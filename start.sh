#!/bin/bash

echo "Starting backend..."
cd backend
npm run start:dev &> ../backend.log &
BACKEND_PID=$!
cd ..
echo "Backend started with PID: $BACKEND_PID. Log: backend.log"

echo "Starting frontend..."
cd frontend
npm run dev &> ../frontend.log &
FRONTEND_PID=$!
cd ..
echo "Frontend started with PID: $FRONTEND_PID. Log: frontend.log"

echo ""
echo "---------------------------------------------------"
echo "Project Status:"
echo "---------------------------------------------------"
echo "Backend (Nest.js): Running (PID: $BACKEND_PID)"
echo "Frontend (Next.js): Running (PID: $FRONTEND_PID)"
echo "---------------------------------------------------"
echo ""
echo "To stop the backend: kill $BACKEND_PID"
echo "To stop the frontend: kill $FRONTEND_PID"
echo "To stop both: kill $BACKEND_PID $FRONTEND_PID"
echo "Logs are redirected to backend.log and frontend.log in the project root."
