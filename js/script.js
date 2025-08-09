// This event listener ensures the script runs only after the entire HTML document has been loaded and parsed.
document.addEventListener('DOMContentLoaded', () => {
    // --- SECTION: DOM Element Selection ---
    // Caching all necessary DOM elements into constants for efficient access.
    const themeToggleBtn = document.getElementById('theme-toggle');
    const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
    const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');
    const addTaskForm = document.getElementById('add-task-form');
    const taskInput = document.getElementById('task-input');
    const dueDateInput = document.getElementById('due-date-input');
    const priorityInput = document.getElementById('priority-input');
    const errorMessage = document.getElementById('error-message');
    const taskList = document.getElementById('task-list');
    const searchInput = document.getElementById('search-input');
    const filterStatus = document.getElementById('filter-status');
    const filterPriority = document.getElementById('filter-priority');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const pendingTasksEl = document.getElementById('pending-tasks');
    const noTasksMessage = document.getElementById('no-tasks-message');
    
    // Edit Modal Elements
    const editModal = document.getElementById('edit-modal');
    const editTaskForm = document.getElementById('edit-task-form');
    const editTaskId = document.getElementById('edit-task-id');
    const editTaskInput = document.getElementById('edit-task-input');
    const editDueDateInput = document.getElementById('edit-due-date-input');
    const editPriorityInput = document.getElementById('edit-priority-input');
    const saveEditBtn = document.getElementById('save-edit-button');
    const cancelEditBtn = document.getElementById('cancel-edit-button');

    // Delete Confirmation Modal Elements
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-button');
    const cancelDeleteBtn = document.getElementById('cancel-delete-button');

    // Clear All Confirmation Modal Elements
    const clearAllConfirmModal = document.getElementById('clear-all-confirm-modal');
    const confirmClearAllBtn = document.getElementById('confirm-clear-all-button');
    const cancelClearAllBtn = document.getElementById('cancel-clear-all-button');

    // --- SECTION: Application State ---
    // Centralized state management for the application.
    let tasks = []; // Array to hold all task objects.
    let currentFilters = { // Object to hold the current filter values.
        search: '',
        status: 'all',
        priority: 'all'
    };
    let taskToDeleteId = null; // Temporarily stores the ID of the task to be deleted.
    let taskToEditId = null; // Temporarily stores the ID of the task to be edited.

    // --- SECTION: Priority and Color Mapping ---
    // A map to associate priority levels with display text and corresponding Tailwind CSS classes for color-coding.
    const priorityMap = {
        low: { text: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
        medium: { text: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
        high: { text: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
    };

    // --- SECTION: Dark Mode Logic ---
    // Function to apply the theme based on localStorage or system preference.
    const applyTheme = () => {
        if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            themeToggleDarkIcon.classList.remove('hidden');
            themeToggleLightIcon.classList.add('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            themeToggleDarkIcon.classList.add('hidden');
            themeToggleLightIcon.classList.remove('hidden');
        }
    };

    // Event listener for the theme toggle button.
    themeToggleBtn.addEventListener('click', () => {
        // Toggles the 'dark' class on the root <html> element.
        document.documentElement.classList.toggle('dark');
        // Updates the theme setting in localStorage for persistence.
        if (document.documentElement.classList.contains('dark')) {
            localStorage.theme = 'dark';
        } else {
            localStorage.theme = 'light';
        }
        applyTheme(); // Re-apply the theme to update icons.
    });

    // --- SECTION: Local Storage Functions ---
    // Functions to persist the tasks array in the browser's local storage.
    const saveTasks = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    };

    const loadTasks = () => {
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
            tasks = JSON.parse(storedTasks);
        }
    };

    // --- SECTION: Core Task Rendering Function ---
    // This function is responsible for rendering the tasks to the DOM based on the current state and filters.
    const renderTasks = () => {
        taskList.innerHTML = ''; // Clear the current list.

        // Filter the tasks array based on search, status, and priority filters.
        const filteredTasks = tasks.filter(task => {
            const searchMatch = task.text.toLowerCase().includes(currentFilters.search.toLowerCase());
            const statusMatch = currentFilters.status === 'all' || (currentFilters.status === 'completed' && task.completed) || (currentFilters.status === 'pending' && !task.completed);
            const priorityMatch = currentFilters.priority === 'all' || task.priority === currentFilters.priority;
            return searchMatch && statusMatch && priorityMatch;
        });

        // Show or hide the "No Tasks" message and disable/enable the "Clear All" button.
        if (tasks.length === 0) {
            noTasksMessage.classList.remove('hidden');
                clearAllBtn.disabled = true;
        } else {
            noTasksMessage.classList.add('hidden');
            clearAllBtn.disabled = false;
        }

        // Iterate over the filtered tasks and create an HTML element for each one.
        if (filteredTasks.length > 0) {
            filteredTasks.forEach(task => {
                const taskElement = document.createElement('div');
                taskElement.className = `bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between shadow-sm transition-all duration-300 ease-in-out`;
                taskElement.dataset.id = task.id;
                
                if (task.completed) {
                    taskElement.classList.add('opacity-60');
                }
                
                // Logic to check for overdue or soon-due tasks.
                const dueDate = new Date(task.dueDate);
                const today = new Date();
                today.setHours(0,0,0,0); // Normalize today's date for accurate comparison.
                
                let deadlineWarning = '';
                if (!task.completed && dueDate < today) {
                    deadlineWarning = `<span class="text-xs text-red-500 font-semibold ml-2">(Overdue)</span>`;
                } else if (!task.completed && (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24) < 2 && dueDate >= today) {
                    deadlineWarning = `<span class="text-xs text-yellow-500 font-semibold ml-2">(Due Soon)</span>`;
                }

                // Format date for display.
                const formattedDate = dueDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

                // Populate the task element with HTML content.
                taskElement.innerHTML = `
                    <div class="flex items-center w-full overflow-hidden">
                        <input type="checkbox" class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer complete-checkbox flex-shrink-0" ${task.completed ? 'checked' : ''}>
                        <div class="ml-4 flex-grow overflow-hidden">
                            <p class="font-medium truncate ${task.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-gray-100'}">${task.text}</p>
                            <div class="flex items-center mt-1 flex-wrap">
                                <p class="text-sm text-gray-600 dark:text-gray-400 mr-3">${formattedDate} ${deadlineWarning}</p>
                                <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${priorityMap[task.priority].color}">${priorityMap[task.priority].text}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2 flex-shrink-0 ml-2">
                        <button class="edit-btn p-2 text-gray-400 shadow-md dark:shadow-md rounded-lg hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200">
                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                        </button>
                        <button class="delete-btn p-2 text-gray-400 shadow-md dark:shadow-md rounded-lg hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200">
                            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                `;
                taskList.appendChild(taskElement);
            });
        }
        updateTaskCount(); // Update the statistic counters after every render.
    };

    // --- SECTION: Task Count Update ---
    // Calculates and updates the total, completed, and pending task counts in the UI.
    const updateTaskCount = () => {
        const completedCount = tasks.filter(task => task.completed).length;
        const pendingCount = tasks.length - completedCount;
        totalTasksEl.textContent = tasks.length;
        completedTasksEl.textContent = completedCount;
        pendingTasksEl.textContent = pendingCount;
    };

    // --- SECTION: Event Handlers & Listeners ---
    // Handles the form submission for adding a new task.
    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        const dueDate = dueDateInput.value;
        const priority = priorityInput.value;

        // Simple validation.
        if (!text || !dueDate) {
            errorMessage.textContent = !text ? 'Task name cannot be empty.' : 'Due date must be filled.';
            errorMessage.classList.remove('hidden');
            return;
        }
        errorMessage.classList.add('hidden');

        // Create a new task object.
        const newTask = {
            id: Date.now(), // Using timestamp as a simple unique ID.
            text,
            dueDate,
            priority,
            completed: false
        };

        tasks.push(newTask);
        saveTasks();
        renderTasks();
        addTaskForm.reset();
        priorityInput.value = 'medium'; // Reset priority to default after submission.
    });

    // Event delegation on the task list for handling clicks on checkboxes, edit, and delete buttons.
    taskList.addEventListener('click', (e) => {
        const target = e.target;
        const taskElement = target.closest('[data-id]'); // Find the parent task element.
        if (!taskElement) return;

        const taskId = Number(taskElement.dataset.id);

        // Handle task completion toggle.
        if (target.classList.contains('complete-checkbox')) {
            const task = tasks.find(t => t.id === taskId);
            task.completed = target.checked;
            saveTasks();
            renderTasks();
        }

        // Handle delete button click: opens confirmation modal.
        if (target.closest('.delete-btn')) {
            taskToDeleteId = taskId;
            deleteConfirmModal.classList.remove('hidden');
        }

        // Handle edit button click: opens the edit modal with task data.
        if (target.closest('.edit-btn')) {
            taskToEditId = taskId;
            const task = tasks.find(t => t.id === taskId);
            editTaskId.value = task.id;
            editTaskInput.value = task.text;
            editDueDateInput.value = task.dueDate;
            editPriorityInput.value = task.priority;
            editModal.classList.remove('hidden');
        }
    });

    // Handlers for filter and search inputs. They update the filter state and re-render the list.
    searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value;
        renderTasks();
    });

    filterStatus.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        renderTasks();
    });

    filterPriority.addEventListener('change', (e) => {
        currentFilters.priority = e.target.value;
        renderTasks();
    });

    // Handler for the "Clear All" button.
    clearAllBtn.addEventListener('click', () => {
        if (tasks.length > 0) {
            clearAllConfirmModal.classList.remove('hidden');
        }
    });
    
    // --- SECTION: Modal Logic Handlers ---
    // Handler for the "Save Changes" button in the edit modal.
    saveEditBtn.addEventListener('click', () => {
        const text = editTaskInput.value.trim();
        const dueDate = editDueDateInput.value;
        if (!text || !dueDate) return;

        const task = tasks.find(t => t.id === taskToEditId);
        task.text = text;
        task.dueDate = dueDate;
        task.priority = editPriorityInput.value;

        saveTasks();
        renderTasks();
        editModal.classList.add('hidden'); // Close the modal.
        taskToEditId = null;
    });

    // Handler to cancel editing.
    cancelEditBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
        taskToEditId = null;
    });

    // Handler to confirm deleting a task.
    confirmDeleteBtn.addEventListener('click', () => {
        const taskElement = taskList.querySelector(`[data-id='${taskToDeleteId}']`);
        if (taskElement) {
            // Apply transition classes for a smooth fade-out effect.
            taskElement.classList.add('opacity-0', 'scale-90');
            
            // Wait for the animation to finish before removing the task and re-rendering.
            taskElement.addEventListener('transitionend', () => {
                tasks = tasks.filter(t => t.id !== taskToDeleteId);
                saveTasks();
                renderTasks(); // Re-render to remove the element from the DOM.
                deleteConfirmModal.classList.add('hidden');
                taskToDeleteId = null;
            }, { once: true }); // The listener will be removed after it's called once.
        }
    });

    // Handler to cancel deletion.
    cancelDeleteBtn.addEventListener('click', () => {
        deleteConfirmModal.classList.add('hidden');
        taskToDeleteId = null;
    });

    // Handler to confirm clearing all tasks.
    confirmClearAllBtn.addEventListener('click', () => {
        tasks = [];
        saveTasks();
        renderTasks();
        clearAllConfirmModal.classList.add('hidden');
    });

    // Handler to cancel clearing all tasks.
    cancelClearAllBtn.addEventListener('click', () => {
        clearAllConfirmModal.classList.add('hidden');
    });

    // --- SECTION: Initial Application Load ---
    // The main initialization function.
    const init = () => {
        applyTheme(); // Set the correct theme on load.
        loadTasks(); // Load any saved tasks from local storage.
        renderTasks(); // Perform the initial render of tasks.
    };

    // Run the initialization function to start the application.
    init();
});
