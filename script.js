
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
   GALLERY LIGHTBOX: opens photos/videos in a modal viewer.
   Videos use preload="none" so they never load until clicked —
   keeps initial page load fast.
--------------------------------------------------------- */
CleanCo.initGalleryLightbox = function () {
  const galleryItems = document.querySelectorAll(".gallery-item");
  const lightbox = document.getElementById("lightbox");
  const lightboxContent = document.getElementById("lightbox-content");
  const closeBtn = document.getElementById("lightbox-close");

  if (!galleryItems.length || !lightbox || !lightboxContent || !closeBtn) return;

  const openLightbox = (type, src, alt) => {
    lightboxContent.innerHTML = "";

    if (type === "video") {
      const video = document.createElement("video");
      video.src = src;
      video.controls = true;
      video.autoplay = true;
      video.preload = "none";
      video.setAttribute("aria-label", alt);
      lightboxContent.appendChild(video);
    } else {
      const img = document.createElement("img");
      img.src = src;
      img.alt = alt;
      lightboxContent.appendChild(img);
    }

    lightbox.classList.add("active");
    document.body.style.overflow = "hidden"; // prevent background scroll
  };

  const closeLightbox = () => {
    lightbox.classList.remove("active");
    document.body.style.overflow = "";

    // Stop video playback when closing
    const video = lightboxContent.querySelector("video");
    if (video) {
      video.pause();
    }
    lightboxContent.innerHTML = "";
  };

  galleryItems.forEach((item) => {
    item.addEventListener("click", () => {
      const type = item.dataset.type;
      const src = item.dataset.src;
      const alt = item.dataset.alt;
      openLightbox(type, src, alt);
    });
  });

  closeBtn.addEventListener("click", closeLightbox);

  // Close when clicking outside content
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightbox.classList.contains("active")) {
      closeLightbox();
    }
  });
};

/* ---------------------------------------------------------
   REVIEWS SLIDER: auto-slides through testimonial cards,
   with manual prev/next arrows and clickable dots.
   Responsive: shows 1 card (mobile), 2 (tablet), 3 (desktop).
--------------------------------------------------------- */
CleanCo.initReviewsSlider = function () {
  const track = document.getElementById("reviews-track");
  const prevBtn = document.getElementById("review-prev");
  const nextBtn = document.getElementById("review-next");
  const dotsWrap = document.getElementById("slider-dots");

  if (!track || !prevBtn || !nextBtn || !dotsWrap) return;

  const cards = Array.from(track.children);
  if (!cards.length) return;

  let currentIndex = 0;
  let autoSlideTimer = null;

  // Determine how many cards are visible at once based on viewport width
  const getVisibleCount = () => {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  };

  const getMaxIndex = () => Math.max(0, cards.length - getVisibleCount());

  const buildDots = () => {
    dotsWrap.innerHTML = "";
    const maxIndex = getMaxIndex();
    for (let i = 0; i <= maxIndex; i++) {
      const dot = document.createElement("button");
      dot.classList.add("slider-dot");
      dot.setAttribute("aria-label", "Go to review slide " + (i + 1));
      if (i === currentIndex) dot.classList.add("active");
      dot.addEventListener("click", () => {
        currentIndex = i;
        updateSlider();
        resetAutoSlide();
      });
      dotsWrap.appendChild(dot);
    }
  };

  const updateSlider = () => {
    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap = 20; // matches margin-right in CSS (1.25rem ≈ 20px)
    const offset = currentIndex * (cardWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;

    // Update dots
    const dots = dotsWrap.querySelectorAll(".slider-dot");
    dots.forEach((dot, i) => dot.classList.toggle("active", i === currentIndex));
  };

  const goNext = () => {
    const maxIndex = getMaxIndex();
    currentIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    updateSlider();
  };

  const goPrev = () => {
    const maxIndex = getMaxIndex();
    currentIndex = currentIndex <= 0 ? maxIndex : currentIndex - 1;
    updateSlider();
  };

  const resetAutoSlide = () => {
    clearInterval(autoSlideTimer);
    autoSlideTimer = setInterval(goNext, 5000);
  };

  nextBtn.addEventListener("click", () => {
    goNext();
    resetAutoSlide();
  });

  prevBtn.addEventListener("click", () => {
    goPrev();
    resetAutoSlide();
  });

  // Rebuild on resize (visible count may change between breakpoints)
  window.addEventListener("resize", () => {
    currentIndex = 0;
    buildDots();
    updateSlider();
  });

  // Init
  buildDots();
  updateSlider();
  resetAutoSlide();
};

/* ---------------------------------------------------------
   FAQ ACCORDION: smooth expand/collapse, only one open
   at a time. Uses max-height animation driven by scrollHeight.
--------------------------------------------------------- */
CleanCo.initFaqAccordion = function () {
  const faqItems = document.querySelectorAll(".faq-item");
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!question || !answer) return;

    question.addEventListener("click", () => {
      const isOpen = question.getAttribute("aria-expanded") === "true";

      // Close all other items first (accordion behavior — only one open at a time)
      faqItems.forEach((otherItem) => {
        const otherQuestion = otherItem.querySelector(".faq-question");
        const otherAnswer = otherItem.querySelector(".faq-answer");
        if (otherQuestion && otherAnswer && otherItem !== item) {
          otherQuestion.setAttribute("aria-expanded", "false");
          otherAnswer.style.maxHeight = "0px";
        }
      });

      // Toggle current item
      if (isOpen) {
        question.setAttribute("aria-expanded", "false");
        answer.style.maxHeight = "0px";
      } else {
        question.setAttribute("aria-expanded", "true");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
};


/* ---------------------------------------------------------
   CONTACT FORM: basic front-end validation + success message.
   NOTE: This does not send emails — it's a demo-ready UI flow.
   Once a backend or form service (e.g. Formspree, EmailJS) is
   chosen, replace the fetch/submit logic inside this function.
--------------------------------------------------------- */
CleanCo.initContactForm = function () {
  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");
  if (!form || !note) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const email = form.email.value.trim();
    const service = form.service.value;

    if (!name || !phone || !email || !service) {
      note.textContent = "Please fill in all required fields.";
      note.className = "form-note error";
      return;
    }

    // Placeholder success flow — replace with real submission logic later
    note.textContent = "Thank you! Your request has been received. We'll contact you shortly.";
    note.className = "form-note success";
    form.reset();
  });
};

/* ---------------------------------------------------------
   FOOTER YEAR: auto-updates copyright year, no manual edits needed
--------------------------------------------------------- */
CleanCo.initFooterYear = function () {
  const yearSpan = document.getElementById("footer-year");
  if (!yearSpan) return;
  yearSpan.textContent = new Date().getFullYear();
};

/* ---------------------------------------------------------
   SCROLL TO TOP BUTTON: appears after scrolling down,
   smooth-scrolls back to hero on click.
--------------------------------------------------------- */
CleanCo.initScrollToTop = function () {
  const btn = document.getElementById("scroll-top-btn");
  if (!btn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      btn.classList.add("visible");
    } else {
      btn.classList.remove("visible");
    }
  });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
};

/* ---------------------------------------------------------
   INIT: run all feature modules once DOM is ready
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  CleanCo.initHeaderScrollEffect();
  CleanCo.initMobileMenu();
  CleanCo.initActiveNavHighlight();
  CleanCo.initStatCounters();
  CleanCo.initGalleryLightbox();
  CleanCo.initReviewsSlider();
  CleanCo.initFaqAccordion();
  CleanCo.initContactForm();
  CleanCo.initFooterYear();
  CleanCo.initScrollToTop();
});