class RegistrarApp {
    constructor(supabaseUrl, supabaseKey) {
        // Initialize Supabase Client
        this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

        this.pages = {
            maintenance: document.getElementById('maintenance-page'),
            welcome: document.getElementById('welcome-page'),
            login: document.getElementById('login-page'),
            request: document.getElementById('request-page'),
            reciept: document.getElementById('trans-reciept'),
            paymentOverlay: document.getElementById('payment-sample'),
            end: document.getElementById('end-page'),
            dbShowcase: document.getElementById('db-showcase'),
        };

        this.buttons = {
            start: document.getElementById('start-btn'),
            login: document.getElementById('login-btn'),
            request: document.getElementById('request-btn'),
            
            finalize: document.getElementById('finalize-btn'),
            cancelPay: document.getElementById('cancel-payment'),
            pay: document.getElementById('pay-btn'),

            showStatusWelcome: document.getElementById('home-status-btn'),
            showStatusEnd: document.getElementById('status-btn'),

            homeBtn: document.getElementById('home-btn'),
            searchStatus: document.getElementById('search-status-btn'),
            backHome: document.getElementById('back-home-btn'),

            globalBack: document.getElementById('global-back-btn'),
        };

        this.progress = {
            waterFill: document.getElementById('water-fill'),
            steps: [
                document.querySelector('.bar.step-1'),
                document.querySelector('.bar.step-2'),
                document.querySelector('.bar.step-3'),
                document.querySelector('.bar.step-4'),
                document.querySelector('.bar.step-5'),
                document.querySelector('.bar.step-6'),
            ]
        };

        this.userData = {
            studentId: '',
            birthdate: '',
            email: '',
            documents: [], // Will store objects: { name: 'TOR', price: 150 }
            notes: '',
            ticketNumber: '',
            totalPrice: 0
        };

        this.documentPrices = {}; // Will load from Supabase
        this.currentStep = 1;

        this.init();
    }

    async init() {
        // Check if in maintenance mode
        try {
            const { data } = await this.supabase.from('system_settings').select('maintenance_mode').eq('id', 1).single();
            
            if (data && data.maintenance_mode) {
                // System is locked. Hide the welcome page and progress bar, show maintenance screen.
                document.getElementById('progress-bar').classList.add('hidden');
                this.pages.welcome.classList.add('hidden');
                this.pages.maintenance.classList.remove('hidden');
                
                return; // STOP the app from loading further (disables all buttons)
            }
        } catch (error) {
            console.error("Failed to check maintenance status:", error);
        }

        // Load dynamic prices from DB first
        await this.fetchPrices();

        this.buttons.start.addEventListener('click', () => {
            this.triggerTransition(() => this.goToLogin(), 2)
        });

        this.buttons.login.addEventListener('click', () => {
            this.handleLogin();
        });

        this.buttons.request.addEventListener('click', () => {
            this.handleRequest();
        });

        this.buttons.finalize.addEventListener('click', () => {
            this.openPaymentGateway();
        });

        this.buttons.homeBtn.addEventListener('click', () => {
            this.triggerTransition(() => {
                this.pages.end.classList.add('hidden');
                this.pages.welcome.classList.remove('hidden');

                document.getElementById('student-id').value = '';
                document.getElementById('birthdate').value = '';
                document.getElementById('student-email').value = '';
                document.getElementById('add-notes').value = '';
                document.querySelectorAll('input[name="plv-doc"]:checked').forEach(box => box.checked = false);
            }, 1);
        });

        this.buttons.cancelPay.addEventListener('click', () => {
            this.pages.paymentOverlay.classList.add('hidden');
        });

        this.buttons.pay.addEventListener('click', () => {
            this.processPayment();
        });

        this.buttons.showStatusWelcome.addEventListener('click', () => {
            this.triggerTransition(() => this.openStatusPage(this.pages.welcome), 1);
        });

        this.buttons.showStatusEnd.addEventListener('click', () => {
            this.triggerTransition(() => this.openStatusPage(this.pages.end), 6);
        });

        this.buttons.backHome.addEventListener('click', () => {
            this.triggerTransition(() => {
                this.pages.dbShowcase.classList.add('hidden');
                this.pages.welcome.classList.remove('hidden');
                
                document.getElementById('progress-bar').classList.remove('hidden'); 
                
                document.getElementById('ticket-search').value = '';
                this.updateProgressBar(1);
            }, 1)
        });

        document.getElementById('close-status-modal').addEventListener('click', () => {
            this.handleModalClose();
        });

        this.buttons.searchStatus.addEventListener('click', () => {
            this.fetchDocumentStatus();
        });

        this.buttons.globalBack.addEventListener('click', () => {
            this.handleGoBack();
        });
    }

