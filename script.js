
// script.js
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) root.classList.add("reduced-motion");

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  if (!reducedMotion) {
    window.addEventListener(
      "pointermove",
      (e) => {
        root.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
        root.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
      },
      { passive: true }
    );
  }

  const progress = $("#scroll-progress");
  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max <= 0 ? 0 : (window.scrollY / max) * 100;
    progress.style.width = `${pct}%`;
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -10% 0px" }
    );

    revealEls.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i * 70, 360)}ms`;
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("in"));
  }

  const navLinks = $$('.topbar nav a[href^="#"], a[data-nav][href^="#"]');
  const sections = $$("section[id]");

  const setActive = (id) => {
    navLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  };

  if ("IntersectionObserver" in window && sections.length) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: "-35% 0px -45% 0px" }
    );
    sections.forEach((section) => sectionObserver.observe(section));
  }

  const typed = $("[data-typed]");
  if (typed) {
    const words = (typed.dataset.words || "Developer,Designer,Creator")
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    if (words.length) {
      if (reducedMotion) {
        typed.textContent = words[0];
      } else {
        let wordIndex = 0;
        let charIndex = 0;
        let deleting = false;

        const tick = () => {
          const word = words[wordIndex];
          charIndex += deleting ? -1 : 1;
          typed.textContent = word.slice(0, charIndex);

          let delay = deleting ? 42 : 78;
          if (!deleting && charIndex >= word.length) {
            deleting = true;
            delay = 1200;
          } else if (deleting && charIndex <= 0) {
            deleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            delay = 220;
          }
          window.setTimeout(tick, delay);
        };

        tick();
      }
    }
  }

  if (!reducedMotion) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
        el.style.transform = `translate(${x * 12}px, ${y * 9}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });

    $$("[data-tilt]").forEach((card) => {
      const reset = () => {
        card.style.setProperty("--rx", "0deg");
        card.style.setProperty("--ry", "0deg");
        card.style.setProperty("--lift", "0px");
        card.style.setProperty("--sx", "50%");
        card.style.setProperty("--sy", "0%");
      };

      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width;
        const py = (e.clientY - rect.top) / rect.height;

        card.style.setProperty("--rx", `${(0.5 - py) * 7}deg`);
        card.style.setProperty("--ry", `${(px - 0.5) * 10}deg`);
        card.style.setProperty("--lift", "-4px");
        card.style.setProperty("--sx", `${px * 100}%`);
        card.style.setProperty("--sy", `${py * 100}%`);
      });

      card.addEventListener("mouseleave", reset);
      card.addEventListener("blur", reset, true);
      reset();
    });
  }

  const parallaxNodes = $$("[data-parallax]");
  if (parallaxNodes.length && !reducedMotion) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        parallaxNodes.forEach((node) => {
          const speed = Number(node.dataset.parallax || 0.14);
          node.style.setProperty("--parallax-y", `${y * speed}px`);
        });
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  const canvas = $("#starfield");
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext("2d");
    let w = 0;
    let h = 0;
    let dpr = 1;
    let stars = [];

    const makeStar = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.3 + Math.random() * 1.6,
      speed: 0.06 + Math.random() * 0.25,
      tw: Math.random() * Math.PI * 2,
      alpha: 0.25 + Math.random() * 0.55
    });

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(45, Math.min(130, Math.round((w * h) / 18000)));
      stars = Array.from({ length: count }, makeStar);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y -= s.speed;
        if (s.y < -12) {
          s.y = h + 12;
          s.x = Math.random() * w;
        }
        s.tw += 0.03;
        const glow = s.alpha * (0.7 + Math.sin(s.tw) * 0.3);
        ctx.fillStyle = `rgba(166, 222, 255, ${glow})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
  }

  const toTop = $("#to-top");
  if (toTop) {
    const toggle = () => toTop.classList.toggle("show", window.scrollY > 650);
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
    toTop.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
