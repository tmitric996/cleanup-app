// Multi-User Task Management System with Firebase
class TaskManager {
    constructor() {
        this.householdId = localStorage.getItem('householdId');
        this.userId = localStorage.getItem('userId');
        this.userName = localStorage.getItem('userName');
        this.tasks = [];
        this.members = [];
        this.selectedDate = new Date();
        this.currentDate = new Date();
        this.selectedCategory = 'all';
        this.selectedFilter = 'all';
        this.activeTimer = null;
        this.timerInterval = null;
        this.database = firebase.database();
        
        // Apply saved theme immediately (before login check)
        this.applySavedTheme();
        
        // Check if user is logged in
        if (this.householdId && this.userId) {
            this.showMainApp();
            this.init();
        } else {
            this.showOnboarding();
        }
    }

    // Apply saved theme immediately
    applySavedTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    init() {
        this.setupTabNavigation();
        this.setupTaskForm();
        this.setupCategoryTabs();
        this.setupTaskFilters();
        this.setupTimerModal();
        this.setupHistoryModal();
        this.setupThemeToggle();
        this.setupSettingsModal();
        this.loadFirebaseData();
    }

    // ========== ONBOARDING & AUTH ==========
    showOnboarding() {
        document.getElementById('onboarding-screen').style.display = 'flex';
        document.getElementById('main-app').style.display = 'none';
        this.setupOnboardingFlow();
    }

    showMainApp() {
        document.getElementById('onboarding-screen').style.display = 'none';
        document.getElementById('main-app').style.display = 'flex';
    }

    setupOnboardingFlow() {
        const householdStep = document.getElementById('household-step');
        const nameStep = document.getElementById('name-step');
        const householdCodeDisplay = document.getElementById('household-code-display');
        const householdInput = document.getElementById('household-code-input');
        const householdContinue = document.getElementById('household-continue');
        const nameInput = document.getElementById('user-name-input');
        const nameContinue = document.getElementById('name-continue');
        const nameBack = document.getElementById('name-back');
        const copyCodeBtn = document.getElementById('copy-code');

        let isNewHousehold = false;

        householdContinue.addEventListener('click', () => {
            const code = householdInput.value.trim().toUpperCase();
            
            if (code === '') {
                // Create new household
                const newCode = this.generateHouseholdCode();
                this.householdId = newCode;
                isNewHousehold = true;
                
                // Show the code
                document.getElementById('household-code-text').textContent = newCode;
                householdCodeDisplay.style.display = 'block';
                
                householdStep.style.display = 'none';
                nameStep.style.display = 'block';
            } else {
                // Join existing household
                this.checkHouseholdExists(code).then(exists => {
                    if (exists) {
                        this.householdId = code;
                        isNewHousehold = false;
                        householdStep.style.display = 'none';
                        nameStep.style.display = 'block';
                    } else {
                        alert('Household not found. Please check the code or create a new household.');
                    }
                });
            }
        });

        nameBack.addEventListener('click', () => {
            nameStep.style.display = 'none';
            householdStep.style.display = 'block';
            householdCodeDisplay.style.display = 'none';
        });

        nameContinue.addEventListener('click', () => {
            const name = nameInput.value.trim();
            if (name === '') {
                alert('Please enter your name');
                return;
            }

            this.userName = name;
            this.userId = Date.now().toString() + Math.random().toString(36).substr(2, 9);

            // Save to localStorage
            localStorage.setItem('householdId', this.householdId);
            localStorage.setItem('userId', this.userId);
            localStorage.setItem('userName', this.userName);

            // Add member to household
            this.addMemberToHousehold(this.userId, this.userName, isNewHousehold).then(() => {
                this.showMainApp();
                this.init();
            });
        });

        copyCodeBtn.addEventListener('click', () => {
            const code = document.getElementById('household-code-text').textContent;
            navigator.clipboard.writeText(code).then(() => {
                copyCodeBtn.textContent = '✅';
                setTimeout(() => {
                    copyCodeBtn.textContent = '📋';
                }, 2000);
            });
        });
    }

    generateHouseholdCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async checkHouseholdExists(code) {
        const snapshot = await this.database.ref(`households/${code}`).once('value');
        return snapshot.exists();
    }