    async fetchPrices() {
        try {
            const { data, error } = await this.supabase.from('document_types').select('*').eq('is_active', true);
            if (data) {
                data.forEach(doc => {
                    this.documentPrices[doc.html_id] = parseFloat(doc.price);
                });
            }
        } catch (err) {
            console.error("Failed to load prices:", err);
        }
    }

    triggerTransition(actionCallBack, targetStep) {
        if(document.startViewTransition) {
            document.startViewTransition(() => {
                actionCallBack();
                this.updateProgressBar(targetStep);
            });
        } else {
            actionCallBack();
            this.updateProgressBar(targetStep);
        }
    }

    goToLogin() {
        this.pages.welcome.classList.add('hidden');
        this.pages.login.classList.remove('hidden');
    }

    async handleLogin() {
        const idInput = document.getElementById('student-id');
        const bdayInput = document.getElementById('birthdate');
        const errorText = document.getElementById('login-error');

        if (errorText) errorText.classList.add('hidden');

        if(idInput.value === '' || bdayInput.value === '' || idInput.value.length < 6) {
            alert("Enter the right format! (at least 6 characters) - Do not leave empty");
            return;
        }

        const loginBtn = this.buttons.login;
        const originalText = loginBtn.innerText;
        loginBtn.innerText = "Verifying...";
        loginBtn.disabled = true;

        try {
            // SUPABASE VERIFICATION
            const { data, error } = await this.supabase
                .from('students')
                .select('*')
                .eq('student_id', idInput.value)
                .eq('birthdate', bdayInput.value)
                .single();

            if (data) {
                // Verification passed!
                this.userData.studentId = data.student_id;
                this.userData.birthdate = data.birthdate;
                
                this.triggerTransition(() => {
                    this.pages.login.classList.add('hidden');
                    this.pages.request.classList.remove('hidden');
                }, 3);
            } else {
                // Verification failed
                if (errorText) errorText.classList.remove('hidden');
                idInput.style.borderColor = '#d32f2f';
                setTimeout(() => idInput.style.borderColor = '', 2000);
            }
        } catch (error) {
            console.error("Error verifying student:", error);
            alert("Database connection failed.");
        } finally {
            loginBtn.innerText = originalText;
            loginBtn.disabled = false;
        }
    }

    handleRequest() {
        const emailInput = document.getElementById('student-email');
        const notesInput = document.getElementById('add-notes');
        const checkedBoxes = document.querySelectorAll('input[name="plv-doc"]:checked');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if(emailInput.value === '') {
            alert("Please enter your email address.");
            return;
        }

        if(!emailRegex.test(emailInput.value)) {
            alert("Please enter a valid email address.");
            emailInput.style.borderColor = '#d32f2f';
            setTimeout(() => emailInput.style.borderColor = '', 2000);
            return; 
        }

        if(checkedBoxes.length === 0) {
            alert("Please select at least one document to request");
            return;
        }

        this.userData.email = emailInput.value;
        this.userData.notes = notesInput.value;
        this.userData.documents = [];
        this.userData.totalPrice = 0;

        // Dynamic calculation based on DB prices
        checkedBoxes.forEach(box => {
            const docName = box.previousElementSibling.innerText;
            const price = this.documentPrices[box.id] || 0;
            
            this.userData.documents.push({ name: docName, price: price });
            this.userData.totalPrice += price;
        });

        // Generate a clean ticket number
        this.userData.ticketNumber = 'TKT-' + Math.floor(100000 + Math.random() * 900000);

        this.buildReceipt();

        this.triggerTransition(() => {
            this.pages.request.classList.add('hidden');
            this.pages.reciept.classList.remove('hidden');
        }, 4);
    }

