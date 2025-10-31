export type UserRole = 'admin' | 'client' | 'trainer' | 'teacher' | 'student';

export interface Division {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  divisionId: string;
}

export interface Tehsil {
  id: string;
  name: string;
  districtId: string;
}

export interface School {
  id: string;
  emisCode: string;
  name: string;
  tehsilId: string;
  districtId: string;
  divisionId: string;
  address: string;
}

export interface Trainer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Teacher {
  id: string;
  name: string;
  cnic: string;
  phone: string;
  email: string;
  schoolId: string;
}

export interface Student {
  id: string;
  name: string;
  gender: 'male' | 'female';
  grade: number;
  schoolId: string;
  rollNo: string;
}

export type SessionStatus = 'Planned' | 'Ongoing' | 'Completed';
export type CourseName = 'Spoken English Programme';

export interface Session {
  id: string;
  title: string;
  courseName: CourseName;
  date: string;
  startTime: string;
  endTime: string;
  trainerId: string;
  schoolId: string;
  status: SessionStatus;
  notes?: string;
}

export interface Attendance {
  id: string;
  sessionId: string;
  personType: 'Teacher' | 'Student';
  personId: string;
  present: boolean;
  markedBy: string;
  timestamp: string;
}

export interface Assessment {
  id: string;
  sessionId: string;
  studentId: string;
  scoredBy: string;
  maxScore: number;
  score: number;
  timestamp: string;
}

export interface TeacherKPI {
  teacherId: string;
  attendanceRate: number;
  avgStudentScore: number;
  compositeScore: number;
}

export interface PaperRegister {
  id: string;
  schoolId: string;
  date: string;
  uploadedBy: string;
  fileUrl: string;
  status: 'Submitted' | 'Verified';
  rows: Array<{
    studentId: string;
    teacherId: string;
    present: boolean;
    sessionHeld: boolean;
  }>;
}

export interface WeeklySummary {
  id: string;
  scope: string;
  weekStart: string;
  weekEnd: string;
  compiledBy: string;
  excelUrl: string;
  status: 'Draft' | 'Submitted' | 'Digitized';
}

export type ResourceType = 'Video' | 'PDF' | 'Link';

export interface Resource {
  id: string;
  title: string;
  type: ResourceType;
  url: string;
  description: string;
  tags: string[];
  uploadedBy: string;
  createdAt: string;
}

export interface FilterState {
  division?: string;
  district?: string;
  tehsil?: string;
  school?: string;
  sessionId?: string;
}
