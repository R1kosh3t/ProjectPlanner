import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Task, Priority, User, Activity, Subtask, Attachment } from '../types';
import { Priority as PriorityEnum } from '../types';
import RichTextEditor from './RichTextEditor';
import { useTranslation } from '../i18n';

interface TaskDetailsModalProps {
  task: Task | null;
  columnId: string | null;
  assignees: User[];
  currentUser: User;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onCreate: (taskData: Omit<Task, 'id' | 'reporterId' | 'activity' | 'displayId'>, columnId: string) => void;
  onDelete: (taskId: string) => void;
  onAddComment: (taskId: string, commentText: string) => void;
  onSubtaskAdd: (taskId: string, title: string) => void;
  onSubtaskUpdate: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  onSubtaskDelete: (taskId: string, subtaskId: string) => void;
  onAttachmentAdd: (taskId: string, attachment: Attachment) => void;
  onAttachmentDelete: (taskId: string, attachmentId: string) => void;
  defaultValues?: Partial<Task> | null;
}

const renderMention = (text: string, assignees: User[]) => {
    const mentionRegex = /@(\w+(\s\w+)*)/g;
    const parts = text.split(mentionRegex);

    return parts.map((part, index) => {
        if (index % 3 === 1) { // Matched mention name
            const assigneeExists = assignees.some(a => a.name === part);
            if (assigneeExists) {
                 return <strong key={index} className="bg-indigo-500/30 text-indigo-300 rounded px-1 py-0.5">@{part}</strong>;
            }
        }
        if (index % 3 === 0) {
            return <React.Fragment key={index}>{part}</React.Fragment>;
        }
        return null;
    });
};

