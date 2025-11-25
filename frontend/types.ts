export enum UserType {
  Student = 'Student',
  Teacher = 'Teacher',
  Parent = 'Parent',
  Admin = 'Admin',
}

export interface User {
  id: string;
  name: string;
  type: UserType;
  email: string;
  phone?: string | null;
  password?: string;
  studentId?: string; // For parents to link to a student
  lastLoginAt?: string | null;
  loginCount?: number;
  failedLoginAttempts?: number;
  groups?: GroupSummary[];
}

export interface GroupSummary {
  id: string;
  name: string;
  color: string;
  role?: string;
}

export interface Group extends GroupSummary {
  createdAt?: string;
  updatedAt?: string;
  members?: Array<{
    id: string;
    name: string;
    email: string;
    type: UserType;
    role?: string;
  }>;
}

export interface Report {
  id: string;
  studentId: string;
  teacherId: string;
  date: string;
  type: 'text' | 'voice';
  content: string; // Text content or URL to voice note
}

export interface Homework {
  id:string;
  studentId: string;
  chapter: string;
  content: string;
  submissionDate: string;
  comment?: {
    teacherId: string;
    type: 'text' | 'voice';
    content: string;
  };
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'pending';
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId?: string | null;
  changes?: unknown;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    email: string;
    type: UserType;
  } | null;
}

export interface MonitorUserSnapshot {
  id: string;
  name: string;
  email: string;
  type: UserType;
  lastLoginAt: string | null;
  loginCount: number;
  failedLoginAttempts: number;
}

export interface MonitorOverview {
  stats: {
    totalUsers: number;
    activeUsers: number;
    loginsLast24h: number;
    auditLogsLast24h: number;
    avgLoginsPerUser: number;
    roleBreakdown: Record<string, number>;
  };
  recentLogins: MonitorUserSnapshot[];
  highRiskUsers: MonitorUserSnapshot[];
  auditActionsLast24h: Record<string, number>;
}
