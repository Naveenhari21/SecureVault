# 🔐 SecureVault — Secure File Sharing & Document Management System

A full-stack web application for secure document management with **AES-256-CBC encryption**, fine-grained access control, document versioning, and comprehensive audit logging.

---

## 🚀 Features

| Feature | Description |
|---------|-------------|
| 🔐 Authentication | JWT-based login/register with bcrypt password hashing |
| 📁 File Management | Upload, view, download, delete, search, and filter files |
| 🔒 Encryption | AES-256-CBC encryption applied before storage, decrypted on download |
| 👥 Access Control | Owner / Edit / View / None permission model per file |
| 📜 Versioning | Upload new versions without losing history; download any version |
| 📊 Audit Logs | All key actions logged with user, timestamp, IP address |
| 📈 Dashboard | Stats cards + recent documents + recent activity feed |

---

## 🗂️ Project Structure

```
File Sharing/
├── backend/
│   ├── config/db.js           # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js            # JWT middleware
│   │   └── upload.js          # Multer (memory storage)
│   ├── models/
│   │   ├── User.js
│   │   ├── File.js
│   │   ├── FileVersion.js
│   │   ├── Permission.js
│   │   └── AuditLog.js
│   ├── routes/
│   │   ├── auth.js            # /api/auth/*
│   │   ├── files.js           # /api/files/*
│   │   ├── permissions.js     # /api/permissions/*
│   │   ├── versions.js        # /api/versions/*
│   │   └── logs.js            # /api/logs/*
│   ├── utils/
│   │   ├── encryption.js      # AES-256-CBC helpers
│   │   └── audit.js           # Audit log helper
│   ├── uploads/               # Encrypted file storage (auto-created)
│   ├── .env
│   ├── package.json
│   └── server.js
└── frontend/
    ├── src/
    │   ├── api/axios.js        # Axios + JWT interceptor
    │   ├── contexts/AuthContext.jsx
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── FileCard.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── MyFiles.jsx
    │   │   ├── SharedWithMe.jsx
    │   │   ├── UploadFile.jsx
    │   │   ├── FileDetails.jsx
    │   │   ├── VersionHistory.jsx
    │   │   ├── ManagePermissions.jsx
    │   │   ├── ActivityLogs.jsx
    │   │   └── Profile.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

---

## ⚙️ Prerequisites

- **Node.js** v18+ — [nodejs.org](https://nodejs.org)
- **MongoDB** v6+ — [mongodb.com](https://www.mongodb.com/try/download/community) (running locally on port 27017)
- **npm** v9+

---

## 🛠️ Setup Instructions

### 1. Clone / Navigate to project

```bash
cd "File Sharing"
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create/edit **`backend/.env`** (already provided):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/secure_file_sharing
JWT_SECRET=your_super_secret_jwt_key_change_in_production_min_32_chars
JWT_EXPIRE=7d
ENCRYPTION_KEY=12345678901234567890123456789012
ENCRYPTION_IV=1234567890123456
NODE_ENV=development
MAX_FILE_SIZE=52428800
```

> ⚠️ **IMPORTANT**: Change `JWT_SECRET` and `ENCRYPTION_KEY` before deploying to production!
> `ENCRYPTION_KEY` must be **exactly 32 characters**.

Start the backend:

```bash
npm run dev     # development (nodemon)
# or
npm start       # production
```

Backend runs on: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend port | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/secure_file_sharing` |
| `JWT_SECRET` | Secret for signing JWTs | **Must change in production** |
| `JWT_EXPIRE` | JWT expiry duration | `7d` |
| `ENCRYPTION_KEY` | 32-char AES key | **Must change in production** |
| `NODE_ENV` | Environment | `development` |
| `MAX_FILE_SIZE` | Max upload size in bytes | `52428800` (50MB) |

---

## 📡 API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Login with email/password |
| GET | `/me` | Get current user |
| PUT | `/profile` | Update profile |
| PUT | `/change-password` | Change password |
| POST | `/logout` | Logout |
| GET | `/users/search?q=` | Search users by name/email |

### Files (`/api/files`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List my files (with search/filter) |
| POST | `/upload` | Upload & encrypt new file |
| GET | `/shared` | Files shared with me |
| GET | `/dashboard/stats` | Dashboard statistics |
| GET | `/:id` | Get file details |
| GET | `/:id/download` | Download (decrypted) file |
| PUT | `/:id` | Update metadata / upload new version |
| DELETE | `/:id` | Soft-delete file |

### Permissions (`/api/permissions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:fileId` | List all permissions for a file |
| POST | `/:fileId` | Grant/update user permission |
| DELETE | `/:fileId/:userId` | Revoke user access |

### Versions (`/api/versions`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:fileId` | List all versions |
| GET | `/:fileId/:versionId/download` | Download a specific version |

### Logs (`/api/logs`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | My audit logs (with action filter) |
| GET | `/file/:fileId` | Logs for a specific file |

---

## 🔐 Security Model

- **Passwords**: Hashed with bcrypt (12 salt rounds)
- **Authentication**: JWT tokens (7-day expiry by default)
- **File Storage**: All files encrypted with AES-256-CBC before writing to disk
- **Per-file IV**: Each file uses a unique Initialization Vector
- **Access Control**: Every API endpoint checks permissions before responding
- **Rate Limiting**: 200 req/15min global, 20 req/15min on auth endpoints
- **Soft Delete**: Deleted files are flagged, not immediately removed

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite + React Router v6 |
| Styling | Vanilla CSS with CSS Variables (dark theme) |
| UI Feedback | react-hot-toast |
| Icons | lucide-react |
| Dates | date-fns |
| HTTP | Axios |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT (jsonwebtoken) |
| Password | bcryptjs |
| Encryption | Node.js built-in `crypto` (AES-256-CBC) |
| File Upload | Multer (memory storage) |
| Validation | express-validator |
| Rate Limiting | express-rate-limit |
