import React, { useState, useEffect } from 'react';
import type { User, Project } from '../types';
import * as api from '../services/api';
import { useTranslation } from '../i18n';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  currentProjectId?: string | null;
  allUsers: User[];
  onDataChanged: () => void;
}

const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose, currentUser, currentProjectId, allUsers, onDataChanged }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleChanges, setRoleChanges] = useState<Record<string, string>>({});
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api.getUserProjects(currentUser.id)
        .then(userProjects => {
          setProjects(userProjects);
          if (currentProjectId) {
            const project = userProjects.find(p => p.id === currentProjectId);
            setCurrentProject(project || null);
            if (project) {
                const initialRoles = Object.keys(project.members).reduce((acc, userId) => {
                    acc[userId] = project.members[userId].role;
                    return acc;
                }, {} as Record<string, string>);
                setRoleChanges(initialRoles);
            }
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, currentUser.id, currentProjectId]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      await api.createProject(newProjectName.trim(), currentUser.id);
      setNewProjectName('');
      onDataChanged(); // Trigger full app refresh
    } catch (err: any) {
      setError(t('adminPanel.errorCreateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
      setRoleChanges(prev => ({ ...prev, [userId]: newRole }));
  };
  
  const handleUpdateRole = async (userId: string) => {
      if (!currentProject || !roleChanges[userId]) return;
      setIsLoading(true);
      try {
          await api.updateUserRoleInProject(currentProject.id, userId, roleChanges[userId]);
          // Refresh data to reflect change
          onDataChanged();
      } catch (err) {
          alert('Failed to update role');
      } finally {
          setIsLoading(false);
      }
  }
  
  if (!isOpen) return null;
  
  const projectMembers = currentProject ? Object.keys(currentProject.members).map(userId => allUsers.find(u => u.id === userId)).filter(Boolean) as User[] : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl border border-gray-700 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{t('adminPanel.title')}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
            <div className="bg-gray-900/50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">{t('adminPanel.createProjectTitle')}</h3>
                {error && <p className="text-red-400 mb-2">{error}</p>}
                <form onSubmit={handleCreateProject} className="flex gap-2">
                    <input 
                        type="text"
                        value={newProjectName}
                        onChange={e => setNewProjectName(e.target.value)}
                        placeholder={t('adminPanel.newProjectPlaceholder')}
                        className="flex-grow p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <button type="submit" disabled={isLoading || !newProjectName.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50">
                        {isLoading ? t('adminPanel.creatingButton') : t('adminPanel.createButton')}
                    </button>
                </form>
            </div>

            {currentProject && (
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3">{t('adminPanel.manageProjectTitle', { name: currentProject.name })}</h3>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">{t('adminPanel.inviteCodeLabel')}</label>
                        <div className="flex items-center gap-2">
                            <input type="text" readOnly value={currentProject.inviteCode} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg font-mono" />
                            <button onClick={() => navigator.clipboard.writeText(currentProject.inviteCode)} className="bg-gray-600 hover:bg-gray-500 p-2 rounded-lg" title={t('adminPanel.copyCodeTitle')}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        </div>
                    </div>
                    
                    <h4 className="font-semibold mb-2">{t('adminPanel.membersTitle')}</h4>
                    <div className="space-y-2">
                        {projectMembers.map(user => (
                            <div key={user.id} className="flex items-center justify-between bg-gray-800 p-2 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover"/>
                                    <div>
                                        <p className="font-medium">{user.name}</p>
                                        <p className="text-xs text-gray-400">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="text"
                                        value={roleChanges[user.id] || ''}
                                        onChange={e => handleRoleChange(user.id, e.target.value)}
                                        className="w-32 p-1 bg-gray-700 border border-gray-600 rounded-md text-sm"
                                        placeholder={t('adminPanel.rolePlaceholder')}
                                    />
                                    <button 
                                        onClick={() => handleUpdateRole(user.id)}
                                        disabled={isLoading || roleChanges[user.id] === currentProject.members[user.id].role}
                                        className="bg-gray-600 hover:bg-gray-500 text-white text-sm font-semibold py-1 px-3 rounded-md transition disabled:opacity-50"
                                    >
                                        {t('adminPanel.saveButton')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default AdminPanelModal;