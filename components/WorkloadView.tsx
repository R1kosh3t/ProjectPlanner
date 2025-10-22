import React, { useMemo } from 'react';
import type { Task, User } from '../types';
import EmptyState from './EmptyState';
import { useTranslation } from '../i18n';

interface WorkloadViewProps {
  tasks: Task[];
  assignees: User[];
  onViewTask: (taskId: string) => void;
}

const WorkloadView: React.FC<WorkloadViewProps> = ({ tasks, assignees, onViewTask }) => {
    const { t } = useTranslation();

    const tasksByAssignee = useMemo(() => {
        const grouped: Record<string, Task[]> = {};
        const unassigned: Task[] = [];

        assignees.forEach(a => {
            grouped[a.id] = [];
        });

        tasks.forEach(task => {
            if (grouped[task.assigneeId]) {
                grouped[task.assigneeId].push(task);
            } else {
                unassigned.push(task);
            }
        });
        
        if(unassigned.length > 0) {
            grouped['unassigned'] = unassigned;
        }

        return grouped;
    }, [tasks, assignees]);

    const assigneesWithTasks = useMemo(() => {
        return assignees.filter(a => tasksByAssignee[a.id] && tasksByAssignee[a.id].length > 0);
    }, [assignees, tasksByAssignee]);


    if (tasks.length === 0) {
        return (
             <EmptyState
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>}
                title={t('listView.noTasksTitle')}
                message={t('listView.noTasksMessage')}
            />
        )
    }

    return (
        <div className="space-y-6">
            {assigneesWithTasks.map(assignee => (
                <div key={assignee.id} className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                    <div className="flex items-center mb-4">
                        <img src={assignee.avatarUrl} alt={assignee.name} className="w-10 h-10 rounded-full mr-3" />
                        <div>
                            <h3 className="font-bold text-lg text-white">{assignee.name}</h3>
                            <p className="text-sm text-gray-400">{t('workloadView.tasksAssigned', { count: tasksByAssignee[assignee.id].length })}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {tasksByAssignee[assignee.id].map(task => (
                            <div 
                                key={task.id}
                                onClick={() => onViewTask(task.id)}
                                className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                            >
                                <p className="text-sm text-gray-400">{task.displayId}</p>
                                <p className="font-semibold text-gray-200 truncate">{task.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            {tasksByAssignee['unassigned'] && tasksByAssignee['unassigned'].length > 0 && (
                 <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                    <div className="flex items-center mb-4">
                        <div className="w-10 h-10 rounded-full mr-3 bg-gray-700 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-white">{t('workloadView.unassigned')}</h3>
                            <p className="text-sm text-gray-400">{t('workloadView.tasks', { count: tasksByAssignee['unassigned'].length })}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {tasksByAssignee['unassigned'].map(task => (
                            <div 
                                key={task.id}
                                onClick={() => onViewTask(task.id)}
                                className="bg-gray-800 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition-colors"
                            >
                                <p className="text-sm text-gray-400">{task.displayId}</p>
                                <p className="font-semibold text-gray-200 truncate">{task.title}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkloadView;