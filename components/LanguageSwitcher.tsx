import React from 'react';
import { useTranslation, Language } from '../i18n';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
  ];

  return (
    <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-1">
      {languages.map(langInfo => (
        <button
          key={langInfo.code}
          onClick={() => handleLanguageChange(langInfo.code)}
          className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${
            language === langInfo.code
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:bg-gray-700'
          }`}
        >
          {langInfo.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
