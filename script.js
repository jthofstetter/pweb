const observer = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.2,
    }
);

document.querySelectorAll('[data-animate]').forEach((section, index) => {
    section.style.transitionDelay = `${index * 80}ms`;
    observer.observe(section);
});

window.addEventListener('load', () => {
    document.querySelectorAll('.progress span').forEach((bar) => {
        const width = bar.style.width;
        bar.style.width = '0%';
        requestAnimationFrame(() => {
            bar.style.width = width;
        });
    });
});
