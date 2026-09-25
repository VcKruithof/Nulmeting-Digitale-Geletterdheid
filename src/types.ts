export type QuestionType = 'checklist' | 'general' | 'knowledge' | 'self-assessment';

export type KerndoelId = 'algemeen' | 'cat1' | 'cat2' | 'cat3';

export type SubcategoryId =
  | 'algemeen'
  | '1A'
  | '1B'
  | '1C'
  | '1D'
  | '2A'
  | '2B'
  | '3A'
  | '3B'
  | '3C';

export type UserRole =
  | 'leerkracht'
  | 'leerkrachtondersteuner'
  | 'intern_begeleider'
  | 'directie'
  | 'ict_coordinator'
  | 'overig';

export interface UserProfile {
  fullName: string;
  email?: string;
  schoolName?: string;
  role: UserRole;
  customRole?: string;
  targetGroup?: 'PO' | 'VO' | 'Beide';
}

export interface ChecklistItem {
  id: string;
  label: string;
  subcategoryId: SubcategoryId;
  tag: string;
}

export interface OptionItem {
  id: string; // 'a', 'b', 'c', 'd' or '1', '2', '3', '4'
  label: string;
  scaleValue?: number; // 1 to 4 for self-assessment
}

export interface Question {
  id: number; // 1 to 50
  categoryBadge: string; // e.g. "CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN"
  subcategoryTitle: string; // e.g. "A. Digitale systemen"
  kerndoelId: KerndoelId;
  subcategoryId: SubcategoryId;
  type: QuestionType;
  questionText: string;
  options?: OptionItem[];
  checklistItems?: ChecklistItem[];
  correctOptionId?: string; // e.g. "b"
  explanation?: string;
  topAccentColor?: string; // hex or tailwind class
}

export type AnswersMap = Record<number, string | string[]>;

export interface SubcategoryScore {
  id: SubcategoryId;
  code: string;
  title: string;
  kerndoelId: KerndoelId;
  knowledgeCorrect: number;
  knowledgeTotal: number;
  knowledgePercentage: number;
  selfAssessmentAvg: number; // 1.0 - 4.0
  selfPercentage: number; // 0 - 100
  checklistCount: number;
  checklistTotal: number;
  checklistPercentage: number; // 0 - 100
  combinedPercentage: number; // 0 - 100 (Average of knowledge, self, and skills)
  level: string;
  feedbackText: string;
  knowledgeQuestionIds: number[];
  selfAssessmentQuestionIds: number[];
  q1ItemIds: string[];
}

export interface CategoryScore {
  id: KerndoelId;
  title: string;
  shortTitle: string;
  kerndoelCode: string;
  accentColor: string;
  bgTint: string;
  knowledgeCorrect: number;
  knowledgeTotal: number;
  knowledgePercentage: number;
  selfAssessmentAvg: number;
  checklistCount: number;
  checklistTotal: number;
  checklistPercentage: number;
  combinedScorePercentage: number;
  levelLabel: string;
  summaryFeedback: string;
  subcategories: SubcategoryScore[];
}

export interface AssessmentResult {
  id?: string;
  user: UserProfile;
  completedAt: string;
  overallScorePercentage: number;
  overallLevel: string;
  overallKnowledgeCorrect: number;
  overallKnowledgeTotal: number;
  overallKnowledgePercentage: number;
  overallSelfAssessmentAvg: number;
  overallChecklistCount: number;
  overallChecklistTotal: number;
  overallChecklistPercentage: number;
  categories: CategoryScore[];
  strengths: string[];
  growthAreas: string[];
  roleSpecificAdvice: string[];
  actionSteps: {
    priority: 'Direct' | 'Middellange termijn' | 'Lange termijn';
    category: string;
    title: string;
    description: string;
  }[];
  answers?: AnswersMap;
}

export interface SavedAssessment {
  id: string;
  userId: string; // user email or identifier
  user: UserProfile;
  createdAt: string;
  result: AssessmentResult;
  answers: AnswersMap;
  schoolId?: string;
  schoolCode?: string;
  schoolName?: string;
}

export interface School {
  id: string;
  name: string;
  schoolName?: string;
  schoolCode: string; // e.g. "#SCOD2026MOZ"
  code?: string;
  city: string;
  sector: 'PO' | 'VO' | 'PO/VO';
  isActive: boolean;
  createdAt: string;
  createdByUser?: string;
  notes?: string;
}

export interface SchoolCodeRecord {
  code: string; // Uppercase normalized e.g. "#SCOD2026MOZ"
  schoolId: string;
  schoolName: string;
  name?: string;
  city: string;
  sector: string;
  isActive: boolean;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  targetSector: 'PO' | 'VO';
  schoolSector?: 'PO' | 'VO' | 'PO/VO';
  isCloudwiseAdmin: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface SchoolDomainAverage {
  id: KerndoelId;
  title: string;
  shortTitle: string;
  averagePercentage: number;
  averageKnowledgePercentage: number;
  averageSelfAssessmentAvg: number;
}

export interface SchoolAggregateReport {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  city: string;
  sector: string;
  participantCount: number;
  lastAssessmentDate: string;
  averageScorePercentage: number;
  domainAverages: SchoolDomainAverage[];
  roleBreakdown: Record<string, number>;
  keyStrengths: string[];
  priorityDevelopmentAreas: string[];
  recommendedCloudwiseWorkshops: string[];
}

