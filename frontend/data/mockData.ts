import { User, UserType, Report, Homework, Chapter } from '../types';

export const MOCK_USERS: User[] = [
  { id: '1', name: 'Admin User', type: UserType.Admin, email: 'admin@example.com', password: 'password123' },
  { id: '2', name: 'Sarah Johnson (Teacher)', type: UserType.Teacher, email: 'sarah.j@example.com', password: 'password123' },
  { id: '3', name: 'David Lee (Asst. Teacher)', type: UserType.Teacher, email: 'david.l@example.com', password: 'password123' },
  { id: '4', name: 'Alice Smith (Student)', type: UserType.Student, email: 'alice.s@example.com', password: 'password123' },
  { id: '5', name: 'Bob Brown (Student)', type: UserType.Student, email: 'bob.b@example.com', password: 'password123' },
  { id: '6', name: 'Charlie Smith (Parent)', type: UserType.Parent, email: 'charlie.s@example.com', studentId: '4', password: 'password123' },
];

export const MOCK_REPORTS: Report[] = [
  { id: 'r1', studentId: '4', teacherId: '2', date: '2023-10-26', type: 'text', content: 'Alice is showing great improvement in Algebra.' },
  { id: 'r2', studentId: '4', teacherId: '3', date: '2023-10-28', type: 'voice', content: 'Voice note about her recent project.' },
  { id: 'r3', studentId: '5', teacherId: '2', date: '2023-10-27', type: 'text', content: 'Bob needs to focus more during lab sessions.' },
];

export const MOCK_HOMEWORKS: Homework[] = [
  { id: 'h1', studentId: '4', chapter: 'Algebra Basics', content: 'Completed all exercises on page 24.', submissionDate: '2023-10-25' },
  { id: 'h2', studentId: '5', chapter: 'Introduction to Physics', content: 'Lab report submitted.', submissionDate: '2023-10-26', comment: { teacherId: '2', type: 'text', content: 'Good work, but please double-check your calculations.' } },
];

export const MOCK_CHAPTERS: Chapter[] = [
  { id: 'c1', title: 'Chapter 1: Algebra Basics', description: 'Understanding variables, expressions, and equations.', status: 'completed' },
  { id: 'c2', title: 'Chapter 2: Geometry Fundamentals', description: 'Exploring points, lines, angles, and shapes.', status: 'completed' },
  { id: 'c3', title: 'Chapter 3: Introduction to Physics', description: 'Covering motion, forces, and energy.', status: 'in-progress' },
  { id: 'c4', title: 'Chapter 4: Chemistry of Matter', description: 'States of matter and their properties.', status: 'pending' },
  { id: 'c5', title: 'Chapter 5: Advanced Trigonometry', description: 'Sine, cosine, tangent, and their applications.', status: 'pending' },
];