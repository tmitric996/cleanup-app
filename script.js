// Task Management System
class TaskManager {
    constructor() {
        this.tasks = this.loadTasks();
        this.selectedDate = new Date();
        this.currentDate = new Date();
        this.selectedCategory = 'all';
        this.selectedFilter = 'all'; // all | incomplete | completed
        this.activeTimer = null;
        this.timerInterval = null;
        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.setupTaskForm();
        this.setupCategoryTabs();
        this.setupTaskFilters();
        this.setupTimerModal();
        this.setupHistoryModal();
        this.setupThemeToggle();
        this.renderAllTasks();
        this.renderTasksForDisplay();
    }

    // Local Storage Methods
    loadTasks() {
        const tasks = localStorage.getItem('cleanupTasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    saveTasks() {
        localStorage.setItem('cleanupTasks', JSON.stringify(this.tasks));
    }

    // Tab Navigation
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

    // Category Tabs Setup
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

    // Task Filter Setup
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

    // Task CRUD Operations
    createTask(taskData) {
        const now = new Date().toISOString();
        const task = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: taskData.name,
            category: taskData.category,
            estimatedTime: parseInt(taskData.estimatedTime),
            completedDates: [],
            createdAt: now,
            lastUpdated: now
        };

        this.tasks.push(task);
        this.saveTasks();
        return task;
    }

    getTask(id) {
        return this.tasks.find(task => task.id === id);
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
        this.saveTasks();
    }

    completeTask(id, date) {
        const task = this.getTask(id);
        if (task) {
            const dateStr = this.formatDateToISO(date);
            if (!task.completedDates.includes(dateStr)) {
                task.completedDates.push(dateStr);
                task.lastUpdated = new Date().toISOString();
                this.saveTasks();
            }
        }
    }

    getTasksForDate(date) {
        const dateStr = this.formatDateToISO(date);
        return this.tasks.filter(task => 
            task.completedDates.includes(dateStr)
        );
    }

