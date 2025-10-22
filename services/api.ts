import type { BoardData, User, Assignee, Task, Activity, Subtask, Attachment, Project } from '../types';
import { Priority } from '../types';

// --- LOCAL STORAGE KEYS ---
const USERS_KEY = 'jiraCloneUsers';
const PROJECTS_KEY = 'jiraCloneProjects';
const SESSION_KEY = 'jiraCloneSession';

// --- MOCK LATENCY ---
const LATENCY = 300;
const simulateLatency = () => new Promise(resolve => setTimeout(resolve, LATENCY));

// --- HELPERS ---

// Helper function to generate a deterministic, geometric SVG avatar
const generateGeometricAvatar = (seed: string): string => {
    const hash = seed.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    
    const colors = ['#6366f1', '#ec4899', '#22c55e', '#f97316', '#8b5cf6', '#06b6d4'];
    const shapes = ['rect', 'circle', 'polygon'];

    const colorIndex = Math.abs(hash % colors.length);
    const shapeIndex = Math.abs(Math.floor(hash / colors.length) % shapes.length);
    
    const backgroundColor = colors[colorIndex];
    const shapeColor = '#ffffff'; // White shape on colored background

    let shapeSvg = '';
    const shape = shapes[shapeIndex];

    switch (shape) {
        case 'rect':
            shapeSvg = `<rect x="20" y="20" width="60" height="60" fill="${shapeColor}" />`;
            break;
        case 'circle':
            shapeSvg = `<circle cx="50" cy="50" r="30" fill="${shapeColor}" />`;
            break;
        case 'polygon':
            shapeSvg = `<polygon points="50,20 80,80 20,80" fill="${shapeColor}" />`;
            break;
    }

    const svg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="${backgroundColor}" />${shapeSvg}</svg>`;

    return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// --- INITIAL DATA (Used if localStorage is empty) ---

const createInitialData = () => {
    const users: User[] = [
      { id: 'user-1', name: 'Alex Ray (Admin)', email: 'alex@example.com', avatarUrl: generateGeometricAvatar('user-1'), role: 'Admin' },
      { id: 'user-2', name: 'Ben Carter', email: 'ben@example.com', avatarUrl: generateGeometricAvatar('user-2'), role: 'Member' },
      { id: 'user-3', name: 'Casey Lee', email: 'casey@example.com', avatarUrl: generateGeometricAvatar('user-3'), role: 'backend-er' },
      { id: 'user-4', name: 'Dana Riley', email: 'dana@example.com', avatarUrl: generateGeometricAvatar('user-4'), role: 'Observer' },
      { id: 'user-5', name: 'Guest User', email: 'guest@example.com', avatarUrl: generateGeometricAvatar('user-5'), role: 'Member' },
    ];
    const userMap = users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
    }, {} as Record<string, User>);

    const initialProjectId = 'proj-1';
    const initialProject: Project = {
        id: initialProjectId,
        name: 'Alpha Project',
        inviteCode: 'JOIN-PROJ-123',
        members: {
            // Admin (user-1) and Guest (user-5) are NOT members of the default project
            'user-2': { role: 'Member' },
            'user-3': { role: 'backend-er' },
            'user-4': { role: 'Observer' },
        },
        boardData: {
            tasks: {
                'task-1': { id: 'task-1', displayId: `ALPHA-1`, title: 'Setup project repository', description: 'Initialize git repo and setup basic folder structure.', priority: Priority.HIGH, assigneeId: 'user-2', reporterId: 'user-2', activity: [{id: 'act-1', type: 'CREATED', timestamp: new Date().toISOString(), userId: 'user-2', details: {}}], dueDate: '2024-08-15', subtasks: [
                    { id: 'sub-1', title: 'Initialize Git', completed: true }, { id: 'sub-2', title: 'Create main branches', completed: true }, { id: 'sub-3', title: 'Add CI config file', completed: false },
                ]},
                'task-2': { id: 'task-2', displayId: `ALPHA-2`, title: 'Design login page UI', description: 'Create Figma mockups for the user login and registration pages.', priority: Priority.MEDIUM, assigneeId: 'user-4', reporterId: 'user-1', activity: [{id: 'act-2', type: 'CREATED', timestamp: new Date().toISOString(), userId: 'user-1', details: {}}], },
                'task-3': { id: 'task-3', displayId: `ALPHA-3`, title: 'Configure database schema', description: 'Setup PostgreSQL and define initial tables for users and tasks.', priority: Priority.HIGH, assigneeId: 'user-3', reporterId: 'user-1', activity: [{id: 'act-3', type: 'CREATED', timestamp: new Date().toISOString(), userId: 'user-1', details: {}}], dueDate: '2024-08-20' },
                'task-4': { id: 'task-4', displayId: `ALPHA-4`, title: 'Implement JWT authentication', description: 'Develop the backend logic for user authentication using JWT.', priority: Priority.HIGH, assigneeId: 'user-3', reporterId: 'user-2', activity: [{id: 'act-4', type: 'CREATED', timestamp: new Date().toISOString(), userId: 'user-2', details: {}}], dueDate: '2024-07-01' },
                'task-5': { id: 'task-5', displayId: `ALPHA-5`, title: 'Refactor authentication module', description: 'Improve the existing auth module with better error handling.', priority: Priority.MEDIUM, assigneeId: 'user-2', reporterId: 'user-3', activity: [{id: 'act-5', type: 'CREATED', timestamp: new Date().toISOString(), userId: 'user-3', details: {}}], dueDate: '2024-07-15' },
                'task-6': { id: 'task-6', displayId: `ALPHA-6`, title: 'Write unit tests for API endpoints', description: 'Use Jest and Supertest to create a suite of unit tests for all user-related API endpoints.', priority: Priority.MEDIUM, assigneeId: 'user-2', reporterId: 'user-1', activity: [{id: 'act-6', type: 'CREATED', timestamp: new Date().toISOString(), userId: 'user-1', details: {}}], },
                'task-7': { id: 'task-7', displayId: `ALPHA-7`, title: 'Documentation for the API', description: 'Create OpenAPI/Swagger documentation for all public endpoints.', priority: Priority.LOW, assigneeId: 'user-4', reporterId: 'user-1', activity: [{id: 'act-7', type: 'CREATED', timestamp: new Date().toISOString(), userId: 'user-1', details: {}}], },
                'task-8': { id: 'task-8', displayId: `ALPHA-8`, title: 'Deploy staging environment', description: 'Setup a staging environment on Vercel/Netlify for CI/CD.', priority: Priority.LOW, assigneeId: 'user-2', reporterId: 'user-3', activity: [{id: 'act-8', type: 'CREATED', timestamp: new Date().toISOString(), userId: 'user-3', details: {}}], dueDate: '2024-07-10' },
            },
            columns: {
                'column-1': { id: 'column-1', title: 'Backlog', taskIds: ['task-2', 'task-7'], },
                'column-2': { id: 'column-2', title: 'To Do', taskIds: ['task-1', 'task-3', 'task-6'], },
                'column-3': { id: 'column-3', title: 'In Progress', taskIds: ['task-4'], },
                'column-4': { id: 'column-4', title: 'Code Review', taskIds: ['task-5'], },
                'column-5': { id: 'column-5', title: 'Done', taskIds: ['task-8'], },
            },
            columnOrder: ['column-1', 'column-2', 'column-3', 'column-4', 'column-5'],
        }
    };
    
    const projectMap = { [initialProjectId]: initialProject };

    setStoredData(USERS_KEY, userMap);
    setStoredData(PROJECTS_KEY, projectMap);
};

// --- DATA ACCESS FUNCTIONS ---
const getStoredData = <T>(key: string, defaultValue: T): T => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (e) {
        console.error(`Error reading from localStorage key "${key}":`, e);
        return defaultValue;
    }
};

const setStoredData = <T>(key: string, value: T): void => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error writing to localStorage key "${key}":`, e);
    }
};

