class AdminSections {
    constructor() {
        // Sidebar Buttons
        this.overviewBtn = document.getElementById('overview-btn');
        this.requestBtn = document.getElementById('request-btn');
        this.studentsBtn = document.getElementById('students-btn');
        this.settingsBtn = document.getElementById('settings-btn');

        // Panels
        this.overviewPanel = document.getElementById('overview');
        this.requestPanel = document.getElementById('request');
        this.studentsPanel = document.getElementById('students');
        this.settingsPanel = document.getElementById('settings');

        // UI Elements
        this.headerTitle = document.querySelector('.main-header.wrapper h1');
        this.overviewCards = document.querySelectorAll('.overview.wrapper .cards'); 
        this.requestRows = document.querySelectorAll('.student-req'); 
        this.searchInput = document.getElementById('request-search');

        // student elements
        this.studentRows = document.querySelectorAll('.student-record');
        this.studentSearchInput = document.getElementById('students-search');

        this.sections = [
            { btn: this.overviewBtn, panel: this.overviewPanel, title: 'Overview' },
            { btn: this.requestBtn, panel: this.requestPanel, title: 'Request' },
            { btn: this.studentsBtn, panel: this.studentsPanel, title: 'Students' },
            { btn: this.settingsBtn, panel: this.settingsPanel, title: 'Settings' }
        ];

        this.initEventListeners();
        this.initSettingsEvents();
        this.initOverlayEvents();
    }

