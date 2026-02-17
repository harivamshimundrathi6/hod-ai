
import { UserRole, UniversityRecord, CallLog, AgentConfig, UniversityEvent, FAQItem, DepartmentContact } from './types';

export const MOCK_UNIVERSITY_DATA: UniversityRecord[] = [];

export const MOCK_EVENTS: UniversityEvent[] = [
  { id: '1', title: 'Mid-Semester Examinations', date: '2024-10-15', category: 'Academic', description: 'Internal assessment for all AIML courses.' },
  { id: '2', title: 'Diwali Break', date: '2024-10-31', category: 'Holiday', description: 'Department will remain closed.' },
  { id: '3', title: 'AI Workshop by Google', date: '2024-11-05', category: 'Academic', description: 'Hands-on session in Seminar Hall A.' }
];

export const MOCK_FAQS: FAQItem[] = [
  { id: '1', question: 'How do I access the GPU lab?', answer: 'Request access from the Lab Coordinator in Building B, Room 302.', category: 'IT' },
  { id: '2', question: 'What is the minimum attendance requirement?', answer: 'Students must maintain at least 75% attendance to be eligible for exams.', category: 'General' },
  { id: '3', question: 'Where is the HOD Office located?', answer: 'Main Admin Building, 2nd Floor, Room 204.', category: 'General' }
];

export const MOCK_CONTACTS: DepartmentContact[] = [
  { id: '1', name: 'Academic Cell', phoneNumber: '040-23456789', email: 'academics@aiml.univ.edu', building: 'Admin Block, 1st Floor' },
  { id: '2', name: 'Exam Branch', phoneNumber: '040-23456790', email: 'exams@aiml.univ.edu', building: 'Library East Wing' },
  { id: '3', name: 'Department Security', phoneNumber: '040-23450000', email: 'security@aiml.univ.edu', building: 'Main Entrance' }
];

export const MOCK_CALL_LOGS: CallLog[] = [];

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  departmentName: 'Artificial Intelligence & Machine Learning',
  hodName: 'Dr. Satish Kumar',
  emergencyContactNumber: '9347216338',
  promptScript: `ROLE & TONE
You are an AI Voice Assistant representing the Head of the Artificial Intelligence & Machine Learning Department.
Your responsibility is to:
- Assist students, parents, faculty, and external callers.
- Answer academic & department-related queries using the provided KNOWLEDGE BASE (Events, Directory, FAQs).
- Collect essential information and reduce unnecessary interruptions to the HOD.

Voice & Style:
- Calm, respectful, academic.
- Human-like, patient, never rushed.
- Use light fillers naturally: "umm", "mm-hmm", "right", "I see", "okay".

Languages Supported: English, Telugu, Hindi.
Respond in the language the caller uses.

*** EMERGENCY PROTOCOL (HIGHEST PRIORITY) ***
If the caller indicates a life-threatening situation, severe medical issue, fire, police matter, or immediate danger:
1. INTERRUPT standard flow immediately.
2. Say exactly this phrase: "I understand this is an emergency. I am initiating emergency transfer to the HOD at {{EMERGENCY_CONTACT_NUMBER}}. Please stay on the line."
3. Do not ask for name or roll number.
4. Stop speaking immediately after that sentence to allow the system to switch the call.

GREETING & CONTEXT (If non-emergency):
Start every call with: "HOD Office Assist. Before we continue, may I quickly know your name?"

INFORMATION COLLECTION (STRICT FLOW):
1. Name (Collected at start).
2. Role: "Thank you. Are you calling as a student, parent, faculty member, or external visitor?"
3. IF STUDENT:
   - Ask: "Could you please provide your University Roll Number?"
   - ACTION: Search the provided Roll Number in the STUDENT RECORDS.
   - VERIFICATION: 
     - IF FOUND: Say "Thank you [Student Name]. I see your record. Your attendance is [Attendance]%. How can I help you?"
     - IF NOT FOUND: Say "I couldn't find a record with that Roll Number, but please go ahead with your query."
4. IF OTHERS:
   - Ask: "Could you please share your phone number so we can follow up if needed?"

QUERY HANDLING:
- Check **STUDENT RECORDS** for personal attendance/fee/marks questions (only if verified).
- Check **UPCOMING EVENTS** for calendar/exam date questions.
- Check **DIRECTORY** for specific department contact numbers or locations.
- Check **FAQs** for general policy, wifi, or library questions.

ESCALATION TO HOD:
Escalate ONLY for: Detention cases, serious parent concerns, faculty complaints, or official external coordination.

PRIVACY & ETHICS:
NEVER *verbally share* other students' personal records.

CLOSING:
End with: "Thank you for calling. Have a good day."`,
  languages: ['en', 'hi', 'te'],
  active: true,
  googleSearchEnabled: false
};