    buildReceipt() {
        const listsContainer = document.getElementById('lists');
        const totalContainer = document.querySelector('#total-price h1');

        let docsHtml = this.userData.documents.map(doc => {
            return `<div class="receipt-item"><span>${doc.name}</span><span>PHP ${doc.price.toFixed(2)}</span></div>`;
        }).join('');

        listsContainer.innerHTML = `
            <div class="receipt-header">
                <h2>Transaction Summary</h2>
                <p><strong>Ticket #: </strong>${this.userData.ticketNumber}</p>
                <p><strong>Student ID: </strong> ${this.userData.studentId}</p>
                <p><strong>Email: </strong> ${this.userData.email}</p>
            </div>
            <div class="receipt-body">
                ${docsHtml}
            </div>
            <div class="receipt-notes">
                <p><strong>Notes: </strong> ${this.userData.notes || 'No Comments.'}</p>
            </div>
        `;

        totalContainer.innerText = `PHP ${this.userData.totalPrice.toFixed(2)}`;
    }

    openPaymentGateway() {
        const gateAmount = document.getElementById('gateway-amount');
        const gateTotal = document.getElementById('gateway-total');
        const payBtnText = document.getElementById('pay-btn');

        const formattedTotal = `PHP ${this.userData.totalPrice.toFixed(2)}`;
        
        gateAmount.innerText = formattedTotal;
        gateTotal.innerText = formattedTotal;
        payBtnText.innerText = `Pay ${formattedTotal}`;

        this.pages.paymentOverlay.classList.remove('hidden');
    }

    async processPayment() {
        this.pages.paymentOverlay.classList.add('hidden');

        this.triggerTransition(() => {
            this.pages.reciept.classList.add('hidden');
            document.getElementById('api-notifier').classList.remove('hidden');
        }, 5);

        try {
            // SUPABASE INSERT
            const documentNames = this.userData.documents.map(d => d.name); // Just save the names as an array
            
            const { error } = await this.supabase.from('requests').insert([{
                ticket_no: this.userData.ticketNumber,
                student_id: this.userData.studentId,
                student_email: this.userData.email,
                documents: documentNames, 
                additional_notes: this.userData.notes,
                total_amount: this.userData.totalPrice,
                status: 'New'
            }]);

            if (error) throw error;

            // Simulate slight delay for the UI loader
            setTimeout(() => {
                this.triggerTransition(() => {
                    document.getElementById('api-notifier').classList.add('hidden');
                    document.getElementById('end-page').classList.remove('hidden');
                }, 6);
            }, 1500);

        } catch (error) {
            console.error("Error submitting request:", error);
            alert("Database Error: Failed to submit request.");
            document.getElementById('api-notifier').classList.add('hidden');
            this.pages.reciept.classList.remove('hidden');
        }
    }

    openStatusPage(fromPage) {
        fromPage.classList.add('hidden');
        document.getElementById('progress-bar').classList.add('hidden');
        this.pages.dbShowcase.classList.remove('hidden');
    }