    async addMemberToHousehold(userId, userName, isNew) {
        try {
            const memberRef = this.database.ref(`households/${this.householdId}/members/${userId}`);
            await memberRef.set({
                name: userName,
                joinedAt: new Date().toISOString()
            });

            // If new household, set creation time
            if (isNew) {
                await this.database.ref(`households/${this.householdId}/createdAt`).set(new Date().toISOString());
            }
            
            console.log('✅ Member added to household:', userName);
        } catch (error) {
            console.error('❌ Error adding member to Firebase:', error);
            alert('Error creating/joining household: ' + error.message + '\n\nPlease check:\n1. Firebase is initialized\n2. Database rules are set correctly\n3. Internet connection is working');
            throw error;
        }
    }

    // ========== FIREBASE DATA MANAGEMENT ==========
    loadFirebaseData() {
        console.log('🔄 Loading data from Firebase for household:', this.householdId);
        
        // Listen to tasks
        this.database.ref(`households/${this.householdId}/tasks`).on('value', (snapshot) => {
            const data = snapshot.val();
            this.tasks = data ? Object.keys(data).map(key => ({id: key, ...data[key]})) : [];
            console.log('📦 Tasks loaded from Firebase:', this.tasks.length, 'tasks');
            console.log('Tasks:', this.tasks);
            this.renderTasksForDisplay();
            this.renderAllTasks();
        });

        // Listen to members
        this.database.ref(`households/${this.householdId}/members`).on('value', (snapshot) => {
            const data = snapshot.val();
            this.members = data ? Object.keys(data).map(key => ({id: key, ...data[key]})) : [];
            console.log('👥 Members loaded from Firebase:', this.members.length, 'members');
            this.updateMemberSelects();
            this.updateFamilyMembersList();
        });
    }

    async saveTaskToFirebase(task) {
        try {
            const taskRef = this.database.ref(`households/${this.householdId}/tasks/${task.id}`);
            await taskRef.set({
                name: task.name,
                category: task.category,
                estimatedTime: task.estimatedTime,
                assignedTo: task.assignedTo || null,
                completedDates: task.completedDates || [],
                createdAt: task.createdAt,
                lastUpdated: task.lastUpdated
            });
            console.log('✅ Task saved to Firebase:', task.name);
        } catch (error) {
            console.error('❌ Error saving task to Firebase:', error);
            alert('Error saving task: ' + error.message + '\n\nPlease check Firebase database rules.');
            throw error;
        }
    }

    async deleteTaskFromFirebase(taskId) {
        await this.database.ref(`households/${this.householdId}/tasks/${taskId}`).remove();
    }

    async updateTaskCompletionInFirebase(taskId, completedDates) {
        await this.database.ref(`households/${this.householdId}/tasks/${taskId}/completedDates`).set(completedDates);
        await this.database.ref(`households/${this.householdId}/tasks/${taskId}/lastUpdated`).set(new Date().toISOString());
    }

