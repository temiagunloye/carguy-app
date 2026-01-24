/**
 * Pricing Toggle Logic (Sliding Tab Version)
 * Handles switching between Monthly and Yearly billing
 */

document.addEventListener('DOMContentLoaded', () => {
    initPricingSlideToggle();
});

function initPricingSlideToggle() {
    const tabsContainer = document.getElementById('pricing-tabs');
    const options = document.querySelectorAll('.toggle-option');

    // Check local storage or URL param for preference
    const savedBilling = localStorage.getItem('garageManager_billing') || 'monthly';
    const params = new URLSearchParams(window.location.search);
    const urlBilling = params.get('billing');

    // Set initial state
    const currentBilling = urlBilling || savedBilling;

    if (currentBilling === 'yearly') {
        setYearly();
    } else {
        setMonthly();
    }

    // Click Handlers
    options.forEach(opt => {
        opt.addEventListener('click', () => {
            const period = opt.dataset.period;
            if (period === 'yearly') setYearly();
            else setMonthly();
        });
    });

    function setMonthly() {
        tabsContainer.classList.remove('year-active');
        updateState('monthly');
    }

    function setYearly() {
        tabsContainer.classList.add('year-active');
        updateState('yearly');
    }

    function updateState(mode) {
        // Persist
        localStorage.setItem('garageManager_billing', mode);

        // Update URL
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('billing', mode);
        window.history.replaceState({}, '', newUrl);

        // Update Prices
        updatePrices(mode);
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

            if (!monthlyPrice && !yearlyPrice) return;

            if (mode === 'yearly') {
                // Animate out
                priceEl.style.opacity = '0';

                setTimeout(() => {
                    if (yearlyPrice) {
                        priceEl.textContent = yearlyPrice;
                        periodEl.innerHTML = 'per year <span class="text-xs text-accent" style="display:block; font-size:12px; color:#3b82f6;">(billed annually)</span>';
                    }
                    if (saveBadge) saveBadge.classList.add('visible');
                    priceEl.style.opacity = '1';
                }, 150);
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
                }, 150);
            }
        });
    }
}
