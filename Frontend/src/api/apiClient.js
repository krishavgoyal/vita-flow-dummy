// // src/api/apiClient.js
// import axios from 'axios';

// const apiClient = axios.create({
//   // This uses VITE_API_URL=http://localhost:5000 from your .env
//   baseURL: import.meta.env.VITE_API_URL, 
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

// export default apiClient;

import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const loginUser = (data) => API.post("/api/auth/login", data);
export const signUpUser = (data) => API.post("/api/auth/signup", data);

// Consultants
export const getConsultants = () => API.get("/api/consultants");

// Diet
export const generateDiet = (data) => API.post("/api/diet/generate", data);

// Exercise
export const generateWorkout = (data) => API.post("/api/exercise/generate", data);

// User
export const updateProfile = (data) => API.put("/api/user/profile", data);