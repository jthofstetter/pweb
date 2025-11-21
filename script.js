const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const bubbleButtons = document.querySelectorAll("[data-interest]");
const bubbleLabel = document.querySelector("[data-interest-label]");
const bubbleDescription = document.querySelector("[data-interest-description]");
const bubbleChart = document.querySelector(".bubble-chart");
const bubbleLayoutQuery = window.matchMedia("(max-width: 720px)");
const bubbleSafeInset = 18;
let activeBubble = null;
let pendingLayoutFrame = null;

const skillTrendTimeline = (() => {
  const startYear = 2020;
  const endYear = 2024;
  const points = [];
  const labels = [];

  for (let year = startYear; year <= endYear; year += 1) {
    for (let quarter = 1; quarter <= 4; quarter += 1) {
      points.push({ year, quarter });
      labels.push(quarter === 1 ? `${year}` : " ");
    }
  }

  return { points, labels };
})();

const rawSkillTrendDatasetConfig = [
  {
    label: "C#",
    startYear: 2020,
    quarterlyValues: [
      5,
      7,
      10,
      10,
      20,
      25,
      30,
      43,
      46,
      50,
      55,
      60,
      65,
      70,
      75,
      78,
      80,
      82,
      84,
      85,
    ],
    lineVar: "--chart-line-1",
    fillVar: "--chart-line-1-fill",
    description:
      "Used for more than five years at HTL, from first console exercises to more demanding coursework projects.",
  },
  {
    label: "Python",
    startYear: 2022,
    quarterlyValues: [
      0,
      10,
      10,
      20,
      25,
      30,
      33,
      45,
      50,
      66,
      75,
      78,
    ],
    lineVar: "--chart-line-2",
    fillVar: "--chart-line-2-fill",
    description:
      "Applied in school for AI experiments and earlier to build a 64-pixel LED Doodle Jump game.",
  },
  {
    label: "Kotlin",
    startYear: 2023,
    quarterlyValues: [0, 8, 10, 23, 16, 32, 40, 73],
    lineVar: "--chart-line-3",
    fillVar: "--chart-line-3-fill",
    description:
      "Tried for mobile experiments and compact app concepts to understand Android development better.",
  },
  {
    label: "C",
    startYear: 2023,
    quarterlyValues: [0, 10, 10, 20, 20, 30, 65, 70],
    lineVar: "--chart-line-4",
    fillVar: "--chart-line-4-fill",
    description:
      "Used to practice low-level fundamentals like memory management and system-level thinking.",
  },
  {
    label: "Russisch",
    startYear: 2022,
    quarterlyValues: [
      0,
      0,
      10,
      10,
      10,
      20,
      20,
      10,
      25,
      33,
      48,
      52,
    ],
    lineVar: "--chart-line-5",
    fillVar: "--chart-line-5-fill",
    description:
      "Long-standing interest sparked by music that turned into learning the language for its beauty.",
  },
];

const skillTrendDatasetConfig = rawSkillTrendDatasetConfig.map(
  ({ label, startYear, quarterlyValues, lineVar, fillVar, description }) => {
    const data = skillTrendTimeline.points.map(({ year, quarter }) => {
      if (year < startYear) {
        return null;
      }

      const offset = (year - startYear) * 4 + (quarter - 1);

      if (offset < 0) {
        return null;
      }

      if (offset >= quarterlyValues.length) {
        const fallback = quarterlyValues[quarterlyValues.length - 1];
        return Number.isFinite(fallback) ? fallback : null;
      }

      return quarterlyValues[offset];
    });

    return {
      label,
      data,
      lineVar,
      fillVar,
      description,
    };
  }
);

const skillTrendLabels = skillTrendTimeline.labels;
let skillTrendChart = null;
const skillToggleContainer = document.querySelector("[data-skill-controls]");
const skillToggleElements = new Map();

function createSkillTrendGradient(context, color) {
  if (!context || !color) {
    return color;
  }

  const { canvas } = context;
  const gradientHeight =
    canvas.getBoundingClientRect().height || canvas.clientHeight || canvas.height || 320;
  const gradient = context.createLinearGradient(0, 0, 0, gradientHeight);

  gradient.addColorStop(0, color);
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  return gradient;
}

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
    description ?? "More about this focus area is coming soon.";
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

    const safeInset = bubbleSafeInset;
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

