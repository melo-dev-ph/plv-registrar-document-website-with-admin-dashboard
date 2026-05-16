class AdminSections {
    constructor() {
        // Sidebar Buttons
        this.overviewBtn = document.getElementById('overview-btn');
        this.requestBtn = document.getElementById('request-btn');
        this.studentsBtn = document.getElementById('students-btn');
        this.reportsBtn = document.getElementById('reports-btn');
        this.settingsBtn = document.getElementById('settings-btn');

        // Panels
        this.overviewPanel = document.getElementById('overview');
        this.requestPanel = document.getElementById('request');
        this.studentsPanel = document.getElementById('students');
        this.reportsPanel = document.getElementById('reports');
        this.settingsPanel = document.getElementById('settings');

        // UI Elements
        this.headerTitle = document.querySelector('.main-header.wrapper h1');
        this.overviewCards = document.querySelectorAll('.overview.wrapper .cards'); 
        this.requestRows = document.querySelectorAll('.student-req'); 
        this.searchInput = document.getElementById('request-search');

        this.sections = [
            { btn: this.overviewBtn, panel: this.overviewPanel, title: 'Overview' },
            { btn: this.requestBtn, panel: this.requestPanel, title: 'Request' },
            { btn: this.studentsBtn, panel: this.studentsPanel, title: 'Students' },
            { btn: this.reportsBtn, panel: this.reportsPanel, title: 'Reports' },
            { btn: this.settingsBtn, panel: this.settingsPanel, title: 'Settings' }
        ];

        this.initEventListeners();
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

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.performSearch(this.searchInput.value);
            }
        });
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
}

document.addEventListener('DOMContentLoaded', () => {
    new AdminSections();
});