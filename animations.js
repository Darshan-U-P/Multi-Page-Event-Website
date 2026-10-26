/* EventSphere motion system — GSAP + ScrollTrigger. */
(async () => {
  "use strict";
  const reduced=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let settings={animations_enabled:true,motion_intensity:"balanced"};
  try { const response=await fetch("/api/content/settings"); if(response.ok)settings=(await response.json()).settings||settings; } catch {}
  if(settings.animations_enabled===false||reduced||!window.gsap)return;
  const gsap=window.gsap;
  if(window.ScrollTrigger)gsap.registerPlugin(window.ScrollTrigger);
  const intensity=settings.motion_intensity||"balanced";
  const duration=intensity==="subtle"?.45:intensity==="expressive"?1.05:.75;
  const y=intensity==="subtle"?12:intensity==="expressive"?38:24;
  const hero=document.querySelectorAll(".hero-label,.hero-content h1,.hero-description,.hero-actions,.hero-note,.hero-visual,.info-hero > *, .details-hero > *, .page-heading > *");
  if(hero.length)gsap.from(hero,{y,opacity:0,duration,stagger:intensity==="expressive"?.14:.08,ease:"power3.out",clearProps:"all"});
  if(window.ScrollTrigger){
    gsap.utils.toArray(".section-heading,.featured-card,.benefit-card,.upcoming-card,.event-card,.about-grid article,.contact-card,.project-panel,.details-layout > *").forEach(element=>{
      gsap.from(element,{y,opacity:0,duration,ease:"power2.out",scrollTrigger:{trigger:element,start:"top 88%",once:true}});
    });
  }
  const orbOne=document.querySelector(".orb-one"),orbTwo=document.querySelector(".orb-two");
  if(orbOne)gsap.to(orbOne,{rotation:22,duration:9,repeat:-1,yoyo:true,ease:"sine.inOut"});
  if(orbTwo)gsap.to(orbTwo,{rotation:-28,duration:12,repeat:-1,yoyo:true,ease:"sine.inOut"});
})();