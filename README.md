# School Management Mini System

Simple full-stack app to manage **students** and **tasks/assignments** with **admin login**.

## Features

- **Authentication**: Admin login (JWT)
- **Students**: Add / edit / delete / list
- **Tasks**: Assign tasks to students, mark completed, delete, list
- **Evaluation mode controls**: optional expiry and record limits

## Tech

- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express
- **Database**: MySQL

## Run locally

### 1) Start MySQL

Make sure MySQL is running and credentials in `backend/.env` are valid.

### 2) Backend

From the project root:

```bash
cd backend
npm install
npm run dev
```

Backend runs on `http://localhost:5000`.

Environment file is at `backend/.env` (edit if needed). Example is `backend/.env.example`.

Required DB values:

```env
DB_SERVER=localhost
DB_PORT=3306
DB_NAME=schoolmini
DB_USER=root
DB_PASSWORD=your_mysql_password
```

Optional evaluation mode values:

```env
APP_MODE=evaluation
EVAL_EXPIRES_AT=2026-12-31
EVAL_MAX_STUDENTS=20
EVAL_MAX_TASKS=50
```

When `APP_MODE=evaluation`, backend blocks new student/task creation after limits are reached
and blocks creation after the expiry date.

### 3) Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

If your backend is on a different URL, create `frontend/.env` based on `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:5000
```

## Default Admin Login

- **Email**: `admin@school.local`
- **Password**: `admin123`

Change these in `backend/.env`.

## API (summary)

- `POST /api/auth/login` → `{ token }`
- `GET /api/students` (auth)
- `POST /api/students` (auth)
- `PUT /api/students/:id` (auth)
- `DELETE /api/students/:id` (auth)
- `GET /api/tasks` (auth)
- `POST /api/tasks` (auth)
- `PATCH /api/tasks/:id/toggle` (auth)
- `DELETE /api/tasks/:id` (auth)

## License and Usage

- This repository is provided under an evaluation-only license.
- See `LICENSE` and `NOTICE` for usage restrictions.
