from __future__ import annotations
import hashlib, hmac, json, os, re, secrets, sqlite3
from contextlib import asynccontextmanager
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from argon2 import PasswordHasher
from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel, Field

DATA_PATH=Path(os.getenv("DATA_PATH","/data")); DATA_PATH.mkdir(parents=True,exist_ok=True); DB_PATH=DATA_PATH/"eventsphere.sqlite3"
ADMIN_USERNAME=os.getenv("ADMIN_USERNAME","admin").strip(); ADMIN_PASSWORD=os.getenv("ADMIN_PASSWORD",""); SESSION_SECRET=os.getenv("SESSION_SECRET","")
COOKIE="eventsphere_session"; SESSION_TTL=8*60*60; ph=PasswordHasher(); password_hash=ph.hash(ADMIN_PASSWORD) if ADMIN_PASSWORD else None
_sessions:dict[str,tuple[str,float]]={}
DEFAULT_PAGE={"hero_title":"Find Your Next Great Event.","hero_description":"Discover inspiring conferences, hands-on workshops, and exciting experiences. Find your people, learn something new, and make every moment count.","featured_title":"FutureTech Summit 2026","featured_description":"Explore artificial intelligence, robotics, and emerging technologies shaping tomorrow. A gathering for curious minds and future builders.","cta_title":"Make room for something remarkable."}
DEFAULT_SETTINGS={"animations_enabled":True,"motion_intensity":"balanced","accent_color":"#60a5fa"}
DEFAULT_EVENTS=[
 {"id":"futuretech","title":"FutureTech Summit 2026","category":"Technology","date":"2026-11-15","location":"Mangalore, Karnataka","description":"Explore AI, robotics, cloud computing, and emerging technologies.","status":"published"},
 {"id":"creative-minds","title":"Creative Minds Workshop","category":"Workshop","date":"2026-11-22","location":"Bengaluru, Karnataka","description":"Turn your ideas into practical projects through hands-on learning.","status":"published"},
 {"id":"startup-connect","title":"Startup Connect","category":"Startups","date":"2026-12-05","location":"Manipal, Karnataka","description":"Connect with founders, share ideas, and discover opportunities.","status":"published"}]
def connect():
 c=sqlite3.connect(DB_PATH,timeout=10); c.row_factory=sqlite3.Row; c.execute("PRAGMA foreign_keys=ON"); return c
def now(): return datetime.now(timezone.utc).isoformat()
def init_db():
 with connect() as c:
  c.execute("CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,title TEXT NOT NULL,category TEXT NOT NULL,date TEXT NOT NULL,location TEXT NOT NULL,description TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN ('draft','published')),created_at TEXT NOT NULL,updated_at TEXT NOT NULL)")
  c.execute("CREATE TABLE IF NOT EXISTS content(key TEXT PRIMARY KEY,draft_json TEXT NOT NULL,published_json TEXT NOT NULL,updated_at TEXT NOT NULL)")
  c.execute("CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value_json TEXT NOT NULL,updated_at TEXT NOT NULL)")
  c.execute("CREATE TABLE IF NOT EXISTS audit_log(id INTEGER PRIMARY KEY AUTOINCREMENT,action TEXT NOT NULL,object_type TEXT NOT NULL,object_id TEXT NOT NULL,created_at TEXT NOT NULL)")
  ts=now()
  if c.execute("SELECT COUNT(*) FROM events").fetchone()[0]==0:
   for e in DEFAULT_EVENTS:c.execute("INSERT INTO events VALUES(?,?,?,?,?,?,?,?,?)",(e["id"],e["title"],e["category"],e["date"],e["location"],e["description"],e["status"],ts,ts))
  for k,v in DEFAULT_PAGE.items():
   c.execute("INSERT OR IGNORE INTO content VALUES(?,?,?,?)",(k,json.dumps(v),json.dumps(v),ts))
  for k,v in DEFAULT_SETTINGS.items():c.execute("INSERT OR IGNORE INTO settings VALUES(?,?,?)",(k,json.dumps(v),ts))
