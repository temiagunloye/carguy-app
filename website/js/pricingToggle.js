/**
 * Pricing Toggle Logic
 * Handles switching between Monthly and Yearly billing
 */

document.addEventListener('DOMContentLoaded', () => {
    initPricingToggle();
});

function initPricingToggle() {
    const toggle = document.getElementById('billing-toggle');
    const monthlyLabels = document.querySelectorAll('.pricing-label[data-billing="monthly"]');
    const yearlyLabels = document.querySelectorAll('.pricing-label[data-billing="yearly"]');

    // Check local storage or URL param for preference
    const savedBilling = localStorage.getItem('garageManager_billing') || 'monthly';
    const params = new URLSearchParams(window.location.search);
    const urlBilling = params.get('billing');

    // Set initial state
    const currentBilling = urlBilling || savedBilling;

    if (currentBilling === 'yearly') {
        toggle.checked = true;
        updateActiveLabels('yearly');
        updatePrices('yearly');
    } else {
        toggle.checked = false;
        updateActiveLabels('monthly');
        updatePrices('monthly');
    }

    // Event listener
    toggle.addEventListener('change', (e) => {
        const mode = e.target.checked ? 'yearly' : 'monthly';
        updateActiveLabels(mode);
        updatePrices(mode);

        // Persist
        localStorage.setItem('garageManager_billing', mode);

        // Update URL without reload
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('billing', mode);
        window.history.replaceState({}, '', newUrl);
    });

    function updateActiveLabels(mode) {
        if (mode === 'yearly') {
            monthlyLabels.forEach(l => l.classList.remove('active'));
            yearlyLabels.forEach(l => l.classList.add('active'));
        } else {
            yearlyLabels.forEach(l => l.classList.remove('active'));
            monthlyLabels.forEach(l => l.classList.add('active'));
        }
    }

    function updatePrices(mode) {
        const cards = document.querySelectorAll('.pricing-card');

        cards.forEach(card => {
            const priceEl = card.querySelector('.pricing-price');
            const periodEl = card.querySelector('.pricing-period');
            const saveBadge = card.querySelector('.save-badge');

            // Get data attributes
            const monthlyPrice = card.getAttribute('data-monthly-price');
            const yearlyPrice = card.getAttribute('data-yearly-price');

            // Skip if no pricing data (e.g. Free plan might handle differently or be same)
            if (!monthlyPrice && !yearlyPrice) return;

            if (mode === 'yearly') {
                // Animate out
                priceEl.style.opacity = '0';

                setTimeout(() => {
                    if (yearlyPrice) {
                        priceEl.textContent = yearlyPrice;
                        periodEl.innerHTML = 'per year <span class="text-xs text-accent">(billed annually)</span>';
                    }
                    if (saveBadge) saveBadge.classList.add('visible');
                    priceEl.style.opacity = '1';
                }, 200);
            } else {
                // Animate out
                priceEl.style.opacity = '0';

                setTimeout(() => {
                    if (monthlyPrice) {
                        priceEl.textContent = monthlyPrice;
                        periodEl.textContent = 'per month';
                    }
                    if (saveBadge) saveBadge.classList.remove('visible');
                    priceEl.style.opacity = '1';
                }, 200);
            }
        });
    }
}
