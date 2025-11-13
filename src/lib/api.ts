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
  return apiClient.get<{
    data: Assessment[];
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  }>(`/assessments${qs ? `?${qs}` : ''}`);
};
export const bulkUpsertStudentAssessments = (sessionId: string, body: any) => apiClient.put(`/assessments/sessions/${sessionId}/students`, body);
export const bulkUpsertTeacherAssessments = (sessionId: string, body: any) => apiClient.put(`/assessments/sessions/${sessionId}/teachers`, body);
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
export const getDistrictComparisonReport = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/reports/district-comparison${qs ? `?${qs}` : ''}`);
};
export const getTodayActivityReport = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/reports/today-activity${qs ? `?${qs}` : ''}`);
};

// Dashboard Aggregate (deprecated - use individual APIs)
export const getDashboardAggregate = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/dashboard${qs ? `?${qs}` : ''}`);
};

// Dashboard - Stat Cards APIs
export const getActiveTeachersStats = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ active: number; taught: number }>(`/dashboard/stats/active-teachers${qs ? `?${qs}` : ''}`);
};

export const getActiveStudentsStats = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ active: number; taught: number }>(`/dashboard/stats/active-students${qs ? `?${qs}` : ''}`);
};

export const getSessionsStats = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ total: number }>(`/dashboard/stats/sessions${qs ? `?${qs}` : ''}`);
};

export const getActiveSchoolsStats = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ active: number }>(`/dashboard/stats/active-schools${qs ? `?${qs}` : ''}`);
};

export const getAttendanceRateStats = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ rate: number }>(`/dashboard/stats/attendance-rate${qs ? `?${qs}` : ''}`);
};

// Dashboard - Chart Data APIs
export const getAttendanceTrendsChart = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: Array<{ date: string; teachers: number; students: number; both: number }> }>(`/dashboard/charts/attendance-trends${qs ? `?${qs}` : ''}`);
};

export const getTodayAttendanceChart = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ present: number; absent: number; total: number }>(`/dashboard/charts/today-attendance${qs ? `?${qs}` : ''}`);
};

export const getWeekdayDistributionChart = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: Array<{ day: string; sessions: number }> }>(`/dashboard/charts/weekday-distribution${qs ? `?${qs}` : ''}`);
};

export const getSessionsProgressChart = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: Array<{ date: string; sessions: number; attendanceRate: number; teachersRate: number; studentsRate: number }> }>(`/dashboard/charts/sessions-progress${qs ? `?${qs}` : ''}`);
};

// Dashboard - Today Section APIs
export const getTodaySessions = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: Array<{
    id: string;
    title: string | null;
    courseName: string | null;
    startTime: string | null;
    endTime: string | null;
    status: string | null;
    school: {
      id: string | null;
      name: string | null;
      divisionId: string | null;
      divisionName: string | null;
      districtId: string | null;
      districtName: string | null;
      tehsilId: string | null;
      tehsilName: string | null;
    } | null;
    attendance: {
      teachersPresent: number;
      teachersTotal: number;
      studentsPresent: number;
      studentsTotal: number;
    } | null;
  }> }>(`/dashboard/today/sessions${qs ? `?${qs}` : ''}`);
};

export const getTodayDistrictSummaries = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: Array<{
    districtId: string | null;
    districtName: string;
    sessions: number;
    totalSessions: number;
    teachersEnrolled: number;
    teachersPresent: number;
    studentsEnrolled: number;
    studentsPresent: number;
    schools: number;
  }> }>(`/dashboard/today/district-summaries${qs ? `?${qs}` : ''}`);
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

// ==================== DATA TRANSFER - IMPORT/EXPORT ====================

// Helper to create FormData for file upload
const createFormData = (file: File): FormData => {
  const formData = new FormData();
  formData.append('file', file);
  return formData;
};

// Helper to download blob response as file
const downloadBlob = async (url: string, filename: string): Promise<Blob> => {
  const response = await apiClient.getBlob(url);
  return response.data;
};

// Divisions
export const exportDivisions = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/divisions/export');
  return response.data;
};

export const importDivisions = async (file: File) => {
  const formData = createFormData(file);
  return apiClient.post('/data-transfer/divisions/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadDivisionsTemplate = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/divisions/template');
  return response.data;
};

// Districts
export const exportDistricts = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/districts/export');
  return response.data;
};

export const importDistricts = async (file: File) => {
  const formData = createFormData(file);
  return apiClient.post('/data-transfer/districts/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadDistrictsTemplate = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/districts/template');
  return response.data;
};

// Tehsils
export const exportTehsils = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/tehsils/export');
  return response.data;
};

export const importTehsils = async (file: File) => {
  const formData = createFormData(file);
  return apiClient.post('/data-transfer/tehsils/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadTehsilsTemplate = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/tehsils/template');
  return response.data;
};

// Schools
export const exportSchools = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/schools/export');
  return response.data;
};

export const importSchools = async (file: File) => {
  const formData = createFormData(file);
  return apiClient.post('/data-transfer/schools/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadSchoolsTemplate = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/schools/template');
  return response.data;
};

// Trainers
export const exportTrainers = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/trainers/export');
  return response.data;
};

export const importTrainersCSV = async (file: File) => {
  const formData = createFormData(file);
  return apiClient.post('/data-transfer/trainers/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadTrainersTemplate = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/trainers/template');
  return response.data;
};

// Teachers
export const exportTeachers = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/teachers/export');
  return response.data;
};

export const importTeachersCSV = async (file: File) => {
  const formData = createFormData(file);
  return apiClient.post('/data-transfer/teachers/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadTeachersTemplate = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/teachers/template');
  return response.data;
};

// Students
export const exportStudents = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/students/export');
  return response.data;
};

export const importStudentsCSV = async (file: File) => {
  const formData = createFormData(file);
  return apiClient.post('/data-transfer/students/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadStudentsTemplate = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/students/template');
  return response.data;
};

// Attendance
export const exportAttendance = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/data-transfer/attendance/export${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const importAttendanceCSV = async (file: File) => {
  const formData = createFormData(file);
  return apiClient.post('/data-transfer/attendance/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadAttendanceTemplate = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/attendance/template');
  return response.data;
};

// Assessments
export const exportAssessmentsCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/data-transfer/assessments/export${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const importAssessmentsCSV = async (file: File) => {
  const formData = createFormData(file);
  return apiClient.post('/data-transfer/assessments/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadAssessmentsTemplate = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/assessments/template');
  return response.data;
};

// Sessions
export const exportSessionsCSV = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/sessions/export');
  return response.data;
};

export const importSessionsCSV = async (file: File) => {
  const formData = createFormData(file);
  return apiClient.post('/data-transfer/sessions/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const downloadSessionsTemplate = async (): Promise<Blob> => {
  const response = await apiClient.getBlob('/data-transfer/sessions/template');
  return response.data;
};


