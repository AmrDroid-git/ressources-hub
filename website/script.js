const DATA_PATHS = {
  websites: "data/websites.json",
  homeDescriptions: "data/home-descriptions.json",
};

let revealObserver;
let homeDescriptionData = null;

document.addEventListener("DOMContentLoaded", () => {
  setupVisualEffects();
  setupNavbar();
  setupFooterYear();
  setupSmartToolbar();

  const page = document.body.dataset.page;

  if (page === "home") {
    loadHomeDescription();
    loadHomeStats();
  }

  if (page === "websites") {
    loadWebsitesPage();
  }

  prepareReveals();
  setupTiltEffects();
  setupMagneticButtons();
});

function setupVisualEffects() {
  if (!document.querySelector(".scroll-progress")) {
    const progress = document.createElement("div");
    progress.className = "scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.prepend(progress);
  }

  const updateProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const value = max <= 0 ? 0 : (window.scrollY / max) * 100;
    document.documentElement.style.setProperty("--scroll", `${value}%`);
  };

  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
}

function setupNavbar() {
  const page = document.body.dataset.page;
  document.querySelectorAll("[data-nav]").forEach((link) => {
    if (link.dataset.nav === page) link.classList.add("active");
  });

  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector("#navLinks");

  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.textContent = isOpen ? "✕" : "☰";
  });

  links.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "☰";
    }
  });
}

function setupFooterYear() {
  const year = document.querySelector("#year");
  if (year) year.textContent = new Date().getFullYear();
}

async function fetchJson(path) {
  const response = await fetch(path, { cache: "no-store" });
  if (!response.ok) throw new Error(`Impossible de charger ${path}`);
  return response.json();
}

async function loadHomeDescription() {
  const languageActions = document.querySelector("#languageActions");

  try {
    homeDescriptionData = await fetchJson(DATA_PATHS.homeDescriptions);
    const defaultLanguage = homeDescriptionData.defaultLanguage || "ar";

    if (languageActions) {
      languageActions.addEventListener("click", (event) => {
        const button = event.target.closest("[data-lang]");
        if (!button) return;
        setHomeLanguage(button.dataset.lang);
      });
    }

    setHomeLanguage(defaultLanguage);
  } catch (error) {
    console.error(error);
    const content = document.querySelector("#homeDescriptionContent");
    if (content) {
      content.innerHTML = "<p>Impossible de charger la description du projet.</p>";
    }
  }
}

function setHomeLanguage(lang) {
  if (!homeDescriptionData || !homeDescriptionData.languages) return;

  const data = homeDescriptionData.languages[lang] || homeDescriptionData.languages.ar;
  if (!data) return;

  document.documentElement.lang = data.htmlLang || lang;
  document.documentElement.dir = data.direction || "ltr";

  const eyebrow = document.querySelector("#homeEyebrow");
  const title = document.querySelector("#homeTitle");
  const intro = document.querySelector("#homeIntro");
  const content = document.querySelector("#homeDescriptionContent");

  if (eyebrow) eyebrow.textContent = data.eyebrow || "";
  if (title) title.textContent = data.title || "";
  if (intro) intro.textContent = data.intro || "";

  if (content) {
    const paragraphs = Array.isArray(data.paragraphs) ? data.paragraphs : [];
    content.innerHTML = `
      <h2>${escapeHtml(data.heading || "")}</h2>
      ${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
      <div class="prayer-box">
        <strong>${lang === "ar" ? "دعاء" : lang === "fr" ? "Petite prière" : "A small prayer"}</strong>
        <p>${escapeHtml(data.prayer || "")}</p>
      </div>
    `;
  }

  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === lang);
  });
}

async function loadHomeStats() {
  try {
    const websites = await fetchJson(DATA_PATHS.websites);
    animateNumber("#homeWebsitesCount", websites.length);
  } catch (error) {
    console.error(error);
  }
}

