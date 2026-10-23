export type QuestionType = 'checklist' | 'skill' | 'general' | 'knowledge' | 'self-assessment' | 'module-assessment';

export type KerndoelId = 'algemeen' | 'cat1' | 'cat2' | 'cat3' | 'module';

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
  | '3C'
  | 'mod_magister'
  | 'mod_parnassys'
  | 'mod_teams'
  | 'mod_googledrive';

export type UserRole =
  | 'leerkracht'
  | 'leerkrachtondersteuner'
  | 'intern_begeleider'
  | 'directie'
  | 'ict_coordinator'
  | 'oop_lesgevend'
  | 'oop_niet_lesgevend'
  | 'overig';

export interface UserProfile {
  fullName: string;
  email?: string;
  schoolName?: string;
  schoolId?: string;
  bestuurId?: string;
  role: UserRole;
  customRole?: string;
  targetGroup?: 'PO' | 'VO' | 'Beide';
  assignedModules?: string[];
  activationCode?: string;
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
  id: number; // 1 to 100+
  categoryBadge: string; // e.g. "CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN"
  subcategoryTitle: string; // e.g. "A. Digitale systemen"
  kerndoelId: KerndoelId;
  subcategoryId: SubcategoryId;
  type: QuestionType;
  questionText: string;
  moduleId?: string; // Optional for modular questions ('magister', 'parnassys', 'teams', 'googledrive')
  skillItemId?: string; // For 1-by-1 skill questions mapping to checklist item
  options?: OptionItem[];
  checklistItems?: ChecklistItem[];
  correctOptionId?: string; // e.g. "b"
  explanation?: string;
  topAccentColor?: string; // hex or tailwind class
}

export type AnswersMap = Record<number | string, string | string[]>;

export type CalibrationStatus = 'in_balance' | 'more_skilled' | 'step_needed';

export interface SubcategoryScore {
  id: SubcategoryId;
  code: string;
  title: string;
  kerndoelId: KerndoelId;
  knowledgeCorrect: number;
  knowledgeTotal: number;
  knowledgePercentage: number;
  selfAssessmentAvg: number; // 1.0 - 4.0
  selfPercentage?: number; // legacy optional (not shown as % anymore)
  checklistCount: number;
  checklistTotal: number;
  checklistPercentage: number; // 0 - 100
  combinedPercentage: number; // 0 - 100 (Average of knowledge and skills)
  level: string;
  feedbackText: string;
  knowledgeQuestionIds: number[];
  selfAssessmentQuestionIds: number[];
  q1ItemIds: string[];
  selfCalibrationStatus: CalibrationStatus;
  selfCalibrationLabel: string;
  selfCalibrationFeedback: string;
}

export interface CalibrationOverview {
  inBalanceCount: number;
  moreSkilledCount: number;
  stepNeededCount: number;
  summary: string;
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
  expiresAt?: string; // 2 months from completion (AVG retention)
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
  selfCalibrationOverview?: CalibrationOverview;
  moduleScores?: ModuleScore[]; // Modular scores (Magister, ParnasSys, Teams, etc.)
  answers?: AnswersMap;
}

export interface SavedAssessment {
  id: string;
  userId: string; // user email or identifier
  user: UserProfile;
  createdAt: string;
  expiresAt?: string;
  result: AssessmentResult;
  answers: AnswersMap;
  schoolId?: string;
  schoolCode?: string;
  schoolName?: string;
  bestuurId?: string;
}

export interface School {
  id: string;
  bestuurId?: string; // Elk school-account gekoppeld aan exact één Bestuur_ID
  bestuurName?: string;
  name: string;
  schoolName?: string;
  schoolCode: string; // e.g. "#SCOD2026MOZ"
  code?: string;
  city: string;
  sector: 'PO' | 'VO' | 'PO/VO';
  isActive: boolean;
  deadline?: string; // Handmatige uiterste toetsdatum (beheerd door Administrator)
  assignedModules?: string[]; // bijv. ['kerndoelen', 'parnassys', 'googledrive']
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

export type UserAccessRole = 'admin' | 'school_admin' | 'candidate';

export type TargetFunctionRole =
  | 'leerkracht'
  | 'directie'
  | 'oop_lesgevend'
  | 'oop_niet_lesgevend'
  | 'intern_begeleider'
  | 'ict_coordinator'
  | 'overig';

export interface Bestuur {
  id: string; // e.g. "bestuur_1"
  name: string; // e.g. "Stichting Openbaar Primair Onderwijs Midden-Holland"
  code: string; // e.g. "BST-OPO-MH"
  contactEmail?: string;
  deadline: string; // ISO date e.g. "2026-06-30"
  schoolCount?: number;
  candidateCount?: number;
  createdAt: string;
}

export interface ActivationCode {
  code: string; // e.g. "CW-ACT-4819"
  schoolId: string;
  bestuurId: string;
  schoolName: string;
  targetSector: 'PO' | 'VO';
  targetFunction: TargetFunctionRole | 'alle';
  assignedModules: string[];
  maxUses?: number;
  usedCount: number;
  isUsed: boolean;
  createdAt: string;
  expiresAt?: string;
  createdByName?: string;
}

export interface ModularModule {
  id: string; // 'kerndoelen' | 'magister' | 'parnassys' | 'teams' | 'googledrive'
  name: string;
  shortName: string;
  description: string;
  isBase: boolean;
  sector: 'PO' | 'VO' | 'BEIDE';
  icon: string;
  targetRoles: TargetFunctionRole[];
  questionCount: number;
}

export interface ModuleScore {
  moduleId: string;
  moduleName: string;
  averageRating: number; // 1.0 - 4.0
  level: string; // 'Oriënterend' | 'Basisvaardig' | 'Zelfstandig' | 'Gevorderd'
  feedback: string;
  recommendations: string[];
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  accessRole?: UserAccessRole;
  functionRole?: TargetFunctionRole;
  schoolId: string;
  schoolCode: string;
  schoolName: string;
  bestuurId?: string;
  bestuurName?: string;
  targetSector: 'PO' | 'VO';
  schoolSector?: 'PO' | 'VO' | 'PO/VO';
  assignedModules?: string[];
  activationCode?: string;
  isActivated?: boolean;
  isCloudwiseAdmin: boolean;
  createdAt: string;
  updatedAt?: string;
  lastActiveAt?: string;
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
  bestuurId?: string;
  bestuurName?: string;
  city: string;
  sector: string;
  participantCount: number;
  lastAssessmentDate: string;
  deadline?: string;
  averageScorePercentage: number;
  domainAverages: SchoolDomainAverage[];
  roleBreakdown: Record<string, number>;
  moduleAverages?: Record<string, { name: string; avgRating: number; level: string }>;
  keyStrengths: string[];
  priorityDevelopmentAreas: string[];
  recommendedCloudwiseWorkshops: string[];
}

export interface SchoolBenchmarkItem {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  city: string;
  sector: string;
  participantCount: number;
  averageScorePercentage: number;
  cat1Average: number;
  cat2Average: number;
  cat3Average: number;
  moduleAverages: Record<string, number>;
}

export interface BestuurAggregateReport {
  bestuurId: string;
  bestuurName: string;
  bestuurCode: string;
  deadline: string;
  totalSchools: number;
  totalParticipants: number;
  averageOverallPercentage: number;
  averageCat1: number;
  averageCat2: number;
  averageCat3: number;
  schools: SchoolBenchmarkItem[];
  keyStrengths: string[];
  priorityDevelopmentAreas: string[];
  generatedAt: string;
}


