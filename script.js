const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    {
      threshold: 0.18,
      rootMargin: '0px 0px -80px 0px'
    }
  );

  document.querySelectorAll('[data-animate]').forEach(section => {
    observer.observe(section);
  });
} else {
  document.querySelectorAll('[data-animate]').forEach(section => {
    section.classList.add('visible');
  });
}

const progressBars = document.querySelectorAll('.progress-fill');
progressBars.forEach(bar => {
  const fill = bar.style.getPropertyValue('--fill');
  bar.style.width = '0%';
  requestAnimationFrame(() => {
    bar.style.width = fill || '60%';
  });
});
