import React, { useState, useCallback, useEffect, useMemo } from 'react';
// FIX: Import the `Subtask` type from `./types` to resolve the "Cannot find name 'Subtask'" error.
import type { BoardData, Task, User, Toast, ToastType, Attachment, Subtask, ViewMode, Project } from './types';
import * as api from './services/api';
import { PROJECTS_KEY, USERS_KEY } from './services/api';
import Header from './components/Header';
import Board from './components/Board';
import CalendarView from './components/CalendarView';
import ListView from './components/ListView';
import WorkloadView from './components/WorkloadView';
import TaskDetailsModal from './components/TaskDetailsModal';
import ConfirmationModal from './components/ConfirmationModal';
import ToastNotification from './components/ToastNotification';
import Dashboard from './components/Dashboard';
import AuthPage from './components/AuthPage';
import NoProjectAccess from './components/NoProjectAccess';
import UserProfileModal from './components/UserProfileModal';
import AdminPanelModal from './components/AdminPanelModal';
import AdminWelcome from './components/AdminWelcome';
import { useTranslation } from './i18n';


function App() {
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]); // All users in the system for admin panel
  const [assignees, setAssignees] = useState<User[]>([]); // Users in the current project
  const [isLoading, setIsLoading] = useState(true);
  const [hasProjectAccess, setHasProjectAccess] = useState(false);

  const [viewingTaskId, setViewingTaskId] = useState<string | null>(null);
  const [creatingTaskInColumnId, setCreatingTaskInColumnId] = useState<string | null>(null);
  const [creatingTaskDefaults, setCreatingTaskDefaults] = useState<Partial<Task> | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('board');
  const { t } = useTranslation();
  
  const initializeApp = useCallback(async () => {
    setIsLoading(true);
    try {
      const user = await api.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        const userProjects = await api.getUserProjects(user.id);
        const allSystemUsers = await api.getAllUsers();
        setAllUsers(allSystemUsers);

        if (userProjects.length > 0) {
            setHasProjectAccess(true);
            // For now, just load the first project. A project switcher could be added later.
            const project = userProjects[0];
            setCurrentProject(project);
            const [board, projectAssignees] = await Promise.all([
                api.getBoardData(project.id),
                api.getProjectAssignees(project.id)
            ]);
            setBoardData(board);
            setAssignees(projectAssignees);
        } else {
            setHasProjectAccess(false);
            setCurrentProject(null);
            setBoardData(null);
            setAssignees([]);
        }
      } else {
        setCurrentUser(null);
        setHasProjectAccess(false);
      }
    } catch (error) {
      console.error("Initialization failed", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);
  
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // The `storage` event is fired in all tabs EXCEPT the one that made the change.
      // This is perfect for syncing state across tabs.
      if (event.key === PROJECTS_KEY || event.key === USERS_KEY) {
        // A key piece of our data has changed in another tab.
        // Re-run the initialization logic to get the fresh data.
        initializeApp();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initializeApp]);


  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  }, []);
  
  const handleLoginSuccess = () => {
    initializeApp();
  };

  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setBoardData(null);
    setHasProjectAccess(false);
    setCurrentProject(null);
    setIsAdminPanelOpen(false); // Reset modal state on logout
  }

  const handleUpdateUser = async (updates: Partial<Pick<User, 'name' | 'avatarUrl' | 'aboutMe' | 'profileBannerUrl'>>) => {
    if (!currentUser) return;
    try {
        const updatedUser = await api.updateUserProfile(currentUser.id, updates);
        setCurrentUser(updatedUser);
        addToast('Profile updated successfully!');
        setIsProfileModalOpen(false);
        // Refresh data if user details changed
        initializeApp();
    } catch (error) {
        console.error("Failed to update profile", error);
        addToast("Failed to update profile", "error");
    }
  };


  const handleDragEnd = useCallback(async (taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number) => {
    if (!boardData || !currentProject) return;
    // Optimistic UI update
    const newBoardData = JSON.parse(JSON.stringify(boardData));
    const sourceColumn = newBoardData.columns[sourceColumnId];
    const destColumn = newBoardData.columns[destColumnId];
    const sourceTaskIndex = sourceColumn.taskIds.indexOf(taskId);
    sourceColumn.taskIds.splice(sourceTaskIndex, 1);
    destColumn.taskIds.splice(destIndex, 0, taskId);
    setBoardData(newBoardData);

    try {
      const updatedBoard = await api.moveTask(currentProject.id, taskId, sourceColumnId, destColumnId, destIndex);
      setBoardData(updatedBoard);
    } catch (error) {
      console.error("Failed to move task:", error);
      addToast("Failed to move task", "error");
      setBoardData(boardData); // Revert on error
    }
  }, [boardData, currentProject, addToast]);
  
  const handleCloseModal = () => {
    setViewingTaskId(null);
    setCreatingTaskInColumnId(null);
    setCreatingTaskDefaults(null);
  };
  
  const handleCreateTaskClick = (columnId: string, defaults?: Partial<Task>) => {
    setCreatingTaskInColumnId(columnId);
    if(defaults) {
        setCreatingTaskDefaults(defaults);
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    if (!currentProject) return;
    try {
        const newBoardState = await api.updateTask(currentProject.id, updatedTask);
        setBoardData(newBoardState);
        addToast(`✅ Task ${updatedTask.displayId} updated.`);
        handleCloseModal();
    } catch (error) {
        console.error("Failed to update task", error);
        addToast("Failed to update task", "error");
    }
  };
  
  const handleAddTask = async (taskData: Omit<Task, 'id' | 'reporterId' | 'activity' | 'displayId'>, columnId: string) => {
      if (!currentProject) return;
      try {
        const { board: newBoardState, newDisplayId } = await api.addTask(currentProject.id, taskData, columnId);
        setBoardData(newBoardState);
        addToast(`✅ Task ${newDisplayId} created successfully.`);
        handleCloseModal();
      } catch (error) {
        console.error("Failed to add task", error);
        addToast("Failed to add task", "error");
      }
  };

  const handleDeleteTask = (taskId: string) => {
    setTaskToDeleteId(taskId);
    setIsConfirmModalOpen(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDeleteId || !boardData || !currentProject) return;
    const taskDisplayId = boardData.tasks[taskToDeleteId]?.displayId || '';

    try {
      const newBoardState = await api.deleteTask(currentProject.id, taskToDeleteId);
      setBoardData(newBoardState);
      addToast(`🗑️ Task ${taskDisplayId} has been deleted.`, 'info');
    } catch (error) {
       console.error("Failed to delete task", error);
       addToast("Failed to delete task", "error");
    } finally {
      handleCloseModal();
      setIsConfirmModalOpen(false);
      setTaskToDeleteId(null);
    }
  };

  const handleAddComment = async (taskId: string, commentText: string) => {
    if (!currentProject) return;
    try {
        const newBoardState = await api.addComment(currentProject.id, taskId, commentText);
        setBoardData(newBoardState);
    } catch (error) {
        console.error("Failed to add comment", error);
        addToast("Failed to add comment", "error");
    }
  };

  const handleSubtaskUpdate = async (taskId: string, subtaskId: string, updates: Partial<Subtask>) => {
    if (!currentProject) return;
    try {
        const newBoardState = await api.updateSubtask(currentProject.id, taskId, subtaskId, updates);
        setBoardData(newBoardState);
    } catch (error) {
        console.error("Failed to update subtask", error);
        addToast("Failed to update subtask", "error");
    }
  };

  const handleSubtaskAdd = async (taskId: string, title: string) => {
    if (!currentProject) return;
    try {
        const newBoardState = await api.addSubtask(currentProject.id, taskId, title);
        setBoardData(newBoardState);
    } catch (error) {
        console.error("Failed to add subtask", error);
        addToast("Failed to add subtask", "error");
    }
  };

  const handleSubtaskDelete = async (taskId: string, subtaskId: string) => {
     if (!currentProject) return;
     try {
        const newBoardState = await api.deleteSubtask(currentProject.id, taskId, subtaskId);
        setBoardData(newBoardState);
     } catch (error) {
        console.error("Failed to delete subtask", error);
        addToast("Failed to delete subtask", "error");
     }
  };

    const handleAttachmentAdd = async (taskId: string, attachment: Attachment) => {
        if (!currentProject) return;
        try {
            const newBoardState = await api.addAttachment(currentProject.id, taskId, attachment);
            setBoardData(newBoardState);
        } catch (error) {
            console.error("Failed to add attachment", error);
            addToast("Failed to add attachment", "error");
        }
    };

    const handleAttachmentDelete = async (taskId: string, attachmentId: string) => {
       if (!currentProject) return;
       try {
            const newBoardState = await api.deleteAttachment(currentProject.id, taskId, attachmentId);
            setBoardData(newBoardState);
       } catch (error) {
            console.error("Failed to delete attachment", error);
            addToast("Failed to delete attachment", "error");
       }
    };

  const filteredBoardData = useMemo(() => {
    if (!boardData) return null;
    
    const lowerCaseQuery = searchQuery.toLowerCase();

    // FIX: Add explicit type `Task` to the `task` parameter in the filter callback to resolve type inference issues.
    const tasksAfterFilterAndSearch = Object.values(boardData.tasks).filter((task: Task) => {
        const matchesAssignee = assigneeFilter === 'all' || task.assigneeId === assigneeFilter;
        const matchesSearch = !lowerCaseQuery ||
            task.title.toLowerCase().includes(lowerCaseQuery) ||
            (typeof task.description === 'string' && task.description.toLowerCase().includes(lowerCaseQuery)) ||
            task.displayId.toLowerCase().includes(lowerCaseQuery);
        return matchesAssignee && matchesSearch;
    });

    // FIX: Add explicit type `Task` to the `t` parameter in the map callback.
    const filteredTaskIds = new Set(tasksAfterFilterAndSearch.map((t: Task) => t.id));
    // FIX: Add explicit type `Task` to the `task` parameter in the reduce callback.
    const filteredTasks = tasksAfterFilterAndSearch.reduce((acc, task: Task) => {
        acc[task.id] = task;
        return acc;
    }, {} as Record<string, Task>);
    
    const filteredColumns = JSON.parse(JSON.stringify(boardData.columns));
    for (const columnId in filteredColumns) {
        filteredColumns[columnId].taskIds = filteredColumns[columnId].taskIds.filter((id: string) => filteredTaskIds.has(id));
    }

    return {
        ...boardData,
        tasks: filteredTasks,
        columns: filteredColumns,
    }

  }, [boardData, assigneeFilter, searchQuery]);
  
  const filteredTasksArray = useMemo(() => filteredBoardData ? Object.values(filteredBoardData.tasks) : [], [filteredBoardData]);

  const viewingTask = viewingTaskId && boardData ? boardData.tasks[viewingTaskId] : null;

  const isAdmin = useMemo(() => currentUser?.role.toLowerCase() === 'admin', [currentUser]);

  const renderContent = () => {
    if (isLoading) {
      return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="text-white text-xl">Loading Project Planner...</div>
          </div>
      );
    }
  
    if (!currentUser) {
      return <AuthPage onLoginSuccess={handleLoginSuccess} />;
    }
    
    if (!hasProjectAccess) {
      if (isAdmin) {
        return <AdminWelcome user={currentUser} onLogout={handleLogout} onCreateProjectClick={() => setIsAdminPanelOpen(true)} />;
      }
      return <NoProjectAccess user={currentUser} onLogout={handleLogout} onProjectJoined={initializeApp} />;
    }
  
    if (!boardData || !filteredBoardData || !currentProject) {
       return (
          <div className="min-h-screen bg-gray-900 flex items-center justify-center">
              <div className="text-white text-xl">Could not load board data.</div>
          </div>
      );
    }

    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <Header 
          user={currentUser}
          projectName={currentProject.name}
          onLogout={handleLogout}
          onProfileClick={() => setIsProfileModalOpen(true)}
          onAdminClick={() => setIsAdminPanelOpen(true)}
          isAdmin={isAdmin}
          assignees={assignees}
          currentFilter={assigneeFilter}
          onFilterChange={setAssigneeFilter}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <main className="mt-6">
          <Dashboard boardData={boardData} />
          <div className="mt-8">
            {viewMode === 'board' && (
                <Board 
                  boardData={filteredBoardData} 
                  onDragEnd={handleDragEnd}
                  onViewTask={(taskId) => setViewingTaskId(taskId)}
                  onCreateTask={(columnId) => handleCreateTaskClick(columnId)}
                />
            )}
            {viewMode === 'calendar' && (
              <CalendarView 
                tasks={filteredTasksArray}
                assignees={assignees}
                onViewTask={(taskId) => setViewingTaskId(taskId)}
                onUpdateTask={handleUpdateTask}
                onCreateTask={handleCreateTaskClick}
                firstColumnId={boardData.columnOrder[0]}
              />
            )}
            {viewMode === 'list' && (
              <ListView
                tasks={filteredTasksArray}
                assignees={assignees}
                columns={boardData.columns}
                onViewTask={(taskId) => setViewingTaskId(taskId)}
               />
            )}
            {viewMode === 'workload' && (
              <WorkloadView
                 tasks={filteredTasksArray}
                 assignees={assignees}
                 onViewTask={(taskId) => setViewingTaskId(taskId)}
              />
            )}
          </div>
        </main>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {renderContent()}

      {/* Modals and Toasts are rendered at the top level to be accessible from any view */}
      {(viewingTask || creatingTaskInColumnId) && (
        <TaskDetailsModal
          task={viewingTask}
          columnId={creatingTaskInColumnId}
          assignees={assignees}
          currentUser={currentUser!} // currentUser is guaranteed to exist if this modal can be opened
          onClose={handleCloseModal}
          onUpdate={handleUpdateTask}
          onCreate={handleAddTask}
          onDelete={handleDeleteTask}
          onAddComment={handleAddComment}
          onSubtaskAdd={handleSubtaskAdd}
          onSubtaskUpdate={handleSubtaskUpdate}
          onSubtaskDelete={handleSubtaskDelete}
          onAttachmentAdd={handleAttachmentAdd}
          onAttachmentDelete={handleAttachmentDelete}
          defaultValues={creatingTaskDefaults}
        />
      )}
      {isProfileModalOpen && currentUser && (
        <UserProfileModal 
            user={currentUser}
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            onSave={handleUpdateUser}
        />
      )}
      {isAdminPanelOpen && currentUser && (
        <AdminPanelModal
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
            currentUser={currentUser}
            currentProjectId={currentProject?.id}
            allUsers={allUsers}
            onDataChanged={initializeApp} // Re-initialize app on changes
        />
      )}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDeleteTask}
        title={t('confirmationModal.deleteTaskTitle')}
        message={t('confirmationModal.deleteTaskMessage')}
      />
       <div className="fixed top-5 right-5 z-[100] w-full max-w-sm">
         <div className="flex flex-col-reverse gap-3">
            {toasts.map(toast => (
                <ToastNotification key={toast.id} toast={toast} onRemove={id => setToasts(t => t.filter(item => item.id !== id))} />
            ))}
         </div>
       </div>
    </div>
  );
}

export default App;