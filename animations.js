/* EventSphere motion system — GSAP + ScrollTrigger. */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = () => {
    if (!window.gsap || reduced) return;
    const gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);
    const heroTargets = document.querySelectorAll(".hero-label, .hero-content h1, .hero-description, .hero-actions, .hero-note, .hero-visual, .info-hero > *, .details-hero > *, .page-heading > *");
    if (heroTargets.length) gsap.from(heroTargets, {y:22,opacity:0,duration:.8,stagger:.09,ease:"power3.out",clearProps:"all"});
    if (window.ScrollTrigger) gsap.utils.toArray(".section-heading, .featured-card, .benefit-card, .upcoming-card, .event-card, .about-grid article, .contact-card, .project-panel, .details-layout > *").forEach((element) => {
      gsap.from(element,{y:28,opacity:0,duration:.7,ease:"power2.out",scrollTrigger:{trigger:element,start:"top 88%",once:true}});
    });
    gsap.to(".orb-one",{rotation:22,duration:9,repeat:-1,yoyo:true,ease:"sine.inOut"});
    gsap.to(".orb-two",{rotation:-28,duration:12,repeat:-1,yoyo:true,ease:"sine.inOut"});
  };
  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded",start,{once:true}); else start();
})();