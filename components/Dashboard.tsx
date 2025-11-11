import React, { useMemo } from 'react';
import type { BoardData, Column, Task } from '../types';
import { useTranslation } from '../i18n';

interface DashboardProps {
  boardData: BoardData;
}

const getCreationDate = (task: BoardData['tasks'][string]): Date => {
    const createdActivity = task.activity.find(a => a.type === 'CREATED');
    return createdActivity ? new Date(createdActivity.timestamp) : new Date();
};

const getCompletionDate = (task: BoardData['tasks'][string], doneColumnId: string, columns: BoardData['columns']): Date | null => {
    let completionTimestamp: string | null = null;

    const doneColumnTitle = columns[doneColumnId]?.title;
    if (!doneColumnTitle) return null;

    for (const activity of [...task.activity].reverse()) {
        if (activity.type === 'STATUS_CHANGE' && activity.details.to === doneColumnTitle) {
            completionTimestamp = activity.timestamp;
            break;
        }
    }
    return completionTimestamp ? new Date(completionTimestamp) : null;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-gray-800 p-4 rounded-xl flex items-center">
    <div className={`p-3 rounded-lg mr-4 ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-gray-400 text-sm font-medium">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ boardData }) => {
  const { tasks, columns, columnOrder } = boardData;
  const { t, language } = useTranslation();
  const allTasks = Object.values(tasks);

  const doneColumnId = useMemo(() => {
    return (Object.values(columns) as Column[]).find((c: Column) => c.title.toLowerCase() === 'done')?.id || columnOrder[columnOrder.length -1];
  }, [columns, columnOrder]);

  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completedTasks = allTasks.filter((task: Task) => columns[doneColumnId]?.taskIds.includes(task.id));
    const activeTasks = allTasks.length - completedTasks.length;
    const overdueTasks = allTasks.filter((task: Task) => {
        if (!task.dueDate || columns[doneColumnId]?.taskIds.includes(task.id)) {
            return false;
        }
        return new Date(task.dueDate) < today;
    }).length;

    return { completedTasks: completedTasks.length, activeTasks, overdueTasks };
  }, [allTasks, columns, doneColumnId]);

  const burndownData = useMemo(() => {
    if (allTasks.length === 0) return null;

    const start: Date = allTasks.reduce<Date>((earliest: Date, task: Task) => {
        const created = getCreationDate(task);
        return created < earliest ? created : earliest;
    }, new Date());
    start.setHours(0, 0, 0, 0);

    const end: Date = allTasks.reduce<Date>((latest: Date, task: Task) => {
        const due = task.dueDate ? new Date(task.dueDate) : new Date(0);
        return due > latest ? due : latest;
    }, new Date(start.getTime()));
    end.setHours(23, 59, 59, 999);
    
    // Ensure sprint is at least a week long for visibility
    if (end.getTime() - start.getTime() < 7 * 24 * 60 * 60 * 1000) {
       end.setDate(start.getDate() + 7);
    }

    const durationDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (durationDays <= 0) return null;

    const totalTasks = allTasks.length;
    const idealRate = totalTasks / (durationDays -1);

    const points = Array.from({ length: durationDays }, (_, i) => {
        const date = new Date(start);
        date.setDate(start.getDate() + i);

        const ideal = Math.max(0, totalTasks - (idealRate * i));

        const completedByDate = allTasks.filter((task: Task) => {
            const completionDate = getCompletionDate(task, doneColumnId, columns);
            return completionDate && completionDate <= date;
        }).length;
        const actual = totalTasks - completedByDate;
        
        return { date, ideal, actual };
    });

    return { points, totalTasks, durationDays, start, end };

  }, [allTasks, doneColumnId, columns]);

  const renderChart = () => {
    if (!burndownData) {
        return <div className="aspect-[500/240] flex items-center justify-center text-gray-500">{t('dashboard.noChartData')}</div>
    }
    const { points, totalTasks, durationDays } = burndownData;
    const width = 500;
    const height = 240;
    const padding = { top: 10, right: 30, bottom: 30, left: 30 };
    const locale = language === 'ru' ? 'ru-RU' : 'en-US';

    const toX = (i: number) => padding.left + (i / (durationDays - 1)) * (width - padding.left - padding.right);
    const toY = (value: number) => padding.top + (1 - value / totalTasks) * (height - padding.top - padding.bottom);
    
    const idealPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.ideal)}`).join(' ');
    const actualPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.actual)}`).join(' ');

    const numYTicks = Math.min(5, totalTasks + 1);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
             {/* Y Axis lines and labels */}
            {Array.from({ length: numYTicks }).map((_, i) => {
                if (numYTicks <= 1) return null;
                const valueRatio = i / (numYTicks - 1);
                const y = padding.top + (1 - valueRatio) * (height - padding.top - padding.bottom);
                const value = Math.round(totalTasks * valueRatio);
                return (
                    <g key={i}>
                        <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#4A5568" strokeWidth="0.5" />
                        <text x={padding.left - 8} y={y + 3} fill="#A0AEC0" fontSize="10" textAnchor="end">{value}</text>
                    </g>
                )
            })}
             {/* X Axis labels */}
             {points.map((p, i) => {
                 if (i % Math.max(1, Math.floor(durationDays / 7)) === 0) {
                     return (
                         <text key={i} x={toX(i)} y={height - 15} fill="#A0AEC0" fontSize="10" textAnchor="middle">
                            {p.date.toLocaleDateString(locale, {month: 'short', day: 'numeric'})}
                         </text>
                     )
                 }
                 return null;
             })}

            <path d={idealPath} stroke="#718096" strokeDasharray="4" strokeWidth="2" fill="none" />
            <path d={actualPath} stroke="#6366F1" strokeWidth="2.5" fill="none" />

            {/* Actual points */}
            {points.map((p, i) => (
                <circle key={i} cx={toX(i)} cy={toY(p.actual)} r="3" fill="#6366F1" />
            ))}
        </svg>
    )
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="sm:col-span-2 lg:col-span-2">
                 <h3 className="text-lg font-semibold text-white mb-2">{t('dashboard.burndownTitle')}</h3>
                 <p className="text-sm text-gray-400 mb-4">{t('dashboard.burndownSubtitle')}</p>
                 <div className="bg-gray-900/50 p-2 rounded-lg">
                    {renderChart()}
                 </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:col-span-2">
                <StatCard title={t('dashboard.completedTasks')} value={metrics.completedTasks} color="bg-green-500/20" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400"><polyline points="20 6 9 17 4 12"></polyline></svg>} />
                <StatCard title={t('dashboard.activeTasks')} value={metrics.activeTasks} color="bg-blue-500/20" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>} />
                <StatCard title={t('dashboard.overdueTasks')} value={metrics.overdueTasks} color="bg-red-500/20" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>} />
                 <StatCard title={t('dashboard.totalTasks')} value={allTasks.length} color="bg-indigo-500/20" icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>} />
            </div>
        </div>
    </div>
  );
};

export default Dashboard;