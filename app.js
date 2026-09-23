(() => {
  "use strict";

  // ---- Constantes del módulo ----
  const EMAIL = "gonzalesbrittany802@gmail.com";
  const GMAIL_URL = "https://mail.google.com/mail/?view=cm&fs=1&to=";

  // ---- Referencias al DOM (capturadas una sola vez) ----
  const dom = {
    canvas: document.querySelector("#heroCanvas"),
    navToggle: document.querySelector("#navToggle"),
    navMenu: document.querySelector("#navMenu"),
    toast: document.querySelector("#toast"),
    toastText: document.querySelector("#toastText"),
    clickCount: document.querySelector("#clickCount"),
    resetBtn: document.querySelector("#resetBtn")
  };

  /* 
     CLOSURE #1 — Contador de consultas
     */
  const createClickCounter = () => {
    let count = 0;

    const render = () => {
      dom.clickCount.textContent = String(count);
    };

    return {
      // Arrow function: `this` es léxico, no depende del llamador.
      increment: () => {
        count += 1;
        render();
        return count;
      },
      reset: () => {
        count = 0;
        render();
        return count;
      },
      get: () => count
    };
  };

  const clickCounter = createClickCounter();

  /* CLOSURE #2 — Toast reutilizable*/
  const showToast = (() => {
    let timer = 0;

    return (message) => {
      dom.toastText.textContent = message;
      dom.toast.classList.add("show");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        dom.toast.classList.remove("show");
      }, 2600);
    };
  })();

  /*  CLOSURE #3 — Sistema de partículas + letra animada + burbujas */
  const createAnimationSystem = (canvas) => {
    const ctx = canvas.getContext("2d");

    // Estado encapsulado (retained por el closure entre frames).
    const state = {
      width: 0,
      height: 0,
      particles: [],
      extraBubbles: [],
      letter: {
        char: "E",
        x: 0,
        y: 0,
        vx: 90,   // px/s
        vy: 70,   // px/s
        size: 42
      },
      lastTime: 0,
      animationId: 0,
      running: false
    };

    const random = (min, max) => Math.random() * (max - min) + min;

    // ---- Redimensionar el canvas respetando el devicePixelRatio ----
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      state.width = canvas.clientWidth;
      state.height = canvas.clientHeight;
      canvas.width = Math.floor(state.width * ratio);
      canvas.height = Math.floor(state.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    // ---- Crear las partículas base del fondo ----
    const seedParticles = () => {
      const amount = Math.max(35, Math.floor(state.width / 22));
      state.particles = Array.from({ length: amount }, () => ({
        x: random(0, state.width),
        y: random(0, state.height),
        radius: random(0.6, 1.8),
        speed: random(7, 20),
        drift: random(-4, 4),
        alpha: random(0.18, 0.65)
      }));
    };

    // ---- Añadir burbujas al hacer click en un botón ----
    const addBubbles = (amount = 6) => {
      for (let i = 0; i < amount; i += 1) {
        state.extraBubbles.push({
          x: random(0, state.width),
          y: state.height + random(0, 40),
          radius: random(6, 18),
          speed: random(30, 70),
          drift: random(-15, 15),
          alpha: random(0.25, 0.6),
          hue: random(160, 190) // tono verdoso/teal
        });
      }
    };

    // ---- Reset: limpia burbujas extra y reposiciona la letra ----
    const reset = () => {
      state.extraBubbles = [];
      state.letter.x = state.width / 2;
      state.letter.y = state.height / 2;
      state.letter.vx = 90;
      state.letter.vy = 70;
    };

    // ---- Dibujo ----
    const drawParticle = (p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(53, 208, 186, ${p.alpha})`;
      ctx.fill();
    };

    const drawBubble = (b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${b.hue}, 80%, 60%, ${b.alpha})`;
      ctx.fill();
    };

    const drawLetter = () => {
      const l = state.letter;
      ctx.font = `bold ${l.size}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(53, 208, 186, 0.9)";
      ctx.fillText(l.char, l.x, l.y);
    };

    // ---- Loop principal ----
    const animate = (time) => {
      // dt limitado para evitar saltos tras cambiar de pestaña.
      const dt = Math.min((time - state.lastTime) / 1000 || 0, 0.05);
      state.lastTime = time;

      ctx.clearRect(0, 0, state.width, state.height);

      // Partículas de fondo (suben).
      state.particles.forEach((p) => {
        p.y -= p.speed * dt;
        p.x += p.drift * dt;
        if (p.y < -5) p.y = state.height + 5;
        if (p.x < -5) p.x = state.width + 5;
        if (p.x > state.width + 5) p.x = -5;
        drawParticle(p);
      });

      // Burbujas extra (suben y desaparecen al salir).
      state.extraBubbles = state.extraBubbles.filter((b) => {
        b.y -= b.speed * dt;
        b.x += b.drift * dt;
        b.alpha -= 0.15 * dt;
        if (b.y < -20 || b.alpha <= 0) return false;
        drawBubble(b);
        return true;
      });

      // Letra rebotando.
      const l = state.letter;
      l.x += l.vx * dt;
      l.y += l.vy * dt;

      if (l.x - l.size / 2 < 0) { l.x = l.size / 2; l.vx *= -1; }
      if (l.x + l.size / 2 > state.width) { l.x = state.width - l.size / 2; l.vx *= -1; }
      if (l.y - l.size / 2 < 0) { l.y = l.size / 2; l.vy *= -1; }
      if (l.y + l.size / 2 > state.height) { l.y = state.height - l.size / 2; l.vy *= -1; }

      drawLetter();

      // Arrow function: conserva `state` vía closure entre frames.
      state.animationId = requestAnimationFrame(animate);
    };

    const start = () => {
      if (state.running) return;
      state.running = true;
      state.lastTime = performance.now();
      state.animationId = requestAnimationFrame(animate);
    };

    const stop = () => {
      if (!state.running) return;
      state.running = false;
      cancelAnimationFrame(state.animationId);
      state.animationId = 0;
    };

    // API pública del sistema de animación.
    return { resize, seedParticles, addBubbles, reset, start, stop };
  };

  const anim = createAnimationSystem(dom.canvas);

  /*HANDLERS (arrow functions → this léxico = IIFE scope) */

  // Construye el link de Gmail con asunto y cuerpo.
  const createGmailLink = (course) => {
    const subject = encodeURIComponent(`Consulta sobre ${course}`);
    const body = encodeURIComponent(
      `Hola, quisiera información sobre "${course}".`
    );
    return `${GMAIL_URL}${encodeURIComponent(EMAIL)}&su=${subject}&body=${body}`;
  };

  // Click en cualquier .gmail-link.
  const handleGmailClick = (event) => {
    event.preventDefault();
    const link = event.currentTarget; // `currentTarget` es más seguro que `this`
    const course = link.dataset.course || "Información de cursos";

    const count = clickCounter.increment();   // suma 1
    anim.addBubbles(6);                       // añade burbujas al fondo

    link.href = createGmailLink(course);
    showToast(`Abriendo Gmail… consulta #${count}`);
    window.open(link.href, "_blank", "noopener,noreferrer");
  };

  const handleMenuToggle = () => {
    const isOpen = dom.navMenu.classList.toggle("open");
    dom.navToggle.setAttribute("aria-expanded", String(isOpen));
  };

  // Reinicia contador + fondo + letra.
  const handleReset = () => {
    clickCounter.reset();     // vuelve a 0
    anim.reset();             // limpia burbujas y reposiciona letra
    showToast("Estado reiniciado");
  };

  const handleResize = () => {
    anim.resize();
    anim.seedParticles();
  };

  // Pausa la animación cuando la pestaña no está visible (ahorro de CPU).
  const handleVisibility = () => {
    if (document.hidden) anim.stop();
    else anim.start();
  };

  /* REGISTRO DE EVENTOS*/
  document.querySelectorAll(".gmail-link").forEach((link) => {
    link.addEventListener("click", handleGmailClick);
  });

  dom.navToggle.addEventListener("click", handleMenuToggle);
  dom.resetBtn.addEventListener("click", handleReset);
  window.addEventListener("resize", handleResize);
  document.addEventListener("visibilitychange", handleVisibility);

  /* BOOTSTRAP */
  anim.resize();
  anim.seedParticles();
  anim.start();
})();