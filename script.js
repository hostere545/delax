(() => {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  const win = window;
  const prefersReducedMotion = win.matchMedia("(prefers-reduced-motion: reduce)");

  const BUTTON_SELECTOR = [
    "button",
    ".btn",
    ".btn-primary",
    ".btn-secondary",
    ".nav-cta",
    ".nav-btn",
    ".cta-btn",
    ".hero-btn",
    "a.btn",
    "a.btn-primary",
    "a.btn-secondary",
    "a.nav-cta",
    "a.nav-btn",
    "a.cta-btn",
    "a.hero-btn",
    'input[type="submit"]',
    'input[type="button"]'
  ].join(",");

  const CURSOR_HOVER_SELECTOR =
    ".btn, .card, .portfolio-card, .sticky-btn, .nav-links a";

  function initMenu() {
    const menuToggle = doc.querySelector(".menu-toggle");
    const navLinks = doc.querySelector(".nav-links");

    if (!menuToggle || !navLinks) return;

    menuToggle.setAttribute("aria-expanded", navLinks.classList.contains("show") ? "true" : "false");

    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("show");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navLinks.addEventListener("click", (event) => {
      if (!event.target.closest("a")) return;
      navLinks.classList.remove("show");
      menuToggle.setAttribute("aria-expanded", "false");
    });

    doc.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !navLinks.classList.contains("show")) return;
      navLinks.classList.remove("show");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.focus();
    });
  }

  function initRevealAnimations() {
    const revealElements = [...doc.querySelectorAll(".reveal:not(.active)")];
    if (!revealElements.length) return;

    if (!("IntersectionObserver" in win) || prefersReducedMotion.matches) {
      revealElements.forEach((element) => element.classList.add("active"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("active");
          observer.unobserve(entry.target);
        }
      },
      {
        root: null,
        rootMargin: "0px 0px -80px 0px",
        threshold: 0.01
      }
    );

    revealElements.forEach((element) => observer.observe(element));
  }

  function animateCounter(counter) {
    if (counter.dataset.counted === "true") return;

    const target = Number(counter.dataset.target);
    if (!Number.isFinite(target)) return;

    counter.dataset.counted = "true";
    counter.classList.add("counted");

    if (prefersReducedMotion.matches || target <= 0) {
      counter.textContent = `${Math.max(0, target).toLocaleString()}+`;
      return;
    }

    const duration = 900;
    const startTime = performance.now();

    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * eased);
      counter.textContent = `${current.toLocaleString()}+`;

      if (progress < 1) {
        win.requestAnimationFrame(update);
      }
    }

    win.requestAnimationFrame(update);
  }

  function initCounters() {
    const counters = [...doc.querySelectorAll(".counter")];
    if (!counters.length) return;

    if (!("IntersectionObserver" in win)) {
      counters.forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.2 }
    );

    counters.forEach((counter) => observer.observe(counter));
  }

  function createRipple(button, x, y) {
    if (prefersReducedMotion.matches) return;

    const ripple = doc.createElement("span");
    ripple.className = "AlgorithmOptix-btn-ripple";
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    button.appendChild(ripple);

    let removed = false;
    const removeRipple = () => {
      if (removed) return;
      removed = true;
      ripple.remove();
    };

    ripple.addEventListener("animationend", removeRipple, { once: true });
    win.setTimeout(removeRipple, 1000);
  }

  function initButtonRipples() {
    doc.addEventListener(
      "pointerover",
      (event) => {
        if (event.pointerType === "touch") return;

        const button = event.target.closest(BUTTON_SELECTOR);
        if (!button) return;
        if (event.relatedTarget && button.contains(event.relatedTarget)) return;

        const rect = button.getBoundingClientRect();
        createRipple(button, rect.width / 2, rect.height / 2);
      },
      { passive: true }
    );

    doc.addEventListener(
      "click",
      (event) => {
        const button = event.target.closest(BUTTON_SELECTOR);
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const hasPointerPosition = Number.isFinite(event.clientX) && Number.isFinite(event.clientY);
        const x = hasPointerPosition && event.clientX ? event.clientX - rect.left : rect.width / 2;
        const y = hasPointerPosition && event.clientY ? event.clientY - rect.top : rect.height / 2;
        createRipple(button, x, y);
      },
      { passive: true }
    );
  }

  function initScrollUI() {
    const scrollProgress = doc.querySelector(".scroll-progress");
    const navbar = doc.querySelector(".navbar");

    if (!scrollProgress && !navbar) return;

    if (scrollProgress) {
      scrollProgress.style.width = "100%";
      scrollProgress.style.transformOrigin = "left center";
      scrollProgress.style.willChange = "transform";
    }

    let framePending = false;

    const update = () => {
      framePending = false;
      const scrollTop = win.scrollY || root.scrollTop || 0;

      if (navbar) {
        navbar.classList.toggle("scrolled", scrollTop > 50);
      }

      if (scrollProgress) {
        const maxScroll = Math.max(root.scrollHeight - win.innerHeight, 0);
        const ratio = maxScroll ? Math.min(scrollTop / maxScroll, 1) : 0;
        scrollProgress.style.transform = `scaleX(${ratio})`;
      }
    };

    const scheduleUpdate = () => {
      if (framePending) return;
      framePending = true;
      win.requestAnimationFrame(update);
    };

    win.addEventListener("scroll", scheduleUpdate, { passive: true });
    win.addEventListener("resize", scheduleUpdate, { passive: true });
    win.addEventListener("load", scheduleUpdate, { once: true });
    scheduleUpdate();
  }

  function hidePageLoader() {
    const pageLoader = doc.getElementById("page-loader");
    if (!pageLoader) return;

    pageLoader.classList.add("loader-hide");
    pageLoader.setAttribute("aria-hidden", "true");
    pageLoader.style.display = "none";
  }

  function startDeferredVisuals() {
    win.requestAnimationFrame(() => {
      win.requestAnimationFrame(() => root.classList.add("is-loaded"));
    });
  }

  function initCustomCursor() {
    const customCursor = doc.querySelector(".custom-cursor");
    const supportsFinePointer = win.matchMedia("(pointer: fine)").matches;

    if (!customCursor || !supportsFinePointer || win.innerWidth <= 991 || prefersReducedMotion.matches) {
      return;
    }

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let animationFrame = 0;

    const animate = () => {
      const deltaX = targetX - currentX;
      const deltaY = targetY - currentY;

      currentX += deltaX * 0.22;
      currentY += deltaY * 0.22;
      customCursor.style.left = `${currentX}px`;
      customCursor.style.top = `${currentY}px`;

      if (Math.abs(deltaX) > 0.15 || Math.abs(deltaY) > 0.15) {
        animationFrame = win.requestAnimationFrame(animate);
      } else {
        currentX = targetX;
        currentY = targetY;
        customCursor.style.left = `${currentX}px`;
        customCursor.style.top = `${currentY}px`;
        animationFrame = 0;
      }
    };

    const scheduleCursor = () => {
      if (!animationFrame) animationFrame = win.requestAnimationFrame(animate);
    };

    win.addEventListener(
      "pointermove",
      (event) => {
        if (event.pointerType === "touch") return;
        targetX = event.clientX;
        targetY = event.clientY;
        customCursor.style.opacity = "1";
        scheduleCursor();
      },
      { passive: true }
    );

    doc.addEventListener("pointerleave", () => {
      customCursor.style.opacity = "0";
    });

    doc.addEventListener("pointerenter", () => {
      customCursor.style.opacity = "1";
    });

    doc.addEventListener(
      "pointerover",
      (event) => {
        const target = event.target.closest(CURSOR_HOVER_SELECTOR);
        if (!target) return;
        if (event.relatedTarget && target.contains(event.relatedTarget)) return;
        customCursor.classList.add("cursor-hover");
      },
      { passive: true }
    );

    doc.addEventListener(
      "pointerout",
      (event) => {
        const target = event.target.closest(CURSOR_HOVER_SELECTOR);
        if (!target) return;
        if (event.relatedTarget && target.contains(event.relatedTarget)) return;
        customCursor.classList.remove("cursor-hover");
      },
      { passive: true }
    );

    win.addEventListener("pointerdown", () => customCursor.classList.add("cursor-click"), {
      passive: true
    });
    win.addEventListener("pointerup", () => customCursor.classList.remove("cursor-click"), {
      passive: true
    });

    doc.addEventListener("visibilitychange", () => {
      if (!doc.hidden || !animationFrame) return;
      win.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    });
  }

  function initOtherServiceField() {
    const serviceSelect = doc.getElementById("service");
    const otherServiceWrap = doc.getElementById("other-service-wrap");
    const otherServiceField = doc.getElementById("other-service");

    if (!serviceSelect || !otherServiceWrap || !otherServiceField) return null;

    const toggle = () => {
      const isOther = serviceSelect.value === "Other";
      otherServiceWrap.style.display = isOther ? "block" : "none";
      otherServiceField.required = isOther;
      if (!isOther) otherServiceField.value = "";
    };

    serviceSelect.addEventListener("change", toggle);
    toggle();
    return toggle;
  }

  function showToast() {
    const toast = doc.getElementById("toast");
    if (!toast) return;

    toast.classList.add("show");
    win.setTimeout(() => toast.classList.remove("show"), 4000);
  }

  function initContactForm(resetOtherServiceField) {
    const contactForm = doc.getElementById("contactForm");
    if (!contactForm) return;

    const submitButton =
      doc.getElementById("submitBtn") ||
      contactForm.querySelector('button[type="submit"], input[type="submit"]');

    contactForm.addEventListener("submit", (event) => {
      if (!contactForm.checkValidity()) return;

      const action = (contactForm.getAttribute("action") || "").trim();
      const handledLocally = !action || action === "#" || action.toLowerCase().startsWith("javascript:");

      if (handledLocally) event.preventDefault();

      if (submitButton) {
        submitButton.classList.add("loading");
        if ("value" in submitButton && submitButton.tagName === "INPUT") {
          submitButton.value = "Sending...";
        } else {
          submitButton.textContent = "Sending...";
        }
      }

      if (!handledLocally) return;

      win.setTimeout(() => {
        contactForm.reset();
        if (typeof resetOtherServiceField === "function") resetOtherServiceField();

        if (submitButton) {
          submitButton.classList.remove("loading");
          if ("value" in submitButton && submitButton.tagName === "INPUT") {
            submitButton.value = "Send Inquiry";
          } else {
            submitButton.innerHTML = '<span class="btn-text">Send Inquiry</span>';
          }
        }

        const successMessage =
          doc.getElementById("form-success") || doc.getElementById("thank-you-msg");
        if (successMessage) successMessage.style.display = "block";

        showToast();
      }, 600);
    });
  }

  function init() {
    hidePageLoader();
    initMenu();
    initRevealAnimations();
    initCounters();
    initButtonRipples();
    initScrollUI();
    initCustomCursor();
    const resetOtherServiceField = initOtherServiceField();
    initContactForm(resetOtherServiceField);
    startDeferredVisuals();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();


/* Trust, privacy, cookie-consent, and form-completion enhancements */
(() => {
  "use strict";
  const doc = document;
  const CONSENT_KEY = "algorithmoptix_cookie_consent_v1";
  const PIXEL_ID = "4290547257873979";
  let pixelLoaded = false;

  function readConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || "null"); } catch (_) { return null; }
  }
  function writeConsent(marketing) {
    const value = { essential: true, marketing: Boolean(marketing), updatedAt: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
    applyConsent(value);
    return value;
  }
  function loadMetaPixel() {
    if (pixelLoaded || window.fbq) return;
    pixelLoaded = true;
    !(function(f,b,e,v,n,t,s) {
      if(f.fbq) return; n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq) f._fbq=n; n.push=n; n.loaded=true; n.version='2.0'; n.queue=[];
      t=b.createElement(e); t.async=true; t.src=v; s=b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t,s);
    })(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  function applyConsent(consent) {
    if (consent && consent.marketing) loadMetaPixel();
    const banner = doc.getElementById('cookie-consent');
    const modal = doc.getElementById('cookie-settings');
    if (banner) banner.hidden = Boolean(consent);
    if (modal) modal.hidden = true;
    const marketing = doc.getElementById('cookie-marketing');
    if (marketing) marketing.checked = Boolean(consent && consent.marketing);
  }
  function openSettings() {
    const modal = doc.getElementById('cookie-settings');
    const banner = doc.getElementById('cookie-consent');
    const marketing = doc.getElementById('cookie-marketing');
    const consent = readConsent();
    if (marketing) marketing.checked = Boolean(consent && consent.marketing);
    if (modal) modal.hidden = false;
    if (banner) banner.hidden = true;
  }
  function closeSettings() {
    const modal = doc.getElementById('cookie-settings');
    if (modal) modal.hidden = true;
    if (!readConsent()) { const banner=doc.getElementById('cookie-consent'); if (banner) banner.hidden=false; }
  }
  function initConsent() {
    applyConsent(readConsent());
    doc.querySelectorAll('[data-cookie-accept]').forEach(el => el.addEventListener('click', () => writeConsent(true)));
    doc.querySelectorAll('[data-cookie-reject]').forEach(el => el.addEventListener('click', () => writeConsent(false)));
    doc.querySelectorAll('[data-cookie-customise],[data-cookie-settings]').forEach(el => el.addEventListener('click', (e) => { e.preventDefault(); openSettings(); }));
    doc.querySelectorAll('[data-cookie-close]').forEach(el => el.addEventListener('click', closeSettings));
    const save=doc.querySelector('[data-cookie-save]');
    if (save) save.addEventListener('click', () => writeConsent(Boolean(doc.getElementById('cookie-marketing')?.checked)));
    const modal=doc.getElementById('cookie-settings');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeSettings(); });
    doc.addEventListener('keydown', e => { if(e.key==='Escape') closeSettings(); });
  }
  function initYear() { doc.querySelectorAll('[data-current-year]').forEach(el => el.textContent=String(new Date().getFullYear())); }
  function initRemoteFormCompletion() {
    const form=doc.getElementById('contactForm');
    const frame=doc.querySelector('iframe[name="hidden_iframe"]');
    if(!form || !frame) return;
    let submitted=false;
    form.addEventListener('submit', e => {
      if (!form.checkValidity()) { e.preventDefault(); form.reportValidity(); return; }
      const honeypot=form.querySelector('[name="company_website"]');
      if(honeypot && honeypot.value.trim()) { e.preventDefault(); return; }
      submitted=true;
    });
    frame.addEventListener('load', () => {
      if(!submitted) return; submitted=false;
      form.reset();
      const other=doc.getElementById('other-service-wrap'); if(other) other.hidden=true;
      const button=doc.getElementById('submitBtn');
      if(button) { button.classList.remove('loading'); button.innerHTML='<span class="btn-text">Send Enquiry</span>'; }
      const success=doc.getElementById('form-success'); if(success) { success.style.display='block'; success.setAttribute('role','status'); success.scrollIntoView({behavior:'smooth',block:'nearest'}); }
      const toast=doc.getElementById('toast'); if(toast) { toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'),4000); }
    });
  }
  function initOtherFieldAccessibility() {
    const select=doc.getElementById('service'); const wrap=doc.getElementById('other-service-wrap'); const field=doc.getElementById('other-service');
    if(!select || !wrap || !field) return;
    const update=()=>{ const show=select.value==='Other'; wrap.hidden=!show; field.required=show; if(!show) field.value=''; };
    select.addEventListener('change',update); update();
  }
  function initTrustEnhancements() { initConsent(); initYear(); initRemoteFormCompletion(); initOtherFieldAccessibility(); }
  if(doc.readyState==='loading') doc.addEventListener('DOMContentLoaded',initTrustEnhancements,{once:true}); else initTrustEnhancements();
})();

