import React from 'react';
import type { User, ViewMode } from '../types';
import { useTranslation } from '../i18n';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  user: User;
  projectName: string;
  onLogout: () => void;
  onProfileClick: () => void;
  onAdminClick: () => void;
  isAdmin: boolean;
  assignees: User[];
  currentFilter: string;
  onFilterChange: (assigneeId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const ViewModeButton: React.FC<{
  mode: ViewMode;
  currentMode: ViewMode;
  onClick: (mode: ViewMode) => void;
  children: React.ReactNode;
}> = ({ mode, currentMode, onClick, children }) => {
  const isActive = mode === currentMode;
  return (
    <button
      onClick={() => onClick(mode)}
      className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${
        isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
};


const Header: React.FC<HeaderProps> = (props) => {
  const { 
    user, projectName, onLogout, onProfileClick, onAdminClick, isAdmin, 
    assignees, currentFilter, onFilterChange, searchQuery, onSearchChange, 
    viewMode, onViewModeChange 
  } = props;
  
  const { t } = useTranslation();

  // FIX: The original code passed a string as the second argument to `t`, which expects an object for replacements. This caused a type error.
  // The fix removes the incorrect argument and adds logic to fall back to the raw role name if a translation is not found,
  // which is useful for custom roles.
  const translationKey = `roles.${user.role}`;
  const rawTranslation = t(translationKey);
  const translatedRole = rawTranslation === translationKey ? user.role : rawTranslation;
  
  const ROLE_STYLES: Record<string, string> = {
    Admin: 'bg-red-500/80 border-red-400',
    Member: 'bg-blue-500/80 border-blue-400',
    Observer: 'bg-gray-500/80 border-gray-400',
    default: 'bg-purple-500/80 border-purple-400',
  }
  const roleStyle = ROLE_STYLES[user.role] || ROLE_STYLES.default;

  return (
    <header className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">{t('header.title')}</h1>
          <p className="text-gray-400 mt-1 truncate">/ {projectName}</p>
        </div>
        <div className="bg-gray-800 p-1 rounded-lg flex items-center">
            <ViewModeButton mode="board" currentMode={viewMode} onClick={onViewModeChange}>{t('views.board')}</ViewModeButton>
            <ViewModeButton mode="list" currentMode={viewMode} onClick={onViewModeChange}>{t('views.list')}</ViewModeButton>
            <ViewModeButton mode="calendar" currentMode={viewMode} onClick={onViewModeChange}>{t('views.calendar')}</ViewModeButton>
            <ViewModeButton mode="workload" currentMode={viewMode} onClick={onViewModeChange}>{t('views.workload')}</ViewModeButton>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
        {/* Filters */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-48">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
                </svg>
              </div>
              <input
                type="text"
                id="task-search"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 p-2.5 h-10"
                placeholder={t('header.searchPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="assignee-filter" className="sr-only">Filter by assignee</label>
              <select
                id="assignee-filter"
                value={currentFilter}
                onChange={(e) => onFilterChange(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 h-10"
              >
                <option value="all">{t('header.allAssignees')}</option>
                {assignees.map(assignee => (
                  <option key={assignee.id} value={assignee.id}>{assignee.name}</option>
                ))}
              </select>
            </div>
        </div>
        {/* User Actions */}
         <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isAdmin && (
                <button onClick={onAdminClick} title={t('header.adminPanel')} className="h-10 w-10 flex items-center justify-center bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </button>
            )}
            <button onClick={onProfileClick} className="flex items-center gap-3 bg-gray-800 border border-gray-700 rounded-lg p-2 h-10 hover:bg-gray-700 transition-colors">
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                <div className="text-sm text-left hidden sm:block">
                    <p className="font-semibold text-white">{user.name}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border text-white/90 ${roleStyle}`}>{translatedRole}</span>
                </div>
            </button>
            <button onClick={onLogout} title={t('header.logOut')} className="h-10 w-10 flex items-center justify-center bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;