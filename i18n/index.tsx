import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const en = {
  "header": {
    "title": "Project Planner",
    "subtitle": "A Kanban-style project management tool",
    "searchPlaceholder": "Search tasks...",
    "allAssignees": "All Assignees",
    "adminPanel": "Admin Panel",
    "logOut": "Log Out"
  },
  "views": {
    "board": "Board",
    "list": "List",
    "calendar": "Calendar",
    "workload": "Workload"
  },
  "auth": {
    "login": "Log In",
    "signup": "Sign Up",
    "mainTitle": "Project Planner",
    "subtitle": "Your modern project management tool",
    "nameLabel": "Full Name",
    "namePlaceholder": "e.g. Alex Doe",
    "emailLabel": "Email address",
    "passwordLabel": "Password",
    "passwordNote": "Note: For this demo, any password will work.",
    "submitLogin": "Log In",
    "submitRegister": "Create Account",
    "processing": "Processing...",
    "noAccount": "Don't have an account?",
    "haveAccount": "Already have an account?",
    "errorUserNotFound": "User not found.",
    "errorEmailInUse": "Email already in use.",
    "errorGeneric": "An error occurred."
  },
  "noProject": {
    "welcome": "Welcome, {{name}}!",
    "noAccess": "You've successfully created an account but don't have project access yet.",
    "joinTitle": "Join a Project",
    "joinMessage": "Enter an invite code below to get access to your team's project board.",
    "codeInputPlaceholder": "Enter invite code (e.g., JOIN-PROJ-123)",
    "joinButton": "Join Project",
    "joiningButton": "Joining...",
    "errorInvalidCode": "Invalid invite code.",
    "errorJoinFailed": "Failed to join project.",
    "errorEnterCode": "Please enter an invite code."
  },
  "adminWelcome": {
    "welcome": "Welcome, Admin {{name}}!",
    "message": "You're all set up. Your first step is to create a project for your team.",
    "workspaceTitle": "Your Workspace Awaits",
    "workspaceMessage": "Create a project to start managing tasks, inviting team members, and organizing your workflow.",
    "createProjectButton": "Create Your First Project"
  },
  "adminPanel": {
    "title": "Admin Panel",
    "createProjectTitle": "Create New Project",
    "newProjectPlaceholder": "New project name...",
    "createButton": "Create",
    "creatingButton": "Creating...",
    "manageProjectTitle": "Manage Project: {{name}}",
    "inviteCodeLabel": "Invite Code",
    "copyCodeTitle": "Copy code",
    "membersTitle": "Project Members",
    "rolePlaceholder": "e.g., tester",
    "saveButton": "Save",
    "errorCreateFailed": "Failed to create project."
  },
  "board": {
    "emptyTitle": "Your board is empty",
    "emptyMessage": "Get started by creating your first task.",
    "createFirstTask": "Create Your First Task",
    "addTask": "Add new task",
    "dropHere": "Drop here",
    "emptyColumn": "This column is empty.",
    "createTaskLink": "Create a task"
  },
  "taskCard": {
    "highPriority": "High Priority",
    "mediumPriority": "Medium Priority",
    "lowPriority": "Low Priority",
    "attachments": "{{count}} attachments",
    "comments": "{{count}} comments",
    "progress": "Progress",
    "dueDate": "Due: {{date}}"
  },
  "taskModal": {
    "detailsTitle": "Task Details",
    "createTitle": "Create New Task",
    "titleLabel": "Title",
    "descriptionLabel": "Description",
    "attachmentsTitle": "Attachments",
    "addAttachment": "Add Attachment",
    "subtasksTitle": "Sub-tasks",
    "addSubtaskPlaceholder": "Add a new sub-task...",
    "addButton": "Add",
    "activityTitle": "Activity",
    "noActivity": "No activity yet.",
    "addCommentPlaceholder": "Add a comment... type @ to mention",
    "sendButton": "Send",
    "assigneeLabel": "Assignee",
    "priorityLabel": "Priority",
    "dueDateLabel": "Due Date",
    "reporterLabel": "Reporter",
    "deleteButton": "Delete Task",
    "saveButton": "Save Changes",
    "createButton": "Create Task",
    "errorTitleRequired": "Title is required."
  },
  "confirmationModal": {
    "deleteTaskTitle": "Delete Task",
    "deleteTaskMessage": "Are you sure you want to delete this task? This action cannot be undone.",
    "cancel": "Cancel",
    "confirm": "Confirm"
  },
  "userProfile": {
    "title": "Your Profile",
    "changeAvatar": "Change",
    "nameLabel": "Name",
    "avatarPreviewLabel": "Avatar Preview",
    "avatarPreviewText": "Custom Image Selected",
    "avatarNote": "Click the image above to upload a new one.",
    "emailLabel": "Email",
    "saveButton": "Save Changes"
  },
  "dashboard": {
    "burndownTitle": "Project Burndown",
    "burndownSubtitle": "Tracking progress against the ideal completion rate.",
    "noChartData": "Not enough data for chart.",
    "completedTasks": "Tasks Completed",
    "activeTasks": "Active Tasks",
    "overdueTasks": "Overdue Tasks",
    "totalTasks": "Total Tasks"
  },
  "listView": {
    "id": "ID",
    "title": "Title",
    "assignee": "Assignee",
    "priority": "Priority",
    "status": "Status",
    "dueDate": "Due Date",
    "uncategorized": "Uncategorized",
    "noTasksTitle": "No tasks to display",
    "noTasksMessage": "Your current search or filter combination yielded no results."
  },
  "workloadView": {
    "tasksAssigned": "{{count}} tasks assigned",
    "unassigned": "Unassigned",
    "tasks": "{{count}} tasks"
  },
  "calendarView": {
    "createTaskTitle": "Create task for this day"
  },
  "priorities": {
    "LOW": "Low",
    "MEDIUM": "Medium",
    "HIGH": "High"
  },
  "roles": {
    "Admin": "Admin",
    "Member": "Member",
    "Observer": "Observer"
  }
};

