const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const bubbleButtons = document.querySelectorAll("[data-interest]");
const bubbleLabel = document.querySelector("[data-interest-label]");
const bubbleDescription = document.querySelector("[data-interest-description]");
const bubbleChart = document.querySelector(".bubble-chart");
const bubbleLayoutQuery = window.matchMedia("(max-width: 720px)");
const bubbleSafeInset = 18;
let activeBubble = null;
let pendingLayoutFrame = null;

const skillTrendDatasetConfig = [
  {
    label: "C#",
    data: [45, 58, 72, 84, 90, 93],
    lineVar: "--chart-line-1",
    fillVar: "--chart-line-1-fill",
  },
  {
    label: "Python",
    data: [30, 42, 55, 68, 76, 85],
    lineVar: "--chart-line-2",
    fillVar: "--chart-line-2-fill",
  },
  {
    label: "Kotlin",
    data: [20, 36, 52, 66, 80, 88],
    lineVar: "--chart-line-3",
    fillVar: "--chart-line-3-fill",
  },
  {
    label: "C",
    data: [10, 18, 28, 36, 48, 60],
    lineVar: "--chart-line-4",
    fillVar: "--chart-line-4-fill",
  },
  {
    label: "Russisch",
    data: [5, 14, 26, 44, 58, 72],
    lineVar: "--chart-line-5",
    fillVar: "--chart-line-5-fill",
  },
];

const skillTrendLabels = ["2020", "2021", "2022", "2023", "2024", "2025"];
let skillTrendChart = null;

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
  const tooltipBackground = readCssVariable(
    "--chart-tooltip-bg",
    "rgba(17, 17, 17, 0.9)",
  );
  const tooltipColor = readCssVariable("--chart-tooltip-color", "#f5f5f5");
  const tooltipBorder = readCssVariable("--timeline-line", "rgba(31, 31, 31, 0.1)");
  const baseAnimation = prefersReducedMotion.matches
    ? false
    : {
        duration: 1100,
        easing: "easeOutQuart",
      };
  const datasetAnimations = prefersReducedMotion.matches
    ? {}
    : {
        tension: {
          duration: 900,
          easing: "easeOutQuad",
          from: 0.25,
          to: 0.4,
        },
        y: {
          duration: 950,
          easing: "easeOutCubic",
        },
      };

  skillTrendChart = new Chart(skillTrendCtx, {
    type: "line",
    data: {
      labels: skillTrendLabels,
      datasets: buildSkillTrendDatasets(),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 12,
          right: 16,
          bottom: 8,
          left: 8,
        },
      },
      animation: baseAnimation,
      animations: datasetAnimations,
      elements: {
        line: {
          borderCapStyle: "round",
          borderJoinStyle: "round",
        },
        point: {
          borderWidth: 2,
          hoverBorderWidth: 2,
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
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
          },
          grid: {
            color: gridColor,
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
          },
          grid: {
            color: gridColor,
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
          labels: {
            color: axisColor,
            usePointStyle: true,
            boxWidth: 12,
            padding: 18,
            font: {
              family: '"Montserrat", sans-serif',
              weight: "500",
            },
          },
        },
        tooltip: {
          backgroundColor: tooltipBackground,
          borderColor: tooltipBorder,
          borderWidth: 1,
          titleFont: {
            family: '"Montserrat", sans-serif',
            weight: "600",
          },
          bodyFont: {
            family: '"Montserrat", sans-serif',
          },
          titleColor: tooltipColor,
          bodyColor: tooltipColor,
          padding: 14,
          cornerRadius: 12,
        },
      },
    },
  });

  updateSkillTrendTheme();
  applySkillTrendMotionPreference();
}

function readCssVariable(name, fallback = "") {
  if (!name) {
    return fallback;
  }

  const styles = getComputedStyle(document.documentElement);
  const value = styles.getPropertyValue(name);

  if (!value) {
    return fallback;
  }

  return value.trim() || fallback;
}

