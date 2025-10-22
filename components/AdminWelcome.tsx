import React from 'react';
import type { User } from '../types';
import { useTranslation } from '../i18n';

interface AdminWelcomeProps {
  user: User;
  onLogout: () => void;
  onCreateProjectClick: () => void;
}

const AdminWelcome: React.FC<AdminWelcomeProps> = ({ user, onLogout, onCreateProjectClick }) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <div className="mb-6">
            <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-indigo-500/20 border-2 border-indigo-500">
                     <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t('adminWelcome.welcome', { name: user.name })}</h1>
            <p className="text-gray-400">{t('adminWelcome.message')}</p>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">{t('adminWelcome.workspaceTitle')}</h2>
            <p className="text-gray-400 mb-6">
                {t('adminWelcome.workspaceMessage')}
            </p>
            <button
                onClick={onCreateProjectClick}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                {t('adminWelcome.createProjectButton')}
            </button>
        </div>
        
        <div className="mt-6 border-t border-gray-700 pt-6">
             <button
                onClick={onLogout}
                className="text-gray-400 hover:text-white font-semibold py-2 px-6 rounded-lg transition text-sm"
            >
                {t('header.logOut')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdminWelcome;