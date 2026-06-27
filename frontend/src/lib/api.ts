import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  login: (username: string, password: string) => api.post("/auth/login", { username, password }),
  me: () => api.get("/auth/me"),
  updateMe: (data: any) => api.put("/auth/me", data),
  changePassword: (data: any) => api.post("/auth/change-password", data),
};

// Clear / Reset data
export const clearAPI = {
  goals: () => api.delete("/goals/clear"),
  tasks: () => api.delete("/tasks/clear"),
  habits: () => api.delete("/habits/clear"),
  finance: () => api.delete("/finance/clear"),
  health: () => api.delete("/health/clear"),
  journal: () => api.delete("/journal/clear"),
};

// Users (admin)
export const usersAPI = {
  list: () => api.get("/users"),
  create: (data: any) => api.post("/users", data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get("/dashboard"),
};

// Goals
export const goalsAPI = {
  list: (params?: any) => api.get("/goals", { params }),
  get: (id: string) => api.get(`/goals/${id}`),
  create: (data: any) => api.post("/goals", data),
  update: (id: string, data: any) => api.put(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
  addSubGoal: (goalId: string, data: any) => api.post(`/goals/${goalId}/sub-goals`, data),
  updateSubGoal: (goalId: string, sgId: string, data: any) => api.put(`/goals/${goalId}/sub-goals/${sgId}`, data),
  deleteSubGoal: (goalId: string, sgId: string) => api.delete(`/goals/${goalId}/sub-goals/${sgId}`),
  addMilestone: (goalId: string, data: any) => api.post(`/goals/${goalId}/milestones`, data),
};

// Habits
export const habitsAPI = {
  list: (activeOnly?: boolean) => api.get("/habits", { params: { active_only: activeOnly } }),
  get: (id: string) => api.get(`/habits/${id}`),
  create: (data: any) => api.post("/habits", data),
  update: (id: string, data: any) => api.put(`/habits/${id}`, data),
  delete: (id: string) => api.delete(`/habits/${id}`),
  toggle: (id: string, data: any) => api.post(`/habits/${id}/toggle`, data),
  getLogs: (id: string, params?: any) => api.get(`/habits/${id}/logs`, { params }),
  getHeatmap: (year?: number) => api.get("/habits/heatmap/all", { params: { year } }),
};

// Tasks
export const tasksAPI = {
  list: (params?: any) => api.get("/tasks", { params }),
  create: (data: any) => api.post("/tasks", data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  reorder: (taskIds: string[]) => api.post("/tasks/reorder", { task_ids: taskIds }),
  today: () => api.get("/tasks/today/list"),
};

// Finance
export const financeAPI = {
  listTransactions: (params?: any) => api.get("/finance/transactions", { params }),
  createTransaction: (data: any) => api.post("/finance/transactions", data),
  updateTransaction: (id: string, data: any) => api.put(`/finance/transactions/${id}`, data),
  deleteTransaction: (id: string) => api.delete(`/finance/transactions/${id}`),
  getSummary: (params?: any) => api.get("/finance/summary", { params }),
  listBudgets: (params?: any) => api.get("/finance/budgets", { params }),
  createBudget: (data: any) => api.post("/finance/budgets", data),
  deleteBudget: (id: string) => api.delete(`/finance/budgets/${id}`),
  listSavingsGoals: () => api.get("/finance/savings-goals"),
  createSavingsGoal: (data: any) => api.post("/finance/savings-goals", data),
  updateSavingsGoal: (id: string, data: any) => api.put(`/finance/savings-goals/${id}`, data),
  deleteSavingsGoal: (id: string) => api.delete(`/finance/savings-goals/${id}`),
  getMonthlyChart: (year?: number) => api.get("/finance/chart/monthly", { params: { year } }),
};

// Health
export const healthAPI = {
  listWeight: (limit?: number) => api.get("/health/weight", { params: { limit } }),
  createWeight: (data: any) => api.post("/health/weight", data),
  deleteWeight: (id: string) => api.delete(`/health/weight/${id}`),
  listMeasurements: () => api.get("/health/measurements"),
  createMeasurement: (data: any) => api.post("/health/measurements", data),
  listActivities: (limit?: number) => api.get("/health/activities", { params: { limit } }),
  createActivity: (data: any) => api.post("/health/activities", data),
  deleteActivity: (id: string) => api.delete(`/health/activities/${id}`),
  getHealthLogs: (limit?: number) => api.get("/health/logs", { params: { limit } }),
  getTodayLog: () => api.get("/health/logs/today"),
  upsertHealthLog: (data: any) => api.post("/health/logs", data),
  getSummary: () => api.get("/health/summary"),
};

// Journal
export const journalAPI = {
  list: (params?: any) => api.get("/journal", { params }),
  today: () => api.get("/journal/today"),
  get: (id: string) => api.get(`/journal/${id}`),
  create: (data: any) => api.post("/journal", data),
  update: (id: string, data: any) => api.put(`/journal/${id}`, data),
  delete: (id: string) => api.delete(`/journal/${id}`),
  getMoodChart: (days?: number) => api.get("/journal/stats/mood-chart", { params: { days } }),
};

// Reports
export const reportsAPI = {
  weekly: () => api.get("/reports/weekly"),
  monthly: (params?: any) => api.get("/reports/monthly", { params }),
};

// Analytics
export const analyticsAPI = {
  productivity: (days?: number) => api.get("/analytics/productivity", { params: { days } }),
  habits: () => api.get("/analytics/habits"),
  finance: (year?: number) => api.get("/analytics/finance", { params: { year } }),
  health: (days?: number) => api.get("/analytics/health", { params: { days } }),
  goals: () => api.get("/analytics/goals"),
};
