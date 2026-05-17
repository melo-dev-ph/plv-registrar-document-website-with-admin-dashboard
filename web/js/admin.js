class AdminSections {
    constructor(supabaseUrl, supabaseKey) {
        // Initialize Supabase Connection
        this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

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
        this.searchInput = document.getElementById('request-search');
        this.studentSearchInput = document.getElementById('students-search');

        // Containers for injected data
        this.requestContainer = document.querySelector('.request.body');
        this.studentContainer = document.querySelector('.students.body');

        // Filter Action Buttons
        this.requestFilterBtn = document.querySelector('#request .filter-btn');
        this.studentFilterBtn = document.querySelector('#students .filter-btn');

        // Dynamic Elements (Populated after fetch)
        this.requestRows = [];
        this.studentRows = [];

        this.sections = [
            { btn: this.overviewBtn, panel: this.overviewPanel, title: 'Overview' },
            { btn: this.requestBtn, panel: this.requestPanel, title: 'Request' },
            { btn: this.studentsBtn, panel: this.studentsPanel, title: 'Students' },
            { btn: this.settingsBtn, panel: this.settingsPanel, title: 'Settings' }
        ];

        // Start App
        this.initEventListeners();
        this.initSettingsEvents();
        this.initOverlayDelegation(); 
        
        // Fetch all live data on load
        this.loadDatabaseData();
    }

    async loadDatabaseData() {
        await this.fetchDashboardStats();
        await this.fetchStudents();
        await this.fetchRequests();
        await this.fetchPrices();
    }

    async fetchStudents() {
        try {
            const { data, error } = await this.supabase
                .from('students')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.studentContainer.innerHTML = ''; 
            
            data.forEach(student => {
                const row = document.createElement('div');
                row.className = 'student-record';
                row.setAttribute('data-id', student.student_id);

                row.innerHTML = `
                    <p class="student-id">${student.student_id}</p>
                    <p class="section">${student.section || 'N/A'}</p>
                    <p class="name">${student.full_name}</p>
                    <button class="action-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 8 8 9"></polyline></svg>
                    </button>
                `;
                this.studentContainer.appendChild(row);
            });

            this.studentRows = document.querySelectorAll('.student-record');
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    }

    async fetchRequests() {
        try {
            const { data, error } = await this.supabase
                .from('requests')
                .select('*, students(full_name, section)')
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.requestContainer.innerHTML = ''; 

            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

            data.forEach(req => {
                const requestDate = new Date(req.created_at);
                let statusClass = 'new';
                
                if (req.status === 'Completed') {
                    statusClass = 'completed';
                } else if (req.status === 'In Process') {
                    statusClass = 'in-process';
                } else if (requestDate <= threeDaysAgo) {
                    statusClass = 'urgent';
                }

                const studentName = req.students ? req.students.full_name : 'Unknown Student';
                const studentSection = req.students ? req.students.section : 'N/A';

                const row = document.createElement('div');
                row.className = `student-req ${statusClass}`;
                row.setAttribute('data-id', req.student_id);
                row.setAttribute('data-ticket', req.ticket_no); 

                row.setAttribute('data-docs', JSON.stringify(req.documents || []));

                row.innerHTML = `
                    <div class="circle"></div>
                    <p class="student-id">${req.student_id}</p>
                    <p class="section">${studentSection}</p>
                    <p class="name">${studentName}</p>
                    <button class="action-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 8 8 9"></polyline></svg>
                    </button>
                `;
                this.requestContainer.appendChild(row);
            });

            this.requestRows = document.querySelectorAll('.student-req');
        } catch (error) {
            console.error("Error fetching requests:", error);
        }
    }

    async fetchDashboardStats() {
        try {
            const { count: newCount } = await this.supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'New');
            const { count: processCount } = await this.supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'In Process');
            const { count: completedCount } = await this.supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'Completed');

            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            const { count: urgentCount } = await this.supabase.from('requests').select('*', { count: 'exact', head: true }).neq('status', 'Completed').lte('created_at', threeDaysAgo.toISOString());

            const newCard = document.querySelector('.cards.new strong');
            const processCard = document.querySelector('.cards.in-process strong');
            const completedCard = document.querySelector('.cards.completed strong');
            const urgentCard = document.querySelector('.cards.urgent strong');

            if(newCard) newCard.textContent = newCount || 0;
            if(processCard) processCard.textContent = processCount || 0;
            if(completedCard) completedCard.textContent = completedCount || 0;
            if(urgentCard) urgentCard.textContent = urgentCount || 0;

        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    }

    async fetchPrices() {
        try {
            const { data, error } = await this.supabase
                .from('document_types')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            const modalBody = document.getElementById('price-config-list');
            if (!modalBody) return;

            modalBody.innerHTML = '';

            data.forEach(doc => {
                const group = document.createElement('div');
                group.className = 'input-group';
                
                group.innerHTML = `
                    <label>${doc.doc_name}</label>
                    <input type="number" data-html-id="${doc.html_id}" value="${doc.price}" min="0" step="10">
                `;
                modalBody.appendChild(group);
            });
        } catch (error) {
            console.error("Error fetching prices:", error);
        }
    }

    initEventListeners() {
        this.sections.forEach(section => {
            section.btn.addEventListener('click', () => {
                this.switchSection(section);
                if (section.title === 'Request') {
                    this.filterRequests('all');
                    this.searchInput.value = '';
                }
            });
        });

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
                if(this.searchInput) this.searchInput.value = '';
            });
        });

        if(this.searchInput) {
            this.searchInput.addEventListener('keyup', (e) => this.performSearch(e.target.value));
        }

        if(this.studentSearchInput) {
            this.studentSearchInput.addEventListener('keyup', (e) => this.performStudentSearch(e.target.value));
        }

        // --- FIXED A: Request Status Filter Menu (Fires and closes instantly) ---
        if (this.requestFilterBtn) {
            const reqMenu = document.createElement('div');
            reqMenu.className = 'filter-dropdown hidden';
            reqMenu.innerHTML = `
                <p data-value="all" class="active">All Statuses</p>
                <p data-value="new">New</p>
                <p data-value="urgent">Urgent</p>
                <p data-value="in-process">In Process</p>
                <p data-value="completed">Completed</p>
            `;
            this.requestFilterBtn.parentNode.appendChild(reqMenu);

            this.requestFilterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.filter-dropdown').forEach(d => { if(d !== reqMenu) d.classList.add('hidden'); });
                reqMenu.classList.toggle('hidden');
            });

            reqMenu.addEventListener('click', (e) => {
                const targetOption = e.target.closest('p');
                if (!targetOption) return;
                e.stopPropagation();

                reqMenu.querySelectorAll('p').forEach(p => p.classList.remove('active'));
                targetOption.classList.add('active');
                
                const filterValue = targetOption.getAttribute('data-value');
                this.filterRequests(filterValue);
                reqMenu.classList.add('hidden'); // Closes menu safely
            });
        }

        // --- FIXED B: Student Filter Menu (Filters by custom Course and Year variables cleanly) ---
        if (this.studentFilterBtn) {
            const studentMenu = document.createElement('div');
            studentMenu.className = 'filter-dropdown hidden';
            this.studentFilterBtn.parentNode.appendChild(studentMenu);

            this.studentFilterBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.filter-dropdown').forEach(d => { if(d !== studentMenu) d.classList.add('hidden'); });
                
                // Parse unique courses and years currently inside student elements
                const courses = new Set();
                const years = new Set();

                this.studentRows.forEach(row => {
                    const sectionText = row.querySelector('.section')?.textContent.trim() || '';
                    const courseMatch = sectionText.match(/^[A-Za-z]+/);
                    const yearMatch = sectionText.match(/\d/);

                    if (courseMatch) courses.add(courseMatch[0].toUpperCase());
                    if (yearMatch) years.add(yearMatch[0]);
                });

                // Track selection markers to prevent reset loss upon modal close re-clicks
                const currentSelection = studentMenu.querySelector('p.active');
                const selectedType = currentSelection ? currentSelection.getAttribute('data-type') : 'all';
                const selectedVal = currentSelection ? currentSelection.getAttribute('data-value') : 'all';

                let menuHtml = `<p data-type="all" data-value="all" class="${selectedType === 'all' ? 'active' : ''}">All Students</p>`;
                
                if (courses.size > 0) {
                    menuHtml += `<div class="filter-group-label" style="padding: 6px 14px; font-weight: bold; font-size: 0.72rem; color: #94A3B8; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; border-top: 1px solid #E2E8F0;">Filter by Course</div>`;
                    Array.from(courses).sort().forEach(c => {
                        menuHtml += `<p data-type="course" data-value="${c}" class="${selectedType === 'course' && selectedVal === c ? 'active' : ''}">${c}</p>`;
                    });
                }
                
                if (years.size > 0) {
                    menuHtml += `<div class="filter-group-label" style="padding: 6px 14px; font-weight: bold; font-size: 0.72rem; color: #94A3B8; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; border-top: 1px solid #E2E8F0;">Filter by Year</div>`;
                    Array.from(years).sort().forEach(y => {
                        const suffix = y === '1' ? 'st' : y === '2' ? 'nd' : y === '3' ? 'rd' : 'th';
                        menuHtml += `<p data-type="year" data-value="${y}" class="${selectedType === 'year' && selectedVal === y ? 'active' : ''}">${y}${suffix} Year</p>`;
                    });
                }

                studentMenu.innerHTML = menuHtml;
                studentMenu.classList.toggle('hidden');
            });

            // Master Delegation Node setup for continuous option listeners without context errors
            studentMenu.addEventListener('click', (e) => {
                const targetOption = e.target.closest('p');
                if (!targetOption) return;
                e.stopPropagation();

                studentMenu.querySelectorAll('p').forEach(p => p.classList.remove('active'));
                targetOption.classList.add('active');

                const filterType = targetOption.getAttribute('data-type');
                const targetValue = targetOption.getAttribute('data-value');

                this.studentRows.forEach(row => {
                    const sectionText = row.querySelector('.section')?.textContent.trim() || '';
                    
                    if (filterType === 'all') {
                        row.style.display = 'grid';
                    } else if (filterType === 'course') {
                        const rowCourse = sectionText.match(/^[A-Za-z]+/);
                        if (rowCourse && rowCourse[0].toUpperCase() === targetValue) {
                            row.style.display = 'grid';
                        } else {
                            row.style.display = 'none';
                        }
                    } else if (filterType === 'year') {
                        const rowYear = sectionText.match(/\d/);
                        if (rowYear && rowYear[0] === targetValue) {
                            row.style.display = 'grid';
                        } else {
                            row.style.display = 'none';
                        }
                    }
                });

                studentMenu.classList.add('hidden'); // Closes menu safely
            });
        }

        // Global Window Event: Closes dropdown targets if clicked elsewhere
        document.addEventListener('click', () => {
            document.querySelectorAll('.filter-dropdown').forEach(dropdown => dropdown.classList.add('hidden'));
        });
    }

    initSettingsEvents() {
        const openAddStudentBtn = document.getElementById('open-add-student-btn');
        const addStudentModal = document.getElementById('add-student-overlay');
        const closeStudentRows = document.querySelectorAll('#close-add-student-icon, #close-add-student-btn');
        const saveStudentBtn = document.getElementById('save-student-btn');

        if (openAddStudentBtn && addStudentModal) {
            openAddStudentBtn.addEventListener('click', () => addStudentModal.classList.add('active'));

            closeStudentRows.forEach(btn => {
                btn.addEventListener('click', () => addStudentModal.classList.remove('active'));
            });

            addStudentModal.addEventListener('click', (e) => {
                if (e.target === addStudentModal) addStudentModal.classList.remove('active');
            });

            if (saveStudentBtn) {
                saveStudentBtn.addEventListener('click', async () => {
                    const studentId = document.getElementById('new-student-id').value.trim();
                    const fullName = document.getElementById('new-student-name').value.trim();
                    const birthdate = document.getElementById('new-student-bday').value;
                    const section = document.getElementById('new-student-section').value.trim();

                    if (!studentId || !fullName || !birthdate) {
                        alert("Error: Please fill in all required fields marked with (*)!");
                        return;
                    }

                    const originalText = saveStudentBtn.innerText;
                    saveStudentBtn.innerText = "Processing...";
                    saveStudentBtn.disabled = true;

                    try {
                        const { error } = await this.supabase
                            .from('students')
                            .insert([{
                                student_id: studentId,
                                full_name: fullName,
                                birthdate: birthdate,
                                section: section || null
                            }]);

                        if (error) throw error;

                        alert("Success! Student record has been added to the database.");
                        addStudentModal.classList.remove('active');

                        document.getElementById('new-student-id').value = '';
                        document.getElementById('new-student-name').value = '';
                        document.getElementById('new-student-bday').value = '';
                        document.getElementById('new-student-section').value = '';

                        await this.fetchStudents();

                    } catch (err) {
                        console.error("Database submission error:", err);
                        alert("Database Error: Failed to create student record. " + err.message);
                    } finally {
                        saveStudentBtn.innerText = originalText;
                        saveStudentBtn.disabled = false;
                    }
                });
            }
        }

        const maintenanceToggle = document.getElementById('maintenance-toggle');
        if(maintenanceToggle) {
            this.supabase.from('system_settings').select('maintenance_mode').eq('id', 1).single()
                .then(({ data, error }) => {
                    if (data && !error) {
                        maintenanceToggle.checked = data.maintenance_mode;
                    }
                });

            maintenanceToggle.addEventListener('change', async (e) => {
                const isActive = e.target.checked;
                const { error } = await this.supabase
                    .from('system_settings')
                    .update({ maintenance_mode: isActive })
                    .eq('id', 1);

                if (error) {
                    console.error("Failed to update maintenance mode:", error);
                    alert("System Error: Could not update maintenance status.");
                    maintenanceToggle.checked = !isActive; 
                } else {
                    console.log(`System Status: Maintenance Mode ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
                }
            });
        }

        const configPriceBtn = document.getElementById('config-price-btn');
        const priceModal = document.getElementById('price-config-overlay');
        const closeBtns = document.querySelectorAll('.close-modal-icon, .close-modal-btn');
        const savePricesBtn = document.getElementById('save-prices-btn'); 

        if(configPriceBtn && priceModal) {
            configPriceBtn.addEventListener('click', () => priceModal.classList.add('active'));

            closeBtns.forEach(btn => {
                btn.addEventListener('click', () => priceModal.classList.remove('active'));
            });

            priceModal.addEventListener('click', (e) => {
                if(e.target === priceModal) priceModal.classList.remove('active');
            });
            
            if (savePricesBtn) {
                savePricesBtn.addEventListener('click', async () => {
                    const originalText = savePricesBtn.innerText;
                    savePricesBtn.innerText = "Saving...";
                    savePricesBtn.disabled = true;

                    const inputs = priceModal.querySelectorAll('.modal-body input[type="number"]');
                    let updateErrors = 0;

                    for (const input of inputs) {
                        const htmlId = input.getAttribute('data-html-id');
                        const newPrice = parseFloat(input.value);

                        const { error } = await this.supabase
                            .from('document_types')
                            .update({ price: newPrice })
                            .eq('html_id', htmlId);

                        if (error) updateErrors++;
                    }

                    savePricesBtn.innerText = originalText;
                    savePricesBtn.disabled = false;

                    if (updateErrors === 0) {
                        alert("System Update: Prices have been successfully updated!");
                        priceModal.classList.remove('active');
                    } else {
                        alert("Warning: Some prices failed to update. Please check your connection.");
                    }
                });
            }
        }

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm("Are you sure you want to securely log out?")) {
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
            const textContent = row.textContent.toLowerCase();
            const studentId = row.getAttribute('data-id')?.toLowerCase() || '';
            
            if(textContent.includes(lowerCaseQuery) || studentId.includes(lowerCaseQuery)){
                row.style.display = 'grid';
            } else {
                row.style.display = 'none';
            }
        });
    }

    performStudentSearch(query) {
        const lowerCaseQuery = query.toLowerCase().trim();
        this.studentRows.forEach(row => {
            const textContent = row.textContent.toLowerCase();
            const studentId = row.getAttribute('data-id')?.toLowerCase() || '';

            if(textContent.includes(lowerCaseQuery) || studentId.includes(lowerCaseQuery)){
                row.style.display = 'grid';
            } else {
                row.style.display = 'none';
            }
        });
    }

    initOverlayDelegation() {
        this.requestContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;

            e.stopPropagation();
            const row = btn.closest('.student-req');
            
            let targetOverlayId = null;
            if (row.classList.contains('urgent')) targetOverlayId = 'urgent-overlay';
            else if (row.classList.contains('new')) targetOverlayId = 'new-overlay';
            else if (row.classList.contains('in-process')) targetOverlayId = 'inprocess-overlay';
            else if (row.classList.contains('completed')) targetOverlayId = 'completed-overlay';

            const overlay = document.getElementById(targetOverlayId);
            if (overlay) {
                overlay.classList.add('active'); 

                const studentId = row.getAttribute('data-id');
                const studentName = row.querySelector('.name').textContent;
                const studentSection = row.querySelector('.section').textContent;
                const requestedDocs = JSON.parse(row.getAttribute('data-docs') || '[]');

                const idDisplay = overlay.querySelector('.rm-id');
                const nameDisplay = overlay.querySelector('.rm-name');
                const sectionDisplay = overlay.querySelector('.rm-section');

                if(idDisplay) idDisplay.textContent = studentId;
                if(nameDisplay) nameDisplay.textContent = studentName;
                if(sectionDisplay) sectionDisplay.textContent = studentSection;

                const docsList = overlay.querySelector('.rm-docs-box ul');
                if (docsList) {
                    docsList.innerHTML = requestedDocs.map(doc => `<li>${doc}</li>`).join('');
                }

                const checkContainer = overlay.querySelector('.rm-checkboxes');
                if (checkContainer) {
                    const isChecked = row.classList.contains('in-process') ? 'checked' : '';
                    checkContainer.innerHTML = requestedDocs.map(doc => 
                        `<label><input type="checkbox" ${isChecked}> ${doc}</label>`
                    ).join('');
                }

                const sentList = overlay.querySelector('.sent-docs-list p');
                if (sentList && targetOverlayId === 'completed-overlay') {
                    sentList.innerHTML = `<strong>Sent:</strong> ${requestedDocs.join(', ')}`;
                }

                const submitBtn = overlay.querySelector('.action-btn-primary');
                if (submitBtn) {
                    const newBtn = submitBtn.cloneNode(true);
                    submitBtn.parentNode.replaceChild(newBtn, submitBtn);

                    newBtn.addEventListener('click', () => {
                        const notes = overlay.querySelector('textarea')?.value || '';
                        const workingDays = overlay.querySelector('.rm-working-days input')?.value || 3;
                        const ticketNo = row.getAttribute('data-ticket');
                        
                        let nextStatus = 'In Process'; 
                        if (targetOverlayId === 'inprocess-overlay') {
                            nextStatus = 'Completed';
                        }

                        this.updateStatusAndNotify(ticketNo, nextStatus, notes, workingDays, newBtn);
                    });
                }
            }
        });

        this.studentContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;

            e.stopPropagation();
            const row = btn.closest('.student-record');
            const overlay = document.getElementById('student-overlay');

            if (overlay) {
                overlay.classList.add('active'); 

                const studentId = row.getAttribute('data-id');
                const studentName = row.querySelector('.name').textContent;
                const studentSection = row.querySelector('.section').textContent;

                const idDisplay = overlay.querySelector('.rm-id');
                const nameDisplay = overlay.querySelector('.rm-name');
                const sectionDisplay = overlay.querySelector('.rm-section');

                if(idDisplay) idDisplay.textContent = studentId;
                if(nameDisplay) nameDisplay.textContent = studentName;
                if(sectionDisplay) sectionDisplay.textContent = studentSection;

                const pendingListContainer = overlay.querySelector('.pending-requests-list');
                if (pendingListContainer) {
                    pendingListContainer.innerHTML = ''; 

                    const studentRequests = Array.from(this.requestRows).filter(reqRow => reqRow.getAttribute('data-id') === studentId);

                    if (studentRequests.length === 0) {
                        pendingListContainer.innerHTML = '<p style="color: var(--Periwinkle-Gray); font-style: italic; text-align: center; margin-top: 20px;">No requests found for this student.</p>';
                    } else {
                        studentRequests.forEach(reqRow => {
                            const ticketNo = reqRow.getAttribute('data-ticket');
                            let statusClass = 'new';
                            let statusText = 'New';
                            
                            if (reqRow.classList.contains('urgent')) { statusClass = 'urgent'; statusText = 'Urgent'; }
                            else if (reqRow.classList.contains('in-process')) { statusClass = 'in-process'; statusText = 'In Process'; }
                            else if (reqRow.classList.contains('completed')) { statusClass = 'completed'; statusText = 'Completed'; }

                            const requestedDocs = JSON.parse(reqRow.getAttribute('data-docs') || '[]');
                            let docLabel = requestedDocs.length > 0 ? requestedDocs[0] : 'No Docs';
                            if (requestedDocs.length > 1) {
                                docLabel += ` (+${requestedDocs.length - 1} more)`; 
                            }

                            const itemHTML = `
                                <div class="pending-item ${statusClass}" data-ticket="${ticketNo}">
                                    <div class="circle"></div>
                                    <div class="pending-item-details">
                                        <p class="doc-name">${docLabel}</p>
                                        <p class="ticket-no">${ticketNo}</p>
                                    </div>
                                    <span class="doc-status">${statusText}</span>
                                </div>
                            `;
                            pendingListContainer.insertAdjacentHTML('beforeend', itemHTML);
                        });
                    }
                }
            }
        });

        const studentOverlayElement = document.getElementById('student-overlay');
        if (studentOverlayElement) {
            studentOverlayElement.addEventListener('click', (e) => {
                const pendingItem = e.target.closest('.pending-item');
                if (!pendingItem) return; 

                const ticketNo = pendingItem.getAttribute('data-ticket');
                const targetRow = Array.from(this.requestRows).find(row => row.getAttribute('data-ticket') === ticketNo);
                
                if (targetRow) {
                    studentOverlayElement.classList.remove('active');
                    const actionBtn = targetRow.querySelector('.action-btn');
                    if (actionBtn) {
                        setTimeout(() => {
                            actionBtn.click();
                        }, 300);
                    }
                }
            });
        }

        const reqOverlays = document.querySelectorAll('.req-overlay');
        reqOverlays.forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });

            const closeBtn = overlay.querySelector('.close-req-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    overlay.classList.remove('active');
                });
            }
        });
    }

    async updateStatusAndNotify(ticketNumber, newStatus, notes, workingDays, btnElement) {
        const originalText = btnElement.innerText;
        btnElement.innerText = "Sending...";
        btnElement.disabled = true;

        try {
            const response = await fetch('http://localhost:3000/api/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticket_number: ticketNumber,
                    status: newStatus,
                    admin_notes: notes,
                    working_days: workingDays
                })
            });

            if (response.ok) {
                alert(`Success! Status updated to ${newStatus} and email sent.`);
                document.querySelectorAll('.req-overlay').forEach(o => o.classList.remove('active'));
                this.loadDatabaseData(); 
            } else {
                alert("Error updating status. Ensure the Node server is running.");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            alert("Failed to connect to the server.");
        } finally {
            btnElement.innerText = originalText;
            btnElement.disabled = false;
        }
    }
}

const SUPABASE_URL = 'https://giicwnztrohimzhbbkvo.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_KfIt6mlV3_g4i7iHioCHNw_xDkt1AyT';

document.addEventListener('DOMContentLoaded', () => {
    new AdminSections(SUPABASE_URL, SUPABASE_ANON_KEY);
});