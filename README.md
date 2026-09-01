# TaskMaster - Collaborative Task Tracking & Management Backend System

TaskMaster is a production-ready, RESTful backend service designed to power team-based task tracking, project organization, and collaborative workflows. Built with **Node.js, Express.js, SQLite, JWT Authentication, WebSockets/SSE Real-Time Notifications, and Generative AI**, this system provides a secure and scalable foundation for team productivity.

---

## 🌟 Key Features

- 🔐 **User Authentication & Session Management**: Secure user registration, credential login, profile management, BCrypt password hashing, and JWT stateless session tokens.
- 📋 **Task Management**: Full CRUD operations with title, description, priority (`LOW`, `MEDIUM`, `HIGH`), status (`OPEN`, `IN_PROGRESS`, `COMPLETED`), due date, assignee, and team scoping.
- 🔍 **Filtering, Sorting & Search**: Filter tasks by status, priority, assignee, or team ID; sort dynamically by due date, title, or creation date; full-text keyword search across titles and descriptions.
- 👥 **Team & Project Collaboration**: Create teams/projects, generate unique invite codes, join existing teams, invite team members, and assign tasks across team members.
- 💬 **Task Comments & File Attachments**: Collaborate directly on tasks through comment threads and file attachment uploads (PDFs, images, documents) with file download endpoints.
- ⚡ **Real-Time Push Notifications**: Integrated Server-Sent Events (SSE) stream (`/api/notifications/stream`) and WebSocket gateway (`ws://localhost:5000/ws`) to push live notifications to users when tasks are assigned, updated, or commented on.
- 🤖 **Generative AI Task Creation & Summary**: Integrated Google Gemini AI service (`/api/ai/generate-description` and `/api/ai/summarize/:taskId`) to automatically generate structured task descriptions, action plans, and task summaries from simple prompts.
- 🛡️ **Production Error Handling & Validation**: Centralized `try-catch` operational error handling middleware, input validation, custom `AppError` class, and strict HTTP response status codes.

---

## 🗄️ Database Architecture & Schema

The application uses an embedded **SQLite** database (`data/taskmaster.db`) with foreign key constraints enabled.

```
+------------------+         +------------------+         +------------------+
|      users       |         |      teams       |         |   team_members   |
+------------------+         +------------------+         +------------------+
| id (PK)          |<--------| owner_id (FK)    |    +--->| team_id (FK)     |
| name             |         | id (PK)          |<---+    | user_id (FK)     |
| email (UNIQUE)   |         | name             |         | role             |
| password (HASH)  |         | invite_code      |         | joined_at        |
| avatar           |         | description      |         +------------------+
+------------------+         +------------------+
    ^         ^
    |         |              +------------------+         +------------------+
    |         +--------------|      tasks       |         |     comments     |
    |                        +------------------+         +------------------+
    |                        | id (PK)          |<--------| task_id (FK)     |
    |                        | title            |         | user_id (FK)     |
    |                        | description      |         | content          |
    |                        | status           |         +------------------+
    |                        | priority         |
    |                        | due_date         |         +------------------+
    |                        | creator_id (FK)  |         |   attachments    |
    |                        | assignee_id (FK) |         +------------------+
    |                        | team_id (FK)     |<--------| task_id (FK)     |
    |                        +------------------+         | uploader_id (FK) |
    |                                                     | filename, path   |
    |                        +------------------+         +------------------+
    |                        |  notifications   |
    +------------------------|------------------|
                             | user_id (FK)     |
                             | title, message   |
                             | type, is_read    |
                             +------------------+
```

---

## 🚀 Quick Start Guide (For Instructor / Reviewer)

### 1. Prerequisites
- **Node.js** v18.0.0 or higher
- **npm** (comes with Node.js)

### 2. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the project root directory (or copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=taskmaster_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
DB_PATH=./data/taskmaster.db
UPLOAD_DIR=./uploads
GEMINI_API_KEY=your_optional_gemini_api_key
```

### 4. Running the Application
Start the TaskMaster API server:
```bash
npm start
```
*The server will start at `http://localhost:5000` and automatically create the SQLite database file and required tables.*

### 5. Running Automated Integration Tests
To execute the comprehensive automated test suite (verifying all 14 user stories):
```bash
npm test
```

---

## 📌 User Story Compliance Matrix

| # | User Story | Implemented API Endpoint | Test Status |
|---|------------|--------------------------|-------------|
| **1** | Create a new account | `POST /api/auth/register` | ✅ PASSED |
| **2** | Log in securely | `POST /api/auth/login` | ✅ PASSED |
| **3** | View & update personal profile | `GET /api/auth/profile`, `PUT /api/auth/profile` | ✅ PASSED |
| **4** | Create a task with title, description, due date | `POST /api/tasks` | ✅ PASSED |
| **5** | View list of tasks assigned to me | `GET /api/tasks/my-tasks` | ✅ PASSED |
| **6** | Mark a task as completed | `PATCH /api/tasks/:id/status` | ✅ PASSED |
| **7** | Assign task to another team member | `PATCH /api/tasks/:id/assign` | ✅ PASSED |
| **8** | Filter tasks by status (`OPEN`, `COMPLETED`) | `GET /api/tasks?status=COMPLETED` | ✅ PASSED |
| **9** | Search tasks by title or description | `GET /api/tasks?search=keyword` | ✅ PASSED |
| **10**| Collaborate via comments and file attachments | `POST /api/tasks/:id/comments`, `POST /api/tasks/:id/attachments` | ✅ PASSED |
| **11**| Create new team & invite members | `POST /api/teams`, `POST /api/teams/join` | ✅ PASSED |
| **12**| Securely log out | `POST /api/auth/logout` | ✅ PASSED |
| **13**| Real-time notifications on assignment/updates | `GET /api/notifications/stream` (SSE / WS) | ✅ PASSED |
| **14**| Generative AI model task creation & summary | `POST /api/ai/generate-description`, `GET /api/ai/summarize/:id` | ✅ PASSED |

