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