async function loadWebsitesPage() {
  const grid = document.querySelector("#websitesGrid");
  const count = document.querySelector("#websiteCount");
  const empty = document.querySelector("#websitesEmpty");
  const searchInput = document.querySelector("#websiteSearch");
  const resetButton = document.querySelector("#resetWebsiteSearch");

  if (!grid || !count || !empty || !searchInput || !resetButton) return;

  try {
    const websites = await fetchJson(DATA_PATHS.websites);

    const render = () => {
      const query = normalize(searchInput.value);

      const filtered = websites.filter((item) => {
        return [item.name, item.description, item.link, item.repo, item.owner, item.category, item.status]
          .map(normalize)
          .some((value) => value.includes(query));
      });

      renderWebsiteCards(grid, filtered);
      count.textContent = `${filtered.length} site(s) affiché(s) sur ${websites.length}`;
      empty.classList.toggle("hidden", filtered.length !== 0);
      refreshDynamicElements(grid);
    };

    searchInput.addEventListener("input", render);
    resetButton.addEventListener("click", () => {
      searchInput.value = "";
      render();
      searchInput.focus();
    });

    render();
  } catch (error) {
    console.error(error);
    count.textContent = "Erreur de chargement des sites.";
  }
}

function renderWebsiteCards(container, items) {
  container.innerHTML = "";

  const fragment = document.createDocumentFragment();

  items.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "resource-card reveal";
    card.style.setProperty("--reveal-delay", `${Math.min(index, 9) * 45}ms`);

    card.innerHTML = `
      <div class="card-top">
        <div class="badges-row">
          <span class="badge badge-category">🌐 ${escapeHtml(item.category || "Site web")}</span>
          <span class="badge badge-status">◆ ${escapeHtml(item.status || "Disponible")}</span>
        </div>
      </div>
      <h2>${escapeHtml(item.name || "Sans nom")}</h2>
      <p>${escapeHtml(item.description || "Aucune description disponible.")}</p>
      <div class="meta-list">
        <span>Propriétaire : ${escapeHtml(item.owner || "Non défini")}</span>
        <span>Site : ${escapeHtml(cleanUrl(item.link))}</span>
        <span>Repo : ${escapeHtml(cleanUrl(item.repo))}</span>
      </div>
      <div class="card-actions">
        <a class="btn btn-primary btn-large" href="${escapeAttribute(item.link || "#")}" target="_blank" rel="noopener noreferrer">Visiter le site</a>
        <a class="btn btn-github" href="${escapeAttribute(item.repo || "#")}" target="_blank" rel="noopener noreferrer">Ouvrir le repo GitHub</a>
      </div>
    `;

    fragment.appendChild(card);
  });

  container.appendChild(fragment);
}

function setupSmartToolbar() {
  const toolbar = document.querySelector(".toolbar");
  if (!toolbar) return;

  let lastScrollY = window.scrollY;
  let hideStartY = 0;
  let ticking = false;
  const minMovement = 6;

  const calculateHideStart = () => {
    const grid = document.querySelector("#websitesGrid");
    const target = grid || toolbar;
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    hideStartY = Math.max(targetTop - toolbar.offsetHeight - 24, 0);
  };

  const showToolbar = () => toolbar.classList.remove("toolbar-hidden");
  const hideToolbar = () => {
    if (!toolbar.contains(document.activeElement)) toolbar.classList.add("toolbar-hidden");
  };

  const update = () => {
    calculateHideStart();
    const currentScrollY = Math.max(window.scrollY, 0);
    const difference = currentScrollY - lastScrollY;

    if (currentScrollY <= hideStartY) showToolbar();
    else if (Math.abs(difference) > minMovement) {
      if (difference > 0) hideToolbar();
      else showToolbar();
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener("resize", calculateHideStart, { passive: true });
  toolbar.addEventListener("focusin", showToolbar);
  calculateHideStart();
}

function prepareReveals(scope = document) {
  const elements = scope.querySelectorAll(
    ".hero-copy, .hero-panel, .section-heading, .feature-card, .cta-card, .toolbar, .results-summary, .content-card, .empty-state, .page-hero .container"
  );

  elements.forEach((element, index) => {
    if (!element.classList.contains("reveal")) element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 55}ms`);
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach((element) => element.classList.add("is-visible"));
    return;
  }

  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -70px 0px" });
  }

  document.querySelectorAll(".reveal:not(.is-visible)").forEach((element) => revealObserver.observe(element));
}

function setupTiltEffects(scope = document) {
  return;
}

function setupMagneticButtons(scope = document) {
  return;
}

function refreshDynamicElements(scope) {
  prepareReveals(scope);
  setupTiltEffects(scope);
  setupMagneticButtons(scope);
}

function animateNumber(selector, target) {
  const element = document.querySelector(selector);
  if (!element) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    element.textContent = target;
    return;
  }

  const duration = 900;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = Math.round(target * eased);
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function cleanUrl(value) {
  return String(value || "")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
