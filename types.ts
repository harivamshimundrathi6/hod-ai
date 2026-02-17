
export enum UserRole {
  HOD = 'HOD',
  STUDENT = 'Student',
  FACULTY = 'Faculty',
  OFFICIAL = 'Official',
  PARENT = 'Parent',
  VISITOR = 'Visitor'
}

export type LanguageCode = 'en' | 'hi' | 'te';

export interface UniversityRecord {
  id: string; // This will serve as the roll number for students
  name: string;
  role: UserRole;
  department: string;
  attendance: number;
  cgpa?: number;
  feeStatus: 'Paid' | 'Pending' | 'Partial';
  lastInternalMarks: string;
}

export interface UniversityEvent {
  id: string;
  title: string;
  date: string;
  category: 'Academic' | 'Holiday' | 'Sports' | 'Cultural';
  description: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'Admissions' | 'Housing' | 'General' | 'IT';
}

export interface DepartmentContact {
  id: string;
  name: string; // e.g., "Registrar Office"
  phoneNumber: string;
  email: string;
  building: string;
}

export interface CallLog {
  id: string;
  callerId?: string; // Corresponds to UniversityRecord.id (roll number) if a student
  callerName: string;
  callerRole: UserRole;
  phoneNumber?: string; // Still useful for non-student callers
  rollNumber?: string; // New field for student roll numbers
  timestamp: string;
  language: LanguageCode;
  summary: string;
  transcript: { speaker: 'Caller' | 'AI'; text: string }[];
  queryType: 'Exam' | 'Fee' | 'Attendance' | 'Admission' | 'Emergency' | 'Other';
  duration: string;
  status: 'Completed' | 'Missed' | 'Transferred';
}

export interface AgentConfig {
  promptScript: string;
  departmentName: string;
  hodName: string;
  emergencyContactNumber: string;
  languages: LanguageCode[];
  active: boolean;
  googleSearchEnabled?: boolean;
}
