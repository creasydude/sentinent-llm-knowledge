# LLM Knowledge Collector Frontend

This is the frontend application for the LLM Knowledge Collector, built with Next.js and Tailwind CSS. It provides a user interface for OTP-based authentication, answering LLM-generated questions, and an admin panel for managing users, answers, and questions.

## Features

-   **User Authentication:** Secure OTP (One-Time Password) based login and verification.
-   **Question Answering:** Users can fetch and submit answers to LLM-generated questions.
-   **Daily Answer Limit:** Enforces a daily limit on answer submissions per user.
-   **Points System:** Users earn points for submitting answers.
-   **User Profile:** Displays user's email, total points, daily answer count, and admin status.
-   **Admin Panel (Admin Users Only):**
    -   User Management: View and toggle admin status for users.
    -   Submission Review: View and validate user-submitted answers.
    -   Data Export: Export validated answers as a JSON dataset for LLM training.
    -   Question Creation: Admins can manually create new questions.

## Installation

1.  Navigate into the `frontend` directory:
    ```bash
    cd /path/to/llm-knowledge/frontend
    ```
2.  Install the project dependencies:
    ```bash
    npm install
    ```

## Running the Application

To run the application in development mode:

```bash
npm run dev
```

The application will typically run on `http://localhost:3000`.

## Environment Variables

Create a `.env.local` file in the root of the `frontend` directory and populate it with the following variable:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Note:** Ensure `NEXT_PUBLIC_API_URL` points to your running backend API. The default assumes the backend is running on `http://localhost:3001` and its API endpoints are prefixed with `/api`.