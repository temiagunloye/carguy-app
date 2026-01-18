// Garage Manager - Main JavaScript
// Navigation, FAQ, and scroll effects

// Sticky Navigation
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('nav-toggle');
const navLinks = document.getElementById('nav-links');

let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    lastScroll = currentScroll;
});

// Mobile Menu Toggle
if (navToggle) {
    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
        });
    });
}

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const wasActive = faqItem.classList.contains('active');

        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });

        // Open clicked item if it wasn't active
        if (!wasActive) {
            faqItem.classList.add('active');
        }
    });
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);

        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Fade in on scroll (simple intersection observer)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.querySelectorAll('.feature-card, .step-card, .pricing-card').forEach(el => {
    observer.observe(el);
});

// Analytics Tracking - Global CTA Handler
document.addEventListener('click', (e) => {
    // 1. Track Button Clicks
    const btn = e.target.closest('.btn');
    if (btn && window.trackEvent) {
        window.trackEvent('cta_click', {
            cta_text: btn.innerText.trim(),
            cta_location: btn.closest('section')?.id || 'navbar',
            destination_url: btn.getAttribute('href')
        });
    }

    // 2. Track Navigation Links
    const navLink = e.target.closest('.nav-link');
    if (navLink && window.trackEvent) {
        window.trackEvent('nav_click', {
            text: navLink.innerText.trim(),
            destination_url: navLink.getAttribute('href')
        });
    }
});