@asynccontextmanager
async def lifespan(app:FastAPI):init_db();yield
app=FastAPI(title="EventSphere Admin API",version="1.0.0",lifespan=lifespan)
def digest(token:str)->str:return hmac.new(SESSION_SECRET.encode(),token.encode(),hashlib.sha256).hexdigest()
def require_admin(request:Request):
 if not SESSION_SECRET:raise HTTPException(503,"Set SESSION_SECRET in .env before using admin routes.")
 token=request.cookies.get(COOKIE,""); key=digest(token) if token else ""; item=_sessions.get(key)
 if not item or item[1]<datetime.now(timezone.utc).timestamp():_sessions.pop(key,None);raise HTTPException(401,"Please sign in.")
 if request.method not in ("GET","HEAD"):
  if not hmac.compare_digest(request.headers.get("x-csrf-token",""),item[0]):raise HTTPException(403,"Invalid CSRF token.")
  origin=request.headers.get("origin")
  if origin and origin.rstrip("/")!=str(request.base_url).rstrip("/"):raise HTTPException(403,"Cross-origin request rejected.")
def audit(c,action,kind,object_id):c.execute("INSERT INTO audit_log(action,object_type,object_id,created_at) VALUES(?,?,?,?)",(action,kind,object_id,now()))
def get_content(published=True):
 col="published_json" if published else "draft_json"
 with connect() as c:return {r["key"]:json.loads(r["value"]) for r in c.execute(f"SELECT key,{col} value FROM content")}
def get_settings():
 with connect() as c:return {r["key"]:json.loads(r["value_json"]) for r in c.execute("SELECT key,value_json FROM settings")}
class Login(BaseModel):username:str=Field(min_length=1,max_length=80);password:str=Field(min_length=1,max_length=256)
class EventInput(BaseModel):
 title:str=Field(min_length=2,max_length=120);category:str=Field(min_length=2,max_length=50);date:str;location:str=Field(min_length=2,max_length=120);description:str=Field(min_length=8,max_length=1200);status:str="draft"
class ContentInput(BaseModel):content:dict[str,str]
class SettingsInput(BaseModel):settings:dict[str,Any]
@app.get("/api/health")
def health():return {"status":"ok","service":"eventsphere-api"}
@app.post("/api/auth/login")
def login(body:Login,request:Request,response:Response):
 if not SESSION_SECRET or not password_hash:raise HTTPException(503,"Configure ADMIN_PASSWORD and SESSION_SECRET in .env first.")
 try:valid=ph.verify(password_hash,body.password)
 except Exception:valid=False
 if not hmac.compare_digest(body.username,ADMIN_USERNAME) or not valid:raise HTTPException(401,"Invalid username or password.")
 token=secrets.token_urlsafe(32);csrf=secrets.token_urlsafe(24);_sessions[digest(token)]=(csrf,datetime.now(timezone.utc).timestamp()+SESSION_TTL)
 secure=request.url.scheme=="https" or request.headers.get("x-forwarded-proto","").lower()=="https"
 response.set_cookie(COOKIE,token,httponly=True,secure=secure,samesite="strict",max_age=SESSION_TTL,path="/")
 response.set_cookie("eventsphere_csrf",csrf,httponly=False,secure=secure,samesite="strict",max_age=SESSION_TTL,path="/")
 return {"user":{"username":ADMIN_USERNAME},"csrf_token":csrf}
@app.get("/api/auth/session")
def session(request:Request):
 token=request.cookies.get(COOKIE,"");row=_sessions.get(digest(token)) if token and SESSION_SECRET else None
 if not row or row[1]<datetime.now(timezone.utc).timestamp():raise HTTPException(401,"Not signed in.")
 return {"user":{"username":ADMIN_USERNAME},"csrf_token":row[0]}
@app.post("/api/auth/logout")
def logout(request:Request,response:Response):
 require_admin(request);token=request.cookies.get(COOKIE,"");_sessions.pop(digest(token),None)
 response.delete_cookie(COOKIE,path="/");response.delete_cookie("eventsphere_csrf",path="/");return {"message":"Signed out."}
@app.get("/api/events")
def list_events(request:Request,include_drafts:bool=False):
 admin=False
 try:require_admin(request);admin=True
 except HTTPException:pass
 query="SELECT * FROM events ORDER BY date" if include_drafts and admin else "SELECT * FROM events WHERE status='published' ORDER BY date"
 with connect() as c:return {"events":[dict(r) for r in c.execute(query)]}
