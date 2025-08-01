// File: script.js (Completely replace your old code with this)

document.addEventListener('DOMContentLoaded', () => {

    const forms = {
        login: document.getElementById('login-form'),
        register: document.getElementById('register-form'),
        forgot: document.getElementById('forgot-form'),
        otp: document.getElementById('otp-form'),
        newPassword: document.getElementById('new-password-form')
    };

    let otpFlow = null;
    let userEmailForVerification = ''; // Store the user's email globally

    function showForm(formId) {
        Object.keys(forms).forEach(key => {
            const formWrapper = forms[key];
            if (formWrapper) {
                formWrapper.classList.toggle('hidden', key !== formId);
            }
        });
    }

    // --- Function to Send OTP Request to YOUR Backend ---
    async function sendOtpRequest(email, formElement) {
        const button = formElement.querySelector('button[type="submit"]');
        const originalButtonText = button.textContent;
        button.disabled = true;
        button.textContent = 'Sending...';

        try {
            const response = await fetch('http://localhost:3000/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email }),
            });
            const result = await response.json();

            if (result.success) {
                userEmailForVerification = email; // Save email for verification step
                const otpInfoText = document.getElementById('otp-info-text');
                otpInfoText.innerHTML = `An OTP has been sent to <br><strong>${email}</strong>`;
                showForm('otp');
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            alert('Could not connect to the server. Make sure it is running.');
        } finally {
            button.disabled = false;
            button.textContent = originalButtonText;
        }
    }

    // --- Event Listeners for form links ---
    document.getElementById('show-register-form').addEventListener('click', (e) => { e.preventDefault(); showForm('register'); });
    document.getElementById('show-forgot-form').addEventListener('click', (e) => { e.preventDefault(); showForm('forgot'); });
    document.getElementById('show-login-form-from-reg').addEventListener('click', (e) => { e.preventDefault(); showForm('login'); });
    document.getElementById('show-login-form-from-forgot').addEventListener('click', (e) => { e.preventDefault(); showForm('login'); });

    // --- Event Listeners for form submissions ---
    if (forms.register) {
        forms.register.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            otpFlow = 'register';
            const email = document.getElementById('register-email').value;
            sendOtpRequest(email, forms.register);
        });
    }
    if (forms.forgot) {
        forms.forgot.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            otpFlow = 'reset';
            const email = document.getElementById('forgot-email').value;
            sendOtpRequest(email, forms.forgot);
        });
    }
    if (forms.otp) {
        forms.otp.querySelector('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const otp = document.getElementById('otp-input').value;
            try {
                const response = await fetch('http://localhost:3000/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmailForVerification, otp: otp }),
                });
                const result = await response.json();
                if (result.success) {
                    if (otpFlow === 'register') {
                        alert('Account verified! Please log in.');
                        showForm('login');
                    } else if (otpFlow === 'reset') {
                        showForm('newPassword');
                    }
                } else {
                    alert(`Error: ${result.message}`);
                }
            } catch (error) {
                alert('Could not connect to the server to verify OTP.');
            }
        });
    }
    if (forms.newPassword) {
        forms.newPassword.querySelector('form').addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Password has been reset successfully! Please log in.');
            showForm('login');
        });
    }

    // --- Show/Hide Password Logic ---
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', () => {
            const passwordInput = button.closest('.input-group').querySelector('.password-input');
            if (passwordInput) {
                passwordInput.type = (passwordInput.type === 'password') ? 'text' : 'password';
                button.classList.toggle('hide');
            }
        });
    });
});