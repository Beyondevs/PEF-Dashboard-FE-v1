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
  return apiClient.post<{ accessToken: string; refreshToken: string; role: 'admin' | 'client' | 'trainer' | 'teacher' | 'student' | 'division_role'; user: { id: string; email: string | null; role: 'admin' | 'client' | 'trainer' | 'teacher' | 'student' | 'division_role'; name?: string | null } }>(
    '/auth/login',
    body,
  );
}

export async function getProfile() {
  return apiClient.get<{ id: string; email: string; role: 'admin' | 'client' | 'trainer' | 'teacher' | 'division_role'; profile?: { name?: string; cnic?: string; hasSignature?: boolean; division?: { id: string; name: string }; divisionId?: string; [key: string]: any } }>('/auth/me');
}

// Signature (trainer only)
export async function getSignature() {
  return apiClient.get<{ signatureSvg: string | null }>('/signature');
}
export async function uploadSignature(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post<{ success: boolean }>('/signature', formData);
}

export async function refresh(refreshToken: string) {
  return apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken });
}

export async function forgotPassword(body: { mobileNumber: string; oldPassword: string; newPassword: string; confirmPassword: string }) {
  return apiClient.post<{ message: string }>('/auth/forgot-password', body);
}

// Backup (Admin-only)
export const createDatabaseBackup = () => apiClient.post<{ success: boolean; message: string; filename: string }>(`/backup/create`, {});
export const listDatabaseBackups = () => apiClient.get<{ success: boolean; backups: Array<{ filename: string; size: number; sizeMB: string; createdAt: string }> }>(`/backup/list`);
export const deleteDatabaseBackup = (filename: string) => apiClient.delete<{ success: boolean; message: string }>(`/backup/${encodeURIComponent(filename)}`);
export const downloadDatabaseBackup = async (filename: string): Promise<Blob> => {
  const response = await apiClient.getBlob(`/backup/download/${encodeURIComponent(filename)}`);
  return response.data;
};
export const testWeeklyCleanup = () => apiClient.post<{ success: boolean; message: string; remainingBackups: number; backups: Array<{ filename: string; sizeMB: string; createdAt: string }> }>(`/backup/test/weekly-cleanup`, {});

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
export const toggleAttendance = (id: string, present?: boolean) => 
  apiClient.patch(`/attendance/${id}`, present !== undefined ? { present } : {});
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

// Leaderboard - Speaking Assessments Based
export const getTeacherLeaderboard = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{
    summary: {
      totalTeachers: number;
      averageLatestScore: number;
      averagePrePct?: number;
      averagePostPct?: number;
      averageImprovement: number;
      completedAllPhases: number;
      maxPossibleScore: number;
    };
    leaderboard: Array<{
      rank: number;
      teacher: {
        id: string;
        name: string;
        schoolId: string;
        school: string;
        district: string;
        division: string;
      };
      assessmentId: string;
      status: string;
      scores: {
        pre: number;
        mid: number;
        post: number;
        latest: number;
        latestPercentage: number;
        average: number;
        maxPossible: number;
      };
      improvement: {
        points: number;
        percentage: number;
      };
      phasesCompleted: number;
    }>;
  }>(`/leaderboard/teachers${qs ? `?${qs}` : ''}`);
};

export const getStudentLeaderboard = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{
    summary: {
      totalStudents: number;
      averageLatestScore: number;
      averagePrePct?: number;
      averagePostPct?: number;
      averageImprovement: number;
      completedAllPhases: number;
      maxPossibleScore: number;
    };
    leaderboard: Array<{
      rank: number;
      student: {
        id: string;
        name: string;
        rollNo: string | null;
        grade: string | null;
        schoolId: string;
        school: string;
        district: string;
        division: string;
      };
      assessmentId: string;
      status: string;
      scores: {
        pre: number;
        mid: number;
        post: number;
        latest: number;
        latestPercentage: number;
        average: number;
        maxPossible: number;
      };
      improvement: {
        points: number;
        percentage: number;
      };
      phasesCompleted: number;
    }>;
  }>(`/leaderboard/students${qs ? `?${qs}` : ''}`);
};

export const getTeacherImprovers = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/leaderboard/teachers/improvers${qs ? `?${qs}` : ''}`);
};

export const getStudentImprovers = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/leaderboard/students/improvers${qs ? `?${qs}` : ''}`);
};

export const getSchoolRankings = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/leaderboard/schools${qs ? `?${qs}` : ''}`);
};
export const getSchoolStarStats = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/leaderboard/schools/stars${qs ? `?${qs}` : ''}`);
};

export const getTeacherKPI = (id: string) => apiClient.get<any>(`/leaderboard/teachers/${id}/kpi`);

