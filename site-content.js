/* Public content layer: pull published CMS data into the static pages. */
(async () => {
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    const [pagesRes,eventsRes,settingsRes]=await Promise.all([
      fetch("/api/content/pages").then(r=>r.ok?r.json():null),
      fetch("/api/events").then(r=>r.ok?r.json():null),
      fetch("/api/content/settings").then(r=>r.ok?r.json():null)
    ]);
    const content=pagesRes?.content;
    if(content){
      const hero=document.querySelector(".hero-content h1"); if(hero&&content.hero_title)hero.textContent=content.hero_title;
      const heroDesc=document.querySelector(".hero-description"); if(heroDesc&&content.hero_description)heroDesc.textContent=content.hero_description;
      const featuredTitle=document.querySelector(".featured-content h3"); if(featuredTitle&&content.featured_title)featuredTitle.textContent=content.featured_title;
      const featuredDesc=document.querySelector(".featured-content > p:not(.event-category)"); if(featuredDesc&&content.featured_description)featuredDesc.textContent=content.featured_description;
      const cta=document.querySelector(".home-cta h2"); if(cta&&content.cta_title)cta.textContent=content.cta_title;
    }
    const events=eventsRes?.events;
    const bannerClass=e=>/workshop/i.test(e.category)?"design-banner":/startup/i.test(e.category)?"startup-banner":"tech-banner";
    const artClass=e=>/workshop/i.test(e.category)?"art-workshop":/startup/i.test(e.category)?"art-startup":"art-future";
    const dateShort=d=>new Date(d+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase();
    const eventCard=e=>{
      const card=document.createElement("article");card.className="event-card";
      const banner=document.createElement("div");banner.className="event-banner "+bannerClass(e);
      if(e.image_url){const img=document.createElement("img");img.className="event-cover-image";img.src=e.image_url;img.alt=e.title+" cover";img.loading="lazy";banner.append(img)}const badge=document.createElement("span");badge.textContent=e.category;banner.append(badge);
      const body=document.createElement("div");body.className="event-content";
      const dt=document.createElement("p");dt.className="event-date";dt.textContent=dateShort(e.date);
      const h=document.createElement("h3");h.textContent=e.title;
      const desc=document.createElement("p");desc.textContent=e.description;
      const loc=document.createElement("p");loc.className="event-location";loc.textContent="📍 "+e.location;
      const link=document.createElement("a");link.className="button button-primary";link.href="event-details.html#"+encodeURIComponent(e.id);link.textContent="View details ↗";
      body.append(dt,h,desc,loc,link);card.append(banner,body);return card;
    };
    if(Array.isArray(events)){
      const grid=document.querySelector(".events-page .event-grid");
      if(grid){grid.replaceChildren();events.forEach(e=>grid.append(eventCard(e)));}
      const homeGrid=document.querySelector(".upcoming-grid");
      if(homeGrid){homeGrid.replaceChildren();events.slice(0,3).forEach(e=>{
        const card=document.createElement("article");card.className="upcoming-card";
        const art=document.createElement("div");art.className="upcoming-art "+artClass(e);
        const tag=document.createElement("span");tag.textContent=e.category.toUpperCase();
        const titleArt=document.createElement("div");titleArt.textContent=e.title;art.append(tag,titleArt);
        const body=document.createElement("div");body.className="upcoming-content";
        const dt=document.createElement("p");dt.className="upcoming-date";dt.textContent=new Date(e.date+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"}).toUpperCase();
        const h=document.createElement("h3");h.textContent=e.title;
        const loc=document.createElement("p");loc.textContent=e.location;
        const link=document.createElement("a");link.className="text-link";link.href="event-details.html#"+encodeURIComponent(e.id);link.textContent="Explore event ↗";
        body.append(dt,h,loc,link);card.append(art,body);homeGrid.append(card);
      });}
      const detail=document.querySelector(".details-page");
      if(detail){
        const requested=decodeURIComponent(location.hash.slice(1)||"futuretech");
        const event=events.find(e=>e.id===requested)||events[0];
        if(event){
          const hero=detail.querySelector(".details-hero");
          const title=hero?.querySelector("h1,h2");if(title)title.textContent=event.title;if(hero&&event.image_url){hero.style.backgroundImage="linear-gradient(90deg,rgba(9,15,29,.88),rgba(9,15,29,.32)),url(\\""+event.image_url+"\\")";hero.style.backgroundSize="cover";hero.style.backgroundPosition="center"}
          const desc=hero?.querySelector("p:not(.section-eyebrow)");if(desc)desc.textContent=event.description;
          const meta=hero?.querySelector(".details-hero-meta");
          if(meta){meta.replaceChildren();for(const label of ["📅 "+new Date(event.date+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}),"📍 "+event.location]){const span=document.createElement("span");span.textContent=label;meta.append(span);}}
          const information=detail.querySelector(".event-info");
          if(information){const paragraphs=information.querySelectorAll("p");const values=[["Date",new Date(event.date+"T12:00:00").toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})],["Location",event.location],["Category",event.category],["Status",event.status==="published"?"Published sample listing":"Draft"]];paragraphs.forEach((p,i)=>{if(!values[i])return;p.replaceChildren();const strong=document.createElement("strong");strong.textContent=values[i][0];p.append(strong,document.createElement("br"),document.createTextNode(values[i][1]));});}
          const body=detail.querySelector(".details-main > p:not(.section-eyebrow):not(.sample-notice)");if(body)body.textContent=event.description;
          const schedule=detail.querySelector("#schedule");if(schedule&&event.id!=="futuretech"){const wrapper=schedule.parentElement;wrapper.querySelectorAll(".schedule-item").forEach(el=>el.remove());const note=wrapper.querySelector(".sample-notice");if(note)note.textContent="No detailed programme is configured for this sample listing.";}
        }
      }
    }
    const featuredImage=document.querySelector(".featured-art");if(featuredImage&&Array.isArray(events)&&events[0]?.image_url){featuredImage.style.backgroundImage="linear-gradient(90deg,rgba(9,15,29,.18),rgba(9,15,29,.12)),url(\\""+events[0].image_url+"\\")";featuredImage.style.backgroundSize="cover";featuredImage.style.backgroundPosition="center"}\n    const settings=settingsRes?.settings;
    if(settings){
      document.documentElement.style.setProperty("--eventsphere-accent",settings.accent_color||"#60a5fa");
      if(settings.animations_enabled===false||reduced)document.documentElement.classList.add("disable-site-motion");
      document.documentElement.dataset.motionIntensity=settings.motion_intensity||"balanced";
    }
  }catch(error){console.warn("EventSphere CMS API unavailable; built-in sample content remains visible.",error);}
})();