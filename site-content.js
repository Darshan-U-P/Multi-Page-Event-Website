/* Public content layer: replace sample listings with published CMS data when API is available. */
(async () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    const [pagesRes, eventsRes, settingsRes] = await Promise.all([
      fetch("/api/content/pages").then(r => r.ok ? r.json() : null),
      fetch("/api/events").then(r => r.ok ? r.json() : null),
      fetch("/api/content/settings").then(r => r.ok ? r.json() : null)
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
    const artClass=e=>/workshop/i.test(e.category)?"design-banner":/startup/i.test(e.category)?"startup-banner":"tech-banner";
    const upcomingClass=e=>/workshop/i.test(e.category)?"art-workshop":/startup/i.test(e.category)?"art-startup":"art-future";
    const dateText=d=>new Date(d+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"}).toUpperCase();
    const buildEventCard=event=>{
      const card=document.createElement("article");card.className="event-card";
      const banner=document.createElement("div");banner.className="event-banner "+artClass(event);
      const badge=document.createElement("span");badge.textContent=event.category;banner.append(badge);
      const body=document.createElement("div");body.className="event-content";
      const date=document.createElement("p");date.className="event-date";date.textContent=dateText(event.date);
      const title=document.createElement("h3");title.textContent=event.title;
      const desc=document.createElement("p");desc.textContent=event.description;
      const location=document.createElement("p");location.className="event-location";location.textContent="📍 "+event.location;
      const link=document.createElement("a");link.className="button button-primary";link.href="event-details.html#"+encodeURIComponent(event.id);link.textContent="View details ↗";
      body.append(date,title,desc,location,link);card.append(banner,body);return card;
    };
    if(Array.isArray(events)){
      const eventGrid=document.querySelector(".events-page .event-grid");
      if(eventGrid){eventGrid.replaceChildren();events.forEach(event=>eventGrid.append(buildEventCard(event)));}
      const homeGrid=document.querySelector(".upcoming-grid");
      if(homeGrid){homeGrid.replaceChildren();events.slice(0,3).forEach(event=>{
        const card=document.createElement("article");card.className="upcoming-card";
        const art=document.createElement("div");art.className="upcoming-art "+upcomingClass(event);
        const tag=document.createElement("span");tag.textContent=event.category.toUpperCase();
        const artTitle=document.createElement("div");artTitle.textContent=event.title;art.append(tag,artTitle);
        const body=document.createElement("div");body.className="upcoming-content";
        const date=document.createElement("p");date.className="upcoming-date";date.textContent=new Date(event.date+"T12:00:00").toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"}).toUpperCase();
        const title=document.createElement("h3");title.textContent=event.title;
        const loc=document.createElement("p");loc.textContent=event.location;
        const link=document.createElement("a");link.className="text-link";link.href="event-details.html#"+encodeURIComponent(event.id);link.textContent="Explore event ↗";
        body.append(date,title,loc,link);card.append(art,body);homeGrid.append(card);
      });}
    }
    const settings=settingsRes?.settings;
    if(settings){
      document.documentElement.style.setProperty("--eventsphere-accent",settings.accent_color||"#60a5fa");
      if(settings.animations_enabled===false)document.documentElement.classList.add("disable-site-motion");
      if(settings.motion_intensity==="subtle")document.documentElement.dataset.motionIntensity="subtle";
      if(settings.motion_intensity==="expressive")document.documentElement.dataset.motionIntensity="expressive";
      if(reduced)document.documentElement.classList.add("disable-site-motion");
    }
  } catch(error) {
    console.warn("EventSphere CMS API unavailable; built-in demo content remains visible.",error);
  }
})();