/** Clear leaderboard caches so next load uses fresh DB data (e.g. after running marks-increase seed). */
export const clearLeaderboardCache = () =>
  apiClient.post<{ message: string; keysDeleted?: number }>('/leaderboard/recalculate', {});

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
export const getAttendanceMarkingStatus = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/reports/attendance-marking-status${qs ? `?${qs}` : ''}`);
};

export const getSchoolHoursReport = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/reports/school-hours${qs ? `?${qs}` : ''}`);
};

export const getSchoolHoursConsolidatedReport = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/reports/school-hours/consolidated${qs ? `?${qs}` : ''}`);
};

export const getSchoolHoursSchoolsList = (params: Record<string, string | number | boolean> = {}) => {
  const p = params || {};
  const parts = Object.entries(p)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  const qs = parts.length ? parts.join('&') : '';
  return apiClient.get<any>(`/reports/school-hours/schools${qs ? `?${qs}` : ''}`);
};

export const exportDistrictComparisonCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/data-transfer/reports/district-comparison/export${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const exportDrilldownCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/data-transfer/reports/drilldown/export${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const exportAttendanceMarkingCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/reports/export/attendance-marking${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const exportSchoolHoursCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/reports/school-hours/export${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const exportSchoolHoursSchoolsListCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/reports/school-hours/schools/export${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const exportSchoolHoursConsolidatedCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/reports/school-hours/consolidated/export${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const exportSchoolHoursConsolidatedAllSchoolsZip = async (
  params: Record<string, string | number | boolean> = {},
): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/reports/school-hours/consolidated/export-all-zip${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const getSchoolSummaryReport = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/reports/school-summary${qs ? `?${qs}` : ''}`);
};

export const exportSchoolSummaryCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/reports/school-summary/export${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const exportSchoolSummaryAllSchoolsZip = async (
  params: Record<string, string | number | boolean> = {},
): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/reports/school-summary/export-all-zip${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const getMonthlyAttendanceCalendar = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{
    persons: Array<{
      id: string;
      name: string;
      rollNo?: string;
      cnic?: string;
      school: { name: string; emisCode: string };
      attendance: Record<string, 'P' | 'A' | 'H' | 'NS' | null>;
    }>;
    personType: 'student' | 'teacher';
    month: number;
    year: number;
    totalDays: number;
    holidays: string[];
  }>(`/reports/monthly-attendance-calendar${qs ? `?${qs}` : ''}`);
};

export const exportMonthlyAttendanceCalendar = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/reports/monthly-attendance-calendar/export${qs ? `?${qs}` : ''}`);
  return response.data;
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
  return apiClient.get<{ 
    data: Array<{
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
    }>;
    summary?: {
      uniqueTeachers: number;
      uniqueStudents: number;
    };
  }>(`/dashboard/today/sessions${qs ? `?${qs}` : ''}`);
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

// Users - Admin portal users (admin, client, bnu, division_role only)
export const getAdminPortalUsers = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; totalItems?: number; total?: number }>(
    `/admin-portal-users${qs ? `?${qs}` : ''}`,
  );
};

// Users - Trainers
export const getTrainers = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; total: number }>(`/trainers${qs ? `?${qs}` : ''}`);
};
export const getTrainerById = (id: string) =>
  apiClient.get<{
    id: string;
    email: string | null;
    phone: string | null;
    role: string;
    trainerProfile: {
      id: string;
      name: string;
      cnic: string | null;
      qualification: string | null;
      certification: string | null;
      assignedSchools: string[];
      signatureSvg: string | null;
    } | null;
  }>(`/trainers/${id}`);
export const createTrainer = (data: any) => apiClient.post('/trainers', data);
export const updateTrainer = (id: string, data: any) => apiClient.patch(`/trainers/${id}`, data);
export const deleteTrainer = (id: string) => apiClient.delete(`/trainers/${id}`);
export const deleteTrainerSignature = (id: string) =>
  apiClient.delete<{ message: string }>(`/trainers/${id}/signature`);

// Users - Teachers
export const getTeachers = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; total: number }>(`/teachers${qs ? `?${qs}` : ''}`);
};
export const getTeachersMissingSpeakingAssessments = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; total: number }>(
    `/teachers/missing-speaking-assessments${qs ? `?${qs}` : ''}`,
  );
};
export const createTeacher = (data: any) => apiClient.post('/teachers', data);
export const updateTeacher = (id: string, data: any) => apiClient.patch(`/teachers/${id}`, data);
export const deleteTeacher = (id: string) => apiClient.delete(`/teachers/${id}`);

// Users - Students
export const getStudents = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; total: number }>(`/students${qs ? `?${qs}` : ''}`);
};
export const getStudentsMissingSpeakingAssessments = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; total: number }>(
    `/students/missing-speaking-assessments${qs ? `?${qs}` : ''}`,
  );
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
export const exportSchools = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/data-transfer/schools/export${qs ? `?${qs}` : ''}`);
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
export const exportTrainers = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/data-transfer/trainers/export${qs ? `?${qs}` : ''}`);
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
export const exportTeachers = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/data-transfer/teachers/export${qs ? `?${qs}` : ''}`);
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
export const exportStudents = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/data-transfer/students/export${qs ? `?${qs}` : ''}`);
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

// Today Activity
export const exportTodayActivityCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/data-transfer/today-activity/export${qs ? `?${qs}` : ''}`);
  return response.data;
};