// Initialize data if it doesn't exist
if (!localStorage.getItem(USERS_KEY) || !localStorage.getItem(PROJECTS_KEY)) {
    createInitialData();
}

// --- API FUNCTIONS ---

// Authentication
export const login = async (email: string): Promise<User> => {
    await simulateLatency();
    const users = getStoredData<Record<string, User>>(USERS_KEY, {});
    const user = Object.values(users).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) {
        setStoredData(SESSION_KEY, user.id);
        return user;
    }
    throw new Error('User not found.');
};

export const register = async (name: string, email: string): Promise<User> => {
    await simulateLatency();
    let users = getStoredData<Record<string, User>>(USERS_KEY, {});
    if (Object.values(users).some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email already in use.');
    }
    const id = `user-${Date.now()}`;
    const newUser: User = {
        id,
        name,
        email,
        avatarUrl: generateGeometricAvatar(id),
        role: 'Member', // Default global role, project-specific roles are managed separately
    };
    users[id] = newUser;
    setStoredData(USERS_KEY, users);
    setStoredData(SESSION_KEY, id);
    return newUser;
};

export const logout = async (): Promise<void> => {
    await simulateLatency();
    localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = async (): Promise<User | null> => {
    await simulateLatency();
    const userId = getStoredData<string | null>(SESSION_KEY, null);
    if (!userId) return null;
    const users = getStoredData<Record<string, User>>(USERS_KEY, {});
    const allProjects = getStoredData<Record<string, Project>>(PROJECTS_KEY, {});
    
    // A user's role is defined globally in their user object.
    const user = users[userId];
    return user || null;
};

export const getAllUsers = async (): Promise<User[]> => {
    await simulateLatency();
    const users = getStoredData<Record<string, User>>(USERS_KEY, {});
    return Object.values(users);
};

export const updateUserProfile = async (userId: string, updates: Partial<Pick<User, 'name' | 'avatarUrl'>>): Promise<User> => {
    await simulateLatency();
    const users = getStoredData<Record<string, User>>(USERS_KEY, {});
    const user = users[userId];
    if (!user) throw new Error("User not found");

    const updatedUser = { ...user, ...updates };
    users[userId] = updatedUser;
    setStoredData(USERS_KEY, users);
    return updatedUser;
};

// Project and Membership
export const getUserProjects = async (userId: string): Promise<Project[]> => {
    await simulateLatency();
    const projects = getStoredData<Record<string, Project>>(PROJECTS_KEY, {});
    return Object.values(projects).filter(p => p.members[userId]);
};

export const joinProject = async (userId: string, inviteCode: string): Promise<boolean> => {
    await simulateLatency();
    const projects = getStoredData<Record<string, Project>>(PROJECTS_KEY, {});
    const project = Object.values(projects).find(p => p.inviteCode === inviteCode);

    if (!project) {
        throw new Error('Invalid invite code.');
    }
    if (!project.members[userId]) {
        project.members[userId] = { role: 'Member' }; // Default role on join
        setStoredData(PROJECTS_KEY, projects);
    }
    return true;
};

export const createProject = async (projectName: string, adminUserId: string): Promise<Project> => {
    await simulateLatency();
    const projects = getStoredData<Record<string, Project>>(PROJECTS_KEY, {});
    const newProjectId = `proj-${Date.now()}`;
    const newProject: Project = {
        id: newProjectId,
        name: projectName,
        inviteCode: `JOIN-${projectName.slice(0, 4).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        members: {
            [adminUserId]: { role: 'Admin' }
        },
        boardData: {
            tasks: {},
            columns: {
                'col-1': { id: 'col-1', title: 'To Do', taskIds: [] },
                'col-2': { id: 'col-2', title: 'In Progress', taskIds: [] },
                'col-3': { id: 'col-3', title: 'Done', taskIds: [] },
            },
            columnOrder: ['col-1', 'col-2', 'col-3']
        }
    };
    projects[newProjectId] = newProject;
    setStoredData(PROJECTS_KEY, projects);
    return newProject;
};

export const updateUserRoleInProject = async (projectId: string, userId: string, newRole: string): Promise<void> => {
    await simulateLatency();
    const projects = getStoredData<Record<string, Project>>(PROJECTS_KEY, {});
    const project = projects[projectId];
    if (!project || !project.members[userId]) {
        throw new Error("User or project not found.");
    }
    project.members[userId].role = newRole;
    setStoredData(PROJECTS_KEY, projects);
};


// Data retrieval for a specific project
export const getBoardData = async (projectId: string): Promise<BoardData> => {
    await simulateLatency();
    const projects = getStoredData<Record<string, Project>>(PROJECTS_KEY, {});
    const project = projects[projectId];
    if (!project) throw new Error("Project not found");
    return project.boardData;
};

export const getProjectAssignees = async (projectId: string): Promise<Assignee[]> => {
    await simulateLatency();
    const projects = getStoredData<Record<string, Project>>(PROJECTS_KEY, {});
    const users = getStoredData<Record<string, User>>(USERS_KEY, {});
    const project = projects[projectId];
    if (!project) return [];
    
    const memberIds = Object.keys(project.members);
    return memberIds.map(id => users[id]).filter(Boolean).map(u => ({ ...u, role: project.members[u.id].role, description: 'Team Member' }));
};

const getCurrentUserId = (): string | null => getStoredData<string | null>(SESSION_KEY, null);

// Project-specific Task operations
const updateProjectBoard = (projectId: string, updateFn: (board: BoardData) => BoardData) => {
    const projects = getStoredData<Record<string, Project>>(PROJECTS_KEY, {});
    const project = projects[projectId];
    if (project) {
        project.boardData = updateFn(project.boardData);
        setStoredData(PROJECTS_KEY, projects);
    }
    return project.boardData;
}

export const moveTask = async (projectId: string, taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number): Promise<BoardData> => {
    await simulateLatency();
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");

    return updateProjectBoard(projectId, board => {
        const sourceColumn = board.columns[sourceColumnId];
        const destColumn = board.columns[destColumnId];
        
        const sourceTaskIndex = sourceColumn.taskIds.indexOf(taskId);
        sourceColumn.taskIds.splice(sourceTaskIndex, 1);
        destColumn.taskIds.splice(destIndex, 0, taskId);

        const task = board.tasks[taskId];
        if (task && sourceColumnId !== destColumnId) {
            const newActivity: Activity = {
                id: `act-${Date.now()}`, type: 'STATUS_CHANGE', timestamp: new Date().toISOString(), userId, details: { from: sourceColumn.title, to: destColumn.title }
            };
            task.activity.push(newActivity);
        }
        return board;
    });
};

export const updateTask = async (projectId: string, updatedTask: Task): Promise<BoardData> => {
    await simulateLatency();
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    
    const users = await getProjectAssignees(projectId);
    const getAssigneeName = (id: string) => users.find(a => a.id === id)?.name || 'Unassigned';

    return updateProjectBoard(projectId, board => {
        const oldTask = board.tasks[updatedTask.id];
        const newActivity: Activity[] = [];
        
        if (oldTask.assigneeId !== updatedTask.assigneeId) {
            newActivity.push({ id: `act-${Date.now()}-assignee`, type: 'ASSIGNEE_CHANGE', timestamp: new Date().toISOString(), userId, details: { from: getAssigneeName(oldTask.assigneeId), to: getAssigneeName(updatedTask.assigneeId) }});
        }
        if (oldTask.priority !== updatedTask.priority) {
            newActivity.push({ id: `act-${Date.now()}-priority`, type: 'PRIORITY_CHANGE', timestamp: new Date().toISOString(), userId, details: { from: oldTask.priority, to: updatedTask.priority }});
        }
        if (oldTask.dueDate !== updatedTask.dueDate) {
             newActivity.push({ id: `act-${Date.now()}-dueDate`, type: 'DUE_DATE_CHANGE', timestamp: new Date().toISOString(), userId, details: { from: oldTask.dueDate || 'No date', to: updatedTask.dueDate || 'No date' }});
        }

        const finalTask = { ...updatedTask, activity: [...updatedTask.activity, ...newActivity] };
        board.tasks[updatedTask.id] = finalTask;
        return board;
    });
};

const generateNewTaskDisplayId = (tasks: Record<string, Task>, projectName: string): string => {
    const prefix = projectName.slice(0, 5).toUpperCase();
    const existingIds = Object.values(tasks)
        .filter(t => t.displayId.startsWith(prefix))
        .map(t => parseInt(t.displayId.split('-')[1], 10));
    const maxId = Math.max(0, ...existingIds);
    return `${prefix}-${maxId + 1}`;
};

export const addTask = async (projectId: string, taskData: Omit<Task, 'id' | 'reporterId' | 'activity' | 'displayId'>, columnId: string): Promise<{board: BoardData, newDisplayId: string}> => {
    await simulateLatency();
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    
    const projects = getStoredData<Record<string, Project>>(PROJECTS_KEY, {});
    const project = projects[projectId];
    if (!project) throw new Error("Project not found");

    const newDisplayId = generateNewTaskDisplayId(project.boardData.tasks, project.name);
    let newBoard!: BoardData;

    updateProjectBoard(projectId, board => {
        const newId = `task-${Date.now()}`;
        const newTask: Task = {
            ...taskData,
            id: newId,
            displayId: newDisplayId,
            reporterId: userId,
            activity: [{ id: `act-${Date.now()}`, type: 'CREATED', timestamp: new Date().toISOString(), userId: userId, details: {} }]
        };
        board.tasks[newId] = newTask;
        board.columns[columnId].taskIds.unshift(newId);
        newBoard = board;
        return board;
    });
    
    return { board: newBoard, newDisplayId };
};

export const deleteTask = async (projectId: string, taskId: string): Promise<BoardData> => {
    return updateProjectBoard(projectId, board => {
        delete board.tasks[taskId];
        for (const columnId in board.columns) {
            board.columns[columnId].taskIds = board.columns[columnId].taskIds.filter(id => id !== taskId);
        }
        return board;
    });
};

const updateTaskInBoard = (board: BoardData, taskId: string, updateFn: (task: Task) => Task): BoardData => {
    const task = board.tasks[taskId];
    if (task) {
        board.tasks[taskId] = updateFn(task);
    }
    return board;
};

export const addComment = async (projectId: string, taskId: string, commentText: string): Promise<BoardData> => {
    await simulateLatency();
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    
    return updateProjectBoard(projectId, board => {
        const newComment: Activity = {
            id: `act-${Date.now()}`, type: 'COMMENT', timestamp: new Date().toISOString(), userId, details: { text: commentText }
        };
        return updateTaskInBoard(board, taskId, task => ({ ...task, activity: [...task.activity, newComment] }));
    });
};

// Subtasks and Attachments (all need projectId)
export const addSubtask = async (projectId: string, taskId: string, title: string): Promise<BoardData> => {
    return updateProjectBoard(projectId, board => {
        const newSubtask: Subtask = { id: `sub-${Date.now()}`, title, completed: false };
        return updateTaskInBoard(board, taskId, task => ({ ...task, subtasks: [...(task.subtasks || []), newSubtask] }));
    });
};

export const updateSubtask = async (projectId: string, taskId: string, subtaskId: string, updates: Partial<Subtask>): Promise<BoardData> => {
    return updateProjectBoard(projectId, board => 
        updateTaskInBoard(board, taskId, task => ({
            ...task,
            subtasks: (task.subtasks || []).map(st => st.id === subtaskId ? { ...st, ...updates } : st)
        }))
    );
};

export const deleteSubtask = async (projectId: string, taskId: string, subtaskId: string): Promise<BoardData> => {
    return updateProjectBoard(projectId, board => 
        updateTaskInBoard(board, taskId, task => ({
            ...task,
            subtasks: (task.subtasks || []).filter(st => st.id !== subtaskId)
        }))
    );
};

export const addAttachment = async (projectId: string, taskId: string, attachment: Attachment): Promise<BoardData> => {
    return updateProjectBoard(projectId, board => 
        updateTaskInBoard(board, taskId, task => ({ ...task, attachments: [...(task.attachments || []), attachment] }))
    );
};

export const deleteAttachment = async (projectId: string, taskId: string, attachmentId: string): Promise<BoardData> => {
    return updateProjectBoard(projectId, board => 
        updateTaskInBoard(board, taskId, task => ({
            ...task,
            attachments: (task.attachments || []).filter(att => att.id !== attachmentId)
        }))
    );
};