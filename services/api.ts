import type { BoardData, User, Assignee, Task, Activity, Subtask, Attachment, Project } from '../types';
import { PROJECT_KEY } from '../constants';


// --- LOCAL STORAGE SETUP ---
const USERS_KEY = 'project_planner_users';
const PROJECTS_KEY = 'project_planner_projects';
const SESSION_USER_ID_KEY = 'project_planner_session_userId';

const _getUsers = (): User[] => JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
const _saveUsers = (users: User[]) => localStorage.setItem(USERS_KEY, JSON.stringify(users));

const _getProjects = (): Project[] => JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');
const _saveProjects = (projects: Project[]) => localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));

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

const getCurrentUserId = (): string | null => sessionStorage.getItem(SESSION_USER_ID_KEY);

// --- API FUNCTIONS ---

// Authentication
let onAuthCallback: ((user: User | null) => void) | null = null;
export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
  onAuthCallback = callback;
  const userId = getCurrentUserId();
  if (userId) {
    const user = _getUsers().find(u => u.id === userId) || null;
    callback(user);
  } else {
    callback(null);
  }
  return () => { onAuthCallback = null; }; // Unsubscribe function
};

export const login = async (email: string, password?: string): Promise<User> => {
    const users = _getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
        throw new Error('User not found.');
    }
    sessionStorage.setItem(SESSION_USER_ID_KEY, user.id);
    if (onAuthCallback) onAuthCallback(user);
    return user;
};

export const register = async (name: string, email: string, password?: string): Promise<User> => {
    const users = _getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email already in use.');
    }

    const newUserId = `user-${Date.now()}`;
    const newUser: User = {
        id: newUserId,
        name,
        email,
        avatarUrl: generateGeometricAvatar(newUserId),
        role: users.length === 0 ? 'Admin' : 'Member',
        aboutMe: '',
        profileBannerUrl: '#4b5563', // gray-600
    };
    
    users.push(newUser);
    _saveUsers(users);
    
    // Automatically log in the new user
    await login(email, password);
    
    return newUser;
};

export const logout = async (): Promise<void> => {
    sessionStorage.removeItem(SESSION_USER_ID_KEY);
    if (onAuthCallback) onAuthCallback(null);
};

export const getCurrentUserData = async (user: User): Promise<User | null> => {
    return _getUsers().find(u => u.id === user.id) || null;
};

export const getAllUsers = async (): Promise<User[]> => {
    return Promise.resolve(_getUsers());
};

export const updateUserProfile = async (userId: string, updates: Partial<Pick<User, 'name' | 'avatarUrl' | 'aboutMe' | 'profileBannerUrl'>>): Promise<User> => {
    const users = _getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) throw new Error("User not found to update.");
    
    users[userIndex] = { ...users[userIndex], ...updates };
    _saveUsers(users);
    return users[userIndex];
};

// Project and Membership
export const getUserProjects = async (userId: string): Promise<Project[]> => {
    const user = _getUsers().find(u => u.id === userId);
    if (!user) return [];

    const allProjects = _getProjects();
    if (user.role.toLowerCase() === 'admin') {
        return allProjects;
    }
    
    return allProjects.filter(p => p.members[userId]);
};

export const joinProject = async (userId: string, inviteCode: string): Promise<boolean> => {
    const projects = _getProjects();
    const projectIndex = projects.findIndex(p => p.inviteCode === inviteCode);
    
    if (projectIndex === -1) {
        throw new Error('Invalid invite code.');
    }
    
    projects[projectIndex].members[userId] = { role: 'Member' };
    _saveProjects(projects);
    return true;
};

export const createProject = async (projectName: string, adminUserId: string): Promise<Project> => {
    const projects = _getProjects();
    const newProjectId = `${PROJECT_KEY.toLowerCase()}-${Date.now()}`;
    
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
    projects.push(newProject);
    _saveProjects(projects);
    return newProject;
};

export const updateUserRoleInProject = async (projectId: string, userId: string, newRole: string): Promise<void> => {
    const projects = _getProjects();
    const project = projects.find(p => p.id === projectId);
    if (project && project.members[userId]) {
        project.members[userId].role = newRole;
        _saveProjects(projects);
    }
};

// Data retrieval for a specific project
export const getBoardData = async (projectId: string): Promise<BoardData> => {
    const project = _getProjects().find(p => p.id === projectId);
    if (!project) throw new Error("Project not found");
    return project.boardData;
};

export const getProjectAssignees = async (projectId: string): Promise<Assignee[]> => {
    const project = _getProjects().find(p => p.id === projectId);
    if (!project) return [];

    const memberIds = Object.keys(project.members);
    if (memberIds.length === 0) return [];
    
    const allUsers = _getUsers();
    const projectUsers = allUsers.filter(u => memberIds.includes(u.id));

    return projectUsers.map(u => ({ ...u, role: project.members[u.id].role, description: 'Team Member' }));
};


// Project-specific Task operations
const _updateProjectBoard = (projectId: string, newBoardData: BoardData) => {
    const projects = _getProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    if (projectIndex !== -1) {
        projects[projectIndex].boardData = newBoardData;
        _saveProjects(projects);
    }
};

