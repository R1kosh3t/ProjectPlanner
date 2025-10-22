import React, { useState } from 'react';
import type { Task, User, Priority } from '../types';
import { Priority as PriorityEnum } from '../types';
import { useTranslation } from '../i18n';

interface CalendarViewProps {
  tasks: Task[];
  assignees: User[];
  onViewTask: (taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  onCreateTask: (columnId: string, defaults: Partial<Task>) => void;
  firstColumnId: string;
}

const PRIORITY_COLORS: Record<Priority, string> = {
    [PriorityEnum.HIGH]: 'bg-red-500/70',
    [PriorityEnum.MEDIUM]: 'bg-yellow-500/70',
    [PriorityEnum.LOW]: 'bg-green-500/70',
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, assignees, onViewTask, onUpdateTask, onCreateTask, firstColumnId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null);
  const { t, language } = useTranslation();
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(startOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());
  const endDate = new Date(endOfMonth);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  const days: Date[] = [];
  let dayIterator = new Date(startDate);
  while (dayIterator <= endDate) {
    days.push(new Date(dayIterator));
    dayIterator.setDate(dayIterator.getDate() + 1);
  }

  const tasksByDate = React.useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = new Date(task.dueDate).toDateString();
        if (!map[dateKey]) {
          map[dateKey] = [];
        }
        map[dateKey].push(task);
      }
    });
    return map;
  }, [tasks]);

  const changeMonth = (offset: number) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };
  
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    setDragOverDate(day);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    const taskId = e.dataTransfer.getData('taskId');
    const taskToUpdate = tasks.find(t => t.id === taskId);
    if (taskToUpdate) {
      const newDueDate = new Date(day);
      const year = newDueDate.getFullYear();
      const month = (newDueDate.getMonth() + 1).toString().padStart(2, '0');
      const date = newDueDate.getDate().toString().padStart(2, '0');
      onUpdateTask({ ...taskToUpdate, dueDate: `${year}-${month}-${date}` });
    }
  };

  const handleCreateTask = (day: Date) => {
    const year = day.getFullYear();
    const month = (day.getMonth() + 1).toString().padStart(2, '0');
    const date = day.getDate().toString().padStart(2, '0');
    onCreateTask(firstColumnId, { dueDate: `${year}-${month}-${date}` });
  };
  
  const today = new Date();
  today.setHours(0,0,0,0);

  const dayNames = [...Array(7).keys()].map(i => {
      const date = new Date();
      date.setDate(date.getDate() - date.getDay() + i);
      return date.toLocaleDateString(locale, { weekday: 'short' });
  });

  return (
    <div className="bg-gray-800/50 rounded-xl p-4 sm:p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h2 className="text-xl font-semibold text-white">
          {currentDate.toLocaleString(locale, { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-700 border border-gray-700 rounded-lg overflow-hidden">
        {dayNames.map(dayName => (
          <div key={dayName} className="text-center text-xs font-bold text-gray-300 py-2 bg-gray-800">
            {dayName}
          </div>
        ))}
        
        {days.map(day => {
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = day.toDateString() === today.toDateString();
          const tasksForDay = tasksByDate[day.toDateString()] || [];
          
          return (
            <div 
              key={day.toISOString()} 
              className={`bg-gray-800 p-2 min-h-[120px] relative group transition-colors ${!isCurrentMonth ? 'bg-gray-800/60' : ''} ${dragOverDate?.toDateString() === day.toDateString() ? 'bg-indigo-900/50' : ''}`}
              onDragOver={(e) => handleDragOver(e, day)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, day)}
            >
              <span className={`text-sm font-semibold ${isCurrentMonth ? 'text-white' : 'text-gray-500'} ${isToday ? 'bg-indigo-600 rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>
                {day.getDate()}
              </span>
              <button onClick={() => handleCreateTask(day)} title={t('calendarView.createTaskTitle')} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-gray-700/50 text-gray-400 items-center justify-center opacity-0 group-hover:opacity-100 hidden sm:flex transition-opacity hover:bg-indigo-600 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              </button>
              <div className="mt-1 space-y-1">
                {tasksForDay.map(task => {
                   const assignee = assignees.find(a => a.id === task.assigneeId);
                   const priorityColor = PRIORITY_COLORS[task.priority];
                   return (
                    <div 
                        key={task.id}
                        draggable="true"
                        onDragStart={(e) => handleDragStart(e, task)}
                        onClick={() => onViewTask(task.id)}
                        className={`p-1.5 rounded-lg text-xs cursor-pointer hover:bg-gray-700/80 transition-colors border-l-4 ${priorityColor}`}
                    >
                        <p className="font-semibold truncate text-gray-200">{task.title}</p>
                         {assignee && <p className="text-gray-400 text-xs">@{assignee.name.split(' ')[0]}</p>}
                    </div>
                   )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default CalendarView;