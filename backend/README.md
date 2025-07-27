# LLM Knowledge Collector Backend (Nest.js)

This is the backend for the LLM Knowledge Collector application, built with Nest.js. It handles user authentication, question generation via an LLM, answer submission, a points system, and admin functionalities.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Environment Variables](#environment-variables)
- [Admin Setup](#admin-setup)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [User Profile](#user-profile)
  - [Questions](#questions)
  - [Answers](#answers)
  - [Admin Endpoints (Admin Only)](#admin-endpoints-admin-only)

## Prerequisites

Before you begin, ensure you have the following installed:

-   [Node.js](https://nodejs.org/en/) (LTS version recommended)
-   [npm](https://www.npmjs.com/) (comes with Node.js)
-   [NestJS CLI](https://docs.nestjs.com/cli/overview) (install globally: `npm i -g @nestjs/cli`)

## Installation

1.  Navigate into the `backend` directory:
    ```bash
    cd /path/to/llm-knowledge/backend
    ```
2.  Install the project dependencies:
    ```bash
    npm install
    ```

## Running the Application

To run the application in development mode:

```bash
nest run start:dev
```

The application will typically run on `http://localhost:3000`.

## Environment Variables

Create a `.env` file in the root of the `backend` directory and populate it with the following variables:

```env
# JWT Secret for token generation
JWT_SECRET=your_jwt_secret_key_here

# OTP Secret for hashing OTPs
OTP_SECRET=your_otp_secret_key_here

# Google Gemini API Key for LLM integration
GEMINI_API_KEY=your_gemini_api_key_here

# Email Service Configuration (for sending OTPs) - Example using Ethereal Mail for testing
# You can get credentials from https://ethereal.email/
EMAIL_SERVICE_HOST=smtp.ethereal.email
EMAIL_SERVICE_PORT=587
EMAIL_SERVICE_USER=your_ethereal_email@ethereal.email
EMAIL_SERVICE_PASS=your_ethereal_password
```

**Note:** For production, use a robust email service provider (e.g., SendGrid, Mailgun, AWS SES) and secure your environment variables appropriately.

## Admin Setup

The application uses SQLite for its database (`db.sqlite` will be created in the project root on first run). To grant admin privileges to a user:

1.  Ensure the application has been run at least once to create the `db.sqlite` file.
2.  Open the `db.sqlite` file using a SQLite client (e.g., `sqlite3` CLI, DB Browser for SQLite).
3.  Execute the following SQL command, replacing `user@example.com` with the email of the user you wish to make an admin:

    ```sql
    UPDATE user SET isAdmin = 1 WHERE email = 'user@example.com';
    ```

## API Endpoints

All endpoints are prefixed with `/api` (e.g., `http://localhost:3000/api/auth/login`).

### Authentication

-   **Request OTP**
    -   `POST /auth/login`
    -   **Description:** Sends an OTP to the provided email address.
    -   **Request Body:**
        ```json
        {
            "email": "user@example.com"
        }
        ```
    -   **Response:**
        ```json
        {
            "message": "OTP sent to user@example.com"
        }
        ```

-   **Verify OTP**
    -   `POST /auth/verify`
    -   **Description:** Verifies the OTP and returns a JWT token upon success.
    -   **Request Body:**
        ```json
        {
            "email": "user@example.com",
            "otp": "123456"
        }
        ```
    -   **Response (Success):**
        ```json
        {
            "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "user": {
                "id": "uuid-of-user",
                "email": "user@example.com",
                "isAdmin": false,
                "points": 0
            }
        }
        ```
    -   **Response (Failure):**
        ```json
        {
            "statusCode": 401,
            "message": "Invalid OTP or OTP expired"
        }
        ```

### User Profile

-   **Get User Profile**
    -   `GET /users/me/profile`
    -   **Description:** Retrieves the profile information of the authenticated user.
    -   **Headers:**
        ```
        Authorization: Bearer <your_jwt_token>
        ```
    -   **Response:**
        ```json
        {
            "id": "uuid-of-user",
            "email": "user@example.com",
            "points": 100,
            "dailyAnswerCount": 3,
            "lastAnswerDate": "2025-07-26T10:00:00.000Z",
            "isAdmin": false
        }
        ```

### Questions

-   **Get Unanswered Question**
    -   `GET /questions/unanswered`
    -   **Description:** Fetches a single question that has not yet been answered by the current user.
    -   **Headers:**
        ```
        Authorization: Bearer <your_jwt_token>
        ```
    -   **Response:**
        ```json
        {
            "id": "uuid-of-question",
            "text": "What are the primary differences between supervised and unsupervised machine learning?",
            "topic": "Machine Learning",
            "isAnswered": false
        }
        ```
    -   **Response (No questions available):**
        ```json
        {
            "statusCode": 404,
            "message": "No unanswered questions available."
        }
        ```

### Answers

-   **Submit Answer**
    -   `POST /answers`
    -   **Description:** Submits an answer to a specific question. Awards 10 points for submission and updates daily answer count.
    -   **Headers:**
        ```
        Authorization: Bearer <your_jwt_token>
        ```
    -   **Request Body:**
        ```json
        {
            "questionId": "uuid-of-question",
            "answerText": "Supervised learning uses labeled data, while unsupervised learning works with unlabeled data to find patterns."
        }
        ```
    -   **Response (Success):**
        ```json
        {
            "id": "uuid-of-answer",
            "text": "Supervised learning uses labeled data, while unsupervised learning works with unlabeled data to find patterns.",
            "questionId": "uuid-of-question",
            "userId": "uuid-of-user",
            "isGoodAnswer": false
        }
        ```
    -   **Response (Daily Limit Reached):**
        ```json
        {
            "statusCode": 403,
            "message": "Daily answer submission limit reached. You can submit up to 5 answers per day."
        }
        ```
    -   **Response (Duplicate Answer):**
        ```json
        {
            "statusCode": 400,
            "message": "Similar answer already exists for this question."
        }
        ```

### Admin Endpoints (Admin Only)

These endpoints require an admin JWT token.

-   **List All Users**
    -   `GET /admin/users`
    -   **Description:** Retrieves a list of all registered users.
    -   **Headers:**
        ```
        Authorization: Bearer <your_admin_jwt_token>
        ```
    -   **Response:**
        ```json
        [
            {
                "id": "uuid-of-user1",
                "email": "user1@example.com",
                "points": 50,
                "isAdmin": false
            },
            {
                "id": "uuid-of-admin",
                "email": "admin@example.com",
                "points": 200,
                "isAdmin": true
            }
        ]
        ```

-   **List All Answers**
    -   `GET /admin/answers`
    -   **Description:** Retrieves a list of all submitted answers.
    -   **Query Parameters:**
        -   `validated`: `true` or `false` (optional, filters by validation status)
    -   **Headers:**
        ```
        Authorization: Bearer <your_admin_jwt_token>
        ```
    -   **Response:**
        ```json
        [
            {
                "id": "uuid-of-answer1",
                "text": "Answer text 1",
                "questionId": "uuid-of-question1",
                "userId": "uuid-of-user1",
                "isGoodAnswer": false
            },
            {
                "id": "uuid-of-answer2",
                "text": "Answer text 2",
                "questionId": "uuid-of-question2",
                "userId": "uuid-of-user2",
                "isGoodAnswer": true
            }
        ]
        ```

-   **Validate Answer**
    -   `POST /admin/answers/:id/validate`
    -   **Description:** Marks an answer as "good" and awards an additional 10 points to the user who submitted it.
    -   **Headers:**
        ```
        Authorization: Bearer <your_admin_jwt_token>
        ```
    -   **URL Parameters:**
        -   `:id`: The ID of the answer to validate.
    -   **Response:**
        ```json
        {
            "message": "Answer validated and points awarded."
        }
        ```

-   **Export Dataset**
    -   `GET /admin/datasets/export`
    -   **Description:** Exports all validated answers (where `isGoodAnswer` is `true`) as a JSON array suitable for LLM training.
    -   **Headers:**
        ```
        Authorization: Bearer <your_admin_jwt_token>
        ```
    -   **Response:**
        ```json
        [
            {
                "instruction": "What is the capital of France?",
                "output": "Paris"
            },
            {
                "instruction": "Explain the concept of recursion in programming.",
                "output": "Recursion is a programming technique where a function calls itself to solve a problem, breaking it down into smaller, similar subproblems."
            }
        ]
        ```