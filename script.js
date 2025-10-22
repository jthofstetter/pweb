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
let activeBubble = null;

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

if (bubbleButtons.length) {
  bubbleButtons.forEach((button) => {
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", () => updateBubbleDetail(button));
    button.addEventListener("mouseenter", () => updateBubbleDetail(button));
    button.addEventListener("focus", () => updateBubbleDetail(button));
  });

  updateBubbleDetail(bubbleButtons[0]);
}
