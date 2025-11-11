# Project Planner

A modern, Jira-like project management tool for organizing your workflow with a beautiful and intuitive drag-and-drop Kanban board. This application is designed to provide a seamless and visually appealing experience for managing tasks and tracking project progress.

## About The Project

Project Planner is a comprehensive web application built to simplify project management for development teams, freelancers, and individuals. It offers a suite of powerful features in a clean, uncluttered interface, focusing on usability and clarity. The goal is to provide the core functionalities of popular tools like Jira or Trello in a lightweight, modern, and easy-to-use package.

This project serves as a demonstration of modern frontend development techniques, showcasing a feature-rich, single-page application built entirely with React and TypeScript, using the browser's `localStorage` to simulate a backend for a complete, standalone experience.

## Key Features

- **Interactive Kanban Board:** A fluid drag-and-drop interface to move tasks across different stages of your workflow (e.g., Backlog, To Do, In Progress, Done).
- **Multiple Project Views:**
    - **Board View:** The classic Kanban visualization for a clear overview of task status.
    - **List View:** A detailed, sortable table of all tasks for quick filtering and bulk review.
    - **Calendar View:** A monthly calendar to visualize tasks with due dates and plan your schedule.
    - **Workload View:** A breakdown of tasks assigned to each team member to manage and balance workloads.
- **Rich Task Management:**
    - Create tasks with detailed descriptions, priorities (Low, Medium, High), assignees, reporters, and due dates.
    - Add sub-tasks and track their completion.
    - Attach files and images directly to tasks.
- **Collaboration Tools:**
    - A full activity log for each task to track all changes.
    - A comment system with **@mentions** to notify team members.
- **Project Dashboard:** Get a high-level overview of project health with a **Burndown Chart** and key statistics like completed, active, and overdue tasks.
- **User and Project Management:**
    - A dedicated **Admin Panel** to create new projects.
    - Secure user authentication (Login/Registration).
    - Invite-based system for users to join projects.
    - Customizable user profiles with avatars, bios, and banner colors.
- **Internationalization:** Full support for both **English** and **Russian** languages.
- **Fully Responsive:** A carefully crafted design that works flawlessly on desktop, tablet, and mobile devices.

## How To Use

The application starts with a clean slate and saves all data in your browser's `localStorage`.

1.  **First User Registration (Admin Setup):**
    - The very first person to register an account automatically becomes the **Administrator**.
    - After registering, the Admin will be prompted to create the first project.

2.  **Creating a Project:**
    - The Admin can access the **Admin Panel** (shield icon in the header) to create a new project.
    - Once a project is created, an **Invite Code** will be generated.

3.  **Inviting Team Members:**
    - The Admin must share the invite code with other team members.
    - New users can register and then use this code to join the project.

4.  **Project Management:**
    - Once in a project, you can navigate between the Board, List, Calendar, and Workload views.
    - Click on any task to view its details, add comments, or update its properties.


## Technology Stack

-   **Frontend:** React 19, TypeScript
-   **Styling:** Tailwind CSS
-   **State Management:** React Hooks (`useState`, `useContext`, `useMemo`, `useCallback`)
-   **Data Persistence:** Browser `localStorage` is used to simulate a backend database, making the app fully functional without a server.
-   **Internationalization (i18n):** Implemented using React Context API for language switching.

---

# Project Planner (Планировщик Проектов)

Современный инструмент для управления проектами в стиле Jira, предназначенный для организации рабочего процесса с помощью красивой и интуитивно понятной Kanban-доски с функцией drag-and-drop. Это приложение создано для обеспечения удобного и визуально привлекательного опыта управления задачами и отслеживания прогресса проекта.

## О проекте

Project Planner — это комплексное веб-приложение, созданное для упрощения управления проектами для команд разработчиков, фрилансеров и индивидуальных пользователей. Оно предлагает набор мощных функций в чистом и простом интерфейсе, с акцентом на удобство использования и наглядность. Цель — предоставить основные функции популярных инструментов, таких как Jira или Trello, в легком, современном и простом в использовании пакете.

Этот проект служит демонстрацией современных техник frontend-разработки, представляя многофункциональное одностраничное приложение, полностью созданное на React и TypeScript, использующее `localStorage` браузера для имитации бэкенда, что обеспечивает полноценную и автономную работу.

## Ключевые возможности

- **Интерактивная Kanban-доска:** Гибкий интерфейс с функцией drag-and-drop для перемещения задач между различными этапами рабочего процесса (например, Бэклог, К выполнению, В работе, Готово).
- **Несколько режимов просмотра:**
    - **Доска:** Классическая Kanban-визуализация для четкого обзора статуса задач.
    - **Список:** Детальная, сортируемая таблица всех задач для быстрой фильтрации и массового просмотра.
    - **Календарь:** Ежемесячный календарь для визуализации задач со сроками выполнения и планирования графика.
    - **Нагрузка:** Распределение задач по членам команды для управления и балансировки рабочей нагрузки.
- **Расширенное управление задачами:**
    - Создание задач с подробными описаниями, приоритетами (Низкий, Средний, Высокий), исполнителями, авторами и сроками выполнения.
    - Добавление подзадач и отслеживание их выполнения.
    - Прикрепление файлов и изображений непосредственно к задачам.
- **Инструменты для совместной работы:**
    - Полный журнал активности для каждой задачи для отслеживания всех изменений.
    - Система комментариев с **@упоминаниями** для уведомления членов команды.
- **Панель мониторинга проекта:** Получите общее представление о состоянии проекта с помощью **Диаграммы сгорания задач** и ключевых статистических данных, таких как завершенные, активные и просроченные задачи.
- **Управление пользователями и проектами:**
    - Специальная **Панель администратора** для создания новых проектов.
    - Безопасная аутентификация пользователей (Вход/Регистрация).
    - Система приглашений для присоединения пользователей к проектам.
    - Настраиваемые профили пользователей с аватарами, биографией и цветами баннеров.
- **Интернационализация:** Полная поддержка **английского** и **русского** языков.
- **Полная адаптивность:** Тщательно продуманный дизайн, который безупречно работает на настольных компьютерах, план