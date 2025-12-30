# Source-Code-Analyse-Tool

A modern web application designed to analyze and manage source code repositories. It provides insights into transition planning, technical debt, and AI-driven code reviews.

## 🚀 Features

- **Project Management**: Organize and track multiple source code projects.
- **Repository Integration**: Clone or upload repositories for deep analysis.
- **AI-Driven Insights**: Automated documentation, code reviews, and bug predictions using AI.
- **Dashboard Metrics**: Visualize total value, active categories, and project health.
- **Real-time Status**: Live streaming of repository cloning and scanning progress.

## 🛠 Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **Analysis**: Custom AI simulation and static analysis logic
- **Server**: Uvicorn with Auto-reload
- **Data Persistence**: Local JSON-based storage (managed via `projects.json` and `repositories.json`)

### Frontend
- **Framework**: Next.js 15 (React)
- **Styling**: Tailwind CSS
- **Components**: Lucide Icons, Custom UI components
- **State Management**: React Hooks & Fetch API

## 📋 Getting Started

### Prerequisites
- Python 3.12 or higher
- Node.js 18 or higher
- npm or yarn

### Installation & Setup

#### 1. Backend Setup
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt  # Or use the pyproject.toml dependencies
```

#### 2. Frontend Setup
```powershell
cd frontend
npm install
```

### Running the Application

#### Start Backend
```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

#### Start Frontend
```powershell
cd frontend
npm run dev
```
The application will be available at `http://localhost:3000`.

## 📂 Project Structure

- `backend/`: FastAPI application, API endpoints, and local data storage.
- `frontend/`: Next.js application with a modern, responsive UI.
- `9_Agent_SaaS/`: Integration modules for Agent-based SaaS features.

## 🛡 License
Distributed under the MIT License. See `LICENSE` for more information.

---
Built with ❤️ by Platzer Günter