const ActivityItem: React.FC<{ activity: Activity, author: User | undefined, assignees: User[] }> = ({ activity, author, assignees }) => {
  const { language } = useTranslation();
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';

  const renderDetails = () => {
    switch(activity.type) {
      case 'COMMENT':
        return <div className="text-gray-200 mt-1 whitespace-pre-wrap">{renderMention(activity.details.text || '', assignees)}</div>;
      case 'STATUS_CHANGE':
        return <p className="text-gray-300 italic">moved this task from <strong>{activity.details.from}</strong> to <strong>{activity.details.to}</strong>.</p>;
      case 'ASSIGNEE_CHANGE':
        return <p className="text-gray-300 italic">reassigned this task from <strong>{activity.details.from}</strong> to <strong>{activity.details.to}</strong>.</p>;
      case 'PRIORITY_CHANGE':
        return <p className="text-gray-300 italic">changed the priority from <strong>{activity.details.from}</strong> to <strong>{activity.details.to}</strong>.</p>;
      case 'DUE_DATE_CHANGE':
        return <p className="text-gray-300 italic">updated the due date from <strong>{activity.details.from}</strong> to <strong>{activity.details.to}</strong>.</p>;
      case 'CREATED':
          return <p className="text-gray-300 italic">created this task.</p>;
      default:
        return null;
    }
  }

  if (activity.type === 'COMMENT') {
    return (
      <div className="flex items-start gap-3">
        <img src={author?.avatarUrl} alt={author?.name} className="w-8 h-8 rounded-full mt-1" />
        <div className="bg-gray-700/50 p-3 rounded-lg flex-1">
          <p className="font-semibold text-sm">{author?.name} <span className="text-xs text-gray-400 font-normal ml-2">{new Date(activity.timestamp).toLocaleString(locale)}</span></p>
          {renderDetails()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 flex justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      </div>
      <div className="flex-1 text-sm">
        <span className="font-semibold">{author?.name}</span> {renderDetails()}
        <span className="text-xs text-gray-400 font-normal ml-2">{new Date(activity.timestamp).toLocaleString(locale)}</span>
      </div>
    </div>
  );
};

const SubtaskItem: React.FC<{ 
    task: Task;
    subtask: Subtask;
    onSubtaskUpdate: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
    onSubtaskDelete: (taskId: string, subtaskId: string) => void;
}> = ({ task, subtask, onSubtaskUpdate, onSubtaskDelete }) => {
    const [title, setTitle] = useState(subtask.title);

    const handleBlur = () => {
        if(subtask.title !== title.trim() && title.trim() !== '') {
            onSubtaskUpdate(task.id, subtask.id, { title: title.trim() });
        } else {
            setTitle(subtask.title);
        }
    };
    
    return (
        <div className="flex items-center gap-2 group hover:bg-gray-700/50 p-1 rounded">
            <input 
                type="checkbox"
                checked={subtask.completed}
                onChange={(e) => onSubtaskUpdate(task.id, subtask.id, { completed: e.target.checked })}
                className="w-4 h-4 bg-gray-600 border-gray-500 text-indigo-500 rounded focus:ring-indigo-500"
            />
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className={`flex-grow bg-transparent outline-none focus:bg-gray-900/80 rounded px-1 ${subtask.completed ? 'line-through text-gray-400' : ''}`}
            />
            <button onClick={() => onSubtaskDelete(task.id, subtask.id)} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    );
};

const AttachmentItem: React.FC<{ attachment: Attachment; onDelete: () => void; }> = ({ attachment, onDelete }) => {
    return (
        <div className="bg-gray-900/80 p-2 rounded-lg flex items-center justify-between group">
            <div className="flex items-center gap-3 overflow-hidden">
                {attachment.type.startsWith('image/') ? (
                    <img src={attachment.data} alt={attachment.name} className="w-10 h-10 rounded object-cover" />
                ) : (
                    <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                    </div>
                )}
                <div className="truncate">
                    <a href={attachment.data} download={attachment.name} className="text-sm font-medium text-indigo-400 hover:underline truncate" title={attachment.name}>{attachment.name}</a>
                    <p className="text-xs text-gray-500">{attachment.type}</p>
                </div>
            </div>
            <button onClick={onDelete} className="text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
        </div>
    );
};

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = (props) => {
  const {
    task, columnId, assignees, currentUser, onClose, onUpdate, onCreate, onDelete, onAddComment,
    onSubtaskAdd, onSubtaskUpdate, onSubtaskDelete, onAttachmentAdd, onAttachmentDelete, defaultValues
  } = props;
  
  const { t } = useTranslation();
  const isEditMode = !!task;
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigneeId: '',
    priority: PriorityEnum.MEDIUM,
    dueDate: '',
    attachments: [] as Attachment[],
  });

  const [newComment, setNewComment] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [mentionQuery, setMentionQuery] = useState('');
  const [isMentionListVisible, setIsMentionListVisible] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditMode && task) {
      setFormData({
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        priority: task.priority,
        dueDate: task.dueDate || '',
        attachments: task.attachments || [],
      });
    } else {
      const defaultAssignee = assignees.length > 0 ? assignees[0].id : '';
      setFormData({
        title: defaultValues?.title || '',
        description: defaultValues?.description || '',
        assigneeId: defaultValues?.assigneeId || defaultAssignee,
        priority: defaultValues?.priority || PriorityEnum.MEDIUM,
        dueDate: defaultValues?.dueDate || '',
        attachments: defaultValues?.attachments || [],
      });
    }
  }, [task, isEditMode, assignees, defaultValues]);

  const sortedActivity = useMemo(() => {
    if (!task) return [];
    return [...task.activity].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [task]);

  const completedSubtasks = task?.subtasks?.filter(st => st.completed).length || 0;
  const totalSubtasks = task?.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleContentClick = (e: React.MouseEvent) => e.stopPropagation();

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      alert(t('taskModal.errorTitleRequired'));
      return;
    }

    const { attachments, ...restOfFormData } = formData;
    const taskDataToSubmit = {
        ...restOfFormData,
        description: formData.description,
        dueDate: formData.dueDate || undefined,
        attachments: formData.attachments,
    };

    if (isEditMode && task) {
      onUpdate({ ...task, ...taskDataToSubmit });
    } else if (columnId) {
      onCreate(taskDataToSubmit, columnId);
    }
  };
  
  const handleAddCommentSubmit = () => {
    if (task && newComment.trim()) {
      onAddComment(task.id, newComment.trim());
      setNewComment('');
    }
  };

  const handleAddSubtaskSubmit = () => {
    if (task && newSubtaskTitle.trim()) {
      onSubtaskAdd(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !task) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        const newAttachment: Attachment = {
            id: `att-${Date.now()}`,
            name: file.name,
            type: file.type,
            data: event.target?.result as string,
        };
        onAttachmentAdd(task.id, newAttachment);
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset file input
  };
  
   const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const text = e.target.value;
        setNewComment(text);

        const mentionMatch = text.match(/@(\w*)$/);
        if (mentionMatch) {
            setMentionQuery(mentionMatch[1].toLowerCase());
            setIsMentionListVisible(true);
        } else {
            setIsMentionListVisible(false);
        }
    };

    const handleMentionSelect = (name: string) => {
        setNewComment(prev => prev.replace(/@\w*$/, `@${name} `));
        setIsMentionListVisible(false);
        commentInputRef.current?.focus();
    };
    
    const filteredAssignees = useMemo(() => {
        if (!mentionQuery) return assignees;
        return assignees.filter(a => a.name.toLowerCase().includes(mentionQuery));
    }, [mentionQuery, assignees]);
  
  const displayedReporter = isEditMode && task ? assignees.find(a => a.id === task.reporterId) : currentUser;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-4xl border border-gray-700 max-h-[90vh] flex flex-col" onClick={handleContentClick}>
        <div className="flex justify-between items-start mb-4">
            <div>
                {isEditMode && <p className="text-sm text-gray-400">{task.displayId}</p>}
                <h2 className="text-2xl font-bold">{isEditMode ? t('taskModal.detailsTitle') : t('taskModal.createTitle')}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
              <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">{t('taskModal.titleLabel')}</label>
                  <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500" required />
              </div>
              
              <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">{t('taskModal.descriptionLabel')}</label>
                  <RichTextEditor value={formData.description} onChange={handleDescriptionChange} />
              </div>
            </form>
            
            {isEditMode && task && (
              <>
                <div className="mt-6 border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold mb-2">{t('taskModal.attachmentsTitle')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                    {task.attachments?.map(att => (
                        <AttachmentItem key={att.id} attachment={att} onDelete={() => onAttachmentDelete(task.id, att.id)} />
                    ))}
                  </div>
                   <label className="w-full text-center cursor-pointer mt-2 bg-gray-700 hover:bg-gray-600 text-sm text-gray-300 font-semibold py-2 px-4 rounded-lg transition">
                      {t('taskModal.addAttachment')}
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                   </label>
                </div>

                <div className="mt-6 border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-semibold mb-2">{t('taskModal.subtasksTitle')}</h3>
                  {totalSubtasks > 0 && (
                      <div className="mb-4">
                          <div className="w-full bg-gray-700 rounded-full h-2">
                              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                      </div>
                  )}
                  <div className="space-y-1 mb-2">
                      {task.subtasks?.map(st => (
                          <SubtaskItem key={st.id} task={task} subtask={st} onSubtaskUpdate={onSubtaskUpdate} onSubtaskDelete={onSubtaskDelete} />
                      ))}
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); handleAddSubtaskSubmit(); }}>
                      <div className="flex gap-2">
                          <input 
                              type="text" 
                              value={newSubtaskTitle}
                              onChange={(e) => setNewSubtaskTitle(e.target.value)}
                              placeholder={t('taskModal.addSubtaskPlaceholder')}
                              className="flex-grow p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                          />
                          <button type="submit" className="bg-gray-600 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50" disabled={!newSubtaskTitle.trim()}>{t('taskModal.addButton')}</button>
                      </div>
                  </form>
                </div>

                <div className="mt-6 border-t border-gray-700 pt-4">
                    <h3 className="text-lg font-semibold mb-4">{t('taskModal.activityTitle')}</h3>
                    <div className="space-y-4 mb-4">
                        {sortedActivity.length > 0 ? sortedActivity.map(activity => {
                            const author = assignees.find(a => a.id === activity.userId);
                            return <ActivityItem key={activity.id} activity={activity} author={author} assignees={assignees} />;
                        }) : <p className="text-gray-500">{t('taskModal.noActivity')}</p>}
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleAddCommentSubmit(); }} className="relative">
                        <div className="flex gap-2">
                            <input 
                                ref={commentInputRef}
                                type="text" 
                                value={newComment}
                                onChange={handleCommentChange}
                                placeholder={t('taskModal.addCommentPlaceholder')}
                                className="flex-grow p-2 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50" disabled={!newComment.trim()}>{t('taskModal.sendButton')}</button>
                        </div>
                         {isMentionListVisible && filteredAssignees.length > 0 && (
                            <div className="absolute bottom-full mb-1 w-full bg-gray-900 border border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                                {filteredAssignees.map(a => (
                                    <div key={a.id} onClick={() => handleMentionSelect(a.name)} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-indigo-500/20">
                                        <img src={a.avatarUrl} alt={a.name} className="w-6 h-6 rounded-full"/>
                                        <span className="text-sm">{a.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </form>
                </div>
              </>
            )}
          </div>
          <div className="md:col-span-1">
             <div className="bg-gray-900/50 p-4 rounded-lg space-y-4">
                 <div>
                    <label htmlFor="assigneeId" className="block text-sm font-medium text-gray-300 mb-2">{t('taskModal.assigneeLabel')}</label>
                    <select id="assigneeId" name="assigneeId" value={formData.assigneeId} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500">
                        {assignees.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">{t('taskModal.priorityLabel')}</label>
                    <select id="priority" name="priority" value={formData.priority} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500">
                        {Object.values(PriorityEnum).map(p => <option key={p} value={p}>{t(`priorities.${p}`)}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-300 mb-2">{t('taskModal.dueDateLabel')}</label>
                    <input type="date" id="dueDate" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                </div>
                 {displayedReporter && (
                    <div>
                        <span className="block text-sm font-medium text-gray-300 mb-2">{t('taskModal.reporterLabel')}</span>
                        <div className="flex items-center p-2 bg-gray-700 rounded-lg h-[42px]">
                            <div className="flex items-center gap-2">
                                <img src={displayedReporter.avatarUrl} alt={displayedReporter.name} className="w-6 h-6 rounded-full"/>
                                <span className="text-sm text-gray-200">{displayedReporter.name}</span>
                            </div>
                        </div>
                    </div>
                )}
             </div>
          </div>
        </div>

          <div className="mt-6 flex-shrink-0 flex justify-between items-center border-t border-gray-700 pt-4">
            <div>
              {isEditMode && task && (
                <button onClick={() => onDelete(task.id)} className="text-red-500 hover:text-red-400 font-semibold transition">
                  {t('taskModal.deleteButton')}
                </button>
              )}
            </div>
            <button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-6 rounded-lg transition">
              {isEditMode ? t('taskModal.saveButton') : t('taskModal.createButton')}
            </button>
          </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;