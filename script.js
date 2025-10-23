const quotes = [
  "Only what grows in silence can rise without breaking.",
  "I've been building systems for years — but the most complex one was myself.",
  "The fire that burned me once — now keeps me warm.",
];

const quoteElement = document.querySelector("[data-quote]");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

let quoteIndex = 0;
let intervalId = null;

function cycleQuotes() {
  if (!quoteElement) return;

  quoteElement.classList.add("is-fading-out");

  setTimeout(() => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    quoteElement.textContent = quotes[quoteIndex];
    quoteElement.classList.remove("is-fading-out");
  }, 600);
}

function startRotation() {
  if (prefersReducedMotion.matches || intervalId !== null) return;
  intervalId = window.setInterval(cycleQuotes, 4000);
}

function stopRotation() {
  if (intervalId === null) return;
  window.clearInterval(intervalId);
  intervalId = null;
}

if (quoteElement) {
  quoteElement.textContent = quotes[quoteIndex];

  if (!prefersReducedMotion.matches) {
    startRotation();
  }

  const handleMotionPreferenceChange = (event) => {
    if (event.matches) {
      stopRotation();
    } else {
      quoteIndex = 0;
      quoteElement.textContent = quotes[quoteIndex];
      stopRotation();
      startRotation();
    }
  };

  if (typeof prefersReducedMotion.addEventListener === "function") {
    prefersReducedMotion.addEventListener(
      "change",
      handleMotionPreferenceChange,
    );
  } else if (typeof prefersReducedMotion.addListener === "function") {
    prefersReducedMotion.addListener(handleMotionPreferenceChange);
  }
}

const bubbleButtons = document.querySelectorAll("[data-interest]");
const bubbleLabel = document.querySelector("[data-interest-label]");
const bubbleDescription = document.querySelector("[data-interest-description]");
const bubbleChart = document.querySelector(".bubble-chart");
const bubbleLayoutQuery = window.matchMedia("(max-width: 720px)");
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

    const left = Math.min(Math.max(radius, targetX), width - radius);
    const top = Math.min(Math.max(radius, targetY), height - radius);

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
