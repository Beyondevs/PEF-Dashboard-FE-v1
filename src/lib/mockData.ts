import {
  Division,
  District,
  Tehsil,
  School,
  Trainer,
  Teacher,
  Student,
  Session,
  Attendance,
  Assessment,
  TeacherKPI,
  Resource,
  PaperRegister,
  WeeklySummary,
  SessionStatus,
  CourseName
} from '@/types';

// Geography data
export const divisions: Division[] = [
  { id: 'div1', name: 'Bahawalpur' },
  { id: 'div2', name: 'D.G. Khan' },
  { id: 'div3', name: 'Faisalabad' },
  { id: 'div4', name: 'Gujranwala' },
  { id: 'div5', name: 'Lahore' },
  { id: 'div6', name: 'Multan' },
  { id: 'div7', name: 'Rawalpindi' },
  { id: 'div8', name: 'Sahiwal' },
  { id: 'div9', name: 'Sargodha' },
];

export const districts: District[] = [
  { id: 'dis1', name: 'Bahawalpur', divisionId: 'div1' },
  { id: 'dis2', name: 'Bahawalnagar', divisionId: 'div1' },
  { id: 'dis3', name: 'Rahim Yar Khan', divisionId: 'div1' },
  { id: 'dis4', name: 'D.G. Khan', divisionId: 'div2' },
  { id: 'dis5', name: 'Layyah', divisionId: 'div2' },
  { id: 'dis6', name: 'Muzaffargarh', divisionId: 'div2' },
  { id: 'dis7', name: 'Rajanpur', divisionId: 'div2' },
  { id: 'dis8', name: 'Faisalabad', divisionId: 'div3' },
  { id: 'dis9', name: 'Chiniot', divisionId: 'div3' },
  { id: 'dis10', name: 'Jhang', divisionId: 'div3' },
  { id: 'dis11', name: 'Toba Tek Singh', divisionId: 'div3' },
  { id: 'dis12', name: 'Gujranwala', divisionId: 'div4' },
  { id: 'dis13', name: 'Gujrat', divisionId: 'div4' },
  { id: 'dis14', name: 'Hafizabad', divisionId: 'div4' },
  { id: 'dis15', name: 'Mandi Bahauddin', divisionId: 'div4' },
  { id: 'dis16', name: 'Narowal', divisionId: 'div4' },
  { id: 'dis17', name: 'Sialkot', divisionId: 'div4' },
  { id: 'dis18', name: 'Lahore', divisionId: 'div5' },
  { id: 'dis19', name: 'Kasur', divisionId: 'div5' },
  { id: 'dis20', name: 'Nankana Sahib', divisionId: 'div5' },
  { id: 'dis21', name: 'Sheikhupura', divisionId: 'div5' },
  { id: 'dis22', name: 'Multan', divisionId: 'div6' },
  { id: 'dis23', name: 'Khanewal', divisionId: 'div6' },
  { id: 'dis24', name: 'Lodhran', divisionId: 'div6' },
  { id: 'dis25', name: 'Vehari', divisionId: 'div6' },
];

export const tehsils: Tehsil[] = [
  { id: 'teh1', name: 'Bahawalpur City', districtId: 'dis1' },
  { id: 'teh2', name: 'Bahawalpur Saddar', districtId: 'dis1' },
  { id: 'teh3', name: 'Ahmadpur East', districtId: 'dis1' },
  { id: 'teh4', name: 'Hasilpur', districtId: 'dis1' },
  { id: 'teh5', name: 'Khairpur Tamewali', districtId: 'dis1' },
  { id: 'teh6', name: 'Yazman', districtId: 'dis1' },
  { id: 'teh7', name: 'Faisalabad City', districtId: 'dis8' },
  { id: 'teh8', name: 'Faisalabad Saddar', districtId: 'dis8' },
  { id: 'teh9', name: 'Jaranwala', districtId: 'dis8' },
  { id: 'teh10', name: 'Sammundri', districtId: 'dis8' },
  { id: 'teh11', name: 'Lahore Cantt', districtId: 'dis18' },
  { id: 'teh12', name: 'Lahore City', districtId: 'dis18' },
  { id: 'teh13', name: 'Model Town', districtId: 'dis18' },
  { id: 'teh14', name: 'Raiwind', districtId: 'dis18' },
  { id: 'teh15', name: 'Shalimar', districtId: 'dis18' },
];

// Generate 100 schools
export const schools: School[] = Array.from({ length: 100 }, (_, i) => {
  const tehsil = tehsils[i % tehsils.length];
  const district = districts.find(d => d.id === tehsil.districtId)!;
  const division = divisions.find(div => div.id === district.divisionId)!;
  
  return {
    id: `school${i + 1}`,
    emisCode: `${34000000 + i}`,
    name: `Government ${['High School', 'Middle School', 'Primary School'][i % 3]} ${['Model Town', 'Satellite Town', 'Civil Lines', 'Cantt', 'City', 'Township'][i % 6]} ${i + 1}`,
    tehsilId: tehsil.id,
    districtId: district.id,
    divisionId: division.id,
    address: `Street ${i + 1}, ${tehsil.name}, ${district.name}, Punjab`,
  };
});

