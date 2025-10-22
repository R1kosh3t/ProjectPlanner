import React, { useState } from 'react';
import * as api from '../services/api';
import { useTranslation } from '../i18n';

interface AuthPageProps {
  onLoginSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Not used for logic, just for UI
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLoginView) {
        await api.login(email);
      } else {
        await api.register(name, email);
      }
      onLoginSuccess();
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred.';
      if(errorMessage.includes('User not found')) {
        setError(t('auth.errorUserNotFound'));
      } else if (errorMessage.includes('Email already in use')) {
        setError(t('auth.errorEmailInUse'));
      } else {
        setError(t('auth.errorGeneric'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{t('auth.mainTitle')}</h1>
            <p className="text-gray-400">{t('auth.subtitle')}</p>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-center text-white mb-6">{isLoginView ? t('auth.login') : t('auth.signup')}</h2>
          
          {error && <p className="bg-red-500/20 text-red-400 text-center p-3 rounded-lg mb-4">{error}</p>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLoginView && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300">{t('auth.nameLabel')}</label>
                  <div className="mt-1">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder={t('auth.namePlaceholder')}
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">{t('auth.emailLabel')}</label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Admin: alex@example.com | Member: guest@example.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-gray-300">{t('auth.passwordLabel')}</label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="••••••••"
                />
                 <p className="text-xs text-gray-500 mt-2">{t('auth.passwordNote')}</p>
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? t('auth.processing') : (isLoginView ? t('auth.submitLogin') : t('auth.submitRegister'))}
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              {isLoginView ? t('auth.noAccount') : t('auth.haveAccount')}
              <button onClick={() => { setIsLoginView(!isLoginView); setError('')}} className="font-medium text-indigo-400 hover:text-indigo-300 ml-2">
                {isLoginView ? t('auth.signup') : t('auth.login')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;