const quotes = [
  "Only what grows in silence can rise without breaking.",
  "I've been building systems for years — but the most complex one was myself.",
  "The fire that burned me once — now keeps me warm.",
];

const quoteElement = document.querySelector("[data-quote]");
let quoteIndex = 0;

function cycleQuotes() {
  if (!quoteElement) return;

  quoteElement.classList.add("is-fading-out");

  setTimeout(() => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    quoteElement.textContent = quotes[quoteIndex];
    quoteElement.classList.remove("is-fading-out");
  }, 600);
}

if (quoteElement) {
  quoteElement.textContent = quotes[quoteIndex];
  setInterval(cycleQuotes, 4000);
}
