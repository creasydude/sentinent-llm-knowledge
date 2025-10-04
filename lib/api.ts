
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const sendOtp = async (email: string) => {
  return api.post("/auth/login", { email });
};

export const verifyOtp = async (email: string, otp: string) => {
  return api.post("/auth/verify", { email, otp });
};

export const getProfile = async () => {
  return api.get("/users/me/profile");
};

export const getUnansweredQuestion = async () => {
  return api.get("/questions/unanswered");
};

export const submitAnswer = async (questionId: string, answerText: string) => {
  return api.post("/answers", { questionId, answerText });
};

export const getUsers = async () => {
  return api.get("/admin/users");
};

export const getAnswers = async () => {
  return api.get("/admin/answers");
};

export const validateAnswer = async (answerId: string) => {
  return api.post(`/admin/answers/${answerId}/validate`);
};

export const promoteUser = async (userId: string) => {
  return api.post(`/admin/users/${userId}/promote`);
};

export const demoteUser = async (userId: string) => {
  return api.post(`/admin/users/${userId}/demote`);
};

export const exportAnswers = async () => {
  return api.get("/admin/datasets/export", { responseType: "blob" });
};

export const createQuestion = async (topic: string) => {
  return api.post("/questions/generate", { topic });
};
