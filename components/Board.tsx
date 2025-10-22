import React from 'react';
import type { BoardData } from '../types';
import Column from './Column';
import EmptyState from './EmptyState';
import { useTranslation } from '../i18n';

interface BoardProps {
  boardData: BoardData;
  onDragEnd: (taskId: string, sourceColumnId: string, destColumnId: string, destIndex: number) => void;
  onViewTask: (taskId: string) => void;
  onCreateTask: (columnId: string) => void;
}

const Board: React.FC<BoardProps> = ({ boardData, onDragEnd, onViewTask, onCreateTask }) => {
  const isBoardEmpty = Object.keys(boardData.tasks).length === 0;
  const { t } = useTranslation();

  if (isBoardEmpty) {
    return (
      <EmptyState
        icon={<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>}
        title={t('board.emptyTitle')}
        message={t('board.emptyMessage')}
      >
        <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => onCreateTask(boardData.columnOrder[0])}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center transition-colors duration-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              {t('board.createFirstTask')}
            </button>
        </div>
      </EmptyState>
    );
  }

  return (
    <div className="grid grid-flow-col auto-cols-[300px] gap-6 overflow-x-auto pb-4">
      {boardData.columnOrder.map(columnId => {
        const column = boardData.columns[columnId];
        // Ensure tasks exist before mapping, especially after filtering
        const tasks = column.taskIds.map(taskId => boardData.tasks[taskId]).filter(Boolean);
        return (
          <Column
            key={column.id}
            column={column}
            tasks={tasks}
            onDropTask={onDragEnd}
            onViewTask={onViewTask}
            onCreateTask={onCreateTask}
          />
        );
      })}
    </div>
  );
};

export default Board;