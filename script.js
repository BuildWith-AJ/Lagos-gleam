
const CleanCo = {};

/* ---------------------------------------------------------
   STICKY NAV: add shadow on scroll
--------------------------------------------------------- */
CleanCo.initHeaderScrollEffect = function () {
  const header = document.getElementById("site-header");
  if (!header) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 20) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });
};

/* ---------------------------------------------------------
   MOBILE MENU: toggle open/close + hamburger animation
--------------------------------------------------------- */
CleanCo.initMobileMenu = function () {
  const btn = document.getElementById("mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (!btn || !menu) return;

  let isOpen = false;

  const closeMenu = () => {
    isOpen = false;
    menu.style.maxHeight = "0px";
    btn.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    isOpen = true;
    menu.style.maxHeight = menu.scrollHeight + "px";
    btn.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
  };

  btn.addEventListener("click", () => {
    isOpen ? closeMenu() : openMenu();
  });

  // Close mobile menu when a link is clicked
  const mobileLinks = menu.querySelectorAll(".mobile-nav-link");
  mobileLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Recalculate height on window resize (prevents clipped menu on rotate/resize)
  window.addEventListener("resize", () => {
    if (isOpen) {
      menu.style.maxHeight = menu.scrollHeight + "px";
    }
  });
};

/* ---------------------------------------------------------
   ACTIVE NAV HIGHLIGHTING: highlight current section link
   while scrolling. Uses IntersectionObserver for performance.
   NOTE: automatically picks up new sections as we add them,
   as long as each section has a matching id + data-section
   attribute on its nav link.
--------------------------------------------------------- */
CleanCo.initActiveNavHighlight = function () {
  const navLinks = document.querySelectorAll(".nav-link, .mobile-nav-link");
  if (!navLinks.length) return;

  const sections = document.querySelectorAll("main section[id]");
  if (!sections.length) return; // no sections yet — safe exit for now

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          navLinks.forEach((link) => {
            link.classList.remove("active");
            if (link.dataset.section === id) {
              link.classList.add("active");
            }
          });
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
  );

  sections.forEach((section) => observer.observe(section));
};

/* ---------------------------------------------------------
   ANIMATED COUNTERS (Stats Bar): counts up when scrolled
   into view. Values are pulled from data-target attributes
   in the HTML — easy to edit later without touching JS.
--------------------------------------------------------- */
CleanCo.initStatCounters = function () {
  const statsBar = document.getElementById("stats-bar");
  const counters = document.querySelectorAll(".stat-number");
  if (!statsBar || !counters.length) return;

  let hasAnimated = false;

  const animateCounters = () => {
    counters.forEach((counter) => {
      const target = parseInt(counter.dataset.target, 10);
      const suffix = counter.dataset.suffix || "";
      const duration = 1500; // ms
      const startTime = performance.now();

      const updateCount = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out for a smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.floor(eased * target);

        counter.textContent = currentValue + suffix;

        if (progress < 1) {
          requestAnimationFrame(updateCount);
        } else {
          counter.textContent = target + suffix;
        }
      };

      requestAnimationFrame(updateCount);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          animateCounters();
          observer.disconnect();
        }
      });
    },
    { threshold: 0.4 }
  );

  observer.observe(statsBar);
};

/* ---------------------------------------------------------
   INIT: run all feature modules once DOM is ready
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  CleanCo.initHeaderScrollEffect();
  CleanCo.initMobileMenu();
  CleanCo.initActiveNavHighlight();
  CleanCo.initStatCounters();
});