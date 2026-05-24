/* ============================================
   andychen.tech — interactions
   ============================================ */

(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none)").matches;

  // ============================================
  // Year
  // ============================================
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ============================================
  // Lenis smooth scroll
  // ============================================
  let lenis = null;
  if (typeof Lenis !== "undefined" && !reduced) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.4,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // ============================================
  // GSAP + ScrollTrigger integration
  // ============================================
  const hasGSAP = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";

  if (hasGSAP) {
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  // ============================================
  // Anchor links → Lenis scrollTo (with offset)
  // ============================================
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const offset = href === "#home" ? 0 : -20;
      if (lenis) {
        lenis.scrollTo(target, { offset });
      } else {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // ============================================
  // Custom cursor
  // ============================================
  if (!isTouch && !reduced) {
    const dot = document.querySelector(".cursor");
    const ring = document.querySelector(".cursor-ring");
    if (dot && ring) {
      let mx = window.innerWidth / 2;
      let my = window.innerHeight / 2;
      let dx = mx;
      let dy = my;
      let rx = mx;
      let ry = my;

      document.addEventListener("mousemove", (e) => {
        mx = e.clientX;
        my = e.clientY;
      });

      function loop() {
        dx += (mx - dx) * 0.4;
        dy += (my - dy) * 0.4;
        rx += (mx - rx) * 0.16;
        ry += (my - ry) * 0.16;
        dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
        ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
        requestAnimationFrame(loop);
      }
      loop();

      // Hover targets
      const hoverSelector = "a, button, .project-card, .goal-card, .skill-group li";
      document.querySelectorAll(hoverSelector).forEach((el) => {
        el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
        el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
      });
    }
  }

  // ============================================
  // Hero entrance
  // ============================================
  if (hasGSAP && !reduced) {
    const lines = document.querySelectorAll(".hero-headline .word");
    if (lines.length) {
      gsap.set(lines, { y: "110%" });
      gsap.to(lines, {
        y: "0%",
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.08,
        delay: 0.15,
      });
    }

    gsap.from(".hero-meta, .hero-sub, .hero-cta, .hero-scroll", {
      opacity: 0,
      y: 18,
      duration: 0.9,
      stagger: 0.1,
      delay: 0.55,
      ease: "power2.out",
    });
  }

  // ============================================
  // Reveal on scroll
  // ============================================
  if (hasGSAP && !reduced) {
    const revealTargets = [
      ".about .section-head",
      ".about-body p",
      ".fact",
      ".goals .section-head",
      ".goal-card",
      ".skills .section-head",
      ".skill-group",
      ".contact .section-head",
      ".contact-email",
      ".contact-sub",
      ".contact-links a",
    ];

    revealTargets.forEach((sel) => {
      gsap.utils.toArray(sel).forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.9,
          delay: i * 0.06,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true,
          },
        });
      });
    });
  }

  // ============================================
  // Horizontal projects scroll (desktop only)
  // ============================================
  if (hasGSAP && !reduced && window.innerWidth > 760) {
    const track = document.querySelector(".projects-track");
    const pin = document.querySelector(".projects-pin");
    if (track && pin) {
      const getDistance = () => track.scrollWidth - window.innerWidth + 40;

      gsap.to(track, {
        x: () => `-${getDistance()}`,
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          pin: true,
          start: "top top",
          end: () => `+=${getDistance()}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });

      // Subtle parallax on project intro while scrolling horizontally
      gsap.to(".projects-intro", {
        x: -60,
        opacity: 0.55,
        ease: "none",
        scrollTrigger: {
          trigger: pin,
          start: "top top",
          end: () => `+=${getDistance()}`,
          scrub: 0.6,
        },
      });
    }
  }

  // ============================================
  // Parallax glows
  // ============================================
  if (hasGSAP && !reduced) {
    gsap.to(".glow-a", {
      yPercent: -25,
      xPercent: -10,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });
    gsap.to(".glow-b", {
      yPercent: 30,
      xPercent: 10,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });
    gsap.to(".grid-overlay", {
      opacity: 0.4,
      ease: "none",
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
    });
  }

  // ============================================
  // Active nav state (topbar + rail)
  // ============================================
  if (hasGSAP) {
    const ids = ["home", "about", "projects", "goals", "skills", "contact"];
    const navLinks = document.querySelectorAll(".primary-nav a");
    const railLinks = document.querySelectorAll(".rail-dot");

    ids.forEach((id, i) => {
      const sec = document.getElementById(id);
      if (!sec) return;
      ScrollTrigger.create({
        trigger: sec,
        start: "top 45%",
        end: "bottom 45%",
        onToggle: (self) => {
          if (self.isActive) {
            navLinks.forEach((l) => l.classList.remove("active"));
            railLinks.forEach((l) => l.classList.remove("active"));
            // Match nav by href
            navLinks.forEach((l) => {
              if (l.getAttribute("href") === `#${id}`) l.classList.add("active");
            });
            if (railLinks[i]) railLinks[i].classList.add("active");
          }
        },
      });
    });
  }

  // ============================================
  // Project card spotlight cursor
  // ============================================
  document.querySelectorAll(".project-card").forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  // ============================================
  // Hide topbar on scroll down, show on scroll up
  // ============================================
  if (hasGSAP) {
    const topbar = document.querySelector(".topbar");
    if (topbar) {
      let lastY = 0;
      ScrollTrigger.create({
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          const y = self.scroll();
          if (y > 80 && y > lastY) {
            topbar.style.transform = "translateY(-100%)";
          } else {
            topbar.style.transform = "translateY(0)";
          }
          lastY = y;
        },
      });
      topbar.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)";
    }
  }
})();