// Sessions
export const exportSessionsCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/data-transfer/sessions/export${qs ? `?${qs}` : ''}`);
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

// ==================== SPEAKING ASSESSMENTS ====================

// Speaking Assessment Types
export type SpeakingAssessmentStatus = 'pending' | 'pre_completed' | 'mid_completed' | 'completed';
export type AssessmentPhase = 'pre' | 'mid' | 'post';

export interface FillStudentSpeakingAssessmentPayload {
  phase: AssessmentPhase;
  fluency: number;
  completeSentences: number;
  accuracy: number;
  pronunciation: number;
  vocabulary: number;
  confidence: number;
  askingQuestions: number;
  answeringQuestions: number;
  sharingInfo: number;
  describing: number;
  feelings: number;
  audience: number;
  notes?: string;
}

export interface FillTeacherSpeakingAssessmentPayload {
  phase: AssessmentPhase;
  fluency: number;
  sentences: number;
  accuracy: number;
  pronunciation: number;
  vocabulary: number;
  confidence: number;
  asking: number;
  answering: number;
  classroomInstructions: number;
  feedback: number;
  engagingStudents: number;
  professionalInteraction: number;
  passion: number;
  roleModel: number;
  notes?: string;
}

// Student Speaking Assessments
export const getStudentSpeakingAssessments = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; totalItems: number; totalPages: number }>(
    `/speaking-assessments/students${qs ? `?${qs}` : ''}`
  );
};

export const getStudentSpeakingAssessmentById = (id: string) =>
  apiClient.get<any>(`/speaking-assessments/students/${id}`);

export const getStudentSpeakingAssessmentPdf = async (id: string): Promise<Blob> => {
  const response = await apiClient.getBlob(`/speaking-assessments/students/${id}/pdf`);
  return response.data;
};

export const fillStudentSpeakingAssessment = (id: string, data: FillStudentSpeakingAssessmentPayload) =>
  apiClient.patch(`/speaking-assessments/students/${id}/fill`, data);

export const resetStudentSpeakingAssessment = (id: string) =>
  apiClient.patch(`/speaking-assessments/students/${id}/reset`, {});

// Teacher Speaking Assessments
export const getTeacherSpeakingAssessments = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<{ data: any[]; page: number; pageSize: number; totalItems: number; totalPages: number }>(
    `/speaking-assessments/teachers${qs ? `?${qs}` : ''}`
  );
};

export const getTeacherSpeakingAssessmentById = (id: string) =>
  apiClient.get<any>(`/speaking-assessments/teachers/${id}`);

export const getTeacherSpeakingAssessmentPdf = async (id: string): Promise<Blob> => {
  const response = await apiClient.getBlob(`/speaking-assessments/teachers/${id}/pdf`);
  return response.data;
};

export const fillTeacherSpeakingAssessment = (id: string, data: FillTeacherSpeakingAssessmentPayload) =>
  apiClient.patch(`/speaking-assessments/teachers/${id}/fill`, data);

export const resetTeacherSpeakingAssessment = (id: string) =>
  apiClient.patch(`/speaking-assessments/teachers/${id}/reset`, {});

// Speaking Assessment Reports
export const getStudentSpeakingAssessmentReport = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/speaking-assessments/reports/students${qs ? `?${qs}` : ''}`);
};

export const getTeacherSpeakingAssessmentReport = (params: Record<string, string | number | boolean> = {}) => {
  const qs = new URLSearchParams(params as any).toString();
  return apiClient.get<any>(`/speaking-assessments/reports/teachers${qs ? `?${qs}` : ''}`);
};

export const exportStudentSpeakingAssessmentsCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/speaking-assessments/students/export${qs ? `?${qs}` : ''}`);
  return response.data;
};

export const exportTeacherSpeakingAssessmentsCSV = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/speaking-assessments/teachers/export${qs ? `?${qs}` : ''}`);
  return response.data;
};

/** Download all filtered student and teacher assessment PDFs as a ZIP file */
export const exportSpeakingAssessmentsPdfsZip = async (params: Record<string, string | number | boolean> = {}): Promise<Blob> => {
  const qs = new URLSearchParams(params as any).toString();
  const response = await apiClient.getBlob(`/speaking-assessments/export-pdfs${qs ? `?${qs}` : ''}`, {
    timeout: 900000, // 15 min: bulk PDF generation for thousands of assessments can exceed 5 min
  });
  return response.data;
};


