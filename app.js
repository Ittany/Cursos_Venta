(() => {
  "use strict";

  /* =========================================================
     Constantes
     ========================================================= */
  const EMAIL = "gonzalesbrittany802@gmail.com";
  const GMAIL_URL = "https://mail.google.com/mail/?view=cm&fs=1&to=";

  /* ---------------------------------------------------------
     Registry de listeners (evita huérfanos)
     --------------------------------------------------------- */
  const listenerRegistry = [];
  const on = (target, type, handler, options) => {
    target.addEventListener(type, handler, options);
    listenerRegistry.push({ target, type, handler, options });
  };

  /* ---------------------------------------------------------
     Referencias DOM
     --------------------------------------------------------- */
  const $ = (sel) => document.querySelector(sel);
  const dom = {
    canvas: $("#heroCanvas"),
    navToggle: $("#navToggle"),
    navMenu: $("#navMenu"),
    toast: $("#toast"),
    toastText: $("#toastText"),
    clickCount: $("#clickCount"),
    resetBtn: $("#resetBtn"),
    compactToggle: $("#compactToggle"),
    courseGrid: $("#courseGrid"),
    contactForm: $("#contactForm"),
    year: $("#year"),
    diagPanel: $("#diagPanel"),
    diagToggle: $("#diagToggle"),
    diagFps: $("#diagFps"),
    diagDt: $("#diagDt"),
    diagRam: $("#diagRam"),
    diagListeners: $("#diagListeners"),
    diagNodes: $("#diagNodes"),
    diagBubbles: $("#diagBubbles"),
    diagNote: $("#diagNote")
  };

  /* ---------------------------------------------------------
     Toast
     --------------------------------------------------------- */
  const showToast = (() => {
    let timer = 0;
    return (message) => {
      dom.toastText.textContent = message;
      dom.toast.classList.add("show");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => dom.toast.classList.remove("show"), 2400);
    };
  })();

  /* ---------------------------------------------------------
     CONTADOR DE CONSULTAS (solo clicks de Gmail)
     --------------------------------------------------------- */
  const createCounter = (el) => {
    let count = 0;
    const render = () => { el.textContent = String(count); };
    return {
      inc: () => { count += 1; render(); return count; },
      get: () => count
    };
  };
  const consultas = createCounter(dom.clickCount);

  /* =========================================================
     SISTEMA DE ANIMACIÓN — BURBUJAS GIGANTES + partículas
     ========================================================= */
  const createAnimationSystem = (canvas) => {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return {
         stats: () => ({
        fps: 0,        // se actualizará desde el panel
        bubbles: state.bubbles.length,
        particles: state.particles.length
      }),}
      ;

     const state = {
      width: 0, height: 0, dpr: 1,
      particles: [],
      bubbles: [],
      lastTime: 0,
      rafId: 0,
      running: false,
      paused: false,
      // métricas
      fps: 0, frames: 0, fpsTimer: 0, lastDt: 0,
      internalListeners: []
    };

    const rand = (a, b) => Math.random() * (b - a) + a;

    const addInternalListener = (t, type, fn, opts) => {
      t.addEventListener(type, fn, opts);
      state.internalListeners.push({ t, type, fn, opts });
    };

    const resize = () => {
      state.dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.width = canvas.clientWidth;
      state.height = canvas.clientHeight;
      canvas.width = Math.floor(state.width * state.dpr);
      canvas.height = Math.floor(state.height * state.dpr);
      ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    };

    const seedParticles = () => {
      const amount = Math.max(35, Math.floor(state.width / 22));
      state.particles = Array.from({ length: amount }, () => ({
        x: rand(0, state.width),
        y: rand(0, state.height),
        radius: rand(0.8, 2.2),
        speed: rand(8, 22),
        drift: rand(-5, 5),
        alpha: rand(0.2, 0.7)
      }));
    };

    /* ---------------------------------------------------------
       BURBUJA GIGANTE — aparece al hacer click en el canvas
       --------------------------------------------------------- */
    const addBubble = (x, y) => {
      const radius = rand(120, 260);
      state.bubbles.push({
        x: x ?? rand(0, state.width),
        y: y ?? state.height + radius,
        radius,
        speed: rand(8, 20),
        drift: rand(-15, 15),
        alpha: rand(0.25, 0.5),
        decay: rand(0.015, 0.04),
        hue: rand(190, 210)
      });
    };

    const clearBubbles = () => {
      state.bubbles.length = 0;
    };

    /* ---------------------------------------------------------
       Dibujo
       --------------------------------------------------------- */
    const drawParticle = (p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
      ctx.fill();
    };

    const drawBubble = (b) => {
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
      grad.addColorStop(0, `hsla(${b.hue}, 90%, 70%, ${b.alpha * 0.7})`);
      grad.addColorStop(1, `hsla(${b.hue}, 90%, 55%, 0)`);

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${b.hue}, 95%, 75%, ${Math.min(1, b.alpha * 2)})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    };

    /* ---------------------------------------------------------
       Loop principal (rAF + dt clamp)
       --------------------------------------------------------- */
    const animate = (time) => {
      const rawDt = (time - state.lastTime) / 1000 || 0;
      const dt = Math.min(rawDt, 0.05);
      state.lastDt = dt * 1000;
      state.frames += 1;
      state.fpsTimer += dt;
      if (state.fpsTimer >= 0.5) {
        state.fps = Math.round(state.frames / state.fpsTimer);
        state.frames = 0;
        state.fpsTimer = 0;
      }
      state.lastTime = time;

      ctx.clearRect(0, 0, state.width, state.height);

      // 1) Burbujas gigantes
      for (let i = state.bubbles.length - 1; i >= 0; i -= 1) {
        const b = state.bubbles[i];
        b.y -= b.speed * dt;
        b.x += b.drift * dt;
        b.alpha -= b.decay * dt;
        if (b.alpha <= 0 || b.y + b.radius < 0) {
          state.bubbles.splice(i, 1);
          continue;
        }
        drawBubble(b);
      }

      // 2) Partículas pequeñas encima
      for (const p of state.particles) {
        p.y -= p.speed * dt;
        p.x += p.drift * dt;
        if (p.y < -5) p.y = state.height + 5;
        if (p.x < -5) p.x = state.width + 5;
        if (p.x > state.width + 5) p.x = -5;
        drawParticle(p);
      }

      state.rafId = requestAnimationFrame(animate);
    };

    const start = () => {
      if (state.running || state.paused) return;
      state.running = true;
      state.lastTime = performance.now();
      state.rafId = requestAnimationFrame(animate);
    };

    const stop = () => {
      if (!state.running) return;
      state.running = false;
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    };

    /* ---------------------------------------------------------
       Click en el canvas → burbuja gigante donde se hizo click
       --------------------------------------------------------- */
    addInternalListener(canvas, "click", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      addBubble(x, y);
    });

    const dispose = () => {
      stop();
      state.internalListeners.forEach(({ t, type, fn, opts }) => {
        t.removeEventListener(type, fn, opts);
      });
      state.internalListeners.length = 0;
      state.particles.length = 0;
      state.bubbles.length = 0;
    };

    return {
      resize, seedParticles, addBubble, clearBubbles,
      start, stop, dispose,
      stats: () => ({
        fps: state.fps,
        dt: state.lastDt,
        bubbles: state.bubbles.length,
        particles: state.particles.length
      })
    };
  };

  const anim = createAnimationSystem(dom.canvas);
  if (!anim) console.error("Canvas no disponible");

  /* GMIL LINKS CONTADOR */
  const createGmailLink = (course) => {
    const subject = encodeURIComponent(`Consulta sobre ${course}`);
    const body = encodeURIComponent(`Hola, quisiera información sobre "${course}".`);
    return `${GMAIL_URL}${encodeURIComponent(EMAIL)}&su=${subject}&body=${body}`;
  };

  on(document, "click", (event) => {
    const link = event.target.closest(".gmail-link");
    if (!link) return;
    event.preventDefault();

    const course = link.dataset.course || "Información de cursos";
    const n = consultas.inc();
    showToast(`Abriendo Gmail… consulta #${n}`);
    window.open(createGmailLink(course), "_blank", "noopener,noreferrer");
  });

  /* =========================================================
     RESET — borra SOLO las burbujas, contador intacto
     ========================================================= */
  on(dom.resetBtn, "click", () => {
    anim.clearBubbles();
    showToast("Burbujas eliminadas");
  });

  /* =========================================================
     NAV
     ========================================================= */
  on(dom.navToggle, "click", () => {
    const open = dom.navMenu.classList.toggle("open");
    dom.navToggle.setAttribute("aria-expanded", String(open));
  });

  /* =========================================================
     COMPACT MODE
     ========================================================= */
  on(dom.compactToggle, "click", () => {
    const compact = !document.body.classList.contains("compact");
    document.body.classList.toggle("compact", compact);
    dom.compactToggle.setAttribute("aria-pressed", String(compact));
    document.documentElement.style.setProperty("--gap-scale", compact ? "0.5" : "1");
    showToast(compact ? "Modo compacto" : "Modo normal");
  });

  /* =========================================================
     RESIZE + VISIBILITY
     ========================================================= */
  on(window, "resize", () => {
    if (!anim) return;
    anim.resize();
    anim.seedParticles();
  });

  on(document, "visibilitychange", () => {
    if (!anim) return;
    if (document.hidden) anim.stop();
    else anim.start();
  });

  /* =========================================================
     VALIDACIÓN DE INPUTS
     ========================================================= */
  const validators = {
    name: (v) => v.trim().length >= 2 || "Escribe al menos 2 caracteres.",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || "Correo no válido.",
    course: (v) => v !== "" || "Selecciona un curso.",
    message: (v) => v.trim().length >= 10 || "Mínimo 10 caracteres."
  };

  const validateField = (input) => {
    const rule = validators[input.name];
    if (!rule) return true;
    const result = rule(input.value);
    const errorEl = document.querySelector(`[data-error-for="${input.id}"]`);
    if (result === true) {
      input.classList.remove("invalid");
      input.classList.add("valid");
      input.setAttribute("aria-invalid", "false");
      if (errorEl) errorEl.textContent = "";
      return true;
    }
    input.classList.add("invalid");
    input.classList.remove("valid");
    input.setAttribute("aria-invalid", "true");
    if (errorEl) errorEl.textContent = result;
    return false;
  };

  on(dom.contactForm, "blur", (event) => {
    if (event.target.matches("input, select, textarea")) validateField(event.target);
  }, true);

  on(dom.contactForm, "input", (event) => {
    if (event.target.matches("input, select, textarea") &&
        event.target.classList.contains("invalid")) {
      validateField(event.target);
    }
  });

  on(dom.contactForm, "submit", (event) => {
    event.preventDefault();
    const fields = Array.from(dom.contactForm.elements)
      .filter((el) => el.name && el.tagName !== "BUTTON");
    if (!fields.every(validateField)) {
      showToast("Revisa los campos marcados");
      return;
    }
    const data = Object.fromEntries(fields.map((el) => [el.name, el.value.trim()]));
    consultas.inc();
    showToast("Abriendo Gmail…");
    window.open(createGmailLink(`${data.course} — ${data.name}`), "_blank", "noopener,noreferrer");
  });

  /* =========================================================
     CURSOS
     ========================================================= */
  const COURSES = [
    { id: "frontend", title: "Desarrollo Web Frontend", tag: "TECNOLOGÍA" },
    { id: "js",       title: "JavaScript Interactivo",   tag: "PROGRAMACIÓN" },
    { id: "ts",       title: "TypeScript desde Cero",    tag: "DESARROLLO" }
  ];

  const renderCourses = (list) => {
    const frag = document.createDocumentFragment();
    list.forEach((c) => {
      const article = document.createElement("article");
      article.className = "course-card";
      article.dataset.courseId = c.id;
      article.innerHTML = `
        <p class="course-tag">${c.tag}</p>
        <h3>${c.title}</h3>
        <button class="text-link gmail-link" type="button" data-course="${c.title}">
          Consultar curso <span aria-hidden="true">↗</span>
        </button>`;
      frag.appendChild(article);
    });
    dom.courseGrid.replaceChildren(frag);
  };
  renderCourses(COURSES);

  /* =========================================================
     EFECTO ONDA EN "Construye tu futuro"
     ---------------------------------------------------------
     Partimos el texto en <span class="letter"> para animar
     cada letra con su propio delay al hacer hover.
     ========================================================= */
  const splitWaveText = () => {
    const el = document.querySelector(".wave-text");
    if (!el) return;
    const text = el.dataset.text || el.textContent;
    el.textContent = "";
    const frag = document.createDocumentFragment();
    for (const ch of text) {
      const span = document.createElement("span");
      span.className = "letter";
      span.textContent = ch === " " ? "\u00A0" : ch;
      frag.appendChild(span);
    }
    el.appendChild(frag);
  };
  splitWaveText();
  
  /* PANEL DE DISAGNOSTICO */
  const readMemory = () => {
    // API no estándar, solo Chrome/Edge
    if (performance.memory && performance.memory.usedJSHeapSize) {
      const mb = performance.memory.usedJSHeapSize / 1048576;
      return `${mb.toFixed(1)} MB`;
    }
    return "N/D";
  };

  // Detecta si hay soporte y avisa
  if (!performance.memory) {
    dom.diagNote.textContent = "RAM no expuesta por este navegador (usa Chrome/Edge).";
  } else {
    dom.diagNote.textContent = "RAM vía performance.memory (solo Chrome/Edge).";
  }

  const updateDiag = () => {
    if (!anim) return;
    const s = anim.stats();
    dom.diagFps.textContent = s.fps || "--";
    dom.diagDt.textContent = `${(s.dt || 0).toFixed(1)} ms`;
    dom.diagRam.textContent = readMemory();
    dom.diagListeners.textContent = listenerRegistry.length;
    dom.diagNodes.textContent = document.getElementsByTagName("*").length;
    dom.diagBubbles.textContent = s.bubbles || 0;
  };

  // Muestreo cada 500 ms (NO se usa para animar, solo para medir)
  window.setInterval(updateDiag, 500);
  updateDiag();

  // Minimizar / expandir el panel
  on(dom.diagToggle, "click", () => {
    const minimized = dom.diagPanel.classList.toggle("minimized");
    dom.diagToggle.textContent = minimized ? "+" : "−";
  });

  /*BOOTSTRAP */
  dom.year.textContent = String(new Date().getFullYear());
  if (anim) {
    anim.resize();
    anim.seedParticles();
    anim.start();
  }

})();