// Generate 50 trainers
export const trainers: Trainer[] = Array.from({ length: 50 }, (_, i) => ({
  id: `trainer${i + 1}`,
  name: `Trainer ${['Ahmed', 'Ali', 'Fatima', 'Sara', 'Hassan', 'Ayesha', 'Usman', 'Zainab'][i % 8]} ${['Khan', 'Shah', 'Malik', 'Hussain', 'Butt'][i % 5]}`,
  phone: `+92300${String(i).padStart(7, '0')}`,
  email: `trainer${i + 1}@premierdlc.com`,
}));

// Generate 500 teachers
export const teachers: Teacher[] = Array.from({ length: 500 }, (_, i) => {
  const school = schools[i % schools.length];
  
  return {
    id: `teacher${i + 1}`,
    name: `${['Muhammad', 'Fatima', 'Ali', 'Aisha', 'Hassan', 'Zainab', 'Usman', 'Khadija'][i % 8]} ${['Ahmad', 'Bashir', 'Khalid', 'Naeem', 'Rashid', 'Saleem'][i % 6]}`,
    cnic: `${35201}${String(i).padStart(7, '0')}${(i % 10)}`,
    phone: `+92301${String(i).padStart(7, '0')}`,
    email: `teacher${i + 1}@school.edu.pk`,
    schoolId: school.id,
  };
});

// Generate 4000 students
export const students: Student[] = Array.from({ length: 4000 }, (_, i) => {
  const school = schools[Math.floor(i / 40)];
  
  return {
    id: `student${i + 1}`,
    name: `${['Ahmed', 'Ali', 'Fatima', 'Sara', 'Hassan', 'Ayesha', 'Usman', 'Zainab', 'Omar', 'Maryam'][i % 10]} ${['Malik', 'Khan', 'Shah', 'Butt', 'Hussain'][i % 5]}`,
    gender: i % 2 === 0 ? 'male' : 'female',
    grade: (i % 8) + 5,
    schoolId: school.id,
    rollNo: `${String(i % 100 + 1).padStart(3, '0')}`,
  };
});

// Generate 150 sessions spread over last/next 14 days
const today = new Date();
const courseNames: CourseName[] = ['English Basics', 'English Intermediate', 'English Advanced'];
const sessionStatuses: SessionStatus[] = ['Planned', 'Ongoing', 'Completed'];

export const sessions: Session[] = Array.from({ length: 150 }, (_, i) => {
  const daysOffset = Math.floor(i / 11) - 7; // Spread over 14 days
  const sessionDate = new Date(today);
  sessionDate.setDate(sessionDate.getDate() + daysOffset);
  
  const hour = 9 + (i % 6);
  const school = schools[i % schools.length];
  const trainer = trainers[i % trainers.length];
  
  let status: SessionStatus = 'Planned';
  if (daysOffset < 0) status = 'Completed';
  else if (daysOffset === 0 && hour < today.getHours()) status = 'Completed';
  else if (daysOffset === 0 && hour === today.getHours()) status = 'Ongoing';
  
  return {
    id: `session${i + 1}`,
    title: `${courseNames[i % 3]} - ${school.name.split(' ').slice(0, 3).join(' ')}`,
    courseName: courseNames[i % 3],
    date: sessionDate.toISOString().split('T')[0],
    startTime: `${String(hour).padStart(2, '0')}:00`,
    endTime: `${String(hour + 2).padStart(2, '0')}:00`,
    trainerId: trainer.id,
    schoolId: school.id,
    status,
    expectedTeachers: Math.floor(Math.random() * 5) + 3,
    expectedStudents: Math.floor(Math.random() * 30) + 20,
    notes: i % 5 === 0 ? 'Special focus on pronunciation and vocabulary building exercises.' : undefined,
  };
});

// Generate attendance records
export const attendance: Attendance[] = [];
sessions.filter(s => s.status !== 'Planned').forEach((session, sessionIdx) => {
  const schoolTeachers = teachers.filter(t => t.schoolId === session.schoolId).slice(0, session.expectedTeachers);
  const schoolStudents = students.filter(s => s.schoolId === session.schoolId).slice(0, session.expectedStudents);
  
  schoolTeachers.forEach((teacher, tIdx) => {
    const present = Math.random() > 0.15; // 85% attendance rate
    attendance.push({
      id: `att_t_${sessionIdx}_${tIdx}`,
      sessionId: session.id,
      personType: 'Teacher',
      personId: teacher.id,
      present,
      markedBy: session.trainerId,
      timestamp: `${session.date}T${session.startTime}:00Z`,
    });
  });
  
  schoolStudents.forEach((student, sIdx) => {
    const present = Math.random() > 0.20; // 80% attendance rate
    attendance.push({
      id: `att_s_${sessionIdx}_${sIdx}`,
      sessionId: session.id,
      personType: 'Student',
      personId: student.id,
      present,
      markedBy: session.trainerId,
      timestamp: `${session.date}T${session.startTime}:00Z`,
    });
  });
});