@app.get("/api/content/pages")
def read_pages(request:Request,draft:bool=False):
 if draft:require_admin(request)
 return {"content":get_content(not draft)}
@app.get("/api/content/settings")
def read_settings():return {"settings":get_settings()}
@app.post("/api/events")
def create_event(body:EventInput,request:Request):
 require_admin(request)
 if body.status not in ("draft","published"):raise HTTPException(422,"Invalid status.")
 try:date.fromisoformat(body.date)
 except ValueError:raise HTTPException(422,"Date must use YYYY-MM-DD.")
 eid=re.sub(r"[^a-z0-9-]+","-",body.title.lower()).strip("-")[:54] or secrets.token_hex(5);ts=now()
 with connect() as c:
  if c.execute("SELECT 1 FROM events WHERE id=?",(eid,)).fetchone():eid=f"{eid}-{secrets.token_hex(3)}"
  c.execute("INSERT INTO events VALUES(?,?,?,?,?,?,?,?,?)",(eid,body.title.strip(),body.category.strip(),body.date,body.location.strip(),body.description.strip(),body.status,ts,ts));audit(c,"create","event",eid)
 return {"message":"Event created.","id":eid}
@app.put("/api/events/{event_id}")
def update_event(event_id:str,body:EventInput,request:Request):
 require_admin(request)
 if body.status not in ("draft","published"):raise HTTPException(422,"Invalid status.")
 try:date.fromisoformat(body.date)
 except ValueError:raise HTTPException(422,"Date must use YYYY-MM-DD.")
 with connect() as c:
  if not c.execute("SELECT 1 FROM events WHERE id=?",(event_id,)).fetchone():raise HTTPException(404,"Event not found.")
  c.execute("UPDATE events SET title=?,category=?,date=?,location=?,description=?,status=?,updated_at=? WHERE id=?",(body.title.strip(),body.category.strip(),body.date,body.location.strip(),body.description.strip(),body.status,now(),event_id));audit(c,"update","event",event_id)
 return {"message":"Event updated.","id":event_id}
@app.delete("/api/events/{event_id}")
def delete_event(event_id:str,request:Request):
 require_admin(request)
 with connect() as c:
  if c.execute("DELETE FROM events WHERE id=?",(event_id,)).rowcount==0:raise HTTPException(404,"Event not found.")
  audit(c,"delete","event",event_id)
 return {"message":"Event deleted."}
@app.put("/api/content/pages")
def update_pages(body:ContentInput,request:Request):
 require_admin(request)
 if set(body.content)-set(DEFAULT_PAGE) or not body.content:raise HTTPException(422,"Unsupported or empty content.")
 ts=now()
 with connect() as c:
  for key,value in body.content.items():
   if not isinstance(value,str) or not value.strip() or len(value)>1200:raise HTTPException(422,f"Invalid value for {key}.")
   encoded=json.dumps(value.strip());c.execute("INSERT INTO content VALUES(?,?,?,?) ON CONFLICT(key) DO UPDATE SET draft_json=excluded.draft_json,published_json=excluded.published_json,updated_at=excluded.updated_at",(key,encoded,encoded,ts))
  audit(c,"publish","page_content","homepage")
 return {"message":"Homepage content saved and published.","content":get_content(True)}
@app.put("/api/content/settings")
def update_settings(body:SettingsInput,request:Request):
 require_admin(request)
 if set(body.settings)-set(DEFAULT_SETTINGS):raise HTTPException(422,"Unsupported settings field.")
 candidate={**get_settings(),**body.settings}
 if candidate["motion_intensity"] not in ("subtle","balanced","expressive"):raise HTTPException(422,"Invalid motion intensity.")
 if not isinstance(candidate["animations_enabled"],bool) or not re.fullmatch(r"#[0-9a-fA-F]{6}",str(candidate["accent_color"])):raise HTTPException(422,"Invalid settings.")
 with connect() as c:
  for key,value in candidate.items():c.execute("INSERT INTO settings VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at",(key,json.dumps(value),now()))
  audit(c,"update","settings","appearance")
 return {"settings":candidate}