function buildSkillTrendDatasets() {
  const styles = getComputedStyle(document.documentElement);

  return skillTrendDatasetConfig.map(({ label, data, lineVar, fillVar }) => {
    const lineColor = (styles.getPropertyValue(lineVar) || "#ffffff").trim() || "#ffffff";
    const fillColor = (styles.getPropertyValue(fillVar) || lineColor).trim() || lineColor;

    return {
      label,
      data: [...data],
      borderColor: lineColor,
      backgroundColor: fillColor,
      tension: 0.35,
      fill: true,
      borderWidth: 3,
      cubicInterpolationMode: "monotone",
      pointBackgroundColor: lineColor,
      pointBorderColor: lineColor,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointHitRadius: 14,
      pointBorderWidth: 2,
      pointHoverBorderWidth: 2,
      pointHoverBackgroundColor: lineColor,
      pointHoverBorderColor: lineColor,
      clip: 0,
    };
  });
}

function updateSkillTrendTheme() {
  if (!skillTrendChart) {
    return;
  }

  const styles = getComputedStyle(document.documentElement);
  const axisColor = readCssVariable("--chart-axis-color", "#f0f0f0");
  const gridColor = readCssVariable("--chart-grid-color", "rgba(255, 255, 255, 0.1)");
  const tooltipBackground = readCssVariable(
    "--chart-tooltip-bg",
    skillTrendChart.options.plugins?.tooltip?.backgroundColor ||
      "rgba(17, 17, 17, 0.9)",
  );
  const tooltipColor = readCssVariable(
    "--chart-tooltip-color",
    skillTrendChart.options.plugins?.tooltip?.titleColor || "#f5f5f5",
  );
  const tooltipBorder = readCssVariable(
    "--timeline-line",
    skillTrendChart.options.plugins?.tooltip?.borderColor ||
      "rgba(31, 31, 31, 0.1)",
  );

  skillTrendChart.data.datasets.forEach((dataset, index) => {
    const config = skillTrendDatasetConfig[index];

    if (!config) {
      return;
    }

    const lineColor = (styles.getPropertyValue(config.lineVar) || dataset.borderColor).trim() ||
      dataset.borderColor;
    const fillColor = (styles.getPropertyValue(config.fillVar) || dataset.backgroundColor).trim() ||
      dataset.backgroundColor;

    dataset.borderColor = lineColor;
    dataset.backgroundColor = fillColor;
    dataset.pointBackgroundColor = lineColor;
    dataset.pointBorderColor = lineColor;
    dataset.pointHoverBackgroundColor = lineColor;
    dataset.pointHoverBorderColor = lineColor;
  });

  if (skillTrendChart.options.scales?.x) {
    skillTrendChart.options.scales.x.ticks = {
      ...(skillTrendChart.options.scales.x.ticks || {}),
      color: axisColor,
    };
    skillTrendChart.options.scales.x.grid = {
      ...(skillTrendChart.options.scales.x.grid || {}),
      color: gridColor,
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
    };
    skillTrendChart.options.scales.y.grid = {
      ...(skillTrendChart.options.scales.y.grid || {}),
      color: gridColor,
    };
    skillTrendChart.options.scales.y.title = {
      ...(skillTrendChart.options.scales.y.title || {}),
      color: axisColor,
    };
  }

  if (skillTrendChart.options.plugins?.legend?.labels) {
    skillTrendChart.options.plugins.legend.labels.color = axisColor;
  }

  if (skillTrendChart.options.plugins?.tooltip) {
    skillTrendChart.options.plugins.tooltip.backgroundColor = tooltipBackground;
    skillTrendChart.options.plugins.tooltip.borderColor = tooltipBorder;
    skillTrendChart.options.plugins.tooltip.titleColor = tooltipColor;
    skillTrendChart.options.plugins.tooltip.bodyColor = tooltipColor;
  }

  skillTrendChart.update();
}

function applySkillTrendMotionPreference() {
  if (!skillTrendChart) {
    return;
  }

  const baseAnimation = prefersReducedMotion.matches
    ? false
    : {
        duration: 1100,
        easing: "easeOutQuart",
      };

  const datasetAnimations = prefersReducedMotion.matches
    ? {}
    : {
        tension: {
          duration: 900,
          easing: "easeOutQuad",
          from: 0.25,
          to: 0.4,
        },
        y: {
          duration: 950,
          easing: "easeOutCubic",
        },
      };

  skillTrendChart.options.animation = baseAnimation;
  skillTrendChart.options.animations = datasetAnimations;
  skillTrendChart.update();
}

if (typeof prefersReducedMotion.addEventListener === "function") {
  prefersReducedMotion.addEventListener("change", applySkillTrendMotionPreference);
} else if (typeof prefersReducedMotion.addListener === "function") {
  prefersReducedMotion.addListener(applySkillTrendMotionPreference);
}
