(() => {
  const topbar = document.getElementById("topbar");
  const toggle = document.getElementById("menu-toggle");
  const nav = document.getElementById("site-nav");
  const navLinks = [...nav.querySelectorAll("a")];

  const setMenu = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    topbar.classList.toggle("menu-is-open", open);
    document.body.classList.toggle("menu-open", open);
  };

  toggle.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) setMenu(false);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false);
      toggle.focus();
    }
  });

  matchMedia("(max-width: 900px), (orientation: portrait)").addEventListener("change", () => setMenu(false));

  const progress = document.getElementById("scroll-progress");

  const onScroll = () => {
    topbar.classList.toggle("is-scrolled", window.scrollY > 20);
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sections.forEach((s) => spy.observe(s));

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const video = document.getElementById("hero-video");
  if (video && reduceMotion) {
    video.removeAttribute("autoplay");
    video.pause();
  }

  document.querySelectorAll(".section__head h2").forEach((h) => {
    const text = h.textContent.trim();
    h.setAttribute("aria-label", text);
    h.textContent = "";
    [...text].forEach((c, i) => {
      const span = document.createElement("span");
      span.className = "char";
      span.setAttribute("aria-hidden", "true");
      span.style.setProperty("--i", i);
      span.textContent = c;
      h.appendChild(span);
    });
  });

  document.querySelectorAll("#gallery-grid a").forEach((a, i) => a.style.setProperty("--i", i));

  const reveal = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        reveal.unobserve(entry.target);
      });
    },
    { threshold: 0.25 }
  );
  document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));

  const hero = document.getElementById("overview");
  const torch = document.getElementById("hero-torch");

  if (hero && torch && !reduceMotion) {
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
    const pos = { x: 0.5, y: 0.45 };
    const target = { x: 0.5, y: 0.45 };
    let pointerActive = false;
    let running = false;
    let start = performance.now();

    if (finePointer) {
      hero.addEventListener("pointermove", (e) => {
        const r = hero.getBoundingClientRect();
        target.x = (e.clientX - r.left) / r.width;
        target.y = (e.clientY - r.top) / r.height;
        pointerActive = true;
      });
      hero.addEventListener("pointerleave", () => {
        pointerActive = false;
      });
    }

    const tick = (now) => {
      if (!running) return;
      const t = (now - start) / 1000;

      if (!pointerActive) {
        target.x = 0.5 + Math.sin(t * 0.35) * 0.32;
        target.y = 0.42 + Math.sin(t * 0.52 + 1.2) * 0.18;
      }

      const ease = pointerActive ? 0.12 : 0.04;
      pos.x += (target.x - pos.x) * ease;
      pos.y += (target.y - pos.y) * ease;

      const flicker = 1 + Math.sin(t * 7.3) * 0.012 + Math.sin(t * 13.1) * 0.008;

      torch.style.setProperty("--tx", `${(pos.x * 100).toFixed(2)}%`);
      torch.style.setProperty("--ty", `${(pos.y * 100).toFixed(2)}%`);
      torch.style.setProperty("--tr", flicker.toFixed(3));
      requestAnimationFrame(tick);
    };

    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !running) {
        running = true;
        start = performance.now() - 2000;
        requestAnimationFrame(tick);
      } else if (!entry.isIntersecting) {
        running = false;
      }
    }).observe(hero);
  }

  const box = document.getElementById("lightbox");
  const boxImg = document.getElementById("lightbox-img");
  const boxCount = document.getElementById("lightbox-count");
  const shots = [...document.querySelectorAll("#gallery-grid a")];
  let current = 0;
  let lastFocus = null;

  const show = (i) => {
    current = (i + shots.length) % shots.length;
    const link = shots[current];
    boxImg.src = link.getAttribute("href");
    boxImg.alt = link.querySelector("img").alt;
    boxCount.textContent = `${current + 1} / ${shots.length}`;
    [current - 1, current + 1].forEach((n) => {
      new Image().src = shots[(n + shots.length) % shots.length].getAttribute("href");
    });
  };

  const close = () => {
    box.close();
  };

  shots.forEach((link, i) => {
    link.addEventListener("click", (e) => {
      if (typeof box.showModal !== "function") return;
      e.preventDefault();
      lastFocus = link;
      show(i);
      box.showModal();
    });
  });

  box.addEventListener("close", () => {
    boxImg.removeAttribute("src");
    if (lastFocus) lastFocus.focus();
  });

  box.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "close") close();
    else if (action === "prev") show(current - 1);
    else if (action === "next") show(current + 1);
    else if (e.target === box) close();
  });

  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(current - 1);
    if (e.key === "ArrowRight") show(current + 1);
  });

  let touchX = null;
  box.addEventListener("touchstart", (e) => {
    touchX = e.touches[0].clientX;
  }, { passive: true });

  box.addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
    touchX = null;
  });
})();
