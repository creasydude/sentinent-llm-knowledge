# LLM Knowledge Collector App

This project is a web application designed for collecting user-generated knowledge to train a Large Language Model (LLM). It features a Nest.js backend and a Next.js (React) frontend, with user authentication via OTP, a points system, and integration with an LLM API for question generation.

## Project Structure

The project is organized into two main directories:

- `backend/`: Contains the Nest.js application.
- `frontend/`: Contains the Next.js (React) application.

```
llm-knowledge/
├── backend/
└── frontend/
```

## Backend (Nest.js)

The backend is built with Nest.js and provides the API endpoints for the frontend.

### Key Features:

- **User Authentication:** OTP-based authentication using email.
- **Database:** SQLite with TypeORM for object-relational mapping.
- **LLM Integration:** Generates knowledge questions using an LLM API (e.g., Google Gemini).
- **Questions & Answers:** CRUD operations for questions and user-submitted answers, including a daily submission limit and duplicate answer checking.
- **Points System:** Awards points to users for submitting answers, with additional points for "good" answers validated by an admin.
- **Admin Functionality:** Endpoints for managing users, validating answers, and exporting datasets.

### Technologies Used:

- Nest.js
- TypeORM
- SQLite
- JWT for authentication
- Google Gemini API (or similar LLM API)

## Frontend (Next.js / React)

The frontend is built with Next.js and React, providing a modern and responsive user interface.

### Key Features:

- **Authentication Flow:** UI for OTP login and verification.
- **Main Dashboard:** Displays questions for users to answer.
- **User Profile:** Shows the logged-in user's email and points.
- **Admin Dashboard:** Provides an interface for admin operations (user management, answer validation, data export).

### Technologies Used:

- Next.js
- React
- Tailwind CSS for styling
- Axios for API calls

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- Node.js (LTS version recommended)
- npm (Node Package Manager) or yarn

### 1. Backend Setup

Navigate to the `backend` directory and install dependencies:

```bash
cd backend
npm install
```

### 2. Frontend Setup

Navigate to the `frontend` directory and install dependencies:

```bash
cd frontend
npm install
```

### 3. Environment Variables

Create a `.env` file in the `backend` directory and configure your LLM API key and any other necessary environment variables.

Example `.env` for backend:

```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
# Add other environment variables as needed, e.g., for email service
```

### 4. Running the Project

A convenient bash script `start.sh` is provided in the project root to run both the frontend and backend simultaneously.

First, ensure the script is executable:

```bash
chmod +x start.sh
```

Then, run the script from the project root directory:

```bash
./start.sh
```

This script will:
- Start the Nest.js backend (usually on `http://localhost:3000` by default).
- Start the Next.js frontend (usually on `http://localhost:3001` by default).
- Redirect the output of both processes to `backend.log` and `frontend.log` files in the project root.

### Managing Processes

The `start.sh` script will output the Process IDs (PIDs) of both the backend and frontend.

To stop individual processes or both:

- **To stop the backend:** `kill <BACKEND_PID>`
- **To stop the frontend:** `kill <FRONTEND_PID>`
- **To stop both:** `kill <BACKEND_PID> <FRONTEND_PID>`

You can check the `backend.log` and `frontend.log` files in the project root for detailed output and any errors from the respective applications.

## Development

### Backend Development

To run the backend in development mode (with hot-reloading), navigate to the `backend` directory and run:

```bash
npm run start:dev
```

### Frontend Development

To run the frontend in development mode, navigate to the `frontend` directory and run:

```bash
npm run dev
```

## API Endpoints (Backend)

Here's a summary of the main API endpoints:

### Authentication
- `POST /auth/login`: Request an OTP for login.
- `POST /auth/verify`: Verify OTP and get a JWT.

### User
- `GET /users/me/profile`: Get the logged-in user's profile information (email, points).

### Questions
- `GET /questions/unanswered`: Get an unanswered question for the user.

### Answers
- `POST /answers`: Submit an answer to a question.

### Admin (Requires Admin Role)
- `GET /admin/users`: List all users.
- `GET /admin/answers`: List all submitted answers (with optional filters).
- `POST /admin/answers/:id/validate`: Validate an answer and award points.
- `GET /admin/datasets/export`: Export validated answers as a dataset.
- `POST /admin/questions`: Trigger question generation via LLM.

## Contributing

Contributions are welcome! Please follow standard GitHub flow: fork the repository, create a new branch for your features or bug fixes, and submit a pull request.

## License

[Specify your project's license here, e.g., MIT License]
