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
import { AppUser, AssessmentResult, School, SchoolAggregateReport, SchoolCodeRecord, UserRole } from '../types';

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
    await setDoc(userDocRef, {
      ...userProfile,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
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

  const payload = {
    id: assessmentId,
    userId: user.uid,
    userEmail: user.email,
    userName: user.displayName || 'Deelnemer',
    userRole: user.role,
    schoolId: user.schoolId,
    schoolCode: user.schoolCode,
    schoolName: user.schoolName,
    targetSector: user.targetSector,
    overallScorePercentage: assessment.overallScorePercentage,
    overallLevel: assessment.overallLevel,
    completedAt: assessment.completedAt || new Date().toISOString(),
    result: assessment,
    createdAt: new Date().toISOString(),
  };

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

// 10b. Cloudwise Admin: Delete or Deactivate School in Firebase
export async function deleteSchoolByCloudwise(schoolId: string, schoolCode: string): Promise<void> {
  const normCode = normalizeSchoolCode(schoolCode);
  const codeKey = normCode.replace('#', '');
  try {
    await deleteDoc(doc(db, 'schools', schoolId));
    await deleteDoc(doc(db, 'schoolCodes', codeKey));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `schools/${schoolId}`);
  }
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
      isActive: true,
      notes: 'Basisschool De Saffier - Utrecht',
    },
    {
      name: 'Het Mozaïek',
      schoolCode: '#SCOD2026MOZ',
      city: 'Utrecht',
      sector: 'PO' as const,
      isActive: true,
      notes: 'Basisschool Het Mozaïek - Utrecht',
    },
    {
      name: 'De Regenboog',
      schoolCode: '#SCOD2026RGB',
      city: 'Woerden',
      sector: 'PO' as const,
      isActive: true,
      notes: 'Basisschool De Regenboog - Woerden',
    },
    {
      name: 'Cloudwise Academy Demo',
      schoolCode: '#CLOUDWISE2026',
      city: 'Woerden',
      sector: 'PO/VO' as const,
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
