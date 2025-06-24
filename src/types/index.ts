export interface Education {
  institution: string;
  location: string;
  degree: string;
  startDate: string;
  endDate: string;
}

export interface Certification {
  title: string;
  description: string;
}

export interface BasicDetails {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  education: Education[];
  certifications: Certification[];
}

// Job description mode and direct keywords mode constants
export const JOB_DESCRIPTION_MODE = "JOB_DESCRIPTION";
export const DIRECT_KEYWORDS_MODE = "DIRECT_KEYWORDS";

export interface ResumeState {
  currentStep: number;
  mode: string;
  basicDetails: BasicDetails;
  taskId: string | null;
  matchScoreTaskId: string | null;
  resumeData: any;
  jobDescription: string;
  matchRate: number | null;
  expectedRate: number | null;
  missingKeywords: string[];
  directKeywords: string;
  customKeywords: string[];
  error: string | null;
  loading: boolean;
  downloadUrl: string | null;
}

// Task status constants
export const TASK_STATUS = {
  PENDING: "PENDING",
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE"
};
