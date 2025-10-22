import React, { useState } from 'react';
import type { Column as ColumnType, Task } from '../types';
import TaskCard from './TaskCard';
import EmptyState from './EmptyState';
import { useTranslation } from '../i18n';

interface ColumnProps {
  column: ColumnType;
  tasks: Task[];
  onDropTask: (taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number) => void;
  onViewTask: (taskId: string) => void;
  onCreateTask: (columnId: string) => void;
}

const Column: React.FC<ColumnProps> = ({ column, tasks, onDropTask, onViewTask, onCreateTask }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { t } = useTranslation();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    const sourceColumnId = e.dataTransfer.getData('sourceColumnId');

    const targetElement = e.target as HTMLElement;
    const dropTargetCard = targetElement.closest('[data-task-id]');
    let destIndex = tasks.length;

    if (dropTargetCard) {
      const dropTaskId = dropTargetCard.getAttribute('data-task-id');
      const dropIndex = tasks.findIndex(task => task.id === dropTaskId);
      
      const dropTargetRect = dropTargetCard.getBoundingClientRect();
      const isDroppingOnUpperHalf = e.clientY < dropTargetRect.top + dropTargetRect.height / 2;

      destIndex = isDroppingOnUpperHalf ? dropIndex : dropIndex + 1;
    }
    
    if (taskId) {
      onDropTask(taskId, sourceColumnId, column.id, destIndex);
    }
  };

  return (
    <div
      className={`bg-gray-800 rounded-xl p-4 flex flex-col transition-colors duration-200 ${isDragOver ? 'bg-gray-700/60' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center">
          {column.title}
          <span className="ml-2 text-sm bg-gray-700 text-gray-300 rounded-full px-2 py-0.5">{tasks.length}</span>
        </h2>
        <button 
          onClick={() => onCreateTask(column.id)}
          className="text-gray-400 hover:text-white transition-colors"
          aria-label={t('board.addTask')}
          title={t('board.addTask')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
      <div className="flex-grow min-h-[200px]">
        {tasks.length > 0 ? (
          <div className="space-y-4">
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} columnId={column.id} onViewTask={onViewTask} />
            ))}
          </div>
        ) : (
            <EmptyState 
                message={isDragOver ? t('board.dropHere') : t('board.emptyColumn')}
                isCompact
            >
             {!isDragOver && (
                <button 
                    onClick={() => onCreateTask(column.id)}
                    className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                    {t('board.createTaskLink')}
                </button>
             )}
            </EmptyState>
        )}
        {isDragOver && tasks.length > 0 && (
            <div className="mt-4 border-2 border-dashed border-gray-500 rounded-lg h-24 bg-gray-700/50 flex items-center justify-center text-gray-400">
                {t('board.dropHere')}
            </div>
        )}
      </div>
    </div>
  );
};

export default Column;