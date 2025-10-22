import React, { useState, useMemo } from 'react';
import type { Task, User, Column, Priority } from '../types';
import { Priority as PriorityEnum } from '../types';
import EmptyState from './EmptyState';
import { useTranslation } from '../i18n';

interface ListViewProps {
  tasks: Task[];
  assignees: User[];
  columns: Record<string, Column>;
  onViewTask: (taskId: string) => void;
}

type SortKey = 'displayId' | 'title' | 'assigneeId' | 'priority' | 'status' | 'dueDate';

const PRIORITY_SORT_ORDER: Record<Priority, number> = {
    [PriorityEnum.HIGH]: 3,
    [PriorityEnum.MEDIUM]: 2,
    [PriorityEnum.LOW]: 1,
};

const getStatusForTask = (taskId: string, columns: Record<string, Column>): string => {
    const column = Object.values(columns).find(c => c.taskIds.includes(taskId));
    return column ? column.title : 'Uncategorized';
};

const SortableHeader: React.FC<{
    sortKey: SortKey;
    title: string;
    sortConfig: { key: SortKey; direction: 'asc' | 'desc' } | null;
    setSortConfig: (config: { key: SortKey; direction: 'asc' | 'desc' }) => void;
}> = ({ sortKey, title, sortConfig, setSortConfig }) => {
    const isSorting = sortConfig?.key === sortKey;
    const direction = isSorting ? (sortConfig.direction === 'asc' ? 'desc' : 'asc') : 'asc';
    const icon = isSorting ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '';

    return (
        <th scope="col" className="px-6 py-3">
            <button onClick={() => setSortConfig({ key: sortKey, direction })} className="flex items-center gap-1">
                {title} <span className="text-indigo-400">{icon}</span>
            </button>
        </th>
    );
};


const ListView: React.FC<ListViewProps> = ({ tasks, assignees, columns, onViewTask }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);
    const { t, language } = useTranslation();
    const locale = language === 'ru' ? 'ru-RU' : 'en-US';

    const assigneesMap = useMemo(() => new Map(assignees.map(a => [a.id, a])), [assignees]);

    const sortedTasks = useMemo(() => {
        let sortableTasks = [...tasks];
        if (sortConfig !== null) {
            sortableTasks.sort((a, b) => {
                const aVal = a[sortConfig.key as keyof Task];
                const bVal = b[sortConfig.key as keyof Task];

                let compareResult = 0;
                
                switch (sortConfig.key) {
                    case 'priority':
                        compareResult = PRIORITY_SORT_ORDER[a.priority] - PRIORITY_SORT_ORDER[b.priority];
                        break;
                    case 'status':
                        const aStatus = getStatusForTask(a.id, columns);
                        const bStatus = getStatusForTask(b.id, columns);
                        compareResult = aStatus.localeCompare(bStatus);
                        break;
                    case 'dueDate':
                        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                        compareResult = aDate - bDate;
                        break;
                    case 'assigneeId':
                        const aAssignee = assigneesMap.get(a.assigneeId)?.name || '';
                        const bAssignee = assigneesMap.get(b.assigneeId)?.name || '';
                        compareResult = aAssignee.localeCompare(bAssignee);
                        break;
                    default:
                        if (typeof aVal === 'string' && typeof bVal === 'string') {
                            compareResult = aVal.localeCompare(bVal);
                        } else {
                            compareResult = (aVal as any) > (bVal as any) ? 1 : -1;
                        }
                }
                
                return sortConfig.direction === 'asc' ? compareResult : -compareResult;
            });
        }
        return sortableTasks;
    }, [tasks, sortConfig, columns, assigneesMap]);

    if (tasks.length === 0) {
        return (
             <EmptyState
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>}
                title={t('listView.noTasksTitle')}
                message={t('listView.noTasksMessage')}
            />
        )
    }

    return (
        <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
            <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs uppercase bg-gray-800 text-gray-400">
                        <tr>
                            <SortableHeader sortKey="displayId" title={t('listView.id')} sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader sortKey="title" title={t('listView.title')} sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader sortKey="assigneeId" title={t('listView.assignee')} sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader sortKey="priority" title={t('listView.priority')} sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader sortKey="status" title={t('listView.status')} sortConfig={sortConfig} setSortConfig={setSortConfig} />
                            <SortableHeader sortKey="dueDate" title={t('listView.dueDate')} sortConfig={sortConfig} setSortConfig={setSortConfig} />
                        </tr>
                    </thead>
                    <tbody>
                        {sortedTasks.map(task => {
                            const assignee = assigneesMap.get(task.assigneeId);
                            const status = getStatusForTask(task.id, columns) || t('listView.uncategorized');
                            return (
                                <tr key={task.id} onClick={() => onViewTask(task.id)} className="bg-gray-800/50 border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer">
                                    <td className="px-6 py-4 font-medium whitespace-nowrap text-white">{task.displayId}</td>
                                    <td className="px-6 py-4 max-w-xs truncate">{task.title}</td>
                                    <td className="px-6 py-4">
                                        {assignee && (
                                            <div className="flex items-center gap-2">
                                                <img src={assignee.avatarUrl} alt={assignee.name} className="w-6 h-6 rounded-full"/>
                                                {assignee.name}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{t(`priorities.${task.priority}`)}</td>
                                    <td className="px-6 py-4">{status}</td>
                                    <td className="px-6 py-4">{task.dueDate ? new Date(task.dueDate).toLocaleDateString(locale) : 'N/A'}</td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ListView;