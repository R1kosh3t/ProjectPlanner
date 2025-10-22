import React, { useState } from 'react';
import type { User } from '../types';
import * as api from '../services/api';
import { useTranslation } from '../i18n';

interface NoProjectAccessProps {
  user: User;
  onLogout: () => void;
  onProjectJoined: () => void;
}

const NoProjectAccess: React.FC<NoProjectAccessProps> = ({ user, onLogout, onProjectJoined }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleJoinProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) {
        setError(t('noProject.errorEnterCode'));
        return;
    }
    setIsLoading(true);
    setError('');
    try {
        await api.joinProject(user.id, inviteCode.trim());
        onProjectJoined();
    } catch (err: any) {
        const errorMessage = err.message || 'Failed to join project.';
        if(errorMessage.includes('Invalid invite code')) {
            setError(t('noProject.errorInvalidCode'));
        } else {
            setError(t('noProject.errorJoinFailed'));
        }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 text-center">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8 max-w-lg w-full">
        <h1 className="text-3xl font-bold text-white mb-2">{t('noProject.welcome', { name: user.name })}</h1>
        <p className="text-gray-400 mb-6">{t('noProject.noAccess')}</p>
        
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">{t('noProject.joinTitle')}</h2>
            <p className="text-gray-400 mb-4">
                {t('noProject.joinMessage')}
            </p>
            <form onSubmit={handleJoinProject}>
                 {error && <p className="bg-red-500/20 text-red-400 text-center p-3 rounded-lg mb-4 text-sm">{error}</p>}
                <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder={t('noProject.codeInputPlaceholder')}
                    className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-center"
                />
                <button
                    type="submit"
                    disabled={isLoading}
                    className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
                >
                    {isLoading ? t('noProject.joiningButton') : t('noProject.joinButton')}
                </button>
            </form>
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

export default NoProjectAccess;