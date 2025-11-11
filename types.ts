export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export interface User {
  id: string;
  name: string;
  avatarUrl: string; // Can be a URL or a base64 data URI
  email: string;
  role: string; // Changed to string to allow custom roles like 'backend-er'
  aboutMe?: string;
  profileBannerUrl?: string; // Can be a color hex or a data URI
}

export interface Assignee extends User {
  description?: string;
}

export type ActivityType = 'COMMENT' | 'STATUS_CHANGE' | 'ASSIGNEE_CHANGE' | 'PRIORITY_CHANGE' | 'DUE_DATE_CHANGE' | 'CREATED';

export interface Activity {
  id: string;
  type: ActivityType;
  timestamp: string; // ISO date string
  userId: string;
  details: {
    text?: string; // for comments
    from?: string; // for changes
    to?: string;   // for changes
  };
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Attachment {
  id:string;
  name: string;
  type: string; // MIME type
  data: string; // Base64 encoded data
}

export interface Task {
  id: string;
  displayId: string;
  title: string;
  description: string; // Can be simple text or HTML
  priority: Priority;
  assigneeId: string;
  reporterId: string;
  activity: Activity[];
  dueDate?: string; // YYYY-MM-DD format
  subtasks?: Subtask[];
  attachments?: Attachment[];
}

export interface Column {
  id: string;
  title: string;
  taskIds: string[];
}

export interface BoardData {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
}

export interface Project {
    id: string;
    name: string;
    inviteCode: string;
    boardData: BoardData;
    members: Record<string, { role: string }>; // Maps userId to their role in this project
}


export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export type ViewMode = 'board' | 'calendar' | 'list' | 'workload';