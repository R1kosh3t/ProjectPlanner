import React, { useEffect, useState } from 'react';
import type { Task, Priority, User } from '../types';
import { Priority as PriorityEnum } from '../types';
import * as api from '../services/api';
import { useTranslation } from '../i18n';

const PRIORITY_STYLES: Record<Priority, { icon: React.ReactNode; color: string; labelKey: string }> = {
  [PriorityEnum.HIGH]: {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 15 7-7 7 7"/></svg>,
    color: 'border-l-red-500',
    labelKey: 'taskCard.highPriority',
  },
  [PriorityEnum.MEDIUM]: {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/></svg>,
    color: 'border-l-yellow-500',
    labelKey: 'taskCard.mediumPriority',
  },
  [PriorityEnum.LOW]: {
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m19 9-7 7-7-7"/></svg>,
    color: 'border-l-green-500',
    labelKey: 'taskCard.lowPriority',
  },
};

interface TaskCardProps {
  task: Task;
  index: number;
  columnId: string;
  onViewTask: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, columnId, onViewTask }) => {
  const [assignee, setAssignee] = useState<User | null>(null);
  const { t, language } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    api.getAllUsers().then(users => {
      if (isMounted) {
        setAssignee(users.find(u => u.id === task.assigneeId) || null);
      }
    });
    return () => { isMounted = false; };
  }, [task.assigneeId]);

  const priorityStyle = PRIORITY_STYLES[task.priority];
  const commentCount = task.activity.filter(a => a.type === 'COMMENT').length;
  const attachmentCount = task.attachments?.length || 0;

  const completedSubtasks = task.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.setData('sourceColumnId', columnId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
        (e.target as HTMLDivElement).classList.add('opacity-50', 'rotate-3');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    (e.target as HTMLDivElement).classList.remove('opacity-50', 'rotate-3');
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate && dueDate < today && columnId !== 'column-3';

  const locale = language === 'ru' ? 'ru-RU' : 'en-US';

  return (
    <div
      draggable="true"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onViewTask(task.id)}
      data-task-id={task.id}
      className={`bg-gray-900/50 p-4 rounded-lg shadow-md border-l-4 ${priorityStyle.color} cursor-pointer hover:bg-gray-700/70 transition-all duration-200 ease-in-out transform hover:-rotate-1`}
    >
      <p className="text-sm text-gray-400 mb-1">{task.displayId}</p>
      <h3 className="font-semibold text-gray-100">{task.title}</h3>
      
      {totalSubtasks > 0 && (
        <div className="mt-3">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
            <span>{t('taskCard.progress')}</span>
            <span>{completedSubtasks}/{totalSubtasks}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-3 text-gray-400">
          <div className="flex items-center" title={t(priorityStyle.labelKey)}>
            {priorityStyle.icon}
          </div>
          {attachmentCount > 0 && (
            <div className="flex items-center space-x-1" title={t('taskCard.attachments', {count: attachmentCount})}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              <span className="text-xs font-medium">{attachmentCount}</span>
            </div>
          )}
          {commentCount > 0 && (
            <div className="flex items-center space-x-1" title={t('taskCard.comments', {count: commentCount})}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              <span className="text-xs font-medium">{commentCount}</span>
            </div>
          )}
           {task.dueDate && (
            <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-500' : ''}`} title={t('taskCard.dueDate', { date: new Date(task.dueDate).toLocaleDateString(locale) })}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span className="text-xs font-medium">{new Date(task.dueDate).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
        {assignee && (
          <img
            src={assignee.avatarUrl}
            alt={assignee.name}
            title={assignee.name}
            className="w-8 h-8 rounded-full border-2 border-gray-700 object-cover"
          />
        )}
      </div>
    </div>
  );
};

export default TaskCard;