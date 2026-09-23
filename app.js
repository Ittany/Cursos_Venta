(() => {
  "use strict";

  // IIFE: variables privadas, sin contaminar el scope global.
  const EMAIL = "gonzalesbrittany802@gmail.com";
  const GMAIL_URL = "https://mail.google.com/mail/?view=cm&fs=1&to=";

  // Referencias al DOM 
  const dom = {
    canvas: document.querySelector("#heroCanvas"),
    navToggle: document.querySelector("#navToggle"),
    navMenu: document.querySelector("#navMenu"),
    toast: document.querySelector("#toast"),
    toastText: document.querySelector("#toastText"),
    clickCount: document.querySelector("#clickCount")
  };

  // Closure: contador de consultas encapsulado.
  const createClickCounter = () => {
    let count = 0;
    return {
      increment: () => {
        count += 1;
        dom.clickCount.textContent = String(count);
        return count;
      }
    };
  };
  const clickCounter = createClickCounter();

  // Toast reutilizable.
  const showToast = (message) => {
    dom.toastText.textContent = message;
    dom.toast.classList.add("show");
    window.setTimeout(() => dom.toast.classList.remove("show"), 2600);
  };

  // Construye el enlace a Gmail con asunto y cuerpo.
  const createGmailLink = (course) => {
    const subject = encodeURIComponent(`Consulta sobre ${course}`);
    const body = encodeURIComponent(
      `Hola, quisiera información sobre "${course}".`
    );
    return `${GMAIL_URL}${encodeURIComponent(EMAIL)}&su=${subject}&body=${body}`;
  };

  // Click en cualquier elemento con .gmail-link.
  const handleGmailClick = (event) => {
    event.preventDefault();
    const link = event.currentTarget;
    const course = link.dataset.course || "Información de cursos";
    const count = clickCounter.increment();

    link.href = createGmailLink(course);
    showToast(`Abriendo Gmail… consulta #${count}`);
    window.open(link.href, "_blank", "noopener,noreferrer");
  };

  document.querySelectorAll(".gmail-link").forEach((link) => {
    link.addEventListener("click", handleGmailClick);
  });

  // Menú móvil.
  const handleMenuToggle = () => {
    const isOpen = dom.navMenu.classList.toggle("open");
    dom.navToggle.setAttribute("aria-expanded", String(isOpen));
  };
  dom.navToggle.addEventListener("click", handleMenuToggle);

  // Canvas: solo preparado, sin animación todavía.
  const ctx = dom.canvas.getContext("2d");
  const resizeCanvas = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const w = dom.canvas.clientWidth;
    const h = dom.canvas.clientHeight;
    dom.canvas.width = Math.floor(w * ratio);
    dom.canvas.height = Math.floor(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  };
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();
})();