import type { Request } from "express";

export type RoleName = "admin" | "principal" | "teacher" | "student";

export interface JwtPayload {
  userId: number;
  roles: RoleName[];
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Tipi tabella (senza campi auto-generati)
export interface UserRow {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  dob: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleRow {
  id: number;
  name: string;
  description: string | null;
}

export interface PermissionRow {
  id: number;
  name: string;
  description: string | null;
}

export interface SchoolYearRow {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: number; // 0|1
}

export interface ClassRow {
  id: number;
  name: string;
  school_year_id: number;
}

export interface SubjectRow {
  id: number;
  name: string;
  description: string | null;
}

export interface TeacherAssignmentRow {
  id: number;
  teacher_id: number;
  class_id: number;
  subject_id: number;
}

export interface ClassEnrollmentRow {
  id: number;
  class_id: number;
  student_id: number;
}

export interface GradeRow {
  id: number;
  student_id: number;
  teacher_id: number;
  subject_id: number;
  value: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface RefreshTokenRow {
  id: number;
  token_hash: string;
  user_id: number;
  expires_at: string;
  revoked: number;
  created_at: string;
}