    updateMemberSelects() {
        const assignSelect = document.getElementById('task-assigned');
        assignSelect.innerHTML = '<option value="">Anyone can do it</option>';
        
        this.members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.name;
            assignSelect.appendChild(option);
        });
    }

    updateFamilyMembersList() {
        const list = document.getElementById('family-members-list');
        if (!list) return;

        list.innerHTML = '';
        
        this.members.forEach(member => {
            const item = document.createElement('div');
            item.className = 'family-member-item';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'family-member-name';
            nameSpan.textContent = member.name;
            
            item.appendChild(nameSpan);
            
            // Only allow removing if not the current user
            if (member.id !== this.userId) {
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-member-btn';
                removeBtn.textContent = 'Remove';
                removeBtn.addEventListener('click', () => this.removeMember(member.id));
                item.appendChild(removeBtn);
            }
            
            list.appendChild(item);
        });
    }

    async removeMember(memberId) {
        if (confirm('Remove this member from the household?')) {
            await this.database.ref(`households/${this.householdId}/members/${memberId}`).remove();
        }
    }

    // ========== TAB NAVIGATION ==========
    setupTabNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        const tabContents = document.querySelectorAll('.tab-content');

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetTab = item.getAttribute('data-tab');

                navItems.forEach(nav => nav.classList.remove('active'));
                tabContents.forEach(tab => tab.classList.remove('active'));

                item.classList.add('active');
                document.getElementById(targetTab).classList.add('active');
            });
        });
    }

    setupCategoryTabs() {
        const categoryTabs = document.querySelectorAll('.category-tab');
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.getAttribute('data-category');
                this.selectedCategory = category;

                categoryTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                this.renderTasksForDisplay();
            });
        });
    }

    setupTaskFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                this.selectedFilter = filter;

                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.renderTasksForDisplay();
            });
        });
    }

    // ========== TASK CRUD ==========
    async createTask(taskData) {
        const now = new Date().toISOString();
        const task = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: taskData.name,
            category: taskData.category,
            estimatedTime: parseInt(taskData.estimatedTime),
            assignedTo: taskData.assignedTo || null,
            completedDates: [],
            createdAt: now,
            lastUpdated: now
        };

        try {
            await this.saveTaskToFirebase(task);
            return task;
        } catch (error) {
            console.error('Failed to create task:', error);
            return null;
        }
    }

    setupTaskForm() {
        const form = document.getElementById('task-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const taskData = {
                name: formData.get('name'),
                category: formData.get('category'),
                estimatedTime: formData.get('estimatedTime'),
                assignedTo: formData.get('assignedTo') || null
            };

            const task = await this.createTask(taskData);
            
            if (task) {
                form.reset();
                // Switch to calendar tab
                document.querySelector('.nav-item[data-tab="calendar-tab"]').click();
            }
        });
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.deleteTaskFromFirebase(taskId);
        }
    }

    completeTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const today = this.formatDateToISO(new Date());
        
        if (!task.completedDates) {
            task.completedDates = [];
        }

        // Add completion with user info
        const completion = {
            date: today,
            userId: this.userId,
            userName: this.userName,
            timestamp: new Date().toISOString()
        };

        // Check if already completed in this cycle
        if (this.isCompletedInCurrentCycle(task)) {
            alert('This task has already been completed in the current period!');
            return;
        }

        task.completedDates.push(completion);
        this.updateTaskCompletionInFirebase(taskId, task.completedDates);
    }

    // ========== TASK RENDERING ==========
    renderTasksForDisplay() {
        const container = document.getElementById('tasks-for-display');
        
        if (!container) {
            console.error('tasks-for-display container not found');
            return;
        }
        
        console.log('📋 Rendering tasks. Total tasks:', this.tasks.length, 'Selected category:', this.selectedCategory, 'Selected filter:', this.selectedFilter);
        
        let filteredTasks = this.tasks;

        // Filter by category
        if (this.selectedCategory !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === this.selectedCategory);
        }

        // Filter by completion status
        if (this.selectedFilter === 'incomplete') {
            filteredTasks = filteredTasks.filter(task => !this.isCompletedInCurrentCycle(task));
        } else if (this.selectedFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => this.isCompletedInCurrentCycle(task));
        }

        console.log('📋 After filtering:', filteredTasks.length, 'tasks');

        // Update progress indicator
        this.updateProgressIndicator();

        if (filteredTasks.length === 0) {
            container.innerHTML = '<div class="empty-state">No tasks to display</div>';
            return;
        }

        container.innerHTML = filteredTasks.map(task => {
            const completedInCurrentCycle = this.isCompletedInCurrentCycle(task);
            const streak = this.calculateStreak(task);
            const hasActiveStreak = streak > 0;
            
            // Get who completed it
            const lastCompletion = task.completedDates && task.completedDates.length > 0 
                ? task.completedDates[task.completedDates.length - 1] 
                : null;
            
            const completedBy = lastCompletion && lastCompletion.userName 
                ? `Completed by ${lastCompletion.userName}` 
                : '';

            // Get assignment info
            const assignedMember = task.assignedTo 
                ? this.members.find(m => m.id === task.assignedTo)
                : null;
            const assignmentInfo = assignedMember 
                ? `<span class="task-assignment">Assigned to: ${assignedMember.name}</span>`
                : '<span class="task-assignment">Anyone</span>';

            return `
                <div class="task-item ${completedInCurrentCycle ? 'completed' : ''}" onclick="taskManager.startTaskTimer('${task.id}')">
                    <div class="task-item-header">
                        <h4 class="task-item-title">${task.name}</h4>
                        <div class="task-badges">
                            <span class="streak-badge ${hasActiveStreak ? '' : 'no-streak'}" 
                                  onclick="event.stopPropagation(); taskManager.showTaskHistory('${task.id}')">
                                🔥 ${streak}
                            </span>
                        </div>
                    </div>
                    <div class="task-item-meta">
                        <span class="category-badge">${this.formatCategory(task.category)}</span>
                        <span class="time-badge">⏱ ${task.estimatedTime} min</span>
                    </div>
                    ${assignmentInfo}
                    ${completedInCurrentCycle ? `<div class="task-completed-by">${completedBy}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    renderAllTasks() {
        const container = document.getElementById('all-tasks-list');
        
        if (!container) {
            console.warn('all-tasks-list container not found');
            return;
        }
        
        console.log('📝 Rendering all tasks list. Total:', this.tasks.length);
        
        if (this.tasks.length === 0) {
            container.innerHTML = '<p>No tasks created yet</p>';
            return;
        }

        container.innerHTML = this.tasks.map(task => {
            const assignedMember = task.assignedTo 
                ? this.members.find(m => m.id === task.assignedTo)
                : null;
            const assignmentText = assignedMember ? `Assigned to: ${assignedMember.name}` : 'Anyone';

            return `
                <div class="all-task-item">
                    <div>
                        <strong>${task.name}</strong>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            ${this.formatCategory(task.category)} • ${task.estimatedTime} min • ${assignmentText}
                        </div>
                    </div>
                    <button class="delete-btn" onclick="taskManager.deleteTask('${task.id}')">🗑️</button>
                </div>
            `;
        }).join('');
    }

    updateProgressIndicator() {
        const progressCard = document.querySelector('.progress-card');
        const progressCount = document.querySelector('.progress-count');
        const progressFill = document.querySelector('.progress-bar-fill');
        const progressSubtitle = document.querySelector('.progress-subtitle');
        
        if (!progressCard || !progressCount || !progressFill || !progressSubtitle) {
            console.warn('Progress indicator elements not found');
            return;
        }
        
        let tasksToCheck = this.tasks;
        let categoryName = 'all';

        if (this.selectedCategory !== 'all') {
            tasksToCheck = tasksToCheck.filter(task => task.category === this.selectedCategory);
            categoryName = this.selectedCategory;
        }

        const total = tasksToCheck.length;
        const completed = tasksToCheck.filter(task => this.isCompletedInCurrentCycle(task)).length;
        const percentage = total > 0 ? (completed / total) * 100 : 0;

        progressCount.textContent = `${completed}/${total}`;
        progressFill.style.width = `${percentage}%`;
        
        const periodText = this.getTimePeriod(categoryName);
        progressSubtitle.textContent = `${categoryName} tasks ${periodText}`;

        // Add all-complete class if all done
        if (completed === total && total > 0) {
            progressCard.classList.add('all-complete');
        } else {
            progressCard.classList.remove('all-complete');
        }
    }

    // ========== HELPER METHODS ==========
    isCompletedInCurrentCycle(task) {
        if (!task.completedDates || task.completedDates.length === 0) return false;

        const categoryToCheck = this.selectedCategory === 'all' ? task.category : this.selectedCategory;
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        // Get the last completion (could be string or object)
        const lastCompletionEntry = task.completedDates[task.completedDates.length - 1];
        const lastCompletionDateStr = typeof lastCompletionEntry === 'string' 
            ? lastCompletionEntry 
            : lastCompletionEntry.date;
        
        const lastCompletion = new Date(lastCompletionDateStr);
        lastCompletion.setHours(0, 0, 0, 0);

        switch (categoryToCheck) {
            case 'daily':
                return this.isSameDay(lastCompletion, now);
            
            case 'weekly':
                const weekStart = this.getWeekStart(now);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                weekEnd.setHours(23, 59, 59, 999);
                
                return lastCompletion >= weekStart && lastCompletion <= weekEnd;
            
            case 'monthly':
                return lastCompletion.getMonth() === now.getMonth() && 
                       lastCompletion.getFullYear() === now.getFullYear();
            
            case 'seasonal':
                const currentSeason = this.getCurrentSeason(now);
                const lastSeason = this.getCurrentSeason(lastCompletion);
                return currentSeason === lastSeason && 
                       lastCompletion.getFullYear() === now.getFullYear();
            
            case 'yearly':
                return lastCompletion.getFullYear() === now.getFullYear();
            
            default:
                return false;
        }
    }

    calculateStreak(task) {
        if (!task.completedDates || task.completedDates.length === 0) return 0;

        // Only calculate streaks for daily and weekly tasks
        if (task.category !== 'daily' && task.category !== 'weekly') return 0;

        // Sort dates (handle both string and object formats)
        const sortedDates = task.completedDates
            .map(entry => typeof entry === 'string' ? entry : entry.date)
            .map(dateStr => {
                const d = new Date(dateStr);
                d.setHours(0, 0, 0, 0);
                return d.getTime();
            })
            .sort((a, b) => b - a); // Most recent first

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let streak = 0;
        let expectedDate = today;

        if (task.category === 'daily') {
            for (let i = 0; i < sortedDates.length; i++) {
                const completionDate = new Date(sortedDates[i]);
                
                if (completionDate.getTime() === expectedDate.getTime()) {
                    streak++;
                    expectedDate = new Date(expectedDate);
                    expectedDate.setDate(expectedDate.getDate() - 1);
                } else if (completionDate.getTime() < expectedDate.getTime()) {
                    break;
                }
            }
        } else if (task.category === 'weekly') {
            let expectedWeekStart = this.getWeekStart(today);
            
            for (let i = 0; i < sortedDates.length; i++) {
                const completionDate = new Date(sortedDates[i]);
                const completionWeekStart = this.getWeekStart(completionDate);
                
                if (completionWeekStart.getTime() === expectedWeekStart.getTime()) {
                    streak++;
                    expectedWeekStart = new Date(expectedWeekStart);
                    expectedWeekStart.setDate(expectedWeekStart.getDate() - 7);
                } else if (completionWeekStart.getTime() < expectedWeekStart.getTime()) {
                    break;
                }
            }
        }

        return streak;
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        const weekStart = new Date(d.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    getCurrentSeason(date) {
        const month = date.getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }

    getTimePeriod(category) {
        const now = new Date();
        
        switch (category) {
            case 'daily':
                return 'today';
            case 'weekly':
                return 'this week';
            case 'monthly':
                return 'this month';
            case 'seasonal':
                return `this ${this.getCurrentSeason(now)}`;
            case 'yearly':
                return 'this year';
            case 'all':
                return 'in current periods';
            default:
                return '';
        }
    }

    formatCategory(category) {
        const icons = {
            daily: '📅',
            weekly: '📆',
            monthly: '🗓️',
            seasonal: '🍂',
            yearly: '📊'
        };
        return `${icons[category] || ''} ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    }

    formatDateToISO(date) {
        return date.toISOString().split('T')[0];
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    formatDateLong(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // ========== TIMER MODAL ==========
    setupTimerModal() {
        const modal = document.getElementById('timer-modal');
        const cancelBtn = document.getElementById('cancel-timer');
        const completeBtn = document.getElementById('complete-task');

        if (!modal || !cancelBtn || !completeBtn) {
            console.error('Timer modal elements not found:', {modal: !!modal, cancelBtn: !!cancelBtn, completeBtn: !!completeBtn});
            return;
        }

        cancelBtn.addEventListener('click', () => {
            this.stopTimer();
            modal.style.display = 'none';
        });

        completeBtn.addEventListener('click', () => {
            if (this.activeTimer) {
                this.completeTask(this.activeTimer.taskId);
                this.stopTimer();
                modal.style.display = 'none';
            }
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.stopTimer();
                modal.style.display = 'none';
            }
        });
    }

    startTaskTimer(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        // Check if already completed in current cycle
        if (this.isCompletedInCurrentCycle(task)) {
            alert('This task has already been completed in the current period!');
            return;
        }

        this.activeTimer = {
            taskId: taskId,
            totalSeconds: task.estimatedTime * 60,
            remainingSeconds: task.estimatedTime * 60
        };

        const modal = document.getElementById('timer-modal');
        const taskNameEl = document.getElementById('timer-task-name');
        const timerDisplay = document.getElementById('timer-display');
        const progressFill = document.getElementById('timer-progress-fill');

        taskNameEl.textContent = task.name;
        modal.style.display = 'flex';

        this.timerInterval = setInterval(() => {
            this.activeTimer.remainingSeconds--;

            const minutes = Math.floor(this.activeTimer.remainingSeconds / 60);
            const seconds = this.activeTimer.remainingSeconds % 60;
            timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            const progress = ((this.activeTimer.totalSeconds - this.activeTimer.remainingSeconds) / this.activeTimer.totalSeconds) * 100;
            progressFill.style.width = `${progress}%`;

            if (this.activeTimer.remainingSeconds <= 0) {
                this.completeTask(taskId);
                this.stopTimer();
                modal.style.display = 'none';
                alert('Task completed! Great job! 🎉');
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.activeTimer = null;
    }

    // ========== HISTORY MODAL ==========
    setupHistoryModal() {
        const modal = document.getElementById('history-modal');
        const closeBtn = document.getElementById('close-history');

        if (!modal || !closeBtn) {
            console.error('History modal elements not found');
            return;
        }

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    showTaskHistory(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) return;

        const modal = document.getElementById('history-modal');
        const taskName = document.getElementById('history-task-name');
        const totalCompletions = document.getElementById('history-total-completions');
        const currentStreak = document.getElementById('history-current-streak');
        const datesList = document.getElementById('history-dates-list');

        taskName.textContent = task.name;
        totalCompletions.textContent = task.completedDates ? task.completedDates.length : 0;
        currentStreak.textContent = this.calculateStreak(task);

        if (!task.completedDates || task.completedDates.length === 0) {
            datesList.innerHTML = '<div class="empty-history">No completion history yet</div>';
        } else {
            // Handle both string and object formats
            const sortedDates = [...task.completedDates]
                .sort((a, b) => {
                    const dateA = typeof a === 'string' ? a : a.date;
                    const dateB = typeof b === 'string' ? b : b.date;
                    return new Date(dateB) - new Date(dateA);
                });

            datesList.innerHTML = sortedDates.map(entry => {
                const dateStr = typeof entry === 'string' ? entry : entry.date;
                const userName = typeof entry === 'object' && entry.userName ? entry.userName : 'Unknown';
                
                const categoryToCheck = this.selectedCategory === 'all' ? task.category : this.selectedCategory;
                const periodName = this.getPeriodNameForTask(task, dateStr);
                
                return `
                    <div class="history-date-item">
                        <span class="history-date-badge">${this.formatDateLong(dateStr)}</span>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            ${periodName} • Completed by ${userName}
                        </div>
                    </div>
                `;
            }).join('');
        }

        modal.style.display = 'flex';
    }

    getPeriodNameForTask(task, dateStr) {
        const date = new Date(dateStr);
        
        switch (task.category) {
            case 'daily':
                return 'Daily task';
            case 'weekly':
                const weekStart = this.getWeekStart(date);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                return `Week of ${weekStart.toLocaleDateString('en-US', {month: 'short', day: 'numeric'})}`;
            case 'monthly':
                return date.toLocaleDateString('en-US', {month: 'long', year: 'numeric'});
            case 'seasonal':
                return `${this.getCurrentSeason(date).charAt(0).toUpperCase() + this.getCurrentSeason(date).slice(1)} ${date.getFullYear()}`;
            case 'yearly':
                return `Year ${date.getFullYear()}`;
            default:
                return '';
        }
    }

    // ========== SETTINGS MODAL ==========
    setupSettingsModal() {
        const settingsBtn = document.getElementById('settings-btn');
        const modal = document.getElementById('settings-modal');
        const closeBtn = document.getElementById('close-settings');
        const logoutBtn = document.getElementById('logout-btn');
        const copyCodeBtn = document.getElementById('copy-household-code');
        const addMemberBtn = document.getElementById('add-member-btn');
        const newMemberInput = document.getElementById('new-member-name');

        // Display current settings
        document.getElementById('settings-household-code').textContent = this.householdId;
        document.getElementById('settings-user-name').textContent = this.userName;

        settingsBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });

        logoutBtn.addEventListener('click', () => {
            if (confirm('Switch to a different household? This will log you out.')) {
                localStorage.removeItem('householdId');
                localStorage.removeItem('userId');
                localStorage.removeItem('userName');
                location.reload();
            }
        });

        copyCodeBtn.addEventListener('click', () => {
            navigator.clipboard.writeText(this.householdId).then(() => {
                const originalText = copyCodeBtn.textContent;
                copyCodeBtn.textContent = 'Copied!';
                setTimeout(() => {
                    copyCodeBtn.textContent = originalText;
                }, 2000);
            });
        });

        addMemberBtn.addEventListener('click', () => {
            const name = newMemberInput.value.trim();
            if (name) {
                const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                this.addMemberToHousehold(newId, name, false);
                newMemberInput.value = '';
            }
        });
    }

    // ========== THEME TOGGLE ==========
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.querySelector('.theme-icon');
        
        if (!themeToggle || !themeIcon) {
            console.error('Theme toggle elements not found');
            return;
        }
        
        // Set initial icon based on current theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            themeIcon.textContent = '☀️';
        } else {
            themeIcon.textContent = '🌙';
        }

        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            
            if (document.body.classList.contains('dark-mode')) {
                themeIcon.textContent = '☀️';
                localStorage.setItem('theme', 'dark');
            } else {
                themeIcon.textContent = '🌙';
                localStorage.setItem('theme', 'light');
            }
        });
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.taskManager = new TaskManager();
});
