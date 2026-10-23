import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  query,
  where,
  getDocFromServer,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  AppUser,
  AssessmentResult,
  Bestuur,
  ActivationCode,
  School,
  SchoolAggregateReport,
  SchoolCodeRecord,
  TargetFunctionRole,
  UserRole,
  BestuurAggregateReport,
  Question,
} from '../types';

// 1. Initialize Firebase App and Services
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 2. Standardized Error Handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Test Connection on Startup
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

// Helper: Recursively sanitize data before sending to Firestore
// Firestore strictly rejects fields with 'undefined' values.
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as unknown as T;
  }

  if (obj instanceof Date) {
    return obj;
  }

  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      cleaned[key] = cleanFirestoreData(value);
    }
  }
  return cleaned as T;
}

// Helper: Normalize School Code (handles # prefix, whitespace, case-insensitivity)
export function normalizeSchoolCode(code: string): string {
  if (!code) return '';
  const cleaned = code.trim().toUpperCase();
  return cleaned.startsWith('#') ? cleaned : `#${cleaned}`;
}

// Sole initial administrator email as specified by the user
export const PRIMARY_ADMIN_EMAIL = 'v.kruithof@edu.cloudwise.nl';

// Helper: Check if an email is the primary designated Cloudwise admin
export function checkIsCloudwiseEmail(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().trim() === PRIMARY_ADMIN_EMAIL.toLowerCase();
}

// Verifies if the authenticated user has an administrative role in Firebase
// "Deze rol kan enkel toegekend worden vanuit Firebase en wordt nooit toegekend aan een nieuwe gebruiker!"
export async function checkUserIsAdmin(uid?: string | null, email?: string | null): Promise<boolean> {
  const cleanEmail = (email || '').toLowerCase().trim();

  // 1. Initial primary administrator check
  if (cleanEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  // 2. Check Firestore /admins/{uid} or /admins/{email}
  try {
    if (uid) {
      const adminUidDoc = await getDoc(doc(db, 'admins', uid));
      if (adminUidDoc.exists()) {
        const data = adminUidDoc.data();
        if (data && data.isActive !== false) {
          return true;
        }
      }
    }

    if (cleanEmail) {
      const adminEmailDoc = await getDoc(doc(db, 'admins', cleanEmail));
      if (adminEmailDoc.exists()) {
        const data = adminEmailDoc.data();
        if (data && data.isActive !== false) {
          return true;
        }
      }
    }
  } catch (err) {
    // Permission denied or offline expected if not an admin
  }

  // 3. Check if user document explicitly has isCloudwiseAdmin === true (assigned in Firebase)
  try {
    if (uid) {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists() && userDoc.data()?.isCloudwiseAdmin === true) {
        return true;
      }
    }
  } catch (err) {
    // ignore
  }

  return false;
}