/* Accessible, non-intrusive founder-led SEO audit popup */
(() => {
  "use strict";

  const POPUP_ID = "seo-audit-popup";
  const FORM_ID = "seoAuditPopupForm";
  const DISMISSED_KEY = "algorithmoptix_audit_popup_dismissed_v1";
  const COMPLETED_KEY = "algorithmoptix_audit_popup_completed_v1";
  const ENGAGED_KEY = "algorithmoptix_audit_popup_engaged_v1";
  const COOKIE_KEY = "algorithmoptix_cookie_consent_v1";
  const DISMISS_DAYS = 7;
  const ENGAGED_DAYS = 30;
  const DELAY_MS = 35000;
  const EXIT_MIN_MS = 12000;
  const SCROLL_TRIGGER = 0.55;
  const WHATSAPP_NUMBER = "8801302149621";

  const doc = document;
  const win = window;
  let popup;
  let dialog;
  let form;
  let lastFocused = null;
  let pageLoadedAt = Date.now();
  let sessionShown = false;
  let triggerTimer = 0;
  let deferredTimer = 0;

  function safeRead(key) {
    try {
      return localStorage.getItem(key);
    } catch (_) {
      return null;
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) {
      // The popup still works when storage is unavailable.
    }
  }

  function hasRecentTimestamp(key, days) {
    const value = Number(safeRead(key));
    if (!Number.isFinite(value) || value <= 0) return false;
    return Date.now() - value < days * 24 * 60 * 60 * 1000;
  }

  function cookieChoiceResolved() {
    return Boolean(safeRead(COOKIE_KEY));
  }

  function isCookieSettingsOpen() {
    const settings = doc.getElementById("cookie-settings");
    return Boolean(settings && !settings.hidden);
  }

  function isCookieBannerOpen() {
    const banner = doc.getElementById("cookie-consent");
    return Boolean(banner && !banner.hidden);
  }

  function isEligible() {
    if (!popup || sessionShown || !popup.hidden) return false;
    if (safeRead(COMPLETED_KEY) === "true") return false;
    if (hasRecentTimestamp(DISMISSED_KEY, DISMISS_DAYS)) return false;
    if (hasRecentTimestamp(ENGAGED_KEY, ENGAGED_DAYS)) return false;
    if (isCookieSettingsOpen() || isCookieBannerOpen() || !cookieChoiceResolved()) return false;
    return true;
  }

  function focusableElements() {
    if (!dialog) return [];
    return [...dialog.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )].filter((element) => element.offsetParent !== null);
  }

  function clearDeferredTimers() {
    if (triggerTimer) win.clearTimeout(triggerTimer);
    if (deferredTimer) win.clearTimeout(deferredTimer);
    triggerTimer = 0;
    deferredTimer = 0;
  }

  function showPopup(source = "timed") {
    if (!isEligible()) return false;

    sessionShown = true;
    clearDeferredTimers();
    lastFocused = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    popup.hidden = false;
    popup.setAttribute("aria-hidden", "false");
    popup.dataset.trigger = source;
    doc.body.classList.add("seo-audit-popup-open");

    win.requestAnimationFrame(() => {
      const firstField = doc.getElementById("audit-website");
      if (firstField) firstField.focus({ preventScroll: true });
      else if (dialog) dialog.focus({ preventScroll: true });
    });

    return true;
  }

  function closePopup(reason = "dismissed") {
    if (!popup || popup.hidden) return;

    popup.hidden = true;
    popup.setAttribute("aria-hidden", "true");
    popup.removeAttribute("data-trigger");
    doc.body.classList.remove("seo-audit-popup-open");

    if (reason === "dismissed") safeWrite(DISMISSED_KEY, String(Date.now()));
    if (reason === "engaged") safeWrite(ENGAGED_KEY, String(Date.now()));

    if (lastFocused && typeof lastFocused.focus === "function") {
      lastFocused.focus({ preventScroll: true });
    }
  }

  function tryOpen(source) {
    if (showPopup(source)) return;
    if (sessionShown || safeRead(COMPLETED_KEY) === "true") return;

    if (!deferredTimer) {
      deferredTimer = win.setTimeout(() => {
        deferredTimer = 0;
        tryOpen(source);
      }, 5000);
    }
  }

  function updateError(input, message) {
    const target = doc.querySelector(`[data-error-for="${input.id}"]`);
    input.setAttribute("aria-invalid", message ? "true" : "false");
    if (target) target.textContent = message;
  }

  function normalizeWebsite(value) {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }

  function validateForm() {
    const website = doc.getElementById("audit-website");
    const email = doc.getElementById("audit-email");
    const whatsapp = doc.getElementById("audit-whatsapp");
    let valid = true;

    const websiteValue = normalizeWebsite(website.value);
    website.value = websiteValue;

    try {
      const url = new URL(websiteValue);
      if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) throw new Error("Invalid URL");
      updateError(website, "");
    } catch (_) {
      updateError(website, "Enter a complete website address, for example https://example.com.");
      valid = false;
    }

    if (!email.validity.valid || !email.value.trim()) {
      updateError(email, "Enter a valid email address.");
      valid = false;
    } else {
      updateError(email, "");
    }

    const phoneValue = whatsapp.value.trim();
    if (phoneValue && !/^[+()\d\s.-]{7,25}$/.test(phoneValue)) {
      updateError(whatsapp, "Enter a valid WhatsApp number or leave this field empty.");
      valid = false;
    } else {
      updateError(whatsapp, "");
    }

    return valid;
  }

  function buildWhatsAppMessage() {
    const website = doc.getElementById("audit-website").value.trim();
    const email = doc.getElementById("audit-email").value.trim();
    const whatsapp = doc.getElementById("audit-whatsapp").value.trim();
    const lines = [
      "Hello MD Sojib Hossen, I would like to request a free SEO audit.",
      "",
      `Website: ${website}`,
      `Email: ${email}`,
      `WhatsApp: ${whatsapp || "Not provided"}`,
      "",
      "Please review my technical SEO, on-page issues, search visibility, and practical growth opportunities."
    ];
    return lines.join("\n");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!form) return;

    const honeypot = form.querySelector('[name="company_website"]');
    if (honeypot && honeypot.value.trim()) {
      closePopup("dismissed");
      return;
    }

    if (!validateForm()) {
      const firstInvalid = form.querySelector('[aria-invalid="true"]');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const status = doc.getElementById("seoAuditPopupStatus");
    if (status) status.textContent = "Opening WhatsApp with your audit request...";

    safeWrite(COMPLETED_KEY, "true");
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage())}`;
    const newWindow = win.open(url, "_blank");
    if (newWindow) {
      try { newWindow.opener = null; } catch (_) { /* Cross-origin window; no action needed. */ }
    } else {
      win.location.href = url;
    }

    form.reset();
    win.setTimeout(() => closePopup("completed"), 250);
  }

  function handleKeyboard(event) {
    if (!popup || popup.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      closePopup("dismissed");
      return;
    }

    if (event.key !== "Tab") return;
    const elements = focusableElements();
    if (!elements.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && doc.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && doc.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleScroll() {
    if (sessionShown || !cookieChoiceResolved()) return;
    const maxScroll = Math.max(doc.documentElement.scrollHeight - win.innerHeight, 1);
    if (win.scrollY / maxScroll >= SCROLL_TRIGGER) {
      win.removeEventListener("scroll", handleScroll);
      tryOpen("scroll");
    }
  }

  function handleExitIntent(event) {
    if (win.innerWidth < 900 || event.clientY > 8) return;
    if (Date.now() - pageLoadedAt < EXIT_MIN_MS) return;
    doc.removeEventListener("mouseout", handleExitIntent);
    tryOpen("exit-intent");
  }

  function initTriggers() {
    triggerTimer = win.setTimeout(() => tryOpen("timed"), DELAY_MS);
    win.addEventListener("scroll", handleScroll, { passive: true });
    doc.addEventListener("mouseout", handleExitIntent);

    doc.querySelectorAll("[data-cookie-accept], [data-cookie-reject], [data-cookie-save]").forEach((button) => {
      button.addEventListener("click", () => {
        win.setTimeout(() => tryOpen("after-cookie-choice"), 1500);
      });
    });
  }

  function initAuditPopup() {
    popup = doc.getElementById(POPUP_ID);
    form = doc.getElementById(FORM_ID);
    dialog = popup ? popup.querySelector('[role="dialog"]') : null;
    if (!popup || !form || !dialog) return;

    popup.querySelectorAll("[data-audit-close]").forEach((element) => {
      element.addEventListener("click", () => closePopup("dismissed"));
    });

    const whatsappLink = popup.querySelector("[data-audit-whatsapp]");
    if (whatsappLink) {
      whatsappLink.addEventListener("click", () => closePopup("engaged"));
    }

    form.addEventListener("submit", handleSubmit);
    form.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => updateError(input, ""));
    });
    doc.addEventListener("keydown", handleKeyboard);
    initTriggers();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", initAuditPopup, { once: true });
  } else {
    initAuditPopup();
  }
})();

