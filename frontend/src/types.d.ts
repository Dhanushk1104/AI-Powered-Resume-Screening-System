export type Role = "ADMIN" | "USER" | string;

export interface AnalyzeResp {
  ats_score: number;
  recommended_role: string;
  matched_keywords: string[];
  explanation: string;
}

export interface AuthResponse {
  token: string;
  role: Role;
}
