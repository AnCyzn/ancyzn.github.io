
// script.js
(() => {
  const root = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) root.classList.add("reduced-motion");

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) => Array.from(parent.querySelectorAll(selector));

  // When the editor popup is open, pause background animations so the UI
  // (including the close button) stays responsive during typing.
  let modalOpen = false;
  let prevBodyOverflow = "";

  if (!reducedMotion) {
    window.addEventListener(
      "pointermove",
      (e) => {
        if (modalOpen) return;
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
  let typedTimeoutId = null;

  const startTyped = (nextWordsCsv) => {
    if (!typed) return;
    if (typedTimeoutId) window.clearTimeout(typedTimeoutId);

    const wordsCsv = typeof nextWordsCsv === "string" ? nextWordsCsv : typed.dataset.words || "";
    const words = wordsCsv
      .split(",")
      .map((w) => w.trim())
      .filter(Boolean);

    if (!words.length) return;

    if (reducedMotion) {
      typed.textContent = words[0];
      return;
    }

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
      typedTimeoutId = window.setTimeout(tick, delay);
    };

    typed.textContent = "";
    tick();
  };

  if (typed) startTyped();

  if (!reducedMotion) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        if (modalOpen) return;
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
        if (modalOpen) return;
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
        if (modalOpen) {
          ticking = false;
          return;
        }
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

  let starfieldRafId = null;
  let starfieldResume = null;

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
      if (modalOpen) {
        starfieldRafId = null;
        return;
      }
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
      starfieldRafId = requestAnimationFrame(draw);
    };

    resize();
    starfieldResume = draw;
    draw();
    window.addEventListener("resize", resize);
  }

  // =========================
  // Content editor + dynamic UI
  // =========================

  const STORAGE_KEY = "ancyzn_portfolio_content_v1";

  const DEFAULT_CONTENT = {
    brand: {
      shortName: "AC",
      fullName: "Andy Chen"
    },
    hero: {
      kicker: "Software Engineer",
      headline: "I build fast, reliable systems.",
      leadBeforeTyped: "Currently focused on",
      typedWords: "TypeScript,React,Node.js,Web Performance",
      leadAfterTyped: "for products that ship."
    },
    highlights: {
      now: "Designing a clean UI architecture and performance tuning.",
      focus: "DX, reliability, and pragmatic engineering.",
      openTo: "Full-stack roles and challenging platform problems."
    },
    about: {
      paragraph:
        "I like building systems that are easy to reason about, measure, and improve over time.",
      bullets: ["Own the details", "Ship iteratively", "Measure, then optimize"]
    },
    skills: {
      tags: ["TypeScript", "React", "Web Performance", "Node.js", "Testing", "System Design", "UX", "Security"],
      note:
        "I'm comfortable across the stack, but I care most about correctness, performance, and maintainability."
    },
    projects: [
      {
        title: "Realtime Ops Console",
        url: "#",
        description: "Monitoring, alerts, and live dashboards with a focus on speed.",
        tags: ["React", "TypeScript", "WebSockets"]
      },
      {
        title: "Offline-First Notes",
        url: "#",
        description: "Fast editor with local persistence and conflict-safe syncing.",
        tags: ["JavaScript", "PWA", "IndexedDB"]
      },
      {
        title: "Tech Blog Starter",
        url: "#",
        description: "A clean writing + publishing workflow for technical posts.",
        tags: ["Markdown", "GitHub Pages", "CSS"]
      }
    ],
    contact: {
      email: "hello@example.com",
      github: "#",
      location: "San Francisco, CA"
    }
  };

  const escapeHtml = (str) =>
    String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const parseCsv = (csv) =>
    String(csv || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const parseLines = (text) =>
    String(text || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

  const setByPath = (obj, path, value) => {
    const parts = String(path).split(".");
    let cur = obj;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isIndex = String(Number(part)) === part;
      const key = isIndex ? Number(part) : part;
      if (i === parts.length - 1) {
        cur[key] = value;
        return;
      }
      if (cur[key] === undefined) {
        // Create nested arrays/objects as needed.
        const nextPart = parts[i + 1];
        const nextIsIndex = String(Number(nextPart)) === nextPart;
        cur[key] = nextIsIndex ? [] : {};
      }
      cur = cur[key];
    }
  };

  const getByPath = (obj, path) => {
    const parts = String(path).split(".");
    let cur = obj;
    for (const part of parts) {
      if (cur == null) return undefined;
      const isIndex = String(Number(part)) === part;
      const key = isIndex ? Number(part) : part;
      cur = cur[key];
    }
    return cur;
  };

  const deepClone = (x) => JSON.parse(JSON.stringify(x));

  const mergeDeep = (base, patch) => {
    if (patch == null || typeof patch !== "object") return base;
    const out = Array.isArray(base) ? [...base] : { ...base };
    Object.keys(patch).forEach((key) => {
      const baseVal = base ? base[key] : undefined;
      const patchVal = patch[key];
      if (Array.isArray(patchVal)) {
        out[key] = patchVal;
      } else if (patchVal && typeof patchVal === "object") {
        out[key] = mergeDeep(baseVal || {}, patchVal);
      } else {
        out[key] = patchVal;
      }
    });
    return out;
  };

  const loadContent = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return deepClone(DEFAULT_CONTENT);
      const parsed = JSON.parse(raw);
      return mergeDeep(deepClone(DEFAULT_CONTENT), parsed);
    } catch {
      return deepClone(DEFAULT_CONTENT);
    }
  };

  let currentContent = loadContent();

  const applyProjectTags = (content) => {
    $$("[data-project-tags]").forEach((el) => {
      const idx = Number(el.dataset.projectTags);
      const project = content.projects && content.projects[idx] ? content.projects[idx] : null;
      const tags = project && Array.isArray(project.tags) ? project.tags : [];
      el.innerHTML = tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
    });
  };

  const applyAboutBullets = (content) => {
    const list = $("#about-bullets");
    if (!list) return;
    const bullets = content.about && Array.isArray(content.about.bullets) ? content.about.bullets : [];
    list.innerHTML = bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join("");
  };

  const applySkillsTags = (content) => {
    const container = $("#skills-tags");
    if (!container) return;
    const tags = content.skills && Array.isArray(content.skills.tags) ? content.skills.tags : [];
    container.innerHTML = tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("");
  };

  const applyContentToDOM = (content) => {
    // Update simple text + href attributes.
    $$("[data-out]").forEach((el) => {
      const key = el.dataset.out;
      if (!key) return;
      if (key === "skills.tags") return; // Skills tag cloud is rendered separately.

      const val = getByPath(content, key);
      if (val === undefined) return;

      const outAttr = el.dataset.outAttr;
      if (outAttr) {
        const stringVal = String(val);
        if (outAttr === "href" && key === "contact.email") {
          el.setAttribute("href", `mailto:${stringVal}`);
        } else {
          el.setAttribute(outAttr, stringVal);
        }
      } else {
        el.textContent = String(val);
      }
    });

    const typed = $("[data-typed]");
    if (typed) {
      const typedWords = getByPath(content, "hero.typedWords") || "";
      typed.dataset.words = typedWords;
      startTyped(typedWords);
    }

    applyProjectTags(content);
    applyAboutBullets(content);
    applySkillsTags(content);

    const year = $("#year");
    if (year) year.textContent = String(new Date().getFullYear());

    const titleEl = $("#page-title");
    if (titleEl && content.brand && content.brand.fullName) {
      // Keep it simple: title text is derived from the brand name.
      titleEl.textContent = `${content.brand.fullName} - Software Engineer`;
    }
  };

  applyContentToDOM(currentContent);

  const openModal = () => {
    const modal = $("#edit-modal");
    const backdrop = $("#modal-backdrop");
    if (!modal || !backdrop) return;

    modalOpen = true;
    prevBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Pause background loops while the user is typing in the popup.
    if (typedTimeoutId) window.clearTimeout(typedTimeoutId);
    typedTimeoutId = null;
    if (starfieldRafId) window.cancelAnimationFrame(starfieldRafId);
    starfieldRafId = null;

    modal.classList.add("show");
    backdrop.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
    backdrop.setAttribute("aria-hidden", "false");

    // Populate editor fields every time it opens.
    $$("[data-bind]").forEach((el) => {
      const key = el.dataset.bind;
      const val = getByPath(currentContent, key);

      if (Array.isArray(val)) {
        if (key === "about.bullets") el.value = val.join("\n");
        else el.value = val.join(", ");
      } else if (val === undefined || val === null) {
        el.value = "";
      } else {
        el.value = String(val);
      }
    });
  };

  const closeModal = () => {
    const modal = $("#edit-modal");
    const backdrop = $("#modal-backdrop");
    if (!modal || !backdrop) return;

    modalOpen = false;
    modal.classList.remove("show");
    backdrop.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
    backdrop.setAttribute("aria-hidden", "true");

    document.body.style.overflow = prevBodyOverflow;
    if (typed) startTyped();
    if (starfieldResume) starfieldResume();
  };

  const serializeContentFromEditor = () => {
    const next = deepClone(DEFAULT_CONTENT);
    $$("[data-bind]").forEach((el) => {
      const key = el.dataset.bind;
      const raw = el.value;
      let parsed = raw;

      if (key === "about.bullets") {
        parsed = parseLines(raw);
      } else if (key === "skills.tags" || key.endsWith(".tags")) {
        parsed = parseCsv(raw);
      } else if (typeof raw === "string") {
        parsed = raw.trim();
      }

      setByPath(next, key, parsed);
    });
    return next;
  };

  const editBtn = $("#edit-button");
  if (editBtn) {
    editBtn.addEventListener("click", openModal);
  }

  const closeEditBtn = $("#close-edit");
  if (closeEditBtn) {
    closeEditBtn.addEventListener("click", closeModal);
  }

  const backdrop = $("#modal-backdrop");
  if (backdrop) {
    backdrop.addEventListener("click", closeModal);
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  const saveBtn = $("#save-edit");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      currentContent = serializeContentFromEditor();
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentContent));
      } catch {}
      applyContentToDOM(currentContent);
      closeModal();
    });
  }

  const resetBtn = $("#reset-edit");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      currentContent = deepClone(DEFAULT_CONTENT);
      applyContentToDOM(currentContent);
      openModal();
    });
  }

  const exportBtn = $("#export-json");
  if (exportBtn) {
    exportBtn.addEventListener("click", async () => {
      const json = JSON.stringify(currentContent, null, 2);
      try {
        await navigator.clipboard.writeText(json);
        exportBtn.textContent = "Copied";
        window.setTimeout(() => {
          exportBtn.textContent = "Export JSON";
        }, 1200);
      } catch {
        window.prompt("Copy this JSON:", json);
      }
    });
  }

  // Contact form helpers (mailto: only)
  const contactForm = $("#contact-form");
  const copyEmailBtn = $("#copy-email");
  const contactStatus = $("#contact-status");

  const setStatus = (msg) => {
    if (!contactStatus) return;
    contactStatus.textContent = msg || "";
  };

  const composeMailto = ({ toEmail, name, email, message }) => {
    const subject = `Message from ${name || "someone"}`;
    const bodyLines = [
      "Hi,",
      "",
      message || "",
      "",
      `From: ${name || ""}`,
      `Email: ${email || ""}`
    ];

    const body = bodyLines.join("\n").trim();
    const mailto = `mailto:${toEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return mailto;
  };

  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const toEmail = getByPath(currentContent, "contact.email") || DEFAULT_CONTENT.contact.email;
      const formData = new FormData(contactForm);
      const name = String(formData.get("name") || "");
      const email = String(formData.get("email") || "");
      const message = String(formData.get("message") || "");

      if (!message.trim()) {
        setStatus("Add a message first.");
        return;
      }

      setStatus("Opening your email client...");
      window.location.href = composeMailto({ toEmail, name, email, message });
    });
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener("click", async () => {
      const toEmail = getByPath(currentContent, "contact.email") || DEFAULT_CONTENT.contact.email;
      try {
        await navigator.clipboard.writeText(toEmail);
        setStatus("Email copied to clipboard.");
      } catch {
        window.prompt("Copy email:", toEmail);
      }
    });
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
