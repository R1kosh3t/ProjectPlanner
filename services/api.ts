import type { BoardData, User, Assignee, Task, Activity, Subtask, Attachment, Project } from '../types';
import { auth, db } from './firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    type User as FirebaseUser
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    getDocs,
    collection,
    updateDoc,
    writeBatch,
    query,
    where,
    arrayUnion
} from 'firebase/firestore';

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

// --- API FUNCTIONS ---

// Authentication
export const onAuthStateChangedListener = (callback: (user: FirebaseUser | null) => void) => onAuthStateChanged(auth, callback);

export const login = async (email: string, password?: string): Promise<FirebaseUser> => {
    if (!password) throw new Error("Password is required for login.");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
};

export const register = async (name: string, email: string, password?: string): Promise<User> => {
    if (!password) throw new Error("Password is required for registration.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user: firebaseUser } = userCredential;

    const usersCollectionRef = collection(db, 'users');
    const userDocRef = doc(usersCollectionRef, firebaseUser.uid);
    
    const userCountSnapshot = await getDocs(usersCollectionRef);

    const newUser: User = {
        id: firebaseUser.uid,
        name,
        email,
        avatarUrl: generateGeometricAvatar(firebaseUser.uid),
        role: userCountSnapshot.size === 0 ? 'Admin' : 'Member',
        aboutMe: '',
        profileBannerUrl: '#4b5563', // gray-600
    };
    await setDoc(userDocRef, newUser);
    return newUser;
};

export const logout = async (): Promise<void> => {
    await signOut(auth);
};

export const getCurrentUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        return userDoc.data() as User;
    }
    return null;
};

export const getAllUsers = async (): Promise<User[]> => {
    const usersCollectionRef = collection(db, 'users');
    const snapshot = await getDocs(usersCollectionRef);
    return snapshot.docs.map(doc => doc.data() as User);
};

export const updateUserProfile = async (userId: string, updates: Partial<Pick<User, 'name' | 'avatarUrl' | 'aboutMe' | 'profileBannerUrl'>>): Promise<User> => {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, updates);
    const updatedDoc = await getDoc(userDocRef);
    return updatedDoc.data() as User;
};

// Project and Membership
export const getUserProjects = async (userId: string): Promise<Project[]> => {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    const user = userDoc.data() as User;
    if (!user) return [];

    const projectsRef = collection(db, 'projects');
    let projectsQuery;

    if (user.role.toLowerCase() === 'admin') {
        // Admins can see all projects
        projectsQuery = query(projectsRef);
    } else {
        // Other users see projects where they are a member
        projectsQuery = query(projectsRef, where(`members.${userId}`, '!=', null));
    }
    const snapshot = await getDocs(projectsQuery);
    return snapshot.docs.map(doc => doc.data() as Project);
};

export const joinProject = async (userId: string, inviteCode: string): Promise<boolean> => {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where('inviteCode', '==', inviteCode));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        throw new Error('Invalid invite code.');
    }
    
    const projectDoc = snapshot.docs[0];
    const projectDocRef = doc(db, 'projects', projectDoc.id);
    
    await updateDoc(projectDocRef, {
        [`members.${userId}`]: { role: 'Member' }
    });
    return true;
};

export const createProject = async (projectName: string, adminUserId: string): Promise<Project> => {
    const newProjectId = `proj-${Date.now()}`;
    const projectDocRef = doc(db, 'projects', newProjectId);
    
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
    await setDoc(projectDocRef, newProject);
    return newProject;
};

export const updateUserRoleInProject = async (projectId: string, userId: string, newRole: string): Promise<void> => {
    const projectDocRef = doc(db, 'projects', projectId);
    await updateDoc(projectDocRef, {
        [`members.${userId}.role`]: newRole
    });
};

// Data retrieval for a specific project
export const getBoardData = async (projectId: string): Promise<BoardData> => {
    const projectDocRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectDocRef);
    if (!projectDoc.exists()) throw new Error("Project not found");
    return (projectDoc.data() as Project).boardData;
};

export const getProjectAssignees = async (projectId: string): Promise<Assignee[]> => {
    const projectDocRef = doc(db, 'projects', projectId);
    const projectDoc = await getDoc(projectDocRef);
    if (!projectDoc.exists()) return [];

    const project = projectDoc.data() as Project;
    const memberIds = Object.keys(project.members);
    if (memberIds.length === 0) return [];
    
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('id', 'in', memberIds));
    const usersSnapshot = await getDocs(q);
    const users = usersSnapshot.docs.map(doc => doc.data() as User);

    return users.map(u => ({ ...u, role: project.members[u.id].role, description: 'Team Member' }));
};

const getCurrentUserId = (): string | null => auth.currentUser?.uid || null;

// Project-specific Task operations
const getProjectDocRef = (projectId: string) => doc(db, 'projects', projectId);

export const moveTask = async (projectId: string, taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number): Promise<BoardData> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    
    const projectDocRef = getProjectDocRef(projectId);
    const projectDoc = await getDoc(projectDocRef);
    if (!projectDoc.exists()) throw new Error("Project not found");

    const project = projectDoc.data() as Project;
    const board = project.boardData;

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
    
    await updateDoc(projectDocRef, { 'boardData': board });
    return board;
};

