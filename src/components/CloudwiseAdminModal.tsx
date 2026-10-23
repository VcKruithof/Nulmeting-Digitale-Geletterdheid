import React, { useState, useEffect } from 'react';
import {
  School,
  SavedAssessment,
  AppUser,
  Bestuur,
  Question,
  OptionItem,
} from '../types';
import {
  getAllSchools,
  addSchoolByCloudwise,
  deleteSchoolWithAllData,
  seedInitialSchoolsInFirebase,
  updateSchoolBestuur,
  checkUserIsAdmin,
  saveUserProfile,
  getUserProfile,
  auth,
  googleProvider,
  getAllBesturen,
  addBestuurByCloudwise,
  deleteBestuurByCloudwise,
  updateBestuurDeadline,
  updateSchoolDeadline,
  DEFAULT_BESTUREN,
  saveQuestionOverride,
  getQuestionOverrides,
  resetQuestionOverride,
} from '../services/firebase';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  ShieldAlert,
  Building,
  Plus,
  CheckCircle,
  X,
  AlertTriangle,
  Layers,
  School as SchoolIcon,
  Lock,
  ShieldCheck,
  Trash2,
  Calendar,
  FileSpreadsheet,
  Download,
  BookOpen,
  Search,
  Check,
  Clock,
  Database,
  RefreshCw,
  Edit3,
  Save,
  RotateCcw,
  HelpCircle,
  ChevronDown,
  Users,
} from 'lucide-react';
import { QUESTIONS, applyQuestionOverrides } from '../data/questionsData';
import { SYSTEM_MODULES, MODULAR_QUESTIONS } from '../data/modulesData';
import {
  exportSchoolReportAsync,
  exportBestuurReportAsync,
  ExportProgress,
} from '../utils/excelExporter';

interface CloudwiseAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  localAssessments: SavedAssessment[];
  currentUser: AppUser | null;
  onAdminLoginSuccess: (user: AppUser) => void;
  onQuestionsUpdated?: () => void;
}

type AdminTab = 'schools' | 'besturen' | 'vragenbank' | 'exports' | 'avg';

