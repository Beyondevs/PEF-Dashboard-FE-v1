import { apiClient } from './api-client';
import type {
  Division,
  District,
  Tehsil,
  School,
  Session,
  Attendance,
  Assessment,
  Resource,
  WeeklySummary,
  TeacherKPI,
} from '@/types';

// Auth
export async function login(body: { identifier: string; password: string }) {
  return apiClient.post<{ accessToken: string; refreshToken: string; role: 'admin' | 'client' | 'trainer' | 'teacher' | 'student'; user: { id: string; email: string | null; role: 'admin' | 'client' | 'trainer' | 'teacher' | 'student'; name?: string | null } }>(
    '/auth/login',
    body,
  );
}

export async function getProfile() {
  return apiClient.get<{ id: string; email: string; role: 'admin' | 'client' | 'trainer' | 'teacher'; profile?: { name?: string; cnic?: string; [key: string]: any } }>('/auth/me');
}

export async function refresh(refreshToken: string) {
  return apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
}

// Geography
export const getDivisions = () => apiClient.get<Division[]>('/divisions');
export const createDivision = (data: Partial<Division>) => apiClient.post<Division>('/divisions', data);
export const updateDivision = (id: string, data: Partial<Division>) => apiClient.patch<Division>(`/divisions/${id}`, data);
export const deleteDivision = (id: string) => apiClient.delete(`/divisions/${id}`);

export const getDistricts = (divisionId?: string) =>
  apiClient.get<District[]>(divisionId ? `/districts?divisionId=${encodeURIComponent(divisionId)}` : '/districts');
export const createDistrict = (data: Partial<District>) => apiClient.post<District>('/districts', data);
export const updateDistrict = (id: string, data: Partial<District>) => apiClient.patch<District>(`/districts/${id}`, data);
export const deleteDistrict = (id: string) => apiClient.delete(`/districts/${id}`);

export const getTehsils = (districtId?: string) =>
  apiClient.get<Tehsil[]>(districtId ? `/tehsils?districtId=${encodeURIComponent(districtId)}` : '/tehsils');
export const createTehsil = (data: Partial<Tehsil>) => apiClient.post<Tehsil>('/tehsils', data);
export const updateTehsil = (id: string, data: Partial<Tehsil>) => apiClient.patch<Tehsil>(`/tehsils/${id}`, data);
export const deleteTehsil = (id: string) => apiClient.delete(`/tehsils/${id}`);

export const getSchools = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: School[]; page: number; pageSize: number; total: number }>(`/schools${qs ? `?${qs}` : ''}`);
};
export const getSchoolById = (id: string) => apiClient.get<School>(`/schools/${id}`);
export const createSchool = (data: Partial<School>) => apiClient.post<School>('/schools', data);
export const updateSchool = (id: string, data: Partial<School>) => apiClient.patch<School>(`/schools/${id}`, data);
export const deleteSchool = (id: string) => apiClient.delete(`/schools/${id}`);

// Sessions
export const getSessions = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: Session[]; page: number; pageSize: number; total: number }>(`/sessions${qs ? `?${qs}` : ''}`);
};
export const getSessionById = (id: string) => apiClient.get<Session>(`/sessions/${id}`);
export const createSession = (data: Partial<Session>) => apiClient.post<Session>('/sessions', data);
export const updateSession = (id: string, data: Partial<Session>) => apiClient.patch<Session>(`/sessions/${id}`, data);
export const deleteSession = (id: string) => apiClient.delete(`/sessions/${id}`);
export const publishSession = (id: string) => apiClient.post<Session>(`/sessions/${id}/publish`, {});

// Attendance
export const getSessionAttendance = (id: string) => apiClient.get<{ session: any; teachers: any[]; students: any[] }>(`/attendance/sessions/${id}`);
export const bulkUpsertAttendance = (id: string, body: any) => apiClient.put(`/attendance/sessions/${id}`, body);
export const toggleAttendance = (id: string) => apiClient.patch(`/attendance/${id}`, {});
export const getAttendanceList = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: Attendance[]; page: number; pageSize: number; total: number }>(`/attendance${qs ? `?${qs}` : ''}`);
};

// Assessments
export const getAssessments = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: Assessment[]; page: number; pageSize: number; total: number }>(`/assessments${qs ? `?${qs}` : ''}`);
};
export const bulkUpsertAssessments = (sessionId: string, body: any) => apiClient.put(`/assessments/sessions/${sessionId}`, body);
export const updateAssessment = (id: string, body: any) => apiClient.patch(`/assessments/${id}`, body);

// Leaderboard
export const getTeacherLeaderboard = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<Array<{ teacher: any; metrics: TeacherKPI; rank: number }>>(`/leaderboard/teachers${qs ? `?${qs}` : ''}`);
};
export const getTeacherKPI = (id: string) => apiClient.get<TeacherKPI[]>(`/leaderboard/teachers/${id}/kpi`);

// Resources
export const getResources = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: Resource[]; page: number; pageSize: number; total: number }>(`/resources${qs ? `?${qs}` : ''}`);
};
export const createResource = (body: Partial<Resource>) => apiClient.post<Resource>('/resources', body);
export const updateResourceApi = (id: string, body: Partial<Resource>) => apiClient.patch<Resource>(`/resources/${id}`, body);
export const deleteResourceApi = (id: string) => apiClient.delete(`/resources/${id}`);

// Reports
export const getDashboardSummary = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/reports/dashboard-summary${qs ? `?${qs}` : ''}`);
};
export const getTodayActivity = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/reports/today-activity${qs ? `?${qs}` : ''}`);
};
export const getDrilldownReport = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/reports/drilldown${qs ? `?${qs}` : ''}`);
};

// Dashboard Aggregate
export const getDashboardAggregate = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/dashboard${qs ? `?${qs}` : ''}`);
};

// Paper Registers
export const getPaperRegisters = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; total: number }>(`/paper-registers${qs ? `?${qs}` : ''}`);
};
export const createPaperRegister = (body: any) => apiClient.post('/paper-registers', body);

// Weekly Summaries
export const getWeeklySummaries = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: WeeklySummary[]; page: number; pageSize: number; total: number }>(`/weekly-summaries${qs ? `?${qs}` : ''}`);
};
export const createWeeklySummary = (body: Partial<WeeklySummary>) => apiClient.post<WeeklySummary>('/weekly-summaries', body);

// Users - Trainers
export const getTrainers = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; total: number }>(`/trainers${qs ? `?${qs}` : ''}`);
};
export const createTrainer = (data: any) => apiClient.post('/trainers', data);
export const updateTrainer = (id: string, data: any) => apiClient.patch(`/trainers/${id}`, data);
export const deleteTrainer = (id: string) => apiClient.delete(`/trainers/${id}`);

// Users - Teachers
export const getTeachers = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; total: number }>(`/teachers${qs ? `?${qs}` : ''}`);
};
export const createTeacher = (data: any) => apiClient.post('/teachers', data);
export const updateTeacher = (id: string, data: any) => apiClient.patch(`/teachers/${id}`, data);
export const deleteTeacher = (id: string) => apiClient.delete(`/teachers/${id}`);

// Users - Students
export const getStudents = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; total: number }>(`/students${qs ? `?${qs}` : ''}`);
};
export const createStudent = (data: any) => apiClient.post('/students', data);
export const updateStudent = (id: string, data: any) => apiClient.patch(`/students/${id}`, data);
export const deleteStudent = (id: string) => apiClient.delete(`/students/${id}`);


