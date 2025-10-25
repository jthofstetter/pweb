const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const bubbleButtons = document.querySelectorAll("[data-interest]");
const bubbleLabel = document.querySelector("[data-interest-label]");
const bubbleDescription = document.querySelector("[data-interest-description]");
const bubbleChart = document.querySelector(".bubble-chart");
const bubbleLayoutQuery = window.matchMedia("(max-width: 720px)");
const bubbleSafeInset = 18;
let activeBubble = null;
let pendingLayoutFrame = null;

function updateBubbleDetail(button) {
  if (!bubbleLabel || !bubbleDescription) return;

  const { label, description } = button.dataset;

  if (activeBubble) {
    activeBubble.classList.remove("is-active");
    activeBubble.setAttribute("aria-pressed", "false");
  }

  activeBubble = button;
  activeBubble.classList.add("is-active");
  activeBubble.setAttribute("aria-pressed", "true");

  bubbleLabel.textContent = label ?? "Special Interests";
  bubbleDescription.textContent =
    description ?? "Mehr zu diesem Schwerpunkt folgt in Kürze.";
}

function parsePercentage(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 50;
}

function sizeToPixels(value, rootFontSize) {
  if (!value) {
    return rootFontSize * 8;
  }

  const trimmed = value.trim();
  const numeric = parseFloat(trimmed);

  if (!Number.isFinite(numeric)) {
    return rootFontSize * 8;
  }

  if (trimmed.endsWith("rem")) {
    return numeric * rootFontSize;
  }

  return numeric;
}

function layoutBubbles() {
  if (!bubbleButtons.length || !bubbleChart) {
    return;
  }

  if (bubbleLayoutQuery.matches) {
    bubbleButtons.forEach((button) => {
      button.style.removeProperty("top");
      button.style.removeProperty("left");
      button.style.removeProperty("transform");
    });

    return;
  }

  const rootFontSize =
    parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const { clientWidth: width, clientHeight: height } = bubbleChart;

  if (!width || !height) {
    return;
  }

  bubbleButtons.forEach((button) => {
    const sizeValue =
      button.style.getPropertyValue("--size") ||
      getComputedStyle(button).getPropertyValue("--size");
    const sizePx = sizeToPixels(sizeValue, rootFontSize);
    const radius = sizePx / 2;

    const percentX = parsePercentage(button.style.getPropertyValue("--x"));
    const percentY = parsePercentage(button.style.getPropertyValue("--y"));

    const targetX = (percentX / 100) * width;
    const targetY = (percentY / 100) * height;

    const safeInset = Math.max(
      bubbleSafeInset,
      Math.min(radius * 0.45, bubbleSafeInset + 14),
    );
    const minX = radius + safeInset;
    const maxX = width - radius - safeInset;
    const minY = radius + safeInset;
    const maxY = height - radius - safeInset;

    const left =
      minX > maxX
        ? width / 2
        : Math.min(Math.max(minX, targetX), maxX);
    const top =
      minY > maxY
        ? height / 2
        : Math.min(Math.max(minY, targetY), maxY);

    button.style.left = `${left}px`;
    button.style.top = `${top}px`;
    button.style.transform = "translate(-50%, -50%)";
  });
}

function scheduleBubbleLayout() {
  if (pendingLayoutFrame !== null) {
    cancelAnimationFrame(pendingLayoutFrame);
  }

  pendingLayoutFrame = requestAnimationFrame(() => {
    pendingLayoutFrame = null;
    layoutBubbles();
  });
}

if (bubbleButtons.length) {
  bubbleButtons.forEach((button) => {
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => updateBubbleDetail(button));
    button.addEventListener("mouseenter", () => updateBubbleDetail(button));
    button.addEventListener("focus", () => updateBubbleDetail(button));
  });

  if (typeof bubbleLayoutQuery.addEventListener === "function") {
    bubbleLayoutQuery.addEventListener("change", scheduleBubbleLayout);
  } else if (typeof bubbleLayoutQuery.addListener === "function") {
    bubbleLayoutQuery.addListener(scheduleBubbleLayout);
  }

  window.addEventListener("resize", scheduleBubbleLayout);
  updateBubbleDetail(bubbleButtons[0]);
  scheduleBubbleLayout();
}

const skillBars = document.querySelectorAll("[data-skill-bar]");

function fillSkillBar(bar) {
  if (!bar || bar.dataset.animated === "true") {
    return;
  }

  const fill = bar.querySelector(".skill__progress");

  if (!fill) {
    return;
  }

  const target = parseFloat(bar.dataset.level);
  const clamped = Number.isFinite(target) ? Math.min(Math.max(target, 0), 100) : 0;

  bar.dataset.animated = "true";

  if (prefersReducedMotion.matches) {
    fill.style.transition = "none";
    fill.style.width = `${clamped}%`;
    bar.classList.add("is-filled");
    return;
  }

  requestAnimationFrame(() => {
    fill.style.width = `${clamped}%`;
    bar.classList.add("is-filled");
  });
}

if (skillBars.length) {
  if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            fillSkillBar(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 },
    );

    skillBars.forEach((bar) => observer.observe(bar));
  } else {
    skillBars.forEach(fillSkillBar);
  }
}

const themePreferenceKey = "preferred-theme";

function readStoredTheme() {
  try {
    return window.localStorage.getItem(themePreferenceKey);
  } catch (error) {
    return null;
  }
}

function storeTheme(value) {
  try {
    window.localStorage.setItem(themePreferenceKey, value);
  } catch (error) {
    /* noop */
  }
}

function createThemeToggle() {
  if (!document.body) {
    return null;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "theme-toggle";
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("data-theme-toggle", "");
  button.setAttribute("aria-label", "Dark Mode umschalten");
  button.setAttribute("title", "Dark Mode umschalten");

  button.innerHTML = `
    <span class="theme-toggle__icon" aria-hidden="true">🌙</span>
    <span class="theme-toggle__label">
      <span class="theme-toggle__title">DARK MODE</span>
      <span class="theme-toggle__status" data-theme-status>OFF</span>
    </span>
  `;

  document.body.appendChild(button);

  return button;
}

function applyThemeState({ isDark, button, statusElement }) {
  if (!document.body) {
    return;
  }

  document.body.classList.toggle("dark-theme", isDark);

  if (button) {
    button.classList.toggle("is-active", isDark);
    button.setAttribute("aria-pressed", isDark ? "true" : "false");
  }

  if (statusElement) {
    statusElement.textContent = isDark ? "ON" : "OFF";
  }

  storeTheme(isDark ? "dark" : "light");
}

function initThemeToggle() {
  const initialPreference = readStoredTheme();
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDarkInitially = initialPreference
    ? initialPreference === "dark"
    : systemPrefersDark;
  const button = createThemeToggle();

  if (!button) {
    return;
  }

  const statusElement = button.querySelector("[data-theme-status]");

  applyThemeState({ isDark: isDarkInitially, button, statusElement });

  button.addEventListener("click", () => {
    const nextState = !document.body.classList.contains("dark-theme");
    applyThemeState({ isDark: nextState, button, statusElement });
  });
}

initThemeToggle();
