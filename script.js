const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);

function enableSectionLinksWithoutHistory() {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") {
        event.preventDefault();
        return;
      }

      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });

      if (window.location.hash) {
        history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    });
  });
}

function updateScrollState() {
  const scrollTop = window.scrollY || window.pageYOffset;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const progress = clamp(scrollTop / maxScroll);
  root.style.setProperty("--progress", progress.toFixed(4));

  const gallery = document.querySelector("[data-horizontal]");
  if (gallery) {
    const parent = gallery.parentElement;
    const rect = parent.getBoundingClientRect();
    const range = parent.offsetHeight + window.innerHeight;
    const local = clamp((window.innerHeight - rect.top) / range);
    const maxShift = Math.max(0, gallery.scrollWidth - window.innerWidth + 44);
    root.style.setProperty("--gallery-shift", `${Math.round(local * -maxShift)}px`);
  }

  document.querySelectorAll("[data-parallax]").forEach((element) => {
    const speed = Number(element.dataset.parallax) || 0;
    element.style.transform = `translate3d(0, ${Math.round(scrollTop * speed)}px, 0)`;
  });
}

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
);

document.querySelectorAll(".reveal, [data-animate]").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index * 38, 220)}ms`;
  revealObserver.observe(element);
});

if (!reduceMotion) {
  let ticking = false;

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateScrollState();
          ticking = false;
        });
        ticking = true;
      }
    },
    { passive: true },
  );

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateX(${y * -4}deg) rotateY(${x * 5}deg) translateY(-3px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

updateScrollState();
enableSectionLinksWithoutHistory();

window.addEventListener("resize", updateScrollState);
