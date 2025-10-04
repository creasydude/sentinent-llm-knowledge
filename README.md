# LLM Knowledge Collector App For Sentinent

This project is a web application designed for collecting user-generated knowledge (Datasets) to train a Large Language Model (LLM). It features a Nest.js backend and a Next.js (React) frontend, with user authentication via OTP, a points system, and integration with an LLM API for question generation.

## DEMO
https://github.com/user-attachments/assets/5e479102-a1ef-4305-87ad-d58c45029176

### Key Features:

- **User Authentication:** OTP-based authentication using email.
- **Database:** SQLite with TypeORM for object-relational mapping.
- **LLM Integration:** Generates knowledge questions using an LLM API (e.g., Google Gemini).
- **Questions & Answers:** CRUD operations for questions and user-submitted answers, including a daily submission limit and duplicate answer checking.
- **Points System:** Awards points to users for submitting answers, with additional points for "good" answers validated by an admin.
- **Admin Functionality:** Endpoints for managing users, validating answers, and exporting datasets.

### Technologies Used:

- Next.js
- TypeORM
- SQLite
- JWT for authentication
- LLM API (You Can Use Dobby API)

## Scripts

- `npm run dev` � Start Next.js dev server
- `npm run build` � Build for production
- `npm start` � Start production server


## Environment Variables

Add the following variables to your `.env.local` file:

```env
NEXT_PUBLIC_API_URL=/api
JWT_SECRET=your_jwt_secret_here

EMAIL_HOST=your_email_host_here
EMAIL_USER=your_email_user_here
EMAIL_PASS=your_email_password_here
EMAIL_PORT=your_email_port_here
EMAIL_SECURE=true_or_false_here
GEMINI_API_KEY=your_gemini_api_key_here
ADMIN_TEST_EMAIL=admin_email@example.com
ADMIN_TEST_OTP=example_otp_here
ADMIN_TEST_SKIP_EMAIL=true_or_false_here
NEXT_PUBLIC_ADMIN_TEST_EMAIL=admin_email@example.com
NEXT_PUBLIC_ADMIN_TEST_OTP=example_otp_here
DATABASE_SSL=true
DATABASE_URL=postgresql://user:password@localhost:5432/mydatabase
USE_MAILTRAP=true
MAILTRAP_TOKEN=token
EMAIL_FROM=email domain
```
## Contributing

Contributions are welcome! Please follow standard GitHub flow: fork the repository, create a new branch for your features or bug fixes, and submit a pull request.

## License

[Specify your project's license here, e.g., MIT License]