export const CloudwiseAdminModal: React.FC<CloudwiseAdminModalProps> = ({
  isOpen,
  onClose,
  localAssessments,
  currentUser,
  onAdminLoginSuccess,
  onQuestionsUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('schools');
  const [schools, setSchools] = useState<School[]>([]);
  const [besturen, setBesturen] = useState<Bestuur[]>(DEFAULT_BESTUREN);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedBestuur, setSelectedBestuur] = useState<Bestuur>(DEFAULT_BESTUREN[0]);

  // Access Control / Login Wall State
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean>(false);

  // Admin Inlogmuur form state
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // 1. School Management State
  const [showAddSchoolForm, setShowAddSchoolForm] = useState<boolean>(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newSector, setNewSector] = useState<'PO' | 'VO' | 'PO/VO'>('PO');
  const [newBestuurId, setNewBestuurId] = useState<string>('bestuur_opo_mh');
  const [isSubmittingSchool, setIsSubmittingSchool] = useState(false);
  const [schoolActionSuccess, setSchoolActionSuccess] = useState<string | null>(null);

  // Quick Inline Bestuur Editing for a School
  const [editingBestuurSchoolId, setEditingBestuurSchoolId] = useState<string | null>(null);
  const [selectedInlineBestuurId, setSelectedInlineBestuurId] = useState<string>('');

  // 2. Cascade Delete School State
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [isDeletingSchool, setIsDeletingSchool] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // 3. Bestuur Management State
  const [showAddBestuurForm, setShowAddBestuurForm] = useState<boolean>(false);
  const [newBestuurName, setNewBestuurName] = useState('');
  const [newBestuurCode, setNewBestuurCode] = useState('');
  const [newBestuurEmail, setNewBestuurEmail] = useState('');
  const [newBestuurDeadline, setNewBestuurDeadline] = useState('2026-06-30');
  const [isSubmittingBestuur, setIsSubmittingBestuur] = useState(false);
  const [bestuurActionSuccess, setBestuurActionSuccess] = useState<string | null>(null);

  // Deadline Editing
  const [editingDeadlineSchoolId, setEditingDeadlineSchoolId] = useState<string | null>(null);
  const [editingDeadlineValue, setEditingDeadlineValue] = useState<string>('2026-06-30');
  const [editingBestuurDeadlineId, setEditingBestuurDeadlineId] = useState<string | null>(null);
  const [editingBestuurDeadlineValue, setEditingBestuurDeadlineValue] = useState<string>('2026-06-30');

  // 4. Vragenbank State & Editing
  const [questionOverrides, setQuestionOverrides] = useState<Record<string, Question>>({});
  const [vragenbankSearch, setVragenbankSearch] = useState('');
  const [vragenbankModuleFilter, setVragenbankModuleFilter] = useState<string>('alle');
  const [vragenbankTypeFilter, setVragenbankTypeFilter] = useState<string>('alle');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editSubcategoryTitle, setEditSubcategoryTitle] = useState('');
  const [editCategoryBadge, setEditCategoryBadge] = useState('');
  const [editExplanation, setEditExplanation] = useState('');
  const [editOptions, setEditOptions] = useState<OptionItem[]>([]);
  const [editCorrectOptionId, setEditCorrectOptionId] = useState<string>('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [questionSaveSuccess, setQuestionSaveSuccess] = useState<string | null>(null);

  // XLSX Export Queue state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Verify admin status on open
  useEffect(() => {
    if (!isOpen) return;

    const verifyAdminStatus = async () => {
      setIsCheckingAccess(true);

      if (!currentUser) {
        setIsAuthorizedAdmin(false);
        setIsCheckingAccess(false);
        return;
      }

      const hasAdmin = await checkUserIsAdmin(currentUser.uid, currentUser.email);
      if (hasAdmin) {
        setIsAuthorizedAdmin(true);
        loadAllAdminData();
      } else {
        setIsAuthorizedAdmin(false);
      }
      setIsCheckingAccess(false);
    };

    verifyAdminStatus();
  }, [isOpen, currentUser]);

  const loadAllAdminData = async () => {
    setIsLoadingData(true);
    try {
      // 1. Load besturen from Firestore
      const bList = await getAllBesturen();
      setBesturen(bList);
      if (bList.length > 0) {
        setSelectedBestuur(bList[0]);
        setNewBestuurId(bList[0].id);
      }

      // 2. Load schools from Firestore
      let list = await getAllSchools();
      if (list.length === 0) {
        list = await seedInitialSchoolsInFirebase();
      }
      setSchools(list);
      if (list.length > 0 && !selectedSchool) {
        setSelectedSchool(list[0]);
      }

      // 3. Load question bank overrides from Firestore
      const overrides = await getQuestionOverrides();
      setQuestionOverrides(overrides);
    } catch (err) {
      console.error('Failed loading admin data from Firestore:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, adminEmailInput.trim(), adminPasswordInput);
      const isAdmin = await checkUserIsAdmin(cred.user.uid, cred.user.email);

      if (!isAdmin) {
        await signOut(auth);
        setLoginError('Toegang geweigerd: Dit account beschikt niet over de Cloudwise beheerdersrol.');
        setIsLoggingIn(false);
        return;
      }

      let profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        profile = {
          uid: cred.user.uid,
          email: cred.user.email || '',
          displayName: cred.user.displayName || 'Robin van der Meer (Beheerder)',
          role: 'directie',
          schoolId: 'cloudwise_hq',
          schoolCode: '#BEHEER',
          schoolName: 'Cloudwise Onderwijsadvies',
          targetSector: 'PO',
          isCloudwiseAdmin: true,
          createdAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
      } else {
        profile.isCloudwiseAdmin = true;
      }

      setIsAuthorizedAdmin(true);
      onAdminLoginSuccess(profile);
      loadAllAdminData();
    } catch (err: any) {
      setLoginError('Inloggen mislukt. Controleer uw beheerderse-mailadres en wachtwoord.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAdminGoogleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const isAdmin = await checkUserIsAdmin(res.user.uid, res.user.email);
      if (!isAdmin) {
        await signOut(auth);
        setLoginError(`Toegang geweigerd: "${res.user.email}" heeft geen beheerdersrol.`);
        setIsLoggingIn(false);
        return;
      }

      let profile = await getUserProfile(res.user.uid);
      if (!profile) {
        profile = {
          uid: res.user.uid,
          email: res.user.email || '',
          displayName: res.user.displayName || 'Robin van der Meer (Beheerder)',
          role: 'directie',
          schoolId: 'cloudwise_hq',
          schoolCode: '#BEHEER',
          schoolName: 'Cloudwise Onderwijsadvies',
          targetSector: 'PO',
          isCloudwiseAdmin: true,
          createdAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
      }
      setIsAuthorizedAdmin(true);
      onAdminLoginSuccess(profile);
      loadAllAdminData();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setLoginError('Google aanmelding niet gelukt.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // --- 1. SCHOOL MANAGEMENT ACTIONS ---
  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      alert('Vul ten minste de schoolnaam en de schoolcode in.');
      return;
    }

    setIsSubmittingSchool(true);
    try {
      const selectedB = besturen.find((b) => b.id === newBestuurId) || besturen[0];
      const targetBestuurId = selectedB?.id || newBestuurId || 'bestuur_opo_mh';
      const targetBestuurName = selectedB?.name || 'Bestuur';

      const added = await addSchoolByCloudwise({
        name: newName.trim(),
        schoolCode: newCode.trim(),
        city: newCity.trim() || 'Nederland',
        sector: newSector,
        bestuurId: targetBestuurId,
        bestuurName: targetBestuurName,
        isActive: true,
      });

      setSchools((prev) => [added, ...prev]);
      setShowAddSchoolForm(false);
      setNewName('');
      setNewCode('');
      setNewCity('');
      setSchoolActionSuccess(`School "${added.name}" gekoppeld aan "${targetBestuurName}" (${added.schoolCode}) succesvol aangemaakt!`);
      setTimeout(() => setSchoolActionSuccess(null), 5000);
    } catch (err: any) {
      alert('Fout bij toevoegen van school: ' + (err.message || 'Onbekende fout'));
    } finally {
      setIsSubmittingSchool(false);
    }
  };

  const handleSaveInlineBestuurChange = async (schoolItem: School, newTargetBestuurId: string) => {
    const foundB = besturen.find((b) => b.id === newTargetBestuurId);
    if (!foundB) return;

    try {
      await updateSchoolBestuur(schoolItem.id, schoolItem.schoolCode, foundB.id, foundB.name);
      setSchools((prev) =>
        prev.map((s) => (s.id === schoolItem.id ? { ...s, bestuurId: foundB.id, bestuurName: foundB.name } : s))
      );
      setEditingBestuurSchoolId(null);
      setSchoolActionSuccess(`School "${schoolItem.name}" succesvol gekoppeld aan bestuur "${foundB.name}"!`);
      setTimeout(() => setSchoolActionSuccess(null), 4000);
    } catch (err: any) {
      alert('Fout bij koppelen van bestuur: ' + (err.message || 'Onbekende fout'));
    }
  };

  const handleExecuteDeleteSchool = async () => {
    if (!schoolToDelete) return;
    setIsDeletingSchool(true);
    try {
      const res = await deleteSchoolWithAllData(schoolToDelete.id, schoolToDelete.schoolCode);
      setSchools((prev) => prev.filter((s) => s.id !== schoolToDelete.id));
      if (selectedSchool?.id === schoolToDelete.id) {
        setSelectedSchool(null);
      }
      setSchoolActionSuccess(
        `School "${schoolToDelete.name}" en alle gekoppelde data definitief gewist (${res.deletedAssessmentsCount} assessments gewist, ${res.deletedCodesCount} activeringscodes gewist, ${res.unlinkedUsersCount} accounts ontkoppeld).`
      );
      setSchoolToDelete(null);
      setDeleteConfirmText('');
      setTimeout(() => setSchoolActionSuccess(null), 6000);
    } catch (err: any) {
      alert('Fout bij verwijderen van school: ' + (err.message || 'Onbekende fout'));
    } finally {
      setIsDeletingSchool(false);
    }
  };

  const handleSaveSchoolDeadline = async (schoolId: string) => {
    await updateSchoolDeadline(schoolId, editingDeadlineValue);
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, deadline: editingDeadlineValue } : s))
    );
    setEditingDeadlineSchoolId(null);
    setSchoolActionSuccess(`Deadline aangepast naar ${editingDeadlineValue}`);
    setTimeout(() => setSchoolActionSuccess(null), 3000);
  };

  // --- 2. BESTUUR MANAGEMENT ACTIONS ---
  const handleCreateBestuur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBestuurName.trim() || !newBestuurCode.trim()) {
      alert('Vul de bestuursnaam en de bestuurscode in.');
      return;
    }

    setIsSubmittingBestuur(true);
    try {
      const added = await addBestuurByCloudwise({
        name: newBestuurName.trim(),
        code: newBestuurCode.trim().toUpperCase(),
        contactEmail: newBestuurEmail.trim(),
        deadline: newBestuurDeadline || '2026-06-30',
        schoolCount: 0,
        candidateCount: 0,
      });

      setBesturen((prev) => [added, ...prev]);
      setShowAddBestuurForm(false);
      setNewBestuurName('');
      setNewBestuurCode('');
      setNewBestuurEmail('');
      setBestuurActionSuccess(`Bestuur "${added.name}" (${added.code}) succesvol geregistreerd in Firestore!`);
      setTimeout(() => setBestuurActionSuccess(null), 5000);
    } catch (err: any) {
      alert('Fout bij aanmaken van bestuur: ' + (err.message || 'Onbekende fout'));
    } finally {
      setIsSubmittingBestuur(false);
    }
  };

  const handleSaveBestuurDeadline = async (bestuurId: string) => {
    await updateBestuurDeadline(bestuurId, editingBestuurDeadlineValue);
    setBesturen((prev) =>
      prev.map((b) => (b.id === bestuurId ? { ...b, deadline: editingBestuurDeadlineValue } : b))
    );
    setEditingBestuurDeadlineId(null);
    setBestuurActionSuccess(`Bestuursdeadline geüpdatet naar ${editingBestuurDeadlineValue}`);
    setTimeout(() => setBestuurActionSuccess(null), 3000);
  };

  const handleDeleteBestuur = async (bestuur: Bestuur) => {
    const linkedSchools = schools.filter((s) => s.bestuurId === bestuur.id);
    if (linkedSchools.length > 0) {
      if (
        !confirm(
          `Let op: er zijn ${linkedSchools.length} scholen gekoppeld aan "${bestuur.name}". Weet u zeker dat u dit bestuur wilt verwijderen?`
        )
      ) {
        return;
      }
    } else {
      if (!confirm(`Weet u zeker dat u bestuur "${bestuur.name}" wilt verwijderen?`)) {
        return;
      }
    }

    try {
      await deleteBestuurByCloudwise(bestuur.id);
      setBesturen((prev) => prev.filter((b) => b.id !== bestuur.id));
      setBestuurActionSuccess(`Bestuur "${bestuur.name}" succesvol verwijderd.`);
      setTimeout(() => setBestuurActionSuccess(null), 3000);
    } catch (err: any) {
      alert('Fout bij verwijderen bestuur: ' + (err.message || 'Onbekende fout'));
    }
  };

  // --- 3. VRAGENBANK EDITING ACTIONS ---
  const handleOpenEditQuestion = (q: Question) => {
    const key = `q_${q.id}${q.moduleId ? '_' + q.moduleId : ''}`;
    const effectiveQuestion = questionOverrides[key] || q;

    setEditingQuestion(effectiveQuestion);
    setEditQuestionText(effectiveQuestion.questionText || '');
    setEditSubcategoryTitle(effectiveQuestion.subcategoryTitle || '');
    setEditCategoryBadge(effectiveQuestion.categoryBadge || '');
    setEditExplanation(effectiveQuestion.explanation || '');
    setEditOptions(effectiveQuestion.options ? [...effectiveQuestion.options] : []);
    setEditCorrectOptionId(effectiveQuestion.correctOptionId || '');
  };

  const handleSaveEditedQuestion = async () => {
    if (!editingQuestion) return;
    if (!editQuestionText.trim()) {
      alert('Vraagstelling mag niet leeg zijn.');
      return;
    }

    setIsSavingQuestion(true);
    try {
      const updatedQ: Question = {
        ...editingQuestion,
        questionText: editQuestionText.trim(),
        subcategoryTitle: editSubcategoryTitle.trim(),
        categoryBadge: editCategoryBadge.trim(),
        explanation: editExplanation.trim(),
        options: editOptions.length > 0 ? editOptions : undefined,
        correctOptionId: editCorrectOptionId || undefined,
      };

      await saveQuestionOverride(updatedQ);
      const key = `q_${updatedQ.id}${updatedQ.moduleId ? '_' + updatedQ.moduleId : ''}`;
      setQuestionOverrides((prev) => ({ ...prev, [key]: updatedQ }));

      setQuestionSaveSuccess(`Vraag #${updatedQ.id} succesvol opgeslagen in Firestore Vragenbank!`);
      setEditingQuestion(null);
      if (onQuestionsUpdated) onQuestionsUpdated();
      setTimeout(() => setQuestionSaveSuccess(null), 4000);
    } catch (err: any) {
      alert('Fout bij opslaan van vraag: ' + (err.message || 'Onbekende fout'));
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleResetQuestionToDefault = async (q: Question) => {
    if (!confirm(`Weet u zeker dat u vraag #${q.id} wilt terugzetten naar de standaardvraag?`)) {
      return;
    }

    try {
      await resetQuestionOverride(q.id, q.moduleId);
      const key = `q_${q.id}${q.moduleId ? '_' + q.moduleId : ''}`;
      setQuestionOverrides((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setQuestionSaveSuccess(`Vraag #${q.id} succesvol hersteld naar de standaard.`);
      if (onQuestionsUpdated) onQuestionsUpdated();
      setTimeout(() => setQuestionSaveSuccess(null), 3000);
    } catch (err: any) {
      alert('Fout bij herstellen van vraag: ' + (err.message || 'Onbekende fout'));
    }
  };

  // --- 4. XLSX EXPORTS ---
  const handleExportSchoolXLSX = async (schoolToExport: School) => {
    setIsExporting(true);
    setExportProgress({ stage: 'Starten met voorbereiden...', percent: 5 });
    setExportSuccessMessage(null);
    try {
      await exportSchoolReportAsync(schoolToExport, localAssessments, (p) => {
        setExportProgress(p);
      });
      setExportSuccessMessage(`Schoolrapport (.xlsx) voor ${schoolToExport.name} succesvol gegenereerd en gedownload!`);
    } catch (err) {
      console.error(err);
      alert('Er is een fout opgetreden bij het exporteren naar XLSX.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  const handleExportBestuurXLSX = async (bestuurToExport: Bestuur) => {
    setIsExporting(true);
    setExportProgress({ stage: 'Starten met voorbereiden van bestuursbenchmark...', percent: 5 });
    setExportSuccessMessage(null);
    try {
      const associatedSchools = schools.filter((s) => s.bestuurId === bestuurToExport.id);
      await exportBestuurReportAsync(
        bestuurToExport,
        associatedSchools.length > 0 ? associatedSchools : schools,
        localAssessments,
        (p) => {
          setExportProgress(p);
        }
      );
      setExportSuccessMessage(`Bestuursrapport (.xlsx) voor ${bestuurToExport.name} succesvol gegenereerd en gedownload!`);
    } catch (err) {
      console.error(err);
      alert('Er is een fout opgetreden bij het exporteren van het bestuursrapport.');
    } finally {
      setIsExporting(false);
      setExportProgress(null);
    }
  };

  if (!isOpen) return null;

  // Combine questions with active overrides applied
  const effectiveBaseQuestions = applyQuestionOverrides(QUESTIONS, questionOverrides);
  const effectiveModularQuestions = applyQuestionOverrides(MODULAR_QUESTIONS, questionOverrides);

  const allQuestionsForBank: (Question & { sourceModule: string; isOverridden: boolean })[] = [
    ...effectiveBaseQuestions.map((q) => {
      const key = `q_${q.id}${q.moduleId ? '_' + q.moduleId : ''}`;
      return {
        ...q,
        sourceModule: 'Kerndoelen Basis',
        isOverridden: !!questionOverrides[key],
      };
    }),
    ...effectiveModularQuestions.map((q) => {
      const key = `q_${q.id}${q.moduleId ? '_' + q.moduleId : ''}`;
      return {
        ...q,
        sourceModule: SYSTEM_MODULES.find((m) => m.id === q.moduleId)?.name || 'Module',
        isOverridden: !!questionOverrides[key],
      };
    }),
  ];

  const filteredQuestions = allQuestionsForBank.filter((q) => {
    const matchesSearch =
      q.questionText.toLowerCase().includes(vragenbankSearch.toLowerCase()) ||
      q.subcategoryTitle.toLowerCase().includes(vragenbankSearch.toLowerCase()) ||
      q.categoryBadge.toLowerCase().includes(vragenbankSearch.toLowerCase());

    const matchesModule =
      vragenbankModuleFilter === 'alle' ||
      (vragenbankModuleFilter === 'kerndoelen' && q.sourceModule.includes('Kerndoelen')) ||
      (q.moduleId && q.moduleId === vragenbankModuleFilter);

    const matchesType =
      vragenbankTypeFilter === 'alle' || q.type === vragenbankTypeFilter;

    return matchesSearch && matchesModule && matchesType;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-3xl max-w-6xl w-full p-6 sm:p-8 shadow-2xl border border-surface-container-high my-6 max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                  Administrator Portal (RBAC Niveau 1)
                </span>
                <span className="text-xs text-on-surface-variant font-medium">Cloudwise Onderwijsadvies</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-on-background">
                Centraal Systeem- & Toetsbeheer
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-on-surface-variant hover:text-on-background rounded-full hover:bg-surface-container cursor-pointer"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* LOGIN WALL CHECK */}
        {!isAuthorizedAdmin ? (
          <div className="py-10 max-w-md mx-auto text-center">
            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-on-background mb-2">Beheerdersverificatie Vereist</h3>
            <p className="text-xs text-on-surface-variant mb-6">
              Toegang tot de centrale vragenbank, besturenconfiguratie en retentie is voorbehouden aan geautoriseerde Cloudwise administrators.
            </p>

            {loginError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold text-left">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminEmailLogin} className="space-y-3 text-left">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Beheerder E-mail
                </label>
                <input
                  type="email"
                  required
                  placeholder="v.kruithof@edu.cloudwise.nl"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm text-on-background"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Wachtwoord
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm text-on-background"
                />
              </div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
              >
                {isLoggingIn ? 'Verifiëren...' : 'Inloggen als Administrator'}
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px bg-surface-container-high flex-grow" />
              <span className="text-[11px] text-on-surface-variant uppercase font-medium">Of met SSO</span>
              <div className="h-px bg-surface-container-high flex-grow" />
            </div>

            <button
              onClick={handleAdminGoogleLogin}
              type="button"
              className="w-full py-2.5 border border-surface-container-high rounded-xl text-xs font-semibold hover:bg-surface-container flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Inloggen met Cloudwise Google Account</span>
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex border-b border-surface-container-high mt-4 gap-1 sm:gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('schools')}
                className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'schools'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-background'
                }`}
              >
                <Building className="w-4 h-4" />
                <span>Scholen ({schools.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('besturen')}
                className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'besturen'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-background'
                }`}
              >
                <Layers className="w-4 h-4 text-purple-600" />
                <span>Schoolbesturen ({besturen.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('vragenbank')}
                className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'vragenbank'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-background'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Vragenbank Beheer ({allQuestionsForBank.length})</span>
                {Object.keys(questionOverrides).length > 0 && (
                  <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {Object.keys(questionOverrides).length} aangepast
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('exports')}
                className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'exports'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-background'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>XLSX Export-engine</span>
              </button>

              <button
                onClick={() => setActiveTab('avg')}
                className={`py-3 px-4 font-semibold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === 'avg'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-on-surface-variant hover:text-on-background'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span>AVG & Retentie</span>
              </button>
            </div>

            {/* TAB 1: SCHOLEN & DEADLINES (met optie om school, gekoppeld bestuur en data te beheren) */}
            {activeTab === 'schools' && (
              <div className="py-5">
                {schoolActionSuccess && (
                  <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{schoolActionSuccess}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-on-background">
                      Aangesloten Scholen & Bestuurskoppelingen
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Koppel elke school aan het juiste bestuur, stel toetsdeadlines in of verwijder scholen inclusief alle data.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddSchoolForm(!showAddSchoolForm)}
                    className="px-3.5 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nieuwe School Toevoegen</span>
                  </button>
                </div>

                {/* Add School Form */}
                {showAddSchoolForm && (
                  <form onSubmit={handleCreateSchool} className="p-4 mb-5 rounded-2xl bg-surface-container-low border border-primary/30">
                    <h4 className="text-xs font-bold text-on-background uppercase tracking-wider mb-3 flex items-center gap-2">
                      <SchoolIcon className="w-4 h-4 text-primary" />
                      Nieuwe School Registreren in Firestore
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                          Schoolnaam *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Bijv. De Horizon"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                          Schoolcode *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="#SCOD2026HOR"
                          value={newCode}
                          onChange={(e) => setNewCode(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                          Plaats
                        </label>
                        <input
                          type="text"
                          placeholder="Utrecht"
                          value={newCity}
                          onChange={(e) => setNewCity(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                          Gekoppeld Bestuur *
                        </label>
                        <select
                          value={newBestuurId}
                          onChange={(e) => setNewBestuurId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                        >
                          {besturen.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddSchoolForm(false)}
                        className="px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container rounded-xl cursor-pointer"
                      >
                        Annuleren
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingSchool}
                        className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingSchool ? 'Opslaan...' : 'Opslaan in Database'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Schools Table with inline Bestuur switcher */}
                <div className="border border-surface-container-high rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-low border-b border-surface-container-high text-on-surface-variant font-semibold">
                      <tr>
                        <th className="p-3">Schoolnaam</th>
                        <th className="p-3">Schoolcode</th>
                        <th className="p-3">Gekoppeld Bestuur</th>
                        <th className="p-3">Sector</th>
                        <th className="p-3">Toetsdeadline</th>
                        <th className="p-3 text-right">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {schools.map((schoolItem) => {
                        const isEditingDeadline = editingDeadlineSchoolId === schoolItem.id;
                        const isEditingBestuur = editingBestuurSchoolId === schoolItem.id;
                        const schoolBestuur = besturen.find((b) => b.id === schoolItem.bestuurId) || besturen[0];

                        return (
                          <tr key={schoolItem.id} className="hover:bg-surface-container-lowest/50">
                            <td className="p-3 font-semibold text-on-background">
                              {schoolItem.name || schoolItem.schoolName}
                            </td>
                            <td className="p-3 font-mono font-bold text-primary">
                              {schoolItem.schoolCode}
                            </td>

                            {/* Gekoppeld Bestuur met directe switch optie */}
                            <td className="p-3 text-on-surface-variant">
                              {isEditingBestuur ? (
                                <div className="flex items-center gap-1.5">
                                  <select
                                    value={selectedInlineBestuurId || schoolItem.bestuurId || schoolBestuur?.id}
                                    onChange={(e) => setSelectedInlineBestuurId(e.target.value)}
                                    className="px-2 py-1 rounded border border-purple-400 bg-surface-container-lowest text-xs text-on-background max-w-[200px]"
                                  >
                                    {besturen.map((b) => (
                                      <option key={b.id} value={b.id}>
                                        {b.name} ({b.code})
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => handleSaveInlineBestuurChange(schoolItem, selectedInlineBestuurId || schoolBestuur?.id)}
                                    className="p-1 bg-purple-700 text-white rounded cursor-pointer"
                                    title="Bestuur koppelen"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingBestuurSchoolId(null)}
                                    className="p-1 text-on-surface-variant rounded cursor-pointer"
                                    title="Annuleren"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div>
                                    <span className="block font-medium text-on-background">{schoolBestuur?.name}</span>
                                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded font-semibold">
                                      {schoolItem.bestuurId || schoolBestuur?.id}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditingBestuurSchoolId(schoolItem.id);
                                      setSelectedInlineBestuurId(schoolItem.bestuurId || schoolBestuur?.id);
                                    }}
                                    className="text-[11px] text-purple-700 hover:underline font-semibold cursor-pointer ml-auto"
                                    title="Koppel ander bestuur aan deze school"
                                  >
                                    Wijzig
                                  </button>
                                </div>
                              )}
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                                {schoolItem.sector}
                              </span>
                            </td>

                            <td className="p-3">
                              {isEditingDeadline ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="date"
                                    value={editingDeadlineValue}
                                    onChange={(e) => setEditingDeadlineValue(e.target.value)}
                                    className="px-2 py-1 rounded border border-primary text-xs"
                                  />
                                  <button
                                    onClick={() => handleSaveSchoolDeadline(schoolItem.id)}
                                    className="p-1 bg-primary text-white rounded cursor-pointer"
                                    title="Opslaan"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingDeadlineSchoolId(null)}
                                    className="p-1 text-on-surface-variant rounded cursor-pointer"
                                    title="Annuleren"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                  <span className="font-semibold text-on-background">
                                    {schoolItem.deadline || schoolBestuur?.deadline || '2026-06-30'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingDeadlineSchoolId(schoolItem.id);
                                      setEditingDeadlineValue(schoolItem.deadline || '2026-06-30');
                                    }}
                                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                                  >
                                    Wijzig
                                  </button>
                                </div>
                              )}
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleExportSchoolXLSX(schoolItem)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Download Schoolrapport XLSX"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>XLSX</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSchoolToDelete(schoolItem);
                                    setDeleteConfirmText('');
                                  }}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs flex items-center justify-center cursor-pointer transition-colors"
                                  title="School en alle gekoppelde data handmatig verwijderen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: SCHOOLBESTUREN AANMAKEN & BEHEREN */}
            {activeTab === 'besturen' && (
              <div className="py-5">
                {bestuurActionSuccess && (
                  <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{bestuurActionSuccess}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-on-background">
                      Schoolbesturen Beheer in Firestore
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Maak nieuwe bovenschoolse besturen aan in Firestore en beheer koepeldeadlines voor bestuursbenchmarks.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddBestuurForm(!showAddBestuurForm)}
                    className="px-3.5 py-2 bg-purple-700 text-white text-xs font-semibold rounded-xl hover:bg-purple-800 flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nieuw Schoolbestuur Aanmaken</span>
                  </button>
                </div>

                {/* Create Bestuur Form */}
                {showAddBestuurForm && (
                  <form onSubmit={handleCreateBestuur} className="p-4 mb-5 rounded-2xl bg-purple-50/50 border border-purple-200">
                    <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-700" />
                      Nieuw Schoolbestuur Toevoegen in Firestore
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                          Bestuursnaam / Stichting *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Bijv. Stichting Flore"
                          value={newBestuurName}
                          onChange={(e) => setNewBestuurName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                          Bestuurscode *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="BST-FLORE-2026"
                          value={newBestuurCode}
                          onChange={(e) => setNewBestuurCode(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background font-mono uppercase"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                          Contact E-mail
                        </label>
                        <input
                          type="email"
                          placeholder="bestuur@stichting.nl"
                          value={newBestuurEmail}
                          onChange={(e) => setNewBestuurEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                          Uiterste Toetsdeadline
                        </label>
                        <input
                          type="date"
                          value={newBestuurDeadline}
                          onChange={(e) => setNewBestuurDeadline(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddBestuurForm(false)}
                        className="px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container rounded-xl cursor-pointer"
                      >
                        Annuleren
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingBestuur}
                        className="px-4 py-1.5 bg-purple-700 text-white text-xs font-semibold rounded-xl hover:bg-purple-800 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingBestuur ? 'Aanmaken...' : 'Bestuur Aanmaken in Firestore'}
                      </button>
                    </div>
                  </form>
                )}

                {/* Besturen Table */}
                <div className="border border-surface-container-high rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-low border-b border-surface-container-high text-on-surface-variant font-semibold">
                      <tr>
                        <th className="p-3">Bestuursnaam</th>
                        <th className="p-3">Bestuurscode</th>
                        <th className="p-3">Contact E-mail</th>
                        <th className="p-3">Aangesloten Scholen</th>
                        <th className="p-3">Uiterste Deadline</th>
                        <th className="p-3 text-right">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {besturen.map((b) => {
                        const linkedSchools = schools.filter((s) => s.bestuurId === b.id);
                        const isEditingThis = editingBestuurDeadlineId === b.id;

                        return (
                          <tr key={b.id} className="hover:bg-surface-container-lowest/50">
                            <td className="p-3 font-semibold text-on-background">
                              <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-purple-600 flex-shrink-0" />
                                <span>{b.name}</span>
                              </div>
                            </td>
                            <td className="p-3 font-mono font-bold text-purple-700">
                              {b.code}
                            </td>
                            <td className="p-3 text-on-surface-variant font-medium">
                              {b.contactEmail || 'Niet ingesteld'}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 font-semibold text-[11px]">
                                {linkedSchools.length} {linkedSchools.length === 1 ? 'school' : 'scholen'}
                              </span>
                            </td>
                            <td className="p-3">
                              {isEditingThis ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="date"
                                    value={editingBestuurDeadlineValue}
                                    onChange={(e) => setEditingBestuurDeadlineValue(e.target.value)}
                                    className="px-2 py-1 rounded border border-purple-600 text-xs"
                                  />
                                  <button
                                    onClick={() => handleSaveBestuurDeadline(b.id)}
                                    className="p-1 bg-purple-700 text-white rounded cursor-pointer"
                                    title="Opslaan"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingBestuurDeadlineId(null)}
                                    className="p-1 text-on-surface-variant rounded cursor-pointer"
                                    title="Annuleren"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                  <span className="font-semibold text-on-background">
                                    {b.deadline || '2026-06-30'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingBestuurDeadlineId(b.id);
                                      setEditingBestuurDeadlineValue(b.deadline || '2026-06-30');
                                    }}
                                    className="text-[11px] text-purple-700 hover:underline font-medium cursor-pointer"
                                  >
                                    Wijzig
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleExportBestuurXLSX(b)}
                                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Bestuursbenchmark XLSX"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>XLSX</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteBestuur(b)}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs flex items-center justify-center cursor-pointer transition-colors"
                                  title="Bestuur verwijderen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: VRAGENBANK BEHEER (Vragen & Antwoorden Aanpassen) */}
            {activeTab === 'vragenbank' && (
              <div className="py-5">
                {questionSaveSuccess && (
                  <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{questionSaveSuccess}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-on-background">
                      Centraal Beheer Toetsvragen & Vragenbank
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Pas vraagstellingen, keuzemogelijkheden, het juiste antwoord en feedback aan. Wijzigingen worden direct in Firestore opgeslagen en toegepast in de toets.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-on-surface-variant">
                      Totaal {filteredQuestions.length} van {allQuestionsForBank.length} vragen
                    </span>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 mb-4 bg-surface-container-low rounded-2xl border border-surface-container">
                  <div className="relative">
                    <Search className="w-4 h-4 text-outline absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Zoek in vraagstelling of subdoel..."
                      value={vragenbankSearch}
                      onChange={(e) => setVragenbankSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                    />
                  </div>
                  <div>
                    <select
                      value={vragenbankModuleFilter}
                      onChange={(e) => setVragenbankModuleFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                    >
                      <option value="alle">Alle Modules & Basis</option>
                      <option value="kerndoelen">Kerndoelen Basis (Standaard)</option>
                      <option value="parnassys">ParnasSys (PO)</option>
                      <option value="magister">Magister (VO)</option>
                      <option value="teams">Microsoft Teams</option>
                      <option value="googledrive">Google Workspace / Drive</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={vragenbankTypeFilter}
                      onChange={(e) => setVragenbankTypeFilter(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                    >
                      <option value="alle">Alle Vraagtypes</option>
                      <option value="knowledge">Kennisvragen (MC)</option>
                      <option value="self-assessment">Niveaubepaling (1-4 schaal)</option>
                      <option value="module-assessment">Modulaire Niveaubepaling</option>
                      <option value="checklist">Vaardighedenchecklist</option>
                    </select>
                  </div>
                </div>

                {/* Questions List with Edit capabilities */}
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {filteredQuestions.map((q) => (
                    <div
                      key={`${q.id}_${q.subcategoryId}_${q.moduleId || 'base'}`}
                      className={`p-4 rounded-2xl bg-surface-container-lowest border transition-all ${
                        q.isOverridden
                          ? 'border-sky-300 bg-sky-50/20'
                          : 'border-surface-container-high hover:border-primary/40'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary bg-sky-100 text-sky-800 px-2 py-0.5 rounded">
                            #{q.id}
                          </span>
                          <span className="text-[11px] font-bold text-on-surface-variant uppercase bg-surface-container px-2 py-0.5 rounded">
                            {q.sourceModule}
                          </span>
                          <span className="text-xs font-semibold text-on-background">
                            {q.subcategoryTitle}
                          </span>
                          {q.isOverridden && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                              Aangepast in Vragenbank
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-outline-variant">
                            Type: {q.type}
                          </span>
                          <button
                            onClick={() => handleOpenEditQuestion(q)}
                            className="px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Vraag & Antwoorden Bewerken</span>
                          </button>
                          {q.isOverridden && (
                            <button
                              onClick={() => handleResetQuestionToDefault(q)}
                              className="p-1 hover:bg-surface-container text-on-surface-variant hover:text-red-600 rounded-lg text-xs cursor-pointer"
                              title="Herstellen naar standaardvraag"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-on-background font-medium mb-2.5 leading-relaxed">
                        {q.questionText}
                      </p>

                      {/* Options preview */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] bg-surface-container-low p-2.5 rounded-xl">
                          {q.options.map((opt) => {
                            const isCorrect = q.type === 'knowledge' && q.correctOptionId === opt.id;
                            return (
                              <div
                                key={opt.id}
                                className={`flex items-center gap-2 px-2 py-1 rounded-lg ${
                                  isCorrect ? 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300' : 'text-on-surface-variant'
                                }`}
                              >
                                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-surface-container-high'
                                }`}>
                                  {opt.id}
                                </span>
                                <span className="truncate">{opt.label}</span>
                                {isCorrect && (
                                  <span className="ml-auto text-[10px] font-bold text-emerald-700 uppercase">
                                    Juist
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {q.explanation && (
                        <div className="mt-2 text-[11px] text-on-surface-variant bg-surface-container/40 p-2 rounded-lg flex items-start gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <span><strong className="text-on-background">Toelichting:</strong> {q.explanation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: XLSX EXPORT ENGINE */}
            {activeTab === 'exports' && (
              <div className="py-5">
                <div className="p-4 mb-5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-emerald-900">
                        XLSX Export-engine met Achtergrondverwerking
                      </h3>
                      <p className="text-xs text-emerald-800/90 mt-0.5 leading-relaxed">
                        Exporteer school- en bestuursrapportages rechtstreeks naar Microsoft Excel (.xlsx) met dynamische tabbladen.
                        Conform AVG / GDPR bevatten de exportbestanden geen directe persoonsgegevens.
                      </p>
                    </div>
                  </div>
                </div>

                {isExporting && exportProgress && (
                  <div className="p-4 mb-5 rounded-2xl bg-surface-container-low border border-primary/40 animate-pulse">
                    <div className="flex items-center justify-between text-xs font-bold text-primary mb-2">
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {exportProgress.stage}
                      </span>
                      <span>{exportProgress.percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${exportProgress.percent}%` }}
                      />
                    </div>
                  </div>
                )}

                {exportSuccessMessage && (
                  <div className="p-3.5 mb-5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{exportSuccessMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* School Export Box */}
                  <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container">
                    <h4 className="font-bold text-on-background text-sm mb-1 flex items-center gap-2">
                      <Building className="w-4 h-4 text-primary" />
                      Schoolrapport Export (.xlsx)
                    </h4>
                    <p className="text-xs text-on-surface-variant mb-4">
                      Download het volledige .xlsx rapport voor één specifieke school.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                          Selecteer School
                        </label>
                        <select
                          value={selectedSchool?.id || ''}
                          onChange={(e) => {
                            const found = schools.find((s) => s.id === e.target.value);
                            if (found) setSelectedSchool(found);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                        >
                          {schools.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.schoolCode}) - {s.city}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => selectedSchool && handleExportSchoolXLSX(selectedSchool)}
                        disabled={isExporting || !selectedSchool}
                        className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span>Genereer & Download Schoolrapport (.xlsx)</span>
                      </button>
                    </div>
                  </div>

                  {/* Bestuur Export Box */}
                  <div className="p-5 rounded-2xl bg-surface-container-low border border-surface-container">
                    <h4 className="font-bold text-on-background text-sm mb-1 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-700" />
                      Bestuursrapport & Benchmark Export (.xlsx)
                    </h4>
                    <p className="text-xs text-on-surface-variant mb-4">
                      Benchmark alle aangesloten scholen onder het Bestuur.
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                          Selecteer Bestuur
                        </label>
                        <select
                          value={selectedBestuur?.id || ''}
                          onChange={(e) => {
                            const found = besturen.find((b) => b.id === e.target.value);
                            if (found) setSelectedBestuur(found);
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                        >
                          {besturen.map((b) => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => selectedBestuur && handleExportBestuurXLSX(selectedBestuur)}
                        disabled={isExporting || !selectedBestuur}
                        className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span>Genereer & Download Bestuursrapport (.xlsx)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: AVG & RETENTIE */}
            {activeTab === 'avg' && (
              <div className="py-5 space-y-4">
                <div className="p-5 rounded-2xl bg-sky-100/40 border border-primary/20">
                  <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-5 h-5" />
                    AVG / GDPR Beveiligings- & Retentiebeleid
                  </h3>
                  <p className="text-xs text-on-background leading-relaxed">
                    De Cloudwise Nulmeting is ontworpen conform de hoogste standaarden van gegevensbescherming in het onderwijs.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container">
                    <Clock className="w-5 h-5 text-amber-600 mb-2" />
                    <h4 className="text-xs font-bold text-on-background">2 Maanden Kandidaattoegang</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-snug">
                      Elke kandidaat heeft na afronding minimaal 2 maanden gegarandeerd toegang tot het interactieve web-dashboard en de PDF-download.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container">
                    <Database className="w-5 h-5 text-primary mb-2" />
                    <h4 className="text-xs font-bold text-on-background">1 Jaar Cloudwise Retentie</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-snug">
                      Data wordt maximaal 1 schooljaar bewaard voor aggregate bestuursanalyses en scholingstrajecten. Oude accounts worden automatisch gearchiveerd.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container">
                    <Users className="w-5 h-5 text-emerald-600 mb-2" />
                    <h4 className="text-xs font-bold text-on-background">Anonimisering voor Scholen</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-snug">
                      Schooldirecties hebben geen directe toegang tot individuele kandidaatantwoorden. Rapporten worden enkel geaggregeerd aangeleverd door Cloudwise.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4 border-t border-surface-container-high flex justify-between items-center">
          <div className="text-[11px] text-on-surface-variant">
            Cloudwise Nulmeting v4.2 • Ingelogd: <span className="font-semibold">{currentUser?.email || 'Niet geauthenticeerd'}</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-surface-container-low hover:bg-surface-container font-semibold text-xs text-on-surface-variant rounded-xl cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>

      {/* ================= MODAL: VRAGEN & ANTWOORDEN AANPASSEN ================= */}
      {editingQuestion && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-surface-container-high my-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-on-background">
                    Vraag #{editingQuestion.id} & Antwoorden Bewerken
                  </h3>
                  <span className="text-xs text-on-surface-variant">
                    {editingQuestion.categoryBadge} • Type: {editingQuestion.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingQuestion(null)}
                className="p-1.5 text-on-surface-variant hover:text-on-background rounded-full hover:bg-surface-container cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Vraagstelling / Casusbeschrijving *
                </label>
                <textarea
                  rows={3}
                  value={editQuestionText}
                  onChange={(e) => setEditQuestionText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Subcategorie / Deelonderwerp
                  </label>
                  <input
                    type="text"
                    value={editSubcategoryTitle}
                    onChange={(e) => setEditSubcategoryTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                    Badge Titel
                  </label>
                  <input
                    type="text"
                    value={editCategoryBadge}
                    onChange={(e) => setEditCategoryBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                  />
                </div>
              </div>

              {/* Options Editor */}
              {editOptions.length > 0 && (
                <div className="p-3 bg-surface-container-low rounded-2xl border border-surface-container">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-on-background uppercase tracking-wider">
                      {editingQuestion.type === 'knowledge'
                        ? 'Keuzeantwoorden (Selecteer het juiste antwoord)'
                        : 'Antwoordopties / Schaalniveaus'}
                    </label>
                    {editingQuestion.type === 'knowledge' && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextId = String.fromCharCode(97 + editOptions.length);
                          setEditOptions((prev) => [...prev, { id: nextId, label: 'Nieuwe optie' }]);
                        }}
                        className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                      >
                        + Optie toevoegen
                      </button>
                    )}
                  </div>

                  <div className="space-y-2">
                    {editOptions.map((opt, idx) => {
                      const isCorrect = editingQuestion.type === 'knowledge' && editCorrectOptionId === opt.id;

                      return (
                        <div
                          key={opt.id || idx}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                            isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-surface-container-lowest border-outline-variant/60'
                          }`}
                        >
                          {editingQuestion.type === 'knowledge' && (
                            <label className="flex items-center cursor-pointer mr-1" title="Markeer als juist antwoord">
                              <input
                                type="radio"
                                name="correctOption"
                                checked={isCorrect}
                                onChange={() => setEditCorrectOptionId(opt.id)}
                                className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                            </label>
                          )}

                          <span className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold text-on-surface-variant flex-shrink-0">
                            {opt.id}
                          </span>

                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditOptions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, label: val } : item))
                              );
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-outline-variant/50 text-xs bg-surface-container-lowest text-on-background"
                          />

                          {editingQuestion.type === 'knowledge' && editOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditOptions((prev) => prev.filter((_, i) => i !== idx));
                                if (editCorrectOptionId === opt.id) {
                                  setEditCorrectOptionId('');
                                }
                              }}
                              className="p-1 text-on-surface-variant hover:text-red-600 rounded cursor-pointer"
                              title="Optie verwijderen"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Explanation Field */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Didactische Toelichting / Uitleg bij het antwoord
                </label>
                <textarea
                  rows={2}
                  placeholder="Voeg uitleg toe die kandidaten of adviseurs kunnen inzien ter verdieping..."
                  value={editExplanation}
                  onChange={(e) => setEditExplanation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-surface-container-high mt-5">
              <button
                type="button"
                onClick={() => handleResetQuestionToDefault(editingQuestion)}
                className="px-3 py-1.5 text-xs text-on-surface-variant hover:text-red-700 hover:bg-red-50 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Herstellen naar standaard</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-4 py-2 text-xs text-on-surface-variant hover:bg-surface-container rounded-xl cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedQuestion}
                  disabled={isSavingQuestion}
                  className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingQuestion ? 'Opslaan in Firebase...' : 'Opslaan in Vragenbank'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SCHOOL INCLUSIEF ALLE DATA VERWIJDEREN ================= */}
      {schoolToDelete && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-surface-container-lowest rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-red-200 my-6">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-background">
                  School & Alle Data Definitief Verwijderen
                </h3>
                <span className="text-xs text-red-700 font-semibold">
                  Onomkeerbare database-actie (Cascading Delete)
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-red-50/70 border border-red-200/80 mb-4 text-xs text-red-950 space-y-2">
              <p className="font-semibold">
                U staat op het punt om school <span className="font-bold underline">{schoolToDelete.name}</span> ({schoolToDelete.schoolCode}) handmatig te verwijderen.
              </p>
              <p>Hiermee wordt de volgende gekoppelde data direct en permanent gewist uit Firestore:</p>
              <ul className="list-disc pl-5 space-y-1 text-red-900 text-[11px]">
                <li>Het schooldocument in de <span className="font-mono">schools</span>-collectie</li>
                <li>De actieve schoolcode-registratie in <span className="font-mono">schoolCodes</span></li>
                <li>Alle opgeslagen assessment-resultaten en team-scores van deze school</li>
                <li>Alle gegenereerde kandidaat-activeringscodes (CW-ACT-...)</li>
                <li>Gekoppelde gebruikersaccounts worden veilig ontkoppeld van deze school</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                Typ ter bevestiging de schoolcode <strong className="font-mono text-on-background">{schoolToDelete.schoolCode}</strong> in:
              </label>
              <input
                type="text"
                placeholder={schoolToDelete.schoolCode}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-red-300 bg-surface-container-lowest text-xs text-on-background font-mono uppercase"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-container-high">
              <button
                type="button"
                onClick={() => setSchoolToDelete(null)}
                className="px-4 py-2 text-xs text-on-surface-variant hover:bg-surface-container rounded-xl cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteSchool}
                disabled={
                  isDeletingSchool ||
                  deleteConfirmText.trim().toUpperCase() !== schoolToDelete.schoolCode.trim().toUpperCase()
                }
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingSchool ? 'Data verwijderen...' : 'Ja, Verwijder School & Alle Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
