document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    // If multiple forms exist, we might need a more specific selector, 
    // but support.html likely has one main form.
    if (!form) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // UI Loading State
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending...';

        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            subject: formData.get('subject'),
            message: formData.get('message')
        };

        try {
            const res = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();

            if (result.ok) {
                // Success
                form.innerHTML = `
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">✅</div>
                        <h3 style="color: white; margin-bottom: 0.5rem;">Message Sent!</h3>
                        <p style="color: #888;">We'll get back to you shortly.</p>
                        <button onclick="window.location.reload()" class="btn btn-secondary btn-sm" style="margin-top:1rem;">Send Another</button>
                    </div>
                `;
            } else {
                throw new Error(result.message || 'Failed to send');
            }
        } catch (err) {
            console.error(err);
            alert('Something went wrong. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
});
