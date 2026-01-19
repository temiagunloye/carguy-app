// Body Shop Lead Forms Handler

document.addEventListener('DOMContentLoaded', () => {
    // Join Network Form
    const joinForm = document.getElementById('join-network-form');
    if (joinForm) {
        joinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLeadSubmit(joinForm, 'bodyshop', 'join');
        });
    }

    // Request Quote Form
    const quoteForm = document.getElementById('request-quote-form');
    if (quoteForm) {
        quoteForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLeadSubmit(quoteForm, 'client_quote', 'quote');
        });
    }
});

async function handleLeadSubmit(form, leadType, formId) {
    const submitBtn = form.querySelector(`#${formId}-submit`);
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');
    const messageEl = form.querySelector(`#${formId}-message`);

    // Get form data
    const formData = new FormData(form);
    const data = {
        type: leadType,
        email: formData.get('email'),
        source: 'website',
        ipHash: '', // Will be set server-side
    };

    // Add fields based on form type
    if (leadType === 'bodyshop') {
        data.businessName = formData.get('businessName');
        data.contactName = formData.get('contactName');
        data.phone = formData.get('phone');
        data.location = formData.get('location');
        data.specialty = formData.get('specialty');
        data.message = formData.get('message');
    } else if (leadType === 'client_quote') {
        data.contactName = formData.get('name');
        data.phone = formData.get('phone');
        data.location = formData.get('location');
        data.message = formData.get('message');
        data.vehicle = formData.get('vehicle');
    }

    // Validate email
    if (!data.email || !data.email.includes('@')) {
        showMessage(messageEl, 'Please enter a valid email address', 'error');
        return;
    }

    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';
    messageEl.style.display = 'none';

    try {
        const response = await fetch('/api/bodyshop-leads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (result.ok) {
            // Track conversion
            trackEvent('bodyshop_lead_submit', {
                lead_type: leadType,
                form_id: formId,
            });

            // Show success message
            showMessage(
                messageEl,
                leadType === 'bodyshop'
                    ? 'Application submitted! We\'ll be in touch within 24 hours.'
                    : 'Quote request received! A dealer will contact you soon.',
                'success'
            );

            // Reset form
            form.reset();

            // Scroll to message
            messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            throw new Error(result.message || 'Submission failed');
        }
    } catch (error) {
        console.error('Lead submission error:', error);
        showMessage(
            messageEl,
            'Something went wrong. Please try again or contact support.',
            'error'
        );
    } finally {
        // Reset button state
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `form-message ${type}`;
    element.style.display = 'block';
}
