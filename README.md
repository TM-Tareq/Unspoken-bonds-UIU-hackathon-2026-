# Morse Code Mastery

A full-stack application for learning and practicing Morse code.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, Socket.io
- **Database**: MySQL (using `mysql2/promise`)
- **Authentication**: JWT (HttpOnly Cookie)

## Prerequisites

- Node.js (v16+)
- MySQL Server

## Setup Instructions

### 1. Database Setup

Ensure your MySQL server is running. Create a database (default: `morse_mastery`) or let the init script do it.

Update `backend/.env` with your MySQL credentials:
```env
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=morse_mastery
JWT_SECRET=your_jwt_secret
```

Initialize the database schema:
```bash
cd backend
npm install
npm run db:init
```

### 2. Backend Setup

Start the backend server:
```bash
cd backend
npm run dev
```
Server runs on http://localhost:5000.

### 3. Frontend Setup

In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173 in your browser.

## Features

- **Learn**: Progressive lessons with audio and practice.
- **Chat**: Real-time Morse code chat room with auto-translation.
- **Profile**: Track your points, streak, and completed lessons.
- **Dark Mode**: Fully supported system/manual toggle.

## Database Schema

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_stats (
  user_id INT PRIMARY KEY,
  total_points INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  current_level INT DEFAULT 1,
  last_active DATE NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id VARCHAR(50) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  points INT DEFAULT 0,
  last_completed DATE NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_lesson (user_id, lesson_id)
);
```