// Generate assessments
export const assessments: Assessment[] = [];
sessions.filter(s => s.status === 'Completed').forEach((session, sessionIdx) => {
  const sessionAttendance = attendance.filter(a => a.sessionId === session.id && a.personType === 'Student' && a.present);
  
  sessionAttendance.forEach((att, idx) => {
    const score = Math.floor(Math.random() * 5) + 5; // Score between 5-10
    assessments.push({
      id: `assess_${sessionIdx}_${idx}`,
      sessionId: session.id,
      studentId: att.personId,
      scoredBy: session.trainerId,
      maxScore: 10,
      score,
      timestamp: `${session.date}T${session.endTime}:00Z`,
    });
  });
});

// Calculate teacher KPIs
export const teacherKPIs: TeacherKPI[] = teachers.map(teacher => {
  const teacherAttendance = attendance.filter(a => a.personType === 'Teacher' && a.personId === teacher.id);
  const presentCount = teacherAttendance.filter(a => a.present).length;
  const attendanceRate = teacherAttendance.length > 0 ? (presentCount / teacherAttendance.length) * 100 : 0;
  
  // Get students from teacher's school
  const schoolStudents = students.filter(s => s.schoolId === teacher.schoolId);
  const studentAssessments = assessments.filter(a => schoolStudents.some(s => s.id === a.studentId));
  const avgScore = studentAssessments.length > 0
    ? (studentAssessments.reduce((sum, a) => sum + a.score, 0) / studentAssessments.length) * 10
    : 0;
  
  const compositeScore = 0.7 * attendanceRate + 0.3 * avgScore;
  
  return {
    teacherId: teacher.id,
    attendanceRate,
    avgStudentScore: avgScore,
    compositeScore,
  };
});

// Generate resources
export const resources: Resource[] = [
  {
    id: 'res1',
    title: 'English Pronunciation Guide',
    type: 'Video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Comprehensive guide to English pronunciation for beginners',
    tags: ['pronunciation', 'basics', 'phonetics'],
    uploadedBy: 'trainer1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'res2',
    title: 'Grammar Fundamentals PDF',
    type: 'PDF',
    url: 'https://example.com/grammar.pdf',
    description: 'Complete guide to English grammar rules and exercises',
    tags: ['grammar', 'intermediate', 'exercises'],
    uploadedBy: 'trainer2',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'res3',
    title: 'Vocabulary Building Exercises',
    type: 'Link',
    url: 'https://example.com/vocab',
    description: 'Interactive vocabulary building exercises and quizzes',
    tags: ['vocabulary', 'advanced', 'interactive'],
    uploadedBy: 'trainer1',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'res4',
    title: 'Speaking Practice Sessions',
    type: 'Video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    description: 'Recorded speaking practice sessions with common scenarios',
    tags: ['speaking', 'intermediate', 'practice'],
    uploadedBy: 'trainer3',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'res5',
    title: 'Writing Skills Workshop',
    type: 'PDF',
    url: 'https://example.com/writing.pdf',
    description: 'Workshop materials for improving English writing skills',
    tags: ['writing', 'advanced', 'workshop'],
    uploadedBy: 'trainer2',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Generate paper registers
export const paperRegisters: PaperRegister[] = Array.from({ length: 20 }, (_, i) => {
  const school = schools[i % schools.length];
  const date = new Date(today);
  date.setDate(date.getDate() - (i * 3));
  
  return {
    id: `pr${i + 1}`,
    schoolId: school.id,
    date: date.toISOString().split('T')[0],
    uploadedBy: `trainer${(i % 10) + 1}`,
    fileUrl: `https://example.com/register${i + 1}.jpg`,
    status: i % 3 === 0 ? 'Verified' : 'Submitted',
    rows: Array.from({ length: 5 }, (_, j) => ({
      studentId: `student${i * 5 + j + 1}`,
      teacherId: `teacher${i + 1}`,
      present: Math.random() > 0.2,
      sessionHeld: true,
    })),
  };
});

// Generate weekly summaries
export const weeklySummaries: WeeklySummary[] = Array.from({ length: 10 }, (_, i) => {
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - (i * 7 + 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const statuses: ('Draft' | 'Submitted' | 'Digitized')[] = ['Draft', 'Submitted', 'Digitized'];
  
  return {
    id: `ws${i + 1}`,
    scope: districts[i % districts.length].name,
    weekStart: weekStart.toISOString().split('T')[0],
    weekEnd: weekEnd.toISOString().split('T')[0],
    compiledBy: `trainer${(i % 10) + 1}`,
    excelUrl: `https://example.com/summary_week${i + 1}.xlsx`,
    status: statuses[i % 3],
  };
});
