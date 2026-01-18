/**
 * Car Guy App - Waitlist Logic
 * Handles form submission, validation, and analytics
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('waitlist-form');
    const successView = document.getElementById('waitlist-success');
    const submitBtn = document.getElementById('waitlist-submit');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const messageEl = document.getElementById('waitlist-message');
    const shareBtn = document.getElementById('share-btn');

    // UTM Parameters
    const getUTMParams = () => {
        const params = new URLSearchParams(window.location.search);
        return {
            source: params.get('utm_source') || 'website',
            medium: params.get('utm_medium') || '',
            campaign: params.get('utm_campaign') || '',
            term: params.get('utm_term') || '',
            content: params.get('utm_content') || ''
        };
    };

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Reset state
            messageEl.style.display = 'none';
            messageEl.className = 'waitlist-message';
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'block';

            // Gather data
            const formData = new FormData(form);
            const data = {
                email: formData.get('email'),
                role: formData.get('role'),
                planInterest: formData.get('planInterest'),
                carBuild: formData.get('carBuild'),
                phone: formData.get('phone'), // Optional/Honeypot
                ...getUTMParams(),
                pagePath: window.location.pathname
            };

            try {
                // Send to API
                const response = await fetch('/api/signup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                // Handle Demo Mode
                if (result.mode === 'demo') {
                    console.log('Demo Mode: Signup simulated.');
                }

                if (response.ok) {
                    // Success
                    form.style.display = 'none';
                    successView.style.display = 'block';

                    // Track event
                    if (window.trackEvent) {
                        window.trackEvent('waitlist_submit', { role: data.role });
                    }
                } else {
                    throw new Error(result.message || 'Something went wrong. Please try again.');
                }

            } catch (error) {
                // Error
                messageEl.textContent = error.message;
                messageEl.classList.add('error');
                messageEl.style.display = 'block';

                // Track error
                if (window.trackEvent) {
                    window.trackEvent('waitlist_submit_error', { error: error.message });
                }
            } finally {
                submitBtn.disabled = false;
                btnText.style.display = 'block';
                btnLoader.style.display = 'none';
            }
        });
    }

    // Share Button Logic
    if (shareBtn) {
        shareBtn.addEventListener('click', () => {
            navigator.clipboard.writeText('https://carguy.app').then(() => {
                const originalText = shareBtn.textContent;
                shareBtn.textContent = 'Copied!';
                setTimeout(() => {
                    shareBtn.textContent = originalText;
                }, 2000);
            });
        });
    }
});
