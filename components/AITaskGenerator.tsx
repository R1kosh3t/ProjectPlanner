import React, { useState } from 'react';
import { generateTaskSuggestions } from '../services/geminiService';
import { useTranslation } from '../i18n';

interface AITaskGeneratorProps {
  onGenerated: (data: { title: string; description: string }) => void;
  onClose: () => void;
}

const AITaskGenerator: React.FC<AITaskGeneratorProps> = ({ onGenerated, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError('');
    try {
      const result = await generateTaskSuggestions(prompt);
      const description = result.subtasks.map(subtask => `- ${subtask}`).join('\n');
      onGenerated({ title: result.title, description });
      onClose(); // Close the generator UI after successful generation
    } catch (err: any) {
      setError(t('aiGenerator.errorGeneric'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-900/80 p-3 rounded-lg mt-2 border border-gray-700 animate-fade-in">
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
      `}</style>
      <label htmlFor="ai-prompt" className="block text-xs font-medium text-gray-400 mb-1">
        {t('aiGenerator.promptLabel')}
      </label>
      <div className="flex gap-2">
        <input
          id="ai-prompt"
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
          placeholder={t('aiGenerator.promptPlaceholder')}
          className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center w-28"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            t('aiGenerator.generateButton')
          )}
        </button>
      </div>
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
};

export default AITaskGenerator;
