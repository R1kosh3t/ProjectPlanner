import React, { useState, useEffect, useRef } from 'react';
import type { User } from '../types';
import { useTranslation } from '../i18n';

interface UserProfileModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Pick<User, 'name' | 'avatarUrl' | 'aboutMe' | 'profileBannerUrl'>>) => void;
}

const BANNER_COLORS = ['#6366f1', '#ec4899', '#22c55e', '#f97316', '#8b5cf6', '#06b6d4', '#ef4444', '#4b5563'];

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [aboutMe, setAboutMe] = useState(user.aboutMe || '');
  const [banner, setBanner] = useState(user.profileBannerUrl || '#4b5563');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl);
      setAboutMe(user.aboutMe || '');
      setBanner(user.profileBannerUrl || '#4b5563');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ name, avatarUrl, aboutMe, profileBannerUrl: banner });
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
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg relative border border-gray-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-20">
             <button onClick={onClose} className="bg-gray-900/50 rounded-full p-1 text-gray-300 hover:text-white hover:bg-gray-800/70">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>
       
        {/* Profile Display */}
        <div className="relative">
             <div className="h-32" style={{ backgroundColor: banner }}></div>
             <div className="absolute -bottom-12 left-6">
                <div className="relative group">
                    <img src={avatarUrl} alt={name} className="w-24 h-24 rounded-full border-4 border-gray-800 object-cover" />
                    <button 
                        onClick={handleAvatarClick}
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
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
        </div>

        {/* Form and Content */}
        <div className="p-6 pt-16">
            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm text-gray-400">{user.email}</p>

            <div className="mt-4 bg-gray-900/50 p-4 rounded-lg">
                <h3 className="text-sm font-bold uppercase text-gray-400 mb-2">{t('userProfile.aboutMe')}</h3>
                <p className="text-sm text-gray-200 whitespace-pre-wrap">{aboutMe || t('userProfile.noBio')}</p>
            </div>

            <div className="mt-6 space-y-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">{t('userProfile.nameLabel')}</label>
                    <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                 <div>
                    <label htmlFor="aboutMe" className="block text-sm font-medium text-gray-300 mb-1">{t('userProfile.aboutMe')}</label>
                    <textarea
                        id="aboutMe"
                        value={aboutMe}
                        onChange={(e) => setAboutMe(e.target.value)}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                        placeholder={t('userProfile.bioPlaceholder')}
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('userProfile.bannerColor')}</label>
                    <div className="flex flex-wrap gap-2">
                        {BANNER_COLORS.map(color => (
                            <button key={color} onClick={() => setBanner(color)} className={`w-8 h-8 rounded-full transition transform hover:scale-110 ${banner === color ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white' : ''}`} style={{ backgroundColor: color }} aria-label={`Set banner color to ${color}`}></button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        
        <div className="bg-gray-900/50 px-6 py-4 flex justify-end gap-4">
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