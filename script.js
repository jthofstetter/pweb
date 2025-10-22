const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealTargets = document.querySelectorAll('[data-animate]');
if (!prefersReducedMotion) {
  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -120px 0px' }
  );

  revealTargets.forEach(section => observer.observe(section));
} else {
  revealTargets.forEach(section => section.classList.add('visible'));
}

const bars = document.querySelectorAll('.tech-item');

bars.forEach(item => {
  const fill = item.dataset.fill || '65';
  const bar = item.querySelector('.bar-fill');
  if (!bar) return;

  if (prefersReducedMotion) {
    bar.style.width = `${fill}%`;
    return;
  }

  bar.style.width = '0%';
  const delay = Math.random() * 280 + 160;
  setTimeout(() => {
    requestAnimationFrame(() => {
      bar.style.width = `${fill}%`;
    });
  }, delay);
});

const podiumTiers = document.querySelectorAll('.podium-tier');
if (!prefersReducedMotion) {
  podiumTiers.forEach((tier, index) => {
    tier.style.setProperty('--delay', `${index * 0.12}s`);
    tier.animate(
      [
        { transform: 'translateY(40px) scale(0.95)', opacity: 0 },
        { transform: 'translateY(0) scale(1)', opacity: 1 }
      ],
      {
        duration: 600,
        delay: index * 120,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'both'
      }
    );
  });
}