    // Task Form Setup
    setupTaskForm() {
        const form = document.getElementById('task-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById('task-name').value,
                category: document.getElementById('task-category').value,
                estimatedTime: document.getElementById('task-time').value
            };

            this.createTask(formData);
            form.reset();
            this.renderAllTasks();
            this.renderTasksForDisplay();

            this.showToast('Task created successfully!');
        });
    }

    renderAllTasks() {
        const container = document.getElementById('all-tasks-list');
        
        if (this.tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">No tasks yet. Create your first cleanup task!</div>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tasks.map(task => `
            <div class="task-card ${task.category}">
                <div class="task-card-header">
                    <div>
                        <div class="task-card-title">${this.escapeHtml(task.name)}</div>
                    </div>
                    <button class="btn-icon delete" onclick="taskManager.confirmDeleteTask('${task.id}')">
                        🗑️
                    </button>
                </div>
                <div class="task-card-meta">
                    <span class="category-badge ${task.category}">${task.category}</span>
                    <span>⏱️ ${task.estimatedTime} min</span>
                    <span>✓ ${task.completedDates.length}</span>
                </div>
            </div>
        `).join('');
    }

    confirmDeleteTask(id) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.deleteTask(id);
            this.renderAllTasks();
            this.renderTasksForDisplay();
        }
    }

    // Render Tasks for Selected Date and Category
    renderTasksForDisplay() {
        const tasksList = document.getElementById('tasks-list');
        const dateHeader = document.getElementById('tasks-header');
        
        // Determine time period based on category
        let timePeriod = this.getTimePeriod(this.selectedCategory);
        dateHeader.textContent = timePeriod.label;

        // Filter tasks by category
        let filteredTasks = this.tasks;
        if (this.selectedCategory !== 'all') {
            filteredTasks = this.tasks.filter(task => task.category === this.selectedCategory);
        }

        if (filteredTasks.length === 0) {
            this.updateProgressIndicator(0, 0, timePeriod);
            tasksList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <div class="empty-state-text">No ${this.selectedCategory === 'all' ? '' : this.selectedCategory} tasks yet</div>
                </div>
            `;
            return;
        }

        // Determine completion status for current period
        const tasksWithStatus = filteredTasks.map(task => {
            const completionsInPeriod = this.getCompletionsInPeriod(task, timePeriod);
            const completedToday = this.selectedCategory === 'daily' || this.selectedCategory === 'all' 
                ? task.completedDates.includes(this.formatDateToISO(new Date()))
                : false;
            
            return {
                task,
                completionsInPeriod,
                completedInCurrentCycle: this.isCompletedInCurrentCycle(task, timePeriod),
                completedToday,
                streak: this.calculateStreak(task)
            };
        });

        // Apply completion filter
        let displayTasks = tasksWithStatus;
        if (this.selectedFilter === 'incomplete') {
            displayTasks = tasksWithStatus.filter(t => !t.completedInCurrentCycle);
        } else if (this.selectedFilter === 'completed') {
            displayTasks = tasksWithStatus.filter(t => t.completedInCurrentCycle);
        }

        // Update progress indicator
        const completedCount = tasksWithStatus.filter(t => t.completedInCurrentCycle).length;
        const totalCount = tasksWithStatus.length;
        this.updateProgressIndicator(completedCount, totalCount, timePeriod);

        // Display tasks
        if (displayTasks.length === 0) {
            const emptyMessage = this.selectedFilter === 'incomplete' 
                ? '🎉 All tasks completed! Excellent work!' 
                : 'No completed tasks yet';
            const emptyIcon = this.selectedFilter === 'incomplete' ? '🌟' : '📋';
            const emptyStyle = this.selectedFilter === 'incomplete' 
                ? 'style="color: #2ECC71; font-weight: 600;"' 
                : '';
            tasksList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon" style="font-size: 3.5rem;">${emptyIcon}</div>
                    <div class="empty-state-text" ${emptyStyle}>${emptyMessage}</div>
                </div>
            `;
            return;
        }

        const tasksHtml = displayTasks.map(({ task, completionsInPeriod, completedInCurrentCycle, completedToday, streak }) => {
            const isRunning = this.activeTimer && this.activeTimer.taskId === task.id;
            const hasActiveStreak = streak.current > 0;
            
            // Use completedInCurrentCycle for styling across all tabs
            const isCompletedStyle = completedInCurrentCycle;
            
            // Show fire badge for all tasks - grey if no streak
            const badgeHtml = `
                <div class="streak-badge ${!hasActiveStreak ? 'no-streak' : ''}" 
                     onclick="event.stopPropagation(); taskManager.showTaskHistory('${task.id}')" 
                     title="${hasActiveStreak ? 'View streak history' : 'View completion history'}">
                    🔥 ${hasActiveStreak ? streak.current : '0'}
                </div>
            `;
            
            return `
                <div class="task-item ${isCompletedStyle ? 'completed' : ''} ${isRunning ? 'running' : ''}" 
                     onclick="taskManager.startTaskTimer('${task.id}')"
                     data-task-id="${task.id}">
                    <div class="task-item-header">
                        <div class="task-item-title">
                            ${this.escapeHtml(task.name)}
                        </div>
                        ${badgeHtml}
                    </div>
                    <div class="task-item-meta">
                        <span class="category-badge ${task.category}">${task.category}</span>
                        <span>⏱️ ${task.estimatedTime} min</span>
                        ${completionsInPeriod > 0 ? `<span style="color: var(--secondary-color);">✓ ${completionsInPeriod} ${completionsInPeriod === 1 ? 'time' : 'times'}</span>` : ''}
                        ${hasActiveStreak && streak.best > streak.current ? `<span style="color: var(--text-secondary);">Best: ${streak.best}</span>` : ''}
                        ${isRunning ? `<span class="task-timer-badge">${this.formatTime(this.activeTimer.remainingTime)}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        tasksList.innerHTML = tasksHtml;
    }

    isCompletedInCurrentCycle(task, period) {
        // If no completions, return false
        if (!task.completedDates || task.completedDates.length === 0) {
            return false;
        }

        // When in "All" tab, check based on the task's own category
        const categoryToCheck = this.selectedCategory === 'all' ? task.category : this.selectedCategory;

        // For daily tasks: check if completed today
        if (categoryToCheck === 'daily') {
            const today = this.formatDateToISO(new Date());
            return task.completedDates.includes(today);
        }
        
        // For weekly tasks: check if completed at least once this week
        if (categoryToCheck === 'weekly') {
            const thisWeekStart = this.getWeekStart(new Date());
            const now = new Date();
            const thisWeekEnd = new Date(thisWeekStart);
            thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);
            thisWeekEnd.setHours(23, 59, 59, 999);
            
            return task.completedDates.some(dateStr => {
                const completionDate = new Date(dateStr + 'T00:00:00');
                return completionDate >= thisWeekStart && completionDate <= thisWeekEnd;
            });
        }
        
        // For monthly tasks: check if completed at least once this month
        if (categoryToCheck === 'monthly') {
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            
            return task.completedDates.some(dateStr => {
                const completionDate = new Date(dateStr + 'T00:00:00');
                return completionDate >= thisMonthStart && completionDate <= thisMonthEnd;
            });
        }
        
        // For seasonal tasks: check if completed in current season
        if (categoryToCheck === 'seasonal') {
            const season = this.getCurrentSeason();
            const seasonDates = this.getSeasonDates(season, new Date().getFullYear());
            
            return task.completedDates.some(dateStr => {
                const completionDate = new Date(dateStr + 'T00:00:00');
                return completionDate >= seasonDates.start && completionDate <= seasonDates.end;
            });
        }
        
        // For yearly tasks: check if completed this year
        if (categoryToCheck === 'yearly') {
            const now = new Date();
            const thisYearStart = new Date(now.getFullYear(), 0, 1);
            const thisYearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
            
            return task.completedDates.some(dateStr => {
                const completionDate = new Date(dateStr + 'T00:00:00');
                return completionDate >= thisYearStart && completionDate <= thisYearEnd;
            });
        }
        
        return false;
    }

    updateProgressIndicator(completed, total, timePeriod) {
        const progressCard = document.getElementById('progress-card');
        const progressTitle = document.getElementById('progress-title');
        const progressCount = document.getElementById('progress-count');
        const progressFill = document.getElementById('progress-bar-fill');
        const progressSubtitle = document.getElementById('progress-subtitle');

        if (total === 0) {
            progressCard.style.display = 'none';
            return;
        }

        progressCard.style.display = 'block';
        
        // Update title based on category
        const titles = {
            'all': 'Today\'s Progress',
            'daily': 'Daily Progress',
            'weekly': 'Weekly Progress',
            'monthly': 'Monthly Progress',
            'seasonal': 'Seasonal Progress',
            'yearly': 'Yearly Progress'
        };
        progressTitle.textContent = titles[this.selectedCategory] || 'Progress';

        // Update count
        progressCount.textContent = `${completed}/${total}`;

        // Update progress bar
        const percentage = (completed / total) * 100;
        progressFill.style.width = `${percentage}%`;
        
        if (completed === total) {
            progressFill.classList.add('complete');
            progressCard.classList.add('all-complete');
        } else {
            progressFill.classList.remove('complete');
            progressCard.classList.remove('all-complete');
        }

        // Update subtitle
        const remaining = total - completed;
        if (completed === total) {
            progressSubtitle.textContent = '🎉 All tasks completed! Great job!';
        } else if (remaining === 1) {
            progressSubtitle.textContent = '1 task remaining';
        } else {
            progressSubtitle.textContent = `${remaining} tasks remaining`;
        }
    }

    getTimePeriod(category) {
        const now = new Date();
        
        switch(category) {
            case 'daily':
            case 'all':
                return {
                    label: 'Today\'s Tasks',
                    start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                    end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
                };
            
            case 'weekly':
                const weekStart = this.getWeekStart(now);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekEnd.getDate() + 6);
                weekEnd.setHours(23, 59, 59);
                return {
                    label: 'This Week\'s Tasks',
                    start: weekStart,
                    end: weekEnd
                };
            
            case 'monthly':
                return {
                    label: 'This Month\'s Tasks',
                    start: new Date(now.getFullYear(), now.getMonth(), 1),
                    end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
                };
            
            case 'seasonal':
                const season = this.getCurrentSeason();
                const seasonDates = this.getSeasonDates(season, now.getFullYear());
                return {
                    label: `This ${season.charAt(0).toUpperCase() + season.slice(1)}'s Tasks`,
                    start: seasonDates.start,
                    end: seasonDates.end
                };
            
            case 'yearly':
                return {
                    label: 'This Year\'s Tasks',
                    start: new Date(now.getFullYear(), 0, 1),
                    end: new Date(now.getFullYear(), 11, 31, 23, 59, 59)
                };
            
            default:
                return {
                    label: 'Today\'s Tasks',
                    start: now,
                    end: now
                };
        }
    }

    getCompletionsInPeriod(task, period) {
        return task.completedDates.filter(dateStr => {
            const date = new Date(dateStr);
            return date >= period.start && date <= period.end;
        }).length;
    }

    getCurrentSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }

    getSeasonDates(season, year) {
        const seasons = {
            winter: {
                start: new Date(year - 1, 11, 1), // Dec 1 of previous year
                end: new Date(year, 1, 28, 23, 59, 59) // Feb 28/29
            },
            spring: {
                start: new Date(year, 2, 1), // Mar 1
                end: new Date(year, 4, 31, 23, 59, 59) // May 31
            },
            summer: {
                start: new Date(year, 5, 1), // Jun 1
                end: new Date(year, 7, 31, 23, 59, 59) // Aug 31
            },
            autumn: {
                start: new Date(year, 8, 1), // Sep 1
                end: new Date(year, 10, 30, 23, 59, 59) // Nov 30
            }
        };
        return seasons[season];
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day;
        const weekStart = new Date(d.setDate(diff));
        weekStart.setHours(0, 0, 0, 0);
        return weekStart;
    }

    // Streak Calculation
    calculateStreak(task) {
        if (task.completedDates.length === 0) {
            return { current: 0, best: 0 };
        }

        // Sort dates in descending order (newest first)
        const sortedDates = task.completedDates
            .map(d => new Date(d))
            .sort((a, b) => b - a);

        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;

        if (task.category === 'daily') {
            // For daily tasks, check consecutive days
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Check if completed today or yesterday to start counting
            const lastCompletion = sortedDates[0];
            lastCompletion.setHours(0, 0, 0, 0);
            
            if (this.isSameDay(lastCompletion, today) || this.isSameDay(lastCompletion, yesterday)) {
                currentStreak = 1;
                let expectedDate = new Date(lastCompletion);
                
                for (let i = 1; i < sortedDates.length; i++) {
                    expectedDate.setDate(expectedDate.getDate() - 1);
                    const checkDate = new Date(sortedDates[i]);
                    checkDate.setHours(0, 0, 0, 0);
                    
                    if (this.isSameDay(checkDate, expectedDate)) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }

            // Calculate best streak
            tempStreak = 1;
            let prevDate = sortedDates[0];
            
            for (let i = 1; i < sortedDates.length; i++) {
                const currentDate = sortedDates[i];
                const daysDiff = Math.floor((prevDate - currentDate) / (1000 * 60 * 60 * 24));
                
                if (daysDiff === 1) {
                    tempStreak++;
                } else {
                    bestStreak = Math.max(bestStreak, tempStreak);
                    tempStreak = 1;
                }
                prevDate = currentDate;
            }
            bestStreak = Math.max(bestStreak, tempStreak, currentStreak);

        } else if (task.category === 'weekly') {
            // For weekly tasks, check consecutive weeks
            const thisWeekStart = this.getWeekStart(new Date());
            const lastWeekStart = new Date(thisWeekStart);
            lastWeekStart.setDate(lastWeekStart.getDate() - 7);

            // Group completions by week
            const weekCompletions = {};
            sortedDates.forEach(date => {
                const weekStart = this.getWeekStart(date);
                const weekKey = this.formatDateToISO(weekStart);
                weekCompletions[weekKey] = true;
            });

            const weeks = Object.keys(weekCompletions).sort().reverse();
            
            // Check if completed this week or last week
            const thisWeekKey = this.formatDateToISO(thisWeekStart);
            const lastWeekKey = this.formatDateToISO(lastWeekStart);
            
            if (weeks.includes(thisWeekKey) || weeks.includes(lastWeekKey)) {
                currentStreak = 1;
                let expectedWeek = new Date(weeks[0]);
                
                for (let i = 1; i < weeks.length; i++) {
                    expectedWeek.setDate(expectedWeek.getDate() - 7);
                    const expectedKey = this.formatDateToISO(expectedWeek);
                    
                    if (weeks[i] === expectedKey) {
                        currentStreak++;
                    } else {
                        break;
                    }
                }
            }

            // Calculate best streak
            tempStreak = 1;
            for (let i = 1; i < weeks.length; i++) {
                const prevWeek = new Date(weeks[i - 1]);
                const currWeek = new Date(weeks[i]);
                const weeksDiff = Math.floor((prevWeek - currWeek) / (1000 * 60 * 60 * 24 * 7));
                
                if (weeksDiff === 1) {
                    tempStreak++;
                } else {
                    bestStreak = Math.max(bestStreak, tempStreak);
                    tempStreak = 1;
                }
            }
            bestStreak = Math.max(bestStreak, tempStreak, currentStreak);
        }

        return { current: currentStreak, best: bestStreak };
    }

    // Timer Functionality
    setupTimerModal() {
        document.getElementById('cancel-timer').addEventListener('click', () => {
            this.cancelTimer();
        });

        document.getElementById('complete-timer-task').addEventListener('click', () => {
            this.completeTimerTask();
        });
    }

    // History Modal
    setupHistoryModal() {
        document.getElementById('close-history').addEventListener('click', () => {
            document.getElementById('history-modal').classList.remove('active');
        });

        // Close on background click
        document.getElementById('history-modal').addEventListener('click', (e) => {
            if (e.target.id === 'history-modal') {
                document.getElementById('history-modal').classList.remove('active');
            }
        });
    }

    // Theme Toggle
    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        const themeIcon = document.querySelector('.theme-icon');
        
        // Load saved theme preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            themeIcon.textContent = '☀️';
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

    showTaskHistory(taskId) {
        const task = this.getTask(taskId);
        if (!task) return;

        // Update modal title
        document.getElementById('history-task-name').textContent = task.name;

        // Update stats
        const totalCompletions = task.completedDates.length;
        document.getElementById('total-completions').textContent = totalCompletions;

        if (totalCompletions > 0) {
            // Sort dates in descending order (newest first)
            const sortedDates = [...task.completedDates].sort((a, b) => new Date(b) - new Date(a));
            const lastCompleted = new Date(sortedDates[0]);
            document.getElementById('last-completed').textContent = this.formatDateDisplay(lastCompleted);

            // Render history list
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const historyHtml = sortedDates.map(dateStr => {
                const date = new Date(dateStr + 'T00:00:00');
                const isToday = this.isSameDay(date, today);
                const isYesterday = this.isSameDay(date, yesterday);
                const isRecent = (today - date) / (1000 * 60 * 60 * 24) <= 7; // Within 7 days

                let badge = '';
                if (isToday) {
                    badge = '<span class="history-date-badge">Today</span>';
                } else if (isYesterday) {
                    badge = '<span class="history-date-badge">Yesterday</span>';
                } else if (isRecent) {
                    badge = '<span class="history-date-badge">Recent</span>';
                }

                return `
                    <div class="history-date-item ${isRecent ? 'recent' : ''}">
                        <span class="history-date-text">${this.formatDateLong(date)}</span>
                        ${badge}
                    </div>
                `;
            }).join('');

            document.getElementById('history-dates-list').innerHTML = historyHtml;
        } else {
            document.getElementById('last-completed').textContent = 'Never';
            document.getElementById('history-dates-list').innerHTML = `
                <div class="empty-history">
                    <div class="empty-history-icon">📅</div>
                    <div>No completion history yet</div>
                </div>
            `;
        }

        // Show modal
        document.getElementById('history-modal').classList.add('active');
    }

    startTaskTimer(taskId) {
        const task = this.getTask(taskId);
        if (!task) return;

        // Check if task is already completed in current cycle
        const timePeriod = this.getTimePeriod(this.selectedCategory);
        if (this.isCompletedInCurrentCycle(task, timePeriod)) {
            const periodNames = {
                'daily': 'today',
                'weekly': 'this week',
                'monthly': 'this month',
                'seasonal': 'this season',
                'yearly': 'this year',
                'all': this.getPeriodNameForTask(task)
            };
            const periodName = periodNames[this.selectedCategory] || 'this period';
            this.showToast(`✓ Task already completed ${periodName}!`);
            return;
        }

        // Stop any existing timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Setup new timer
        this.activeTimer = {
            taskId: task.id,
            totalTime: task.estimatedTime * 60, // Convert to seconds
            remainingTime: task.estimatedTime * 60,
            startTime: Date.now()
        };

        // Show modal
        document.getElementById('timer-task-name').textContent = task.name;
        document.getElementById('timer-display').textContent = this.formatTime(this.activeTimer.remainingTime);
        document.getElementById('timer-modal').classList.add('active');

        // Start countdown
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);

        this.renderTasksForDisplay();
    }

    getPeriodNameForTask(task) {
        const periodMap = {
            'daily': 'today',
            'weekly': 'this week',
            'monthly': 'this month',
            'seasonal': 'this season',
            'yearly': 'this year'
        };
        return periodMap[task.category] || 'this period';
    }

    updateTimer() {
        if (!this.activeTimer) return;

        this.activeTimer.remainingTime--;

        const timerDisplay = document.getElementById('timer-display');
        const progressBar = document.getElementById('timer-progress-bar');
        
        timerDisplay.textContent = this.formatTime(this.activeTimer.remainingTime);
        
        // Update progress bar
        const progress = ((this.activeTimer.totalTime - this.activeTimer.remainingTime) / this.activeTimer.totalTime) * 100;
        progressBar.style.width = `${progress}%`;

        // Warning when less than 1 minute
        if (this.activeTimer.remainingTime <= 60 && this.activeTimer.remainingTime > 0) {
            timerDisplay.classList.add('warning');
        }

        // Timer finished
        if (this.activeTimer.remainingTime <= 0) {
            clearInterval(this.timerInterval);
            this.showToast('Time\'s up! 🎉');
            timerDisplay.textContent = '00:00';
            timerDisplay.classList.add('warning');
        }

        // Update task display
        this.renderTasksForDisplay();
    }

    cancelTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.activeTimer = null;
        document.getElementById('timer-modal').classList.remove('active');
        document.getElementById('timer-display').classList.remove('warning');
        this.renderTasksForDisplay();
    }

    completeTimerTask() {
        if (!this.activeTimer) return;

        const task = this.getTask(this.activeTimer.taskId);
        if (task) {
            this.completeTask(task.id, this.selectedDate);
            this.showToast(`${task.name} completed! 🎉`);
        }

        this.cancelTimer();
        this.renderTasksForDisplay();
        this.renderAllTasks();
    }

    formatTime(seconds) {
        if (seconds < 0) seconds = 0;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Utility Methods
    formatDateToISO(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateDisplay(date) {
        const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    formatDateLong(date) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--text-primary);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 3000;
            animation: slideUp 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// Add CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    @keyframes slideDown {
        from {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
        to {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
    }
    
    .btn-icon {
        background: transparent;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
    }
    
    .btn-icon.delete {
        color: var(--danger-color);
    }
    
    .btn-icon:active {
        transform: scale(0.9);
        background: rgba(0, 0, 0, 0.05);
    }
`;
document.head.appendChild(style);

// Initialize the app when DOM is loaded
let taskManager;
document.addEventListener('DOMContentLoaded', () => {
    taskManager = new TaskManager();
});