function refreshSkillToggleColors() {
  if (!skillToggleElements.size) {
    return;
  }

  skillToggleElements.forEach((toggle, index) => {
    const config = skillTrendDatasetConfig[index];

    if (!config) {
      return;
    }

    const accentColor = readCssVariable(config.lineVar, "#4c6ef5");
    toggle.style.setProperty("--toggle-accent", accentColor);
  });
}

function handleSkillToggleChange(event) {
  if (!skillTrendChart) {
    return;
  }

  const target = event.target;

  if (!target || target.type !== "checkbox") {
    return;
  }

  const datasetIndex = Number.parseInt(target.dataset.datasetIndex, 10);

  if (!Number.isFinite(datasetIndex)) {
    return;
  }

  const isVisible = target.checked;

  skillTrendChart.setDatasetVisibility(datasetIndex, isVisible);
  skillTrendChart.update();
}

function renderSkillTrendControls() {
  if (!skillToggleContainer || !skillTrendChart) {
    return;
  }

  skillToggleContainer.innerHTML = "";
  skillToggleElements.clear();

  skillTrendDatasetConfig.forEach(({ label, lineVar, description }, index) => {
    const toggleId = `skill-toggle-${index}`;
    const wrapper = document.createElement("label");
    wrapper.className = "skill-toggle";
    wrapper.setAttribute("for", toggleId);

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = toggleId;
    input.checked = true;
    input.dataset.datasetIndex = String(index);

    const track = document.createElement("span");
    track.className = "skill-toggle__track";
    track.setAttribute("aria-hidden", "true");

    const thumb = document.createElement("span");
    thumb.className = "skill-toggle__thumb";
    thumb.setAttribute("aria-hidden", "true");
    track.appendChild(thumb);

    const text = document.createElement("span");
    text.className = "skill-toggle__label";
    text.textContent = label;

    const info = document.createElement("span");
    info.className = "skill-toggle__info";
    info.textContent =
      description ||
      "Kurzer Kontext folgt – was, wo und warum die Technologie genutzt wurde.";

    wrapper.appendChild(input);
    wrapper.appendChild(track);
    wrapper.appendChild(text);
    wrapper.appendChild(info);

    input.addEventListener("change", handleSkillToggleChange);

    const accentColor = readCssVariable(lineVar, "#4c6ef5");
    wrapper.style.setProperty("--toggle-accent", accentColor);

    skillToggleContainer.appendChild(wrapper);
    skillToggleElements.set(index, wrapper);
  });

  refreshSkillToggleColors();
}

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
  button.setAttribute("aria-label", "Dark-Mode umschalten");
  button.setAttribute("title", "Dark-Mode umschalten");

  button.innerHTML = `
    <span class="theme-toggle__orb" aria-hidden="true"></span>
    <span class="theme-toggle__text">
      <span class="theme-toggle__title">Dark Mode</span>
      <span class="theme-toggle__status" data-theme-status>OFF</span>
    </span>
  `;

  document.body.appendChild(button);

  return button;
}

function triggerScreenFlash() {
  if (!document.body || prefersReducedMotion.matches) {
    return;
  }

  document.body.classList.add("is-flashing");
  window.setTimeout(() => {
    document.body.classList.remove("is-flashing");
  }, 650);
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
  updateSkillTrendTheme();
}

function initThemeToggle() {
  const initialPreference = readStoredTheme();
  const isDarkInitially = initialPreference === "dark";
  const button = createThemeToggle();

  if (!button) {
    return;
  }

  const statusElement = button.querySelector("[data-theme-status]");

  applyThemeState({ isDark: isDarkInitially, button, statusElement });

  button.addEventListener("click", () => {
    const nextState = !document.body.classList.contains("dark-theme");
    applyThemeState({ isDark: nextState, button, statusElement });
    triggerScreenFlash();
  });
}

initThemeToggle();

const skillTrendCtx = document.getElementById("skillTrend");