export const moveTask = async (projectId: string, taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number): Promise<BoardData> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");

    const board = await getBoardData(projectId);

    const sourceColumn = board.columns[sourceColumnId];
    const destColumn = board.columns[destColumnId];
    
    sourceColumn.taskIds = sourceColumn.taskIds.filter(id => id !== taskId);
    destColumn.taskIds.splice(destIndex, 0, taskId);

    const task = board.tasks[taskId];
    if (task && sourceColumnId !== destColumnId) {
        const newActivity: Activity = {
            id: `act-${Date.now()}`, type: 'STATUS_CHANGE', timestamp: new Date().toISOString(), userId, details: { from: sourceColumn.title, to: destColumn.title }
        };
        task.activity.push(newActivity);
    }
    
    _updateProjectBoard(projectId, board);
    return board;
};

export const updateTask = async (projectId: string, updatedTask: Task): Promise<BoardData> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");

    const board = await getBoardData(projectId);
    const oldTask = board.tasks[updatedTask.id];
    
    const users = await getProjectAssignees(projectId);
    const getAssigneeName = (id: string) => users.find(a => a.id === id)?.name || 'Unassigned';
    
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
    
    _updateProjectBoard(projectId, board);
    return board;
};

const generateNewTaskDisplayId = (tasks: Record<string, Task>, projectName: string): string => {
    const prefix = projectName.slice(0, 5).toUpperCase();
    const existingIds = Object.values(tasks)
        .filter(t => t.displayId.startsWith(prefix))
        .map(t => parseInt(t.displayId.split('-')[1] || '0', 10));
    const maxId = Math.max(0, ...existingIds);
    return `${prefix}-${maxId + 1}`;
};

export const addTask = async (projectId: string, taskData: Omit<Task, 'id' | 'reporterId' | 'activity' | 'displayId'>, columnId: string): Promise<{board: BoardData, newDisplayId: string}> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    
    const project = _getProjects().find(p => p.id === projectId);
    if (!project) throw new Error("Project not found");

    const board = project.boardData;
    
    const newDisplayId = generateNewTaskDisplayId(board.tasks, project.name);
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
    
    _updateProjectBoard(projectId, board);
    return { board, newDisplayId };
};

export const deleteTask = async (projectId: string, taskId: string): Promise<BoardData> => {
    const board = await getBoardData(projectId);
    
    delete board.tasks[taskId];
    for (const columnId in board.columns) {
        board.columns[columnId].taskIds = board.columns[columnId].taskIds.filter(id => id !== taskId);
    }
    
    _updateProjectBoard(projectId, board);
    return board;
};

const updateTaskProperty = async (projectId: string, taskId: string, update: Partial<Task>): Promise<BoardData> => {
    const board = await getBoardData(projectId);
    if (!board.tasks[taskId]) throw new Error("Task not found to update property");
    
    board.tasks[taskId] = { ...board.tasks[taskId], ...update };
    
    _updateProjectBoard(projectId, board);
    return board;
}

export const addComment = async (projectId: string, taskId: string, commentText: string): Promise<BoardData> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    
    const board = await getBoardData(projectId);
    const task = board.tasks[taskId];
    if (!task) throw new Error("Task not found to add comment");
    
    const newComment: Activity = {
        id: `act-${Date.now()}`, type: 'COMMENT', timestamp: new Date().toISOString(), userId, details: { text: commentText }
    };
    
    task.activity.push(newComment);
    
    _updateProjectBoard(projectId, board);
    return board;
};

// Subtasks and Attachments
export const addSubtask = async (projectId: string, taskId: string, title: string): Promise<BoardData> => {
    const board = await getBoardData(projectId);
    const task = board.tasks[taskId];
    if (!task) throw new Error("Task not found");
    
    const newSubtask: Subtask = { id: `sub-${Date.now()}`, title, completed: false };
    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    
    return updateTaskProperty(projectId, taskId, { subtasks: updatedSubtasks });
};

export const updateSubtask = async (projectId: string, taskId: string, subtaskId: string, updates: Partial<Subtask>): Promise<BoardData> => {
    const board = await getBoardData(projectId);
    const task = board.tasks[taskId];
    if (!task) throw new Error("Task not found");

    const updatedSubtasks = (task.subtasks || []).map(st => st.id === subtaskId ? { ...st, ...updates } : st);
    return updateTaskProperty(projectId, taskId, { subtasks: updatedSubtasks });
};

export const deleteSubtask = async (projectId: string, taskId: string, subtaskId: string): Promise<BoardData> => {
    const board = await getBoardData(projectId);
    const task = board.tasks[taskId];
    if (!task) throw new Error("Task not found");

    const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
    return updateTaskProperty(projectId, taskId, { subtasks: updatedSubtasks });
};

export const addAttachment = async (projectId: string, taskId: string, attachment: Attachment): Promise<BoardData> => {
    const board = await getBoardData(projectId);
    const task = board.tasks[taskId];
    if (!task) throw new Error("Task not found");
    
    const updatedAttachments = [...(task.attachments || []), attachment];
    return updateTaskProperty(projectId, taskId, { attachments: updatedAttachments });
};

export const deleteAttachment = async (projectId: string, taskId: string, attachmentId: string): Promise<BoardData> => {
    const board = await getBoardData(projectId);
    const task = board.tasks[taskId];
    if (!task) throw new Error("Task not found");

    const updatedAttachments = (task.attachments || []).filter(att => att.id !== attachmentId);
    return updateTaskProperty(projectId, taskId, { attachments: updatedAttachments });
};