    async fetchDocumentStatus() {
        const ticketInput = document.getElementById('ticket-search').value.trim();
        if(!ticketInput) {
            alert("Please enter a ticket number");
            return;
        }

        const btn = this.buttons.searchStatus;
        btn.innerText = "Searching...";
        btn.disabled = true;

        try {
            // SUPABASE STATUS CHECK
            const { data, error } = await this.supabase
                .from('requests')
                .select('*')
                .eq('ticket_no', ticketInput)
                .single();

            const overlay = document.getElementById('status-overlay');
            const successModal = document.getElementById('status-success-modal');
            const errorModal = document.getElementById('status-error-modal');

            successModal.classList.add('hidden');
            errorModal.classList.add('hidden');

            if (data) {
                this.currentSearchedTicket = ticketInput; 
                this.currentTicketStatus = data.status;

                document.getElementById('res-student-id').innerText = data.student_id;
                document.getElementById('res-documents').innerText = data.documents.join(', ');

                const badge = document.getElementById('res-status-badge');
                badge.innerText = data.status;
                badge.className = 'badge';

                const statusStr = data.status.toLowerCase();
                if (statusStr === 'new') badge.classList.add('pending');
                else if (statusStr === 'in process') badge.classList.add('processing');
                else badge.classList.add('ready');

                overlay.classList.remove('hidden');
                successModal.classList.remove('hidden');
            } else {
                overlay.classList.remove('hidden');
                errorModal.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Error fetching status:", error);
        } finally {
            btn.innerText = "Check Status";
            btn.disabled = false;
        }
    }

    async updateDocumentStatus(newStatus, btnElement) {
        if(!this.currentSearchedTicket) return;

        const originalText = btnElement.innerText; 
        btnElement.innerText = "Updating...";

        try {
            // SUPABASE UPDATE (For testing purposes)
            const { error } = await this.supabase
                .from('requests')
                .update({ status: newStatus })
                .eq('ticket_no', this.currentSearchedTicket);

            if (!error) {
                alert(`Test Success: Status updated to ${newStatus} in Database.`);
                this.fetchDocumentStatus(); // Refresh the modal
            } else {
                throw error;
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Failed to update status in database.");
        } finally {
            btnElement.innerText = originalText;
        }
    }

    async handleModalClose() {
        const overlay = document.getElementById('status-overlay');

        // Auto-delete test (Optional: You can remove this if you want to keep history)
        if(this.currentSearchedTicket && this.currentTicketStatus === 'Completed') {
            try {
                await this.supabase.from('requests').delete().eq('ticket_no', this.currentSearchedTicket);
                console.log(`Ticket ${this.currentSearchedTicket} automatically deleted.`);
            } catch (error) {
                console.error("Failed to delete ticket:", error);
            }
        } 

        overlay.classList.add('hidden');
        this.currentSearchedTicket = '';
        this.currentTicketStatus = '';
    }

    handleGoBack() {
        if (this.currentStep === 2) {
            this.triggerTransition(() => {
                this.pages.login.classList.add('hidden');
                this.pages.welcome.classList.remove('hidden');
            }, 1);
        } else if (this.currentStep === 3) {
            this.triggerTransition(() => {
                this.pages.request.classList.add('hidden');
                this.pages.login.classList.remove('hidden');
            }, 2);
        } else if (this.currentStep === 4) {
            this.triggerTransition(() => {
                this.pages.reciept.classList.add('hidden');
                this.pages.request.classList.remove('hidden');
            }, 3);
        }
    }

    updateProgressBar(targetStep) {
        this.currentStep = targetStep;

        if ([2, 3, 4].includes(this.currentStep)) {
            this.buttons.globalBack.classList.remove('hidden');
        } else {
            this.buttons.globalBack.classList.add('hidden');
        }

        const percentage = (this.currentStep / 6) * 100;
        this.progress.waterFill.style.width = `${percentage}%`;

        this.progress.steps.forEach((stepElement, index) => {
            if(index < this.currentStep) {
                stepElement.classList.add('completed');
                stepElement.classList.remove('active');
            } else {
                stepElement.classList.remove('completed', 'active');
            }
        });

        this.progress.steps[this.currentStep - 1].classList.add('active');
    }
}

const SUPABASE_URL = 'https://giicwnztrohimzhbbkvo.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_KfIt6mlV3_g4i7iHioCHNw_xDkt1AyT';

document.addEventListener('DOMContentLoaded', () => {
    const app = new RegistrarApp(SUPABASE_URL, SUPABASE_ANON_KEY);
});