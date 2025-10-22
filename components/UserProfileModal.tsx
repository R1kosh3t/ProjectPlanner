import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import { useTranslation } from '../i18n';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Pick<User, 'name' | 'avatarUrl'>>) => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl);
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ name, avatarUrl });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md relative border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{t('userProfile.title')}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        <div className="space-y-4">
            <div className="flex justify-center">
                <div className="relative group">
                    <img src={avatarUrl} alt={name} className="w-24 h-24 rounded-full border-4 border-indigo-500 object-cover" />
                    <button 
                        onClick={handleAvatarClick}
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={t('userProfile.changeAvatar')}
                    >
                        {t('userProfile.changeAvatar')}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>
            </div>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">{t('userProfile.nameLabel')}</label>
                <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">{t('userProfile.avatarPreviewLabel')}</label>
                <input
                    type="text"
                    value={avatarUrl.startsWith('data:') ? t('userProfile.avatarPreviewText') : avatarUrl}
                    readOnly
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 truncate cursor-not-allowed"
                />
                 <p className="text-xs text-gray-500 mt-1">{t('userProfile.avatarNote')}</p>
            </div>
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">{t('userProfile.emailLabel')}</label>
                <input
                    id="email"
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                />
            </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {t('confirmationModal.cancel')}
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            {t('userProfile.saveButton')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;