if (skillTrendCtx) {
  const axisColor = readCssVariable("--chart-axis-color", "#1f1f1f");
  const gridColor = readCssVariable("--chart-grid-color", "rgba(31, 31, 31, 0.12)");

  skillTrendChart = new Chart(skillTrendCtx, {
    type: "line",
    data: {
      labels: skillTrendLabels,
      datasets: buildSkillTrendDatasets(),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: prefersReducedMotion.matches
        ? false
        : {
            duration: 1200,
            easing: "easeOutQuart",
          },
      animations: prefersReducedMotion.matches
        ? {}
        : {
            tension: {
              duration: 1400,
              easing: "easeOutQuart",
              from: 0.15,
              to: 0.35,
            },
            radius: {
              duration: 200,
              easing: "easeOutQuad",
              delay: 80,
            },
          },
      interaction: {
        intersect: false,
        mode: "nearest",
      },
      layout: {
        padding: {
          top: 24,
          left: 26,
          right: 28,
          bottom: 26,
        },
      },
      elements: {
        point: {
          radius: 5,
          hoverRadius: 8,
          borderWidth: 2,
        },
        line: {
          borderWidth: 2.75,
          borderCapStyle: "round",
          borderJoinStyle: "round",
        },
      },
      scales: {
        x: {
          title: {
            text: "Jahr",
            display: true,
            color: axisColor,
          },
          ticks: {
            color: axisColor,
            font: {
              family: "Montserrat, sans-serif",
              size: 12,
            },
            padding: 10,
          },
          grid: {
            color: gridColor,
            borderColor: axisColor,
            borderWidth: 1.2,
            lineWidth: 1.2,
            drawTicks: false,
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          title: {
            text: "Skill-Level (%)",
            display: true,
            color: axisColor,
          },
          ticks: {
            color: axisColor,
            font: {
              family: "Montserrat, sans-serif",
              size: 12,
            },
            padding: 12,
          },
          grid: {
            color: gridColor,
            borderColor: axisColor,
            borderWidth: 1.2,
            lineWidth: 1.2,
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: axisColor,
            usePointStyle: true,
            pointStyle: "circle",
          },
          onClick: () => {},
        },
        tooltip: {
          backgroundColor: "rgba(25, 25, 25, 0.86)",
          titleColor: "#ffffff",
          bodyColor: "#f5f5f5",
          borderColor: "rgba(255, 255, 255, 0.08)",
          borderWidth: 1,
          displayColors: false,
          padding: 12,
          callbacks: {
            label: (context) => `${context.dataset.label}: ${context.formattedValue}%`,
          },
        },
      },
    },
  });

  renderSkillTrendControls();
  updateSkillTrendTheme();
}

function readCssVariable(name, fallback = "") {
  if (!name) {
    return fallback;
  }

  let value = "";

  if (document.body) {
    const bodyStyles = getComputedStyle(document.body);
    value = bodyStyles.getPropertyValue(name);
  }

  if (!value || !value.trim()) {
    const rootStyles = getComputedStyle(document.documentElement);
    value = rootStyles.getPropertyValue(name);
  }

  if (!value) {
    return fallback;
  }

  return value.trim() || fallback;
}

function buildSkillTrendDatasets() {
  const context = skillTrendCtx ? skillTrendCtx.getContext("2d") : null;

  return skillTrendDatasetConfig.map(({ label, data, lineVar, fillVar }) => {
    const lineColor = readCssVariable(lineVar, "#ffffff");
    const fallbackFill = readCssVariable(fillVar, lineColor);
    const fillColor = createSkillTrendGradient(context, fallbackFill);

    return {
      label,
      data: [...data],
      borderColor: lineColor,
      backgroundColor: fillColor,
      tension: 0.35,
      fill: "origin",
      pointBackgroundColor: lineColor,
      pointBorderColor: lineColor,
      pointHoverBackgroundColor: lineColor,
      pointHoverBorderColor: lineColor,
      pointHoverRadius: 7,
      metaFillColor: fallbackFill,
    };
  });
}

function updateSkillTrendTheme() {
  if (!skillTrendChart) {
    return;
  }

  const axisColor = readCssVariable("--chart-axis-color", "#f0f0f0");
  const gridColor = readCssVariable("--chart-grid-color", "rgba(255, 255, 255, 0.1)");
  const context = skillTrendCtx ? skillTrendCtx.getContext("2d") : null;

  skillTrendChart.data.datasets.forEach((dataset, index) => {
    const config = skillTrendDatasetConfig[index];

    if (!config) {
      return;
    }

    const lineColor = readCssVariable(config.lineVar, dataset.borderColor);
    const fillColor = readCssVariable(config.fillVar, dataset.metaFillColor || dataset.backgroundColor);

    dataset.borderColor = lineColor;
    dataset.backgroundColor = createSkillTrendGradient(context, fillColor);
    dataset.pointBackgroundColor = lineColor;
    dataset.pointBorderColor = lineColor;
    dataset.pointHoverBackgroundColor = lineColor;
    dataset.pointHoverBorderColor = lineColor;
    dataset.fill = "origin";
    dataset.metaFillColor = fillColor;
  });

  if (skillTrendChart.options.scales?.x) {
    skillTrendChart.options.scales.x.ticks = {
      ...(skillTrendChart.options.scales.x.ticks || {}),
      color: axisColor,
      font: {
        ...(skillTrendChart.options.scales.x.ticks?.font || {}),
        family: "Montserrat, sans-serif",
        size: 12,
      },
    };
    skillTrendChart.options.scales.x.grid = {
      ...(skillTrendChart.options.scales.x.grid || {}),
      color: gridColor,
      borderColor: axisColor,
      borderWidth: 1.2,
      lineWidth: 1.2,
      drawTicks: false,
    };
    skillTrendChart.options.scales.x.title = {
      ...(skillTrendChart.options.scales.x.title || {}),
      color: axisColor,
    };
  }

  if (skillTrendChart.options.scales?.y) {
    skillTrendChart.options.scales.y.ticks = {
      ...(skillTrendChart.options.scales.y.ticks || {}),
      color: axisColor,
      font: {
        ...(skillTrendChart.options.scales.y.ticks?.font || {}),
        family: "Montserrat, sans-serif",
        size: 12,
      },
    };
    skillTrendChart.options.scales.y.grid = {
      ...(skillTrendChart.options.scales.y.grid || {}),
      color: gridColor,
      borderColor: axisColor,
      borderWidth: 1.2,
      lineWidth: 1.2,
      drawTicks: false,
    };
    skillTrendChart.options.scales.y.title = {
      ...(skillTrendChart.options.scales.y.title || {}),
      color: axisColor,
    };
  }

  if (skillTrendChart.options.plugins?.legend?.labels) {
    skillTrendChart.options.plugins.legend.labels.color = axisColor;
  }

  const tooltipOptions = skillTrendChart.options.plugins?.tooltip;

  if (tooltipOptions) {
    const isDarkTheme = document.body.classList.contains("dark-theme");

    tooltipOptions.backgroundColor = isDarkTheme
      ? "rgba(12, 12, 12, 0.92)"
      : "rgba(25, 25, 25, 0.86)";
    tooltipOptions.titleColor = isDarkTheme ? "#f8f8f8" : "#111111";
    tooltipOptions.bodyColor = isDarkTheme ? "#f1f1f1" : "#222222";
    tooltipOptions.borderColor = isDarkTheme
      ? "rgba(255, 255, 255, 0.12)"
      : "rgba(0, 0, 0, 0.08)";
  }

  refreshSkillToggleColors();
  skillTrendChart.update();
}

if (typeof prefersReducedMotion?.addEventListener === "function") {
  prefersReducedMotion.addEventListener("change", (event) => {
    if (!skillTrendChart) {
      return;
    }

    skillTrendChart.options.animation = event.matches
      ? false
      : {
          duration: 1200,
          easing: "easeOutQuart",
        };
    skillTrendChart.options.animations = event.matches
      ? {}
      : {
          tension: {
            duration: 1400,
            easing: "easeOutQuart",
            from: 0.15,
            to: 0.35,
          },
          radius: {
            duration: 200,
            easing: "easeOutQuad",
            delay: 80,
          },
        };

    skillTrendChart.update();
  });
}