// 5. Schoolcode Validation Service (100% Firebase Firestore)
// "De schoolcodes staan niet meer in de frontend opgeslagen. Alles rondom schoolcodes gebeurt in Firebase."
export async function validateSchoolCode(inputCode: string): Promise<School | null> {
  const norm = normalizeSchoolCode(inputCode);
  if (!norm || norm.length < 2) return null;

  const codeKey = norm.replace('#', '').toUpperCase();

  // 1. Direct lookup in Firebase Firestore 'schoolCodes' index
  try {
    let codeSnap = await getDoc(doc(db, 'schoolCodes', codeKey));
    if (!codeSnap.exists()) {
      codeSnap = await getDoc(doc(db, 'schoolCodes', norm));
    }

    if (codeSnap.exists()) {
      const data = codeSnap.data() as any;
      if (data.isActive !== false) {
        // Fetch full school record from Firestore
        let schoolFromRef: School | null = null;
        if (data.schoolId) {
          const schoolDocRef = doc(db, 'schools', data.schoolId);
          const schoolSnap = await getDoc(schoolDocRef);
          if (schoolSnap.exists()) {
            const sData = schoolSnap.data() as any;
            schoolFromRef = {
              id: schoolSnap.id,
              name: sData.name || sData.schoolName || data.schoolName || data.name || 'School',
              schoolName: sData.name || sData.schoolName || data.schoolName || data.name || 'School',
              schoolCode: sData.schoolCode || sData.code || data.code || inputCode,
              city: sData.city || data.city || '',
              sector: (sData.sector || data.sector || 'PO') as 'PO' | 'VO' | 'PO/VO',
              bestuurId: sData.bestuurId || data.bestuurId || '',
              bestuurName: sData.bestuurName || data.bestuurName || '',
              assignedModules: sData.assignedModules || data.assignedModules || ['kerndoelen'],
              deadline: sData.deadline || data.deadline || '',
              isActive: sData.isActive !== false,
              createdAt: sData.createdAt || new Date().toISOString(),
            };
          }
        }

        if (schoolFromRef) {
          return schoolFromRef;
        }

        return {
          id: data.schoolId || codeSnap.id,
          name: data.name || data.schoolName || 'School',
          schoolName: data.name || data.schoolName || 'School',
          schoolCode: data.code || data.schoolCode || inputCode,
          city: data.city || '',
          sector: (data.sector || 'PO') as 'PO' | 'VO' | 'PO/VO',
          bestuurId: data.bestuurId || '',
          bestuurName: data.bestuurName || '',
          assignedModules: data.assignedModules || ['kerndoelen'],
          deadline: data.deadline || '',
          isActive: true,
          createdAt: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn('Firestore schoolCodes lookup warning:', err);
  }

  // 2. Direct query or collection scan in Firebase Firestore 'schools' collection
  try {
    const candidateCodes = [norm, codeKey, inputCode.trim(), inputCode.trim().toUpperCase()];
    const querySnapshot = await getDocs(collection(db, 'schools'));
    for (const d of querySnapshot.docs) {
      const raw = d.data() as any;
      const schoolCode = raw.schoolCode || raw.code || '';
      const normSchoolCode = normalizeSchoolCode(schoolCode);
      if (
        normSchoolCode === norm ||
        schoolCode.toUpperCase() === codeKey ||
        candidateCodes.includes(schoolCode)
      ) {
        if (raw.isActive !== false) {
          return {
            id: d.id,
            name: raw.name || raw.schoolName || 'School',
            schoolName: raw.name || raw.schoolName || 'School',
            schoolCode: raw.schoolCode || raw.code || inputCode,
            city: raw.city || '',
            sector: (raw.sector || 'PO') as 'PO' | 'VO' | 'PO/VO',
            bestuurId: raw.bestuurId || '',
            bestuurName: raw.bestuurName || '',
            assignedModules: raw.assignedModules || ['kerndoelen'],
            deadline: raw.deadline || '',
            isActive: true,
            createdAt: raw.createdAt || new Date().toISOString(),
          };
        }
      }
    }
  } catch (err) {
    console.warn('Firestore schools collection query warning:', err);
  }

  // If not found in Firebase Firestore, return null. NO frontend fallback!
  return null;
}

// 6. User Profile Management in Firestore
export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const path = `users/${uid}`;
  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);
    if (userSnap.exists()) {
      return userSnap.data() as AppUser;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function saveUserProfile(userProfile: AppUser): Promise<void> {
  const path = `users/${userProfile.uid}`;
  try {
    const userDocRef = doc(db, 'users', userProfile.uid);
    // Sanitize data recursively to eliminate any undefined values that crash Firestore
    const cleaned = cleanFirestoreData({
      ...userProfile,
      bestuurId: userProfile.bestuurId || '',
      bestuurName: userProfile.bestuurName || '',
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userDocRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

// 7. Save Completed Assessment to Firestore
export async function saveAssessmentRecord(
  assessment: AssessmentResult,
  user: AppUser
): Promise<string> {
  const assessmentId = assessment.id || `assessment_${Date.now()}`;
  const path = `assessments/${assessmentId}`;

  const payload = cleanFirestoreData({
    id: assessmentId,
    userId: user.uid,
    userEmail: user.email || '',
    userName: user.displayName || 'Robin van der Meer',
    userRole: user.role || 'leerkracht',
    schoolId: user.schoolId || '',
    schoolCode: user.schoolCode || '',
    schoolName: user.schoolName || '',
    bestuurId: user.bestuurId || '',
    bestuurName: user.bestuurName || '',
    targetSector: user.targetSector || 'PO',
    overallScorePercentage: assessment.overallScorePercentage,
    overallLevel: assessment.overallLevel || 'Basisvaardig',
    completedAt: assessment.completedAt || new Date().toISOString(),
    result: assessment,
    createdAt: new Date().toISOString(),
  });

  try {
    await setDoc(doc(db, 'assessments', assessmentId), payload);
    return assessmentId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    return assessmentId;
  }
}

// 8. Fetch user's own assessments
export async function getUserAssessments(uid: string): Promise<any[]> {
  const path = 'assessments';
  try {
    const q = query(collection(db, 'assessments'), where('userId', '==', uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => d.data());
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}

// 9. Cloudwise Admin: Add New School & School Code
export async function addSchoolByCloudwise(schoolData: Omit<School, 'id' | 'createdAt'>): Promise<School> {
  const schoolId = `school_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const normCode = normalizeSchoolCode(schoolData.schoolCode);

  const newSchool: School = {
    ...schoolData,
    id: schoolId,
    schoolCode: normCode,
    isActive: true,
    createdAt: new Date().toISOString(),
    createdByUser: auth.currentUser?.email || 'Cloudwise Admin',
  };

  const codeKey = normCode.replace('#', '');

  // Save to schools collection
  try {
    await setDoc(doc(db, 'schools', schoolId), newSchool);
    // Save to schoolCodes mapping collection
    await setDoc(doc(db, 'schoolCodes', codeKey), {
      code: normCode,
      schoolId: schoolId,
      schoolName: newSchool.name,
      city: newSchool.city,
      sector: newSchool.sector,
      isActive: true,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `schools/${schoolId}`);
  }

  return newSchool;
}

// 10. Cloudwise Admin: Fetch all schools (100% from Firebase Firestore)
export async function getAllSchools(): Promise<School[]> {
  try {
    const snapshot = await getDocs(collection(db, 'schools'));
    const firestoreSchools = snapshot.docs.map((d) => {
      const raw = d.data() as any;
      const schoolName = raw.name || raw.schoolName || 'Onbekende school';
      return {
        id: d.id,
        name: schoolName,
        schoolName: schoolName,
        schoolCode: raw.schoolCode || raw.code || '',
        city: raw.city || '',
        sector: (raw.sector || 'PO') as 'PO' | 'VO' | 'PO/VO',
        bestuurId: raw.bestuurId || '',
        bestuurName: raw.bestuurName || '',
        assignedModules: raw.assignedModules || ['kerndoelen'],
        deadline: raw.deadline || '',
        isActive: raw.isActive !== false,
        createdAt: raw.createdAt || new Date().toISOString(),
        notes: raw.notes || '',
      } as School;
    });
    // Sort alphabetically by name
    return firestoreSchools.sort((a, b) => a.name.localeCompare(b.name));
  } catch (err) {
    console.warn('Could not fetch schools from Firestore:', err);
    return [];
  }
}

// 10b. Cloudwise Admin: Delete School with ALL Linked Data in Firebase (Cascading Delete)
export async function deleteSchoolWithAllData(
  schoolId: string,
  schoolCode: string
): Promise<{ deletedAssessmentsCount: number; deletedCodesCount: number; unlinkedUsersCount: number }> {
  const normCode = normalizeSchoolCode(schoolCode);
  const codeKey = normCode.replace('#', '').toUpperCase();

  let deletedAssessmentsCount = 0;
  let deletedCodesCount = 0;
  let unlinkedUsersCount = 0;

  // 1. Delete school document from 'schools'
  try {
    await deleteDoc(doc(db, 'schools', schoolId));
  } catch (err) {
    console.warn('Could not delete school doc:', err);
  }

  // 2. Delete schoolCodes lookup documents (both uppercase key and normalized key)
  try {
    await deleteDoc(doc(db, 'schoolCodes', codeKey));
    await deleteDoc(doc(db, 'schoolCodes', normCode));
  } catch (err) {
    console.warn('Could not delete schoolCodes entry:', err);
  }

  // 3. Delete all associated assessments in 'assessments'
  try {
    const q1 = query(collection(db, 'assessments'), where('schoolCode', '==', normCode));
    const snap1 = await getDocs(q1);
    for (const d of snap1.docs) {
      await deleteDoc(d.ref);
      deletedAssessmentsCount++;
    }

    // Also check assessments matching by schoolId
    const q2 = query(collection(db, 'assessments'), where('schoolId', '==', schoolId));
    const snap2 = await getDocs(q2);
    for (const d of snap2.docs) {
      if (!snap1.docs.some((sd) => sd.id === d.id)) {
        await deleteDoc(d.ref);
        deletedAssessmentsCount++;
      }
    }
  } catch (err) {
    console.warn('Could not cascade delete assessments:', err);
  }

  // 4. Delete all activation codes generated for this school in 'activationCodes'
  try {
    const qAct = query(collection(db, 'activationCodes'), where('schoolId', '==', schoolId));
    const snapAct = await getDocs(qAct);
    for (const d of snapAct.docs) {
      await deleteDoc(d.ref);
      deletedCodesCount++;
    }
  } catch (err) {
    console.warn('Could not cascade delete activationCodes:', err);
  }

  // 5. Unlink any users tied to this school in 'users'
  try {
    const qUsers = query(collection(db, 'users'), where('schoolId', '==', schoolId));
    const snapUsers = await getDocs(qUsers);
    for (const d of snapUsers.docs) {
      await updateDoc(d.ref, {
        schoolId: '',
        schoolCode: '',
        schoolName: '',
        isActivated: false,
        updatedAt: new Date().toISOString(),
      });
      unlinkedUsersCount++;
    }
  } catch (err) {
    console.warn('Could not unlink users:', err);
  }

  return { deletedAssessmentsCount, deletedCodesCount, unlinkedUsersCount };
}

// Legacy alias
export async function deleteSchoolByCloudwise(schoolId: string, schoolCode: string): Promise<void> {
  await deleteSchoolWithAllData(schoolId, schoolCode);
}

// 10c. Seed initial schools directly INTO Firebase Firestore (only called when Firestore is empty)
export async function seedInitialSchoolsInFirebase(): Promise<School[]> {
  const existing = await getAllSchools();
  if (existing.length > 0) {
    return existing;
  }

  const initialList = [
    {
      name: 'De Saffier',
      schoolCode: '#SCOD2026SAF',
      city: 'Utrecht',
      sector: 'PO' as const,
      bestuurId: 'bestuur_opo_mh',
      bestuurName: 'Stichting Openbaar Onderwijs Midden-Holland',
      isActive: true,
      notes: 'Basisschool De Saffier - Utrecht',
    },
    {
      name: 'Het Mozaïek',
      schoolCode: '#SCOD2026MOZ',
      city: 'Utrecht',
      sector: 'PO' as const,
      bestuurId: 'bestuur_opo_mh',
      bestuurName: 'Stichting Openbaar Onderwijs Midden-Holland',
      isActive: true,
      notes: 'Basisschool Het Mozaïek - Utrecht',
    },
    {
      name: 'De Regenboog',
      schoolCode: '#SCOD2026RGB',
      city: 'Woerden',
      sector: 'PO' as const,
      bestuurId: 'bestuur_cpo_randstad',
      bestuurName: 'Christelijk Primair Onderwijs Randstad',
      isActive: true,
      notes: 'Basisschool De Regenboog - Woerden',
    },
    {
      name: 'Cloudwise Academy Demo',
      schoolCode: '#CLOUDWISE2026',
      city: 'Woerden',
      sector: 'PO/VO' as const,
      bestuurId: 'bestuur_opo_mh',
      bestuurName: 'Cloudwise Onderwijsadvies Beheer',
      isActive: true,
      notes: 'Interne testschool voor Cloudwise onderwijsadviseurs',
    },
  ];

  const created: School[] = [];
  for (const s of initialList) {
    try {
      const added = await addSchoolByCloudwise(s);
      created.push(added);
    } catch (e) {
      console.warn('Could not seed school into Firestore:', e);
    }
  }

  return created.length > 0 ? created : await getAllSchools();
}

// 11. Cloudwise Admin: Aggregate School Report
// "Alle score's van alle gebruikers, worden op een grote berg gegooid en moeten samen het gemiddelde schoolresultaat creëren,
// zodat een school aan dit rapport kan zien waar schoolbreed aan gewerkt moet worden.
// Dit schoolrapport wordt overigens aan niemand getoond en kan enkel door Cloudwise worden opgevraagd."
export async function getAggregatedSchoolReport(
  school: School,
  fallbackLocalAssessments: any[] = []
): Promise<SchoolAggregateReport> {
  let assessments: any[] = [];

  try {
    const q = query(
      collection(db, 'assessments'),
      where('schoolCode', '==', normalizeSchoolCode(school.schoolCode))
    );
    const snapshot = await getDocs(q);
    assessments = snapshot.docs.map((d) => d.data());
  } catch (err) {
    console.warn('Firestore query for school assessments failed or offline:', err);
  }

  // Include any matching fallback assessments from current app session if Firestore has none
  if (assessments.length === 0) {
    const norm = normalizeSchoolCode(school.schoolCode);
    const matchingLocal = fallbackLocalAssessments.filter(
      (a) => normalizeSchoolCode(a.schoolCode || a.user?.schoolCode || '') === norm
    );
    if (matchingLocal.length > 0) {
      assessments = matchingLocal.map((a) => ({
        ...a,
        overallScorePercentage: a.result?.overallScorePercentage ?? 70,
        result: a.result,
        userRole: a.user?.role || 'leerkracht',
      }));
    }
  }

  const participantCount = assessments.length;

  if (participantCount === 0) {
    return {
      schoolId: school.id,
      schoolName: school.name,
      schoolCode: school.schoolCode,
      city: school.city,
      sector: school.sector,
      participantCount: 0,
      lastAssessmentDate: '',
      averageScorePercentage: 0,
      domainAverages: [
        { id: 'cat1', title: 'Categorie 1: Praktische Kennis en Vaardigheden', shortTitle: 'Systemen & Netwerken', averagePercentage: 0, averageKnowledgePercentage: 0, averageSelfAssessmentAvg: 0 },
        { id: 'cat2', title: 'Categorie 2: Veiligheid en Privacy in de Schoolpraktijk', shortTitle: 'Veiligheid & Privacy', averagePercentage: 0, averageKnowledgePercentage: 0, averageSelfAssessmentAvg: 0 },
        { id: 'cat3', title: 'Categorie 3: Didactische Toepassing en Curriculum', shortTitle: 'Didactiek & Onderwijs', averagePercentage: 0, averageKnowledgePercentage: 0, averageSelfAssessmentAvg: 0 },
      ],
      roleBreakdown: {},
      keyStrengths: [],
      priorityDevelopmentAreas: [
        'Nog geen deelnemers hebben de nulmeting voltooid voor deze schoolcode.',
        'Deel schoolcode ' + school.schoolCode + ' met het team om data te verzamelen.',
      ],
      recommendedCloudwiseWorkshops: [
        'Cloudwise Kick-off Digitale Geletterdheid',
        'Inspiratiesessie actuele kerndoelen PO/VO',
      ],
    };
  }

  // Compute aggregate averages
  let totalScore = 0;
  const domainTotals: Record<string, { totalPct: number; totalKnowledge: number; totalSelf: number; count: number }> = {
    cat1: { totalPct: 0, totalKnowledge: 0, totalSelf: 0, count: 0 },
    cat2: { totalPct: 0, totalKnowledge: 0, totalSelf: 0, count: 0 },
    cat3: { totalPct: 0, totalKnowledge: 0, totalSelf: 0, count: 0 },
  };
  const roleCounts: Record<string, number> = {};

  assessments.forEach((item) => {
    const res = item.result || item;
    totalScore += res.overallScorePercentage || 0;

    const r = item.userRole || item.user?.role || 'leerkracht';
    roleCounts[r] = (roleCounts[r] || 0) + 1;

    if (Array.isArray(res.categories)) {
      res.categories.forEach((cat: any) => {
        if (domainTotals[cat.id]) {
          domainTotals[cat.id].totalPct += cat.combinedScorePercentage || 0;
          domainTotals[cat.id].totalKnowledge += cat.knowledgePercentage || 0;
          domainTotals[cat.id].totalSelf += cat.selfAssessmentAvg || 0;
          domainTotals[cat.id].count += 1;
        }
      });
    }
  });

  const avgOverall = Math.round(totalScore / participantCount);

  const domainAverages = [
    {
      id: 'cat1' as const,
      title: 'Categorie 1: Praktische Kennis en Vaardigheden',
      shortTitle: 'Systemen & Netwerken',
      averagePercentage: domainTotals.cat1.count ? Math.round(domainTotals.cat1.totalPct / domainTotals.cat1.count) : avgOverall,
      averageKnowledgePercentage: domainTotals.cat1.count ? Math.round(domainTotals.cat1.totalKnowledge / domainTotals.cat1.count) : 0,
      averageSelfAssessmentAvg: domainTotals.cat1.count ? +(domainTotals.cat1.totalSelf / domainTotals.cat1.count).toFixed(1) : 0,
    },
    {
      id: 'cat2' as const,
      title: 'Categorie 2: Veiligheid en Privacy in de Schoolpraktijk',
      shortTitle: 'Veiligheid & Privacy',
      averagePercentage: domainTotals.cat2.count ? Math.round(domainTotals.cat2.totalPct / domainTotals.cat2.count) : avgOverall,
      averageKnowledgePercentage: domainTotals.cat2.count ? Math.round(domainTotals.cat2.totalKnowledge / domainTotals.cat2.count) : 0,
      averageSelfAssessmentAvg: domainTotals.cat2.count ? +(domainTotals.cat2.totalSelf / domainTotals.cat2.count).toFixed(1) : 0,
    },
    {
      id: 'cat3' as const,
      title: 'Categorie 3: Didactische Toepassing en Curriculum',
      shortTitle: 'Didactiek & Onderwijs',
      averagePercentage: domainTotals.cat3.count ? Math.round(domainTotals.cat3.totalPct / domainTotals.cat3.count) : avgOverall,
      averageKnowledgePercentage: domainTotals.cat3.count ? Math.round(domainTotals.cat3.totalKnowledge / domainTotals.cat3.count) : 0,
      averageSelfAssessmentAvg: domainTotals.cat3.count ? +(domainTotals.cat3.totalSelf / domainTotals.cat3.count).toFixed(1) : 0,
    },
  ];

  // Derive key strengths and priority development areas based on aggregate data
  const sortedDomains = [...domainAverages].sort((a, b) => b.averagePercentage - a.averagePercentage);
  const highest = sortedDomains[0];
  const lowest = sortedDomains[sortedDomains.length - 1];

  const keyStrengths: string[] = [
    `Sterkste domein: ${highest.title} (gemiddeld ${highest.averagePercentage}%).`,
    `${participantCount} ${participantCount === 1 ? 'onderwijsprofessional heeft' : 'onderwijsprofessionals hebben'} deelgenomen aan de nulmeting.`,
    `Gemiddeld kennisniveau van het team ligt op ${avgOverall}%.`,
  ];

  const priorityDevelopmentAreas: string[] = [
    `Grootste ontwikkelpunt: ${lowest.title} (gemiddeld ${lowest.averagePercentage}%). Hier heeft het team schoolbreed de meeste behoefte aan versterking.`,
    lowest.averagePercentage < 65
      ? 'Structurele professionalisering gewenst om aan de actuele landelijke kerndoelen te voldoen.'
      : 'Borgen van doorlopende leerlijn en praktische lesvoorbeelden.',
  ];

  const recommendedCloudwiseWorkshops: string[] = [
    `Cloudwise Verdiepingstraining: ${lowest.shortTitle} in de klas`,
    'Teamtraining: Veilige digitale schoolomgeving & AVG in de praktijk',
    'Begeleidingstraject: Doorlopende leerlijn Digitale Geletterdheid PO/VO',
  ];

  return {
    schoolId: school.id,
    schoolName: school.name,
    schoolCode: school.schoolCode,
    city: school.city,
    sector: school.sector,
    participantCount,
    lastAssessmentDate: assessments[assessments.length - 1]?.completedAt || new Date().toISOString(),
    averageScorePercentage: avgOverall,
    domainAverages,
    roleBreakdown: roleCounts,
    keyStrengths,
    priorityDevelopmentAreas,
    recommendedCloudwiseWorkshops,
  };
}

// ================= 12. BESTUUR MANAGEMENT =================
export const DEFAULT_BESTUREN: Bestuur[] = [
  {
    id: 'bestuur_opo_mh',
    name: 'Stichting Openbaar Onderwijs Midden-Holland',
    code: 'BST-OPO-MH',
    contactEmail: 'bestuur@opo-mh.nl',
    deadline: '2026-06-30',
    schoolCount: 3,
    candidateCount: 42,
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'bestuur_cpo_randstad',
    name: 'Christelijk Primair Onderwijs Randstad',
    code: 'BST-CPO-RS',
    contactEmail: 'info@cpo-randstad.nl',
    deadline: '2026-05-15',
    schoolCount: 2,
    candidateCount: 28,
    createdAt: '2026-02-01T09:00:00Z',
  },
  {
    id: 'bestuur_vo_midden',
    name: 'Stichting Voortgezet Onderwijs Regio Midden',
    code: 'BST-VO-MIDDEN',
    contactEmail: 'secretariaat@vo-midden.nl',
    deadline: '2026-07-01',
    schoolCount: 2,
    candidateCount: 65,
    createdAt: '2026-02-10T10:00:00Z',
  },
];

export async function getAllBesturen(): Promise<Bestuur[]> {
  try {
    const snap = await getDocs(collection(db, 'besturen'));
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Bestuur));
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  } catch (err) {
    console.warn('Could not load besturen from Firestore, using standard list:', err);
  }
  return DEFAULT_BESTUREN;
}

export async function addBestuurByCloudwise(
  bestuurData: Omit<Bestuur, 'id' | 'createdAt'>
): Promise<Bestuur> {
  const normCode = (bestuurData.code || `BST-${Date.now()}`).trim().toUpperCase();
  const cleanId = normCode.replace(/[^A-Z0-9]/g, '_').toLowerCase();
  const bestuurId = `bestuur_${cleanId}_${Math.random().toString(36).substring(2, 6)}`;

  const newBestuur: Bestuur = {
    ...bestuurData,
    id: bestuurId,
    code: normCode,
    deadline: bestuurData.deadline || '2026-06-30',
    contactEmail: bestuurData.contactEmail || '',
    schoolCount: 0,
    candidateCount: 0,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'besturen', bestuurId), cleanFirestoreData(newBestuur));
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `besturen/${bestuurId}`);
  }

  return newBestuur;
}

export async function deleteBestuurByCloudwise(bestuurId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'besturen', bestuurId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `besturen/${bestuurId}`);
  }
}

export async function updateBestuurDeadline(bestuurId: string, deadline: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'besturen', bestuurId), { deadline, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Failed to update bestuur deadline in Firestore:', err);
  }
}

export async function updateSchoolDeadline(schoolId: string, deadline: string): Promise<void> {
  try {
    await updateDoc(doc(db, 'schools', schoolId), { deadline, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Failed to update school deadline in Firestore:', err);
  }
}

export async function updateSchoolModules(schoolId: string, assignedModules: string[]): Promise<void> {
  try {
    await updateDoc(doc(db, 'schools', schoolId), { assignedModules, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn('Failed to update school modules in Firestore:', err);
  }
}

// ================= 13. ACTIVATION CODES & RBAC REGISTRATION =================
export async function generateActivationCode(params: {
  schoolId: string;
  bestuurId: string;
  schoolName: string;
  targetSector: 'PO' | 'VO';
  targetFunction: TargetFunctionRole | 'alle';
  assignedModules: string[];
  maxUses?: number;
}): Promise<ActivationCode> {
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const code = `CW-ACT-${randomSuffix}`;

  const activationRecord: ActivationCode = {
    code,
    schoolId: params.schoolId,
    bestuurId: params.bestuurId,
    schoolName: params.schoolName,
    targetSector: params.targetSector,
    targetFunction: params.targetFunction,
    assignedModules: params.assignedModules,
    maxUses: params.maxUses || 50,
    usedCount: 0,
    isUsed: false,
    createdAt: new Date().toISOString(),
    createdByName: auth.currentUser?.email || 'Schoolaccount',
  };

  try {
    await setDoc(doc(db, 'activationCodes', code), activationRecord);
  } catch (err) {
    console.warn('Could not write activationCode to Firestore:', err);
  }

  return activationRecord;
}

export async function validateActivationCode(code: string): Promise<ActivationCode | null> {
  const clean = code.trim().toUpperCase();
  try {
    const snap = await getDoc(doc(db, 'activationCodes', clean));
    if (snap.exists()) {
      const data = snap.data() as ActivationCode;
      if (data.maxUses && data.usedCount >= data.maxUses) {
        return null; // Exhausted
      }
      return data;
    }
  } catch (err) {
    console.warn('Error reading activation code from Firestore:', err);
  }
  return null;
}

export async function getSchoolActivationCodes(schoolId: string): Promise<ActivationCode[]> {
  try {
    const q = query(collection(db, 'activationCodes'), where('schoolId', '==', schoolId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as ActivationCode);
  } catch (err) {
    console.warn('Could not fetch school activation codes:', err);
    return [];
  }
}

// ================= 14. PROGRESS MANAGEMENT & TUSSENTIJDS OPSLAAN =================
export async function saveCandidateProgress(
  userId: string,
  currentQuestionIndex: number,
  answers: Record<string | number, any>
): Promise<void> {
  if (!userId) return;
  const key = `cloudwise_progress_${userId}`;
  try {
    // 1. Local storage instant save (offline-resilient)
    localStorage.setItem(key, JSON.stringify({ currentQuestionIndex, answers, savedAt: new Date().toISOString() }));
  } catch {
    // ignore localstorage quota errors
  }

  // 2. Firestore cloud backup
  try {
    await setDoc(doc(db, 'testProgress', userId), cleanFirestoreData({
      userId,
      currentQuestionIndex: currentQuestionIndex ?? 0,
      answers: answers ?? {},
      updatedAt: new Date().toISOString(),
    }), { merge: true });
  } catch (err) {
    // Non-blocking background error
  }
}

export async function getCandidateProgress(
  userId: string
): Promise<{ currentQuestionIndex: number; answers: Record<string | number, any> } | null> {
  if (!userId) return null;
  const key = `cloudwise_progress_${userId}`;

  // 1. Check local storage first
  try {
    const local = localStorage.getItem(key);
    if (local) {
      return JSON.parse(local);
    }
  } catch {
    // fallback
  }

  // 2. Check Firestore
  try {
    const snap = await getDoc(doc(db, 'testProgress', userId));
    if (snap.exists()) {
      const data = snap.data();
      return {
        currentQuestionIndex: data.currentQuestionIndex || 0,
        answers: data.answers || {},
      };
    }
  } catch (err) {
    // ignore
  }

  return null;
}

// ================= 15. LINK SCHOOLCODE & UNLOCK ASSESSMENT =================
export async function linkSchoolToUser(
  userId: string,
  inputCode: string
): Promise<{ success: boolean; user?: AppUser; school?: School; error?: string }> {
  if (!userId) {
    return { success: false, error: 'Gebruiker is niet ingelogd.' };
  }
  const clean = inputCode.trim();
  if (!clean) {
    return { success: false, error: 'Voer een schoolcode of activeringscode in.' };
  }

  try {
    // 1. Check activation code (CW-ACT-...)
    if (clean.toUpperCase().startsWith('CW-ACT-') || clean.toUpperCase().startsWith('ACT-')) {
      const act = await validateActivationCode(clean);
      if (act) {
        const existingProfile = await getUserProfile(userId);
        const resolvedSector = act.targetSector || 'PO';
        const updatedUser: AppUser = {
          uid: userId,
          email: existingProfile?.email || auth.currentUser?.email || '',
          displayName: existingProfile?.displayName || auth.currentUser?.displayName || 'Robin van der Meer',
          role: (act.targetFunction && act.targetFunction !== 'alle' ? act.targetFunction : existingProfile?.role || 'leerkracht') as UserRole,
          schoolId: act.schoolId || '',
          schoolCode: clean.toUpperCase(),
          schoolName: act.schoolName || 'School',
          bestuurId: act.bestuurId || existingProfile?.bestuurId || '',
          bestuurName: existingProfile?.bestuurName || '',
          schoolSector: resolvedSector,
          targetSector: resolvedSector,
          assignedModules: act.assignedModules && act.assignedModules.length > 0 ? act.assignedModules : ['kerndoelen'],
          isActivated: true,
          activationCode: clean.toUpperCase(),
          isCloudwiseAdmin: existingProfile?.isCloudwiseAdmin || false,
          createdAt: existingProfile?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveUserProfile(updatedUser);

        // Update activation code usage count
        try {
          await updateDoc(doc(db, 'activationCodes', clean.toUpperCase()), {
            usedCount: (act.usedCount || 0) + 1,
            lastUsedAt: new Date().toISOString(),
          });
        } catch {
          // non-blocking
        }

        const schoolObj: School = {
          id: act.schoolId,
          bestuurId: act.bestuurId || '',
          name: act.schoolName,
          schoolName: act.schoolName,
          schoolCode: clean.toUpperCase(),
          city: 'Gekoppeld via activeringscode',
          sector: resolvedSector,
          isActive: true,
          assignedModules: act.assignedModules,
          createdAt: act.createdAt,
        };

        return { success: true, user: updatedUser, school: schoolObj };
      }
    }

    // 2. Standard School Code validation in Firebase Firestore
    const school = await validateSchoolCode(clean);
    if (school) {
      const existingProfile = await getUserProfile(userId);
      const effectiveSchoolSector = (school.sector as 'PO' | 'VO' | 'PO/VO') || 'PO';
      const effectiveTargetSector: 'PO' | 'VO' = effectiveSchoolSector === 'VO' ? 'VO' : 'PO';

      const updatedUser: AppUser = {
        uid: userId,
        email: existingProfile?.email || auth.currentUser?.email || '',
        displayName: existingProfile?.displayName || auth.currentUser?.displayName || 'Robin van der Meer',
        role: existingProfile?.role || 'leerkracht',
        schoolId: school.id,
        schoolCode: normalizeSchoolCode(school.schoolCode),
        schoolName: school.name || school.schoolName || 'School',
        bestuurId: school.bestuurId || existingProfile?.bestuurId || '',
        bestuurName: school.bestuurName || existingProfile?.bestuurName || '',
        schoolSector: effectiveSchoolSector,
        targetSector: effectiveTargetSector,
        assignedModules: school.assignedModules && school.assignedModules.length > 0 ? school.assignedModules : ['kerndoelen'],
        isActivated: true,
        isCloudwiseAdmin: existingProfile?.isCloudwiseAdmin || false,
        createdAt: existingProfile?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveUserProfile(updatedUser);
      return { success: true, user: updatedUser, school };
    }

    return {
      success: false,
      error: 'De ingevoerde code is niet gevonden. Voer een geldige schoolcode (#SCOD...) of activeringscode (CW-ACT-...) in.',
    };
  } catch (err: any) {
    console.error('Error linking school code:', err);
    let msg = err?.message || 'Probeer opnieuw';
    try {
      const parsed = JSON.parse(msg);
      if (parsed?.error) msg = parsed.error;
    } catch {
      // not a json string
    }
    return {
      success: false,
      error: 'Er is een fout opgetreden bij het koppelen van de code: ' + msg,
    };
  }
}

// ================= 16. QUESTION BANK CUSTOMIZATION =================
export async function saveQuestionOverride(question: Question): Promise<void> {
  const docKey = `q_${question.id}${question.moduleId ? '_' + question.moduleId : ''}`;
  const path = `questionBank/${docKey}`;
  try {
    const cleaned = cleanFirestoreData({
      ...question,
      docKey,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.email || 'Cloudwise Admin',
    });
    await setDoc(doc(db, 'questionBank', docKey), cleaned);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

export async function getQuestionOverrides(): Promise<Record<string, Question>> {
  try {
    const snap = await getDocs(collection(db, 'questionBank'));
    const map: Record<string, Question> = {};
    snap.docs.forEach((d) => {
      const data = d.data() as Question & { docKey?: string };
      const key = data.docKey || d.id;
      map[key] = data;
    });
    return map;
  } catch (err) {
    console.warn('Could not fetch question overrides:', err);
    return {};
  }
}

export async function resetQuestionOverride(questionId: number, moduleId?: string): Promise<void> {
  const docKey = `q_${questionId}${moduleId ? '_' + moduleId : ''}`;
  const path = `questionBank/${docKey}`;
  try {
    await deleteDoc(doc(db, 'questionBank', docKey));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

