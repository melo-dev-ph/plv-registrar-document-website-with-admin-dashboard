class AdminAuthenticator {
    constructor(supabaseUrl, supabaseAnonKey) {
        this.supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey);


        this.loginForm = document.querySelector('.admin-content form');
        this.adminIdInput = document.getElementById('id');
        this.passwordInput = document.getElementById('password');
        this.loginBtn = document.getElementById('login-btn');

        this.errorContainer = this.buildErrorContainer();

        this.init();
    }

    buildErrorContainer() {
        const container = document.createElement('div');
        container.style.color = '#d32f2f';
        container.style.fontSize = '0.85rem';
        container.style.margin = '0 0 10px 0';
        container.style.textAlign = 'center';
        container.style.fontWeight = '600';
        container.style.visibility = 'hidden';
        container.style.minHeight = '18px';

        const formAction = this.loginForm.querySelector('.form-action');
        this.loginForm.querySelector('fieldset').insertBefore(container, formAction);

        return container;
    }

    init() {
        if (this.loginForm) {
            this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        this.adminIdInput.addEventListener('input', () => this.clearErrors());
        this.passwordInput.addEventListener('input', () => this.clearErrors());
    }

    clearErrors() {
        this.errorContainer.style.visibility = 'hidden';
        this.adminIdInput.classList.remove('input-error');
        this.passwordInput.classList.remove('input-error');
    }

    async handleLogin(e) {
        e.preventDefault(); 
        
        this.setLoadingState(true);

        const emailOrId = this.adminIdInput.value.trim();
        const password = this.passwordInput.value;

        try {
            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: emailOrId,
                password: password,
            });

            if (error) throw error;

            this.handleSuccess();

        } catch (error) {
            console.error("Login failed:", error.message);
            this.showError('Invalid Admin ID or Password.');
        }
    }

    setLoadingState(isLoading) {
        if (isLoading) {
            this.clearErrors();
            this.loginBtn.textContent = 'VERIFYING...';
            this.loginBtn.disabled = true;
        } else {
            this.loginBtn.textContent = 'LOG IN';
            this.loginBtn.disabled = false;
        }
    }

    showError(message) {
        this.errorContainer.textContent = message;
        this.errorContainer.style.visibility = 'visible';
        
        this.adminIdInput.classList.add('input-error');
        this.passwordInput.classList.add('input-error');

        this.setLoadingState(false);
    }

    handleSuccess() {
        this.loginBtn.textContent = 'ACCESS GRANTED';
        this.loginBtn.style.backgroundColor = '#4CAF50'; 
        
        setTimeout(() => {
            window.location.href = 'admin.html'; 
        }, 500);
    }
}

const SUPABASE_URL = 'https://giicwnztrohimzhbbkvo.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_KfIt6mlV3_g4i7iHioCHNw_xDkt1AyT';

document.addEventListener('DOMContentLoaded', () => {
    new AdminAuthenticator(SUPABASE_URL, SUPABASE_ANON_KEY);
});