export const updateTask = async (projectId: string, updatedTask: Task): Promise<BoardData> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    
    const projectDocRef = getProjectDocRef(projectId);
    const projectDoc = await getDoc(projectDocRef);
    if (!projectDoc.exists()) throw new Error("Project not found");

    const project = projectDoc.data() as Project;
    const board = project.boardData;
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
    
    await updateDoc(projectDocRef, { 'boardData': board });
    return board;
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
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    
    const projectDocRef = getProjectDocRef(projectId);
    const projectDoc = await getDoc(projectDocRef);
    if (!projectDoc.exists()) throw new Error("Project not found");

    const project = projectDoc.data() as Project;
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
    
    await updateDoc(projectDocRef, { 'boardData': board });
    return { board, newDisplayId };
};

export const deleteTask = async (projectId: string, taskId: string): Promise<BoardData> => {
    const projectDocRef = getProjectDocRef(projectId);
    const projectDoc = await getDoc(projectDocRef);
    if (!projectDoc.exists()) throw new Error("Project not found");

    const project = projectDoc.data() as Project;
    const board = project.boardData;
    
    delete board.tasks[taskId];
    for (const columnId in board.columns) {
        board.columns[columnId].taskIds = board.columns[columnId].taskIds.filter(id => id !== taskId);
    }
    
    await updateDoc(projectDocRef, { 'boardData': board });
    return board;
};

const updateTaskProperty = async (projectId: string, taskId: string, update: Partial<Task>): Promise<BoardData> => {
    const projectDocRef = getProjectDocRef(projectId);
    // In Firestore, you can update nested objects using dot notation
    const updates = Object.keys(update).reduce((acc, key) => {
        acc[`boardData.tasks.${taskId}.${key}`] = update[key as keyof Task];
        return acc;
    }, {} as Record<string, any>);
    
    await updateDoc(projectDocRef, updates);
    
    const updatedDoc = await getDoc(projectDocRef);
    return (updatedDoc.data() as Project).boardData;
}


export const addComment = async (projectId: string, taskId: string, commentText: string): Promise<BoardData> => {
    const userId = getCurrentUserId();
    if (!userId) throw new Error("Not authenticated");
    
    const newComment: Activity = {
        id: `act-${Date.now()}`, type: 'COMMENT', timestamp: new Date().toISOString(), userId, details: { text: commentText }
    };
    
    const projectDocRef = getProjectDocRef(projectId);
    await updateDoc(projectDocRef, {
        [`boardData.tasks.${taskId}.activity`]: arrayUnion(newComment)
    });
    
    const updatedDoc = await getDoc(projectDocRef);
    return (updatedDoc.data() as Project).boardData;
};

// Subtasks and Attachments
const getTaskFromBoard = async (projectId: string, taskId: string): Promise<Task> => {
    const projectDocRef = getProjectDocRef(projectId);
    const projectDoc = await getDoc(projectDocRef);
    if (!projectDoc.exists()) throw new Error("Project not found");
    const board = (projectDoc.data() as Project).boardData;
    const task = board.tasks[taskId];
    if (!task) throw new Error("Task not found");
    return task;
};


export const addSubtask = async (projectId: string, taskId: string, title: string): Promise<BoardData> => {
    const task = await getTaskFromBoard(projectId, taskId);
    const newSubtask: Subtask = { id: `sub-${Date.now()}`, title, completed: false };
    const updatedSubtasks = [...(task.subtasks || []), newSubtask];
    return updateTaskProperty(projectId, taskId, { subtasks: updatedSubtasks });
};

export const updateSubtask = async (projectId: string, taskId: string, subtaskId: string, updates: Partial<Subtask>): Promise<BoardData> => {
    const task = await getTaskFromBoard(projectId, taskId);
    const updatedSubtasks = (task.subtasks || []).map(st => st.id === subtaskId ? { ...st, ...updates } : st);
    return updateTaskProperty(projectId, taskId, { subtasks: updatedSubtasks });
};

export const deleteSubtask = async (projectId: string, taskId: string, subtaskId: string): Promise<BoardData> => {
    const task = await getTaskFromBoard(projectId, taskId);
    const updatedSubtasks = (task.subtasks || []).filter(st => st.id !== subtaskId);
    return updateTaskProperty(projectId, taskId, { subtasks: updatedSubtasks });
};

export const addAttachment = async (projectId: string, taskId: string, attachment: Attachment): Promise<BoardData> => {
    const task = await getTaskFromBoard(projectId, taskId);
    const updatedAttachments = [...(task.attachments || []), attachment];
    return updateTaskProperty(projectId, taskId, { attachments: updatedAttachments });
};

export const deleteAttachment = async (projectId: string, taskId: string, attachmentId: string): Promise<BoardData> => {
    const task = await getTaskFromBoard(projectId, taskId);
    const updatedAttachments = (task.attachments || []).filter(att => att.id !== attachmentId);
    return updateTaskProperty(projectId, taskId, { attachments: updatedAttachments });
};