const ru = {
  "header": {
    "title": "Планировщик Проектов",
    "subtitle": "Инструмент для управления проектами в стиле Kanban",
    "searchPlaceholder": "Поиск задач...",
    "allAssignees": "Все исполнители",
    "adminPanel": "Панель админа",
    "logOut": "Выйти"
  },
  "views": {
    "board": "Доска",
    "list": "Список",
    "calendar": "Календарь",
    "workload": "Нагрузка"
  },
  "auth": {
    "login": "Войти",
    "signup": "Регистрация",
    "mainTitle": "Планировщик Проектов",
    "subtitle": "Ваш современный инструмент для управления проектами",
    "nameLabel": "Полное имя",
    "namePlaceholder": "например, Алексей Петров",
    "emailLabel": "Email адрес",
    "passwordLabel": "Пароль",
    "passwordNote": "Примечание: для этого демо подойдет любой пароль.",
    "submitLogin": "Войти",
    "submitRegister": "Создать аккаунт",
    "processing": "Обработка...",
    "noAccount": "Нет аккаунта?",
    "haveAccount": "Уже есть аккаунт?",
    "errorUserNotFound": "Пользователь не найден.",
    "errorEmailInUse": "Этот email уже используется.",
    "errorGeneric": "Произошла ошибка."
  },
  "noProject": {
    "welcome": "Добро пожаловать, {{name}}!",
    "noAccess": "Вы успешно создали аккаунт, но у вас еще нет доступа к проектам.",
    "joinTitle": "Присоединиться к проекту",
    "joinMessage": "Введите код-приглашение, чтобы получить доступ к доске вашего проекта.",
    "codeInputPlaceholder": "Введите код (например, JOIN-PROJ-123)",
    "joinButton": "Присоединиться",
    "joiningButton": "Присоединяемся...",
    "errorInvalidCode": "Неверный код-приглашение.",
    "errorJoinFailed": "Не удалось присоединиться к проекту.",
    "errorEnterCode": "Пожалуйста, введите код-приглашение."
  },
  "adminWelcome": {
    "welcome": "Добро пожаловать, администратор {{name}}!",
    "message": "Всё готово. Ваш первый шаг — создать проект для вашей команды.",
    "workspaceTitle": "Ваше рабочее пространство ждет",
    "workspaceMessage": "Создайте проект, чтобы начать управлять задачами, приглашать участников и организовывать рабочий процесс.",
    "createProjectButton": "Создать свой первый проект"
  },
  "adminPanel": {
    "title": "Панель администратора",
    "createProjectTitle": "Создать новый проект",
    "newProjectPlaceholder": "Название нового проекта...",
    "createButton": "Создать",
    "creatingButton": "Создание...",
    "manageProjectTitle": "Управление проектом: {{name}}",
    "inviteCodeLabel": "Код-приглашение",
    "copyCodeTitle": "Копировать код",
    "membersTitle": "Участники проекта",
    "rolePlaceholder": "например, тестировщик",
    "saveButton": "Сохранить",
    "errorCreateFailed": "Не удалось создать проект."
  },
  "board": {
    "emptyTitle": "Ваша доска пуста",
    "emptyMessage": "Начните с создания вашей первой задачи.",
    "createFirstTask": "Создать первую задачу",
    "addTask": "Добавить новую задачу",
    "dropHere": "Перетащите сюда",
    "emptyColumn": "В этой колонке пусто.",
    "createTaskLink": "Создать задачу"
  },
  "taskCard": {
    "highPriority": "Высокий приоритет",
    "mediumPriority": "Средний приоритет",
    "lowPriority": "Низкий приоритет",
    "attachments": "{{count}} вложений",
    "comments": "{{count}} комментариев",
    "progress": "Прогресс",
    "dueDate": "Срок: {{date}}"
  },
  "taskModal": {
    "detailsTitle": "Детали задачи",
    "createTitle": "Создать новую задачу",
    "titleLabel": "Название",
    "descriptionLabel": "Описание",
    "attachmentsTitle": "Вложения",
    "addAttachment": "Добавить вложение",
    "subtasksTitle": "Подзадачи",
    "addSubtaskPlaceholder": "Добавить новую подзадачу...",
    "addButton": "Добавить",
    "activityTitle": "Активность",
    "noActivity": "Активности еще нет.",
    "addCommentPlaceholder": "Добавьте комментарий... введите @ для упоминания",
    "sendButton": "Отправить",
    "assigneeLabel": "Исполнитель",
    "priorityLabel": "Приоритет",
    "dueDateLabel": "Срок выполнения",
    "reporterLabel": "Автор",
    "deleteButton": "Удалить задачу",
    "saveButton": "Сохранить изменения",
    "createButton": "Создать задачу",
    "errorTitleRequired": "Название обязательно."
  },
  "confirmationModal": {
    "deleteTaskTitle": "Удалить задачу",
    "deleteTaskMessage": "Вы уверены, что хотите удалить эту задачу? Это действие нельзя будет отменить.",
    "cancel": "Отмена",
    "confirm": "Подтвердить"
  },
  "userProfile": {
    "title": "Ваш профиль",
    "changeAvatar": "Изменить",
    "nameLabel": "Имя",
    "avatarPreviewLabel": "Превью аватара",
    "avatarPreviewText": "Выбрано пользовательское изображение",
    "avatarNote": "Нажмите на изображение выше, чтобы загрузить новое.",
    "emailLabel": "Email",
    "saveButton": "Сохранить изменения"
  },
  "dashboard": {
    "burndownTitle": "Диаграмма сгорания задач",
    "burndownSubtitle": "Отслеживание прогресса по отношению к идеальной скорости выполнения.",
    "noChartData": "Недостаточно данных для диаграммы.",
    "completedTasks": "Завершено задач",
    "activeTasks": "Активных задач",
    "overdueTasks": "Просрочено задач",
    "totalTasks": "Всего задач"
  },
  "listView": {
    "id": "ID",
    "title": "Название",
    "assignee": "Исполнитель",
    "priority": "Приоритет",
    "status": "Статус",
    "dueDate": "Срок",
    "uncategorized": "Без категории",
    "noTasksTitle": "Нет задач для отображения",
    "noTasksMessage": "Ваш текущий поиск или фильтр не дал результатов."
  },
  "workloadView": {
    "tasksAssigned": "Назначено задач: {{count}}",
    "unassigned": "Не назначено",
    "tasks": "Задач: {{count}}"
  },
  "calendarView": {
    "createTaskTitle": "Создать задачу на этот день"
  },
  "priorities": {
    "LOW": "Низкий",
    "MEDIUM": "Средний",
    "HIGH": "Высокий"
  },
  "roles": {
    "Admin": "Админ",
    "Member": "Участник",
    "Observer": "Наблюдатель"
  }
};

const translations = { en, ru };
export type Language = keyof typeof translations;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const getNestedValue = (obj: any, path: string): string | undefined => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const storedLang = localStorage.getItem('app-lang');
    return (storedLang && storedLang in translations) ? (storedLang as Language) : 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-lang', language);
  }, [language]);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const langStrings = translations[language];
    const fallbackStrings = translations.en;

    let translation = getNestedValue(langStrings, key) ?? getNestedValue(fallbackStrings, key) ?? key;

    if (replacements) {
        Object.entries(replacements).forEach(([placeholder, value]) => {
            translation = translation.replace(`{{${placeholder}}}`, String(value));
        });
    }

    return translation;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