---

## 📡 RESTful API Documentation

### 🔑 Authentication Endpoints
- **`POST /api/auth/register`**
  - **Body**: `{ "name": "Alice", "email": "alice@example.com", "password": "password123" }`
  - **Response**: `201 Created` with JWT token and user object.
- **`POST /api/auth/login`**
  - **Body**: `{ "email": "alice@example.com", "password": "password123" }`
  - **Response**: `200 OK` with JWT token.
- **`GET /api/auth/profile`** *(Protected)*
  - **Headers**: `Authorization: Bearer <token>`
- **`PUT /api/auth/profile`** *(Protected)*
  - **Body**: `{ "name": "Alice Lead", "avatar": "avatar_url" }`
- **`POST /api/auth/logout`** *(Protected)*

---

### 📋 Task Management Endpoints
- **`POST /api/tasks`** *(Protected)*
  - **Body**: `{ "title": "Design REST API", "description": "Draft endpoints", "priority": "HIGH", "dueDate": "2026-12-31", "teamId": 1, "assigneeId": 2 }`
- **`GET /api/tasks`** *(Protected)*
  - **Query Params**: `status`, `priority`, `teamId`, `assigneeId`, `search`, `sortBy`, `order`
  - **Example**: `/api/tasks?status=OPEN&search=API&sortBy=dueDate&order=asc`
- **`GET /api/tasks/my-tasks`** *(Protected)*
- **`GET /api/tasks/:id`** *(Protected)*
- **`PUT /api/tasks/:id`** *(Protected)*
- **`PATCH /api/tasks/:id/status`** *(Protected)*
  - **Body**: `{ "status": "COMPLETED" }`
- **`PATCH /api/tasks/:id/assign`** *(Protected)*
  - **Body**: `{ "assigneeId": 2 }`
- **`DELETE /api/tasks/:id`** *(Protected)*

---

### 👥 Team Collaboration Endpoints
- **`POST /api/teams`** *(Protected)*
  - **Body**: `{ "name": "Backend Team", "description": "Core API developers" }`
  - **Response**: `201 Created` with unique `invite_code`.
- **`POST /api/teams/join`** *(Protected)*
  - **Body**: `{ "inviteCode": "A1B2C3D4" }`
- **`POST /api/teams/:teamId/members`** *(Protected)*
  - **Body**: `{ "email": "bob@example.com", "role": "MEMBER" }`
- **`GET /api/teams`** *(Protected)*
- **`GET /api/teams/:id`** *(Protected)*

---

### 💬 Comments & File Attachments
- **`POST /api/tasks/:taskId/comments`** *(Protected)*
  - **Body**: `{ "content": "Updated the pull request." }`
- **`GET /api/tasks/:taskId/comments`** *(Protected)*
- **`POST /api/tasks/:taskId/attachments`** *(Protected)*
  - **Form Data**: `file` (multipart file upload)
- **`GET /api/tasks/attachments/:id/download`** *(Protected)*

---

### ⚡ Real-Time Push Notifications
- **`GET /api/notifications/stream?token=<JWT_TOKEN>`** (SSE Stream)
- **`ws://localhost:5000/ws?token=<JWT_TOKEN>`** (WebSocket Gateway)
- **`GET /api/notifications`** *(Protected)*
- **`PATCH /api/notifications/:id/read`** *(Protected)*

---

### 🤖 Generative AI Endpoints
- **`POST /api/ai/generate-description`** *(Protected)*
  - **Body**: `{ "prompt": "Implement OAuth2 login with Google", "priority": "HIGH" }`
  - **Response**: AI-generated objective, deliverables, action items, and acceptance criteria.
- **`GET /api/ai/summarize/:taskId`** *(Protected)*
  - **Response**: AI summary of task state, description, and comment activity.

---

## 🧪 Testing with cURL Examples

```bash
# 1. Register User
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"password123"}'

# 2. Create Task (Include JWT token in Header)
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Setup Database","description":"Configure SQLite tables","priority":"HIGH"}'

# 3. Generate AI Task Description
curl -X POST http://localhost:5000/api/ai/generate-description \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Implement JWT user auth","priority":"HIGH"}'
```

---

## 🛠️ Project Structure

```
TaskMaster/
├── src/
│   ├── config/          # Database & Environment configuration
│   ├── controllers/     # Request handlers & logic for each module
│   ├── middleware/      # Auth, Multer upload, validation & error handling
│   ├── models/          # SQLite Data Access Layer & query wrappers
│   ├── routes/          # Express route definitions
│   ├── services/        # Real-time notification & AI generation services
│   ├── utils/           # JWT, BCrypt, and AppError utilities
│   ├── app.js           # Express app setup & middleware binding
│   └── index.js         # HTTP & WebSocket server entrypoint
├── tests/
│   └── integration.test.js # Automated integration test suite
├── uploads/             # Physical file attachment storage
├── .env.example         # Template environment configuration
├── package.json         # Dependencies & scripts
└── README.md            # Instructor documentation
```

---

## 📄 License & Credits
Developed as a production-ready collaborative task management backend system for academic submission and enterprise deployment.