    initEventListeners() {
        this.sections.forEach(section => {
            section.btn.addEventListener('click', () => {
                this.switchSection(section);
                
                //If clicking Request directly from Sidebar, show ALL
                if (section.title === 'Request') {
                    this.filterRequests('all');
                    this.searchInput.value = '';
                }
            });
        });

        // 2. Overview Card Click Events (Pre-filtering routing)
        this.overviewCards.forEach(card => {
            card.addEventListener('click', () => {
                let statusToFilter = 'all';
                if (card.classList.contains('urgent')) statusToFilter = 'urgent';
                if (card.classList.contains('new')) statusToFilter = 'new';
                if (card.classList.contains('in-process')) statusToFilter = 'in-process';
                if (card.classList.contains('completed')) statusToFilter = 'completed';

                const requestSection = this.sections.find(s => s.title === 'Request');
                this.switchSection(requestSection);

                this.filterRequests(statusToFilter);
                this.searchInput.value = '';
            });
        });

        // for request section
        if(this.searchInput) {
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch(this.searchInput.value);
                }
            });
        }

        // for students section
        if(this.studentSearchInput) {
            this.studentSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performStudentSearch(this.studentSearchInput.value);
                }
            });
        }

    }

    initSettingsEvents() {
        const maintenanceToggle = document.getElementById('maintenance-toggle');
        if(maintenanceToggle) {
            maintenanceToggle.addEventListener('change', (e) => {
                if(e.target.checked) {
                    console.log("System Status: Maintenance Mode ACTIVE");
                } else {
                    console.log("System Status: Maintenance Mode INACTIVE");
                }
            });
        }

        const configPriceBtn = document.getElementById('config-price-btn');
        const priceModal = document.getElementById('price-config-overlay');
        const closeBtns = document.querySelectorAll('.close-modal-icon, .close-modal-btn');

        if(configPriceBtn && priceModal) {
            configPriceBtn.addEventListener('click', () => {
                priceModal.classList.add('active');
            });

            closeBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    priceModal.classList.remove('active');
                })
            });

            priceModal.addEventListener('click', (e) => {
                if(e.target === priceModal) {
                    priceModal.classList.remove('active');
                }
            })
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                const confirmLogout = confirm("Are you sure you want to securely log out?");
                if (confirmLogout) {
                    console.log("Logging out...");
                    // Redirect to login page logic goes here
                    window.location.href = 'admin-login.html';
                }
            });
        }
    }

    switchSection(activeSection) {
        this.sections.forEach(section => {
            section.btn.classList.remove('active');
            section.panel.classList.add('hidden');
        });

        activeSection.btn.classList.add('active');
        activeSection.panel.classList.remove('hidden');
        this.headerTitle.textContent = activeSection.title;
    }

    //Handles the UI filtering of the request list
    filterRequests(status) {
        this.requestRows.forEach(row => {
            if (status === 'all' || row.classList.contains(status)) {
                row.style.display = 'grid';
            } else {
                row.style.display = 'none';
            }
        });
    }

    performSearch(query) {
        const lowerCaseQuery = query.toLowerCase().trim();

        this.requestRows.forEach(row => {
            const name = row.querySelector('.name')?.textContent.toLowerCase() || '';
            const section = row.querySelector('.section')?.textContent.toLowerCase() || '';
            const status = row.querySelector('.status-text')?.textContent.toLowerCase() || '';
            const studentId = row.getAttribute('data-id')?.toLowerCase() || '';

            if(name.includes(lowerCaseQuery) || section.includes(lowerCaseQuery) || status.includes(lowerCaseQuery) || studentId.includes(lowerCaseQuery)){
                row.style.display = 'grid';
            } else {
                row.style.display = 'none';
            }
        });
    }

    performStudentSearch(query) {
        const lowerCaseQuery = query.toLowerCase().trim();

        this.studentRows.forEach(row => {
            const name = row.querySelector('.name')?.textContent.toLowerCase() || '';
            const section = row.querySelector('.section')?.textContent.toLowerCase() || '';
            const studentId = row.getAttribute('data-id')?.toLowerCase() || '';

            if(name.includes(lowerCaseQuery) || section.includes(lowerCaseQuery) || studentId.includes(lowerCaseQuery)){
                row.style.display = 'grid';
            } else {
                row.style.display = 'none';
            }
        });
    }

    initOverlayEvents() {
        const requestActionBtns = document.querySelectorAll('.student-req .action-btn');
        // NEW: Grab the action buttons from the Students tab
        const studentActionBtns = document.querySelectorAll('.student-record .action-btn'); 

        const overlays = {
            'urgent': document.getElementById('urgent-overlay'),
            'new': document.getElementById('new-overlay'),
            'in-process': document.getElementById('inprocess-overlay'),
            'completed': document.getElementById('completed-overlay'),
            // NEW: Add the student overlay to our map
            'student': document.getElementById('student-overlay') 
        };

        // 1. Open Request Overlays
        requestActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = e.currentTarget.closest('.student-req');

                let rowStatus = null;
                if (row.classList.contains('urgent')) rowStatus = 'urgent';
                else if (row.classList.contains('new')) rowStatus = 'new';
                else if (row.classList.contains('in-process')) rowStatus = 'in-process';
                else if (row.classList.contains('completed')) rowStatus = 'completed';

                if (rowStatus && overlays[rowStatus]) {
                    overlays[rowStatus].classList.add('active'); 

                    const studentId = row.getAttribute('data-id');
                    const idDisplay = overlays[rowStatus].querySelector('.rm-id');
                    if(idDisplay && studentId) {
                        idDisplay.textContent = studentId;
                    }
                }
            });
        });

        // 2. NEW: Open Student Profile Overlay
        studentActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const row = e.currentTarget.closest('.student-record');
                const studentOverlay = overlays['student'];

                if (studentOverlay) {
                    studentOverlay.classList.add('active'); // Triggers the popup animation

                    // Grab the info from the row clicked and put it in the overlay
                    const studentId = row.getAttribute('data-id');
                    const studentName = row.querySelector('.name').textContent;
                    const studentSection = row.querySelector('.section').textContent;

                    studentOverlay.querySelector('.rm-id').textContent = studentId;
                    studentOverlay.querySelector('.rm-name').textContent = studentName;
                    studentOverlay.querySelector('.rm-section').textContent = studentSection;
                }
            });
        });

        // 3. Close Logic for ALL Overlays
        Object.values(overlays).forEach(overlay => {
            if (overlay) {
                // Close when clicking the dark background
                overlay.addEventListener('click', (e) => {
                    if (e.target === overlay) {
                        overlay.classList.remove('active');
                    }
                });

                // Close when clicking the "X" button
                const closeBtn = overlay.querySelector('.close-req-btn');
                if (closeBtn) {
                    closeBtn.addEventListener('click', () => {
                        overlay.classList.remove('active');
                    });
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminSections();
});