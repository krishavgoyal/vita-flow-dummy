// src/api/apiClient.js
import axios from 'axios';

const apiClient = axios.create({
  // This uses VITE_API_URL=http://localhost:5000 from your .env
  baseURL: import.meta.env.VITE_API_URL, 
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;