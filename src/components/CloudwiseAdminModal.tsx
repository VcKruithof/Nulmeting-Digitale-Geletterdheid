import React, { useState, useEffect } from 'react';
import {
  School,
  SchoolAggregateReport,
  SavedAssessment,
  AppUser,
  Bestuur,
  Question,
} from '../types';
import {
  getAllSchools,
  addSchoolByCloudwise,
  deleteSchoolByCloudwise,
  seedInitialSchoolsInFirebase,
  getAggregatedSchoolReport,
  normalizeSchoolCode,
  checkUserIsAdmin,
  saveUserProfile,
  getUserProfile,
  auth,
  googleProvider,
  PRIMARY_ADMIN_EMAIL,
  getAllBesturen,
  updateBestuurDeadline,
  updateSchoolDeadline,
  DEFAULT_BESTUREN,
} from '../services/firebase';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  ShieldAlert,
  Building,
  KeyRound,
  Plus,
  BarChart3,
  Users,
  Award,
  CheckCircle,
  Copy,
  Printer,
  Sparkles,
  X,
  AlertTriangle,
  Layers,
  School as SchoolIcon,
  Lock,
  Mail,
  ShieldCheck,
  ArrowRight,
  LogOut,
  Trash2,
  Calendar,
  FileSpreadsheet,
  Download,
  BookOpen,
  Filter,
  Search,
  Check,
  Clock,
  Database,
  RefreshCw,
} from 'lucide-react';
import { QUESTIONS } from '../data/questionsData';
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
}

type AdminTab = 'schools' | 'vragenbank' | 'exports' | 'reports' | 'avg';

export const CloudwiseAdminModal: React.FC<CloudwiseAdminModalProps> = ({
  isOpen,
  onClose,
  localAssessments,
  currentUser,
  onAdminLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('schools');
  const [schools, setSchools] = useState<School[]>([]);
  const [besturen, setBesturen] = useState<Bestuur[]>(DEFAULT_BESTUREN);
  const [isLoadingSchools, setIsLoadingSchools] = useState<boolean>(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [selectedBestuur, setSelectedBestuur] = useState<Bestuur>(DEFAULT_BESTUREN[0]);
  const [report, setReport] = useState<SchoolAggregateReport | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Access Control / Login Wall State
  const [isCheckingAccess, setIsCheckingAccess] = useState<boolean>(true);
  const [isAuthorizedAdmin, setIsAuthorizedAdmin] = useState<boolean>(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Admin Inlogmuur form state
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // New School Form state
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newSector, setNewSector] = useState<'PO' | 'VO' | 'PO/VO'>('PO');
  const [newBestuurId, setNewBestuurId] = useState<string>('bestuur_opo_mh');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Deadline Editing
  const [editingDeadlineSchoolId, setEditingDeadlineSchoolId] = useState<string | null>(null);
  const [editingDeadlineValue, setEditingDeadlineValue] = useState<string>('2026-06-30');
  const [deadlineSuccess, setDeadlineSuccess] = useState<string | null>(null);

  // Vragenbank filter state
  const [vragenbankSearch, setVragenbankSearch] = useState('');
  const [vragenbankModuleFilter, setVragenbankModuleFilter] = useState<string>('alle');
  const [vragenbankTypeFilter, setVragenbankTypeFilter] = useState<string>('alle');

  // XLSX Export Queue state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Verify admin status
  useEffect(() => {
    if (!isOpen) return;

    const verifyAdminStatus = async () => {
      setIsCheckingAccess(true);
      setAccessDeniedMessage(null);

      if (!currentUser) {
        setIsAuthorizedAdmin(false);
        setIsCheckingAccess(false);
        return;
      }

      const hasAdmin = await checkUserIsAdmin(currentUser.uid, currentUser.email);
      if (hasAdmin) {
        setIsAuthorizedAdmin(true);
        loadSchoolsAndBesturen();
      } else {
        setIsAuthorizedAdmin(false);
        setAccessDeniedMessage(
          `U bent momenteel ingelogd als "${currentUser.displayName || currentUser.email}". Dit account beschikt niet over de Cloudwise beheerdersrol.`
        );
      }
      setIsCheckingAccess(false);
    };

    verifyAdminStatus();
  }, [isOpen, currentUser]);

  const loadSchoolsAndBesturen = async () => {
    setIsLoadingSchools(true);
    try {
      const bList = await getAllBesturen();
      setBesturen(bList);
      if (bList.length > 0) setSelectedBestuur(bList[0]);

      let list = await getAllSchools();
      if (list.length === 0) {
        list = await seedInitialSchoolsInFirebase();
      }
      setSchools(list);
      if (list.length > 0 && !selectedSchool) {
        setSelectedSchool(list[0]);
      }
    } catch (err) {
      console.error('Failed loading data:', err);
    } finally {
      setIsLoadingSchools(false);
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
          displayName: cred.user.displayName || 'Cloudwise Beheerder',
          role: 'directie',
          schoolId: 'cloudwise_hq',
          schoolCode: '#BEHEER',
          schoolName: 'Cloudwise Hoofdkantoor',
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
      loadSchoolsAndBesturen();
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
      loadSchoolsAndBesturen();
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setLoginError('Google aanmelding niet gelukt.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSaveDeadline = async (schoolId: string) => {
    await updateSchoolDeadline(schoolId, editingDeadlineValue);
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, deadline: editingDeadlineValue } : s))
    );
    setEditingDeadlineSchoolId(null);
    setDeadlineSuccess(`Deadline succesvol aangepast naar ${editingDeadlineValue}`);
    setTimeout(() => setDeadlineSuccess(null), 3000);
  };

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
      await exportBestuurReportAsync(bestuurToExport, associatedSchools.length > 0 ? associatedSchools : schools, localAssessments, (p) => {
        setExportProgress(p);
      });
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

  // Combine all questions for the Vragenbank
  const allQuestionsForBank: (Question & { sourceModule: string })[] = [
    ...QUESTIONS.map((q) => ({ ...q, sourceModule: 'Kerndoelen Basis' })),
    ...MODULAR_QUESTIONS.map((q) => ({
      ...q,
      sourceModule: SYSTEM_MODULES.find((m) => m.id === q.moduleId)?.name || 'Module',
    })),
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
              Toegang tot de centrale vragenbank, deadline-configuratie en AVG-rapportage exports is voorbehouden aan geautoriseerde Cloudwise administrators.
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
                <span>Scholen & Deadlines</span>
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
                <span>Vragenbank ({allQuestionsForBank.length})</span>
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

            {/* TAB 1: SCHOLEN & DEADLINES */}
            {activeTab === 'schools' && (
              <div className="py-5">
                {deadlineSuccess && (
                  <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{deadlineSuccess}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-on-background">
                      Aangesloten Scholen & Toetsdeadlines
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Elke school is gekoppeld aan exact één Bestuur_ID. Pas handmatig de uiterste toetsdatum (deadline) aan.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-3.5 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Nieuwe School Toevoegen</span>
                  </button>
                </div>

                {/* Add School Form */}
                {showAddForm && (
                  <div className="p-4 mb-5 rounded-2xl bg-surface-container-low border border-primary/30">
                    <h4 className="text-xs font-bold text-on-background uppercase tracking-wider mb-3">
                      Nieuwe School Registreren in Firestore
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                          Schoolnaam
                        </label>
                        <input
                          type="text"
                          placeholder="Bijv. De Horizon"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-xs text-on-background"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                          Schoolcode
                        </label>
                        <input
                          type="text"
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
                          Gekoppeld Bestuur
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
                        onClick={() => setShowAddForm(false)}
                        className="px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container rounded-xl cursor-pointer"
                      >
                        Annuleren
                      </button>
                      <button
                        onClick={async () => {
                          if (!newName || !newCode) return alert('Vul schoolnaam en code in.');
                          const selectedB = besturen.find((b) => b.id === newBestuurId);
                          await addSchoolByCloudwise({
                            name: newName,
                            schoolCode: newCode,
                            city: newCity,
                            sector: newSector,
                            bestuurId: newBestuurId,
                            bestuurName: selectedB?.name || 'Bestuur',
                            isActive: true,
                          });
                          setShowAddForm(false);
                          loadSchoolsAndBesturen();
                        }}
                        className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 cursor-pointer"
                      >
                        Opslaan in Database
                      </button>
                    </div>
                  </div>
                )}

                {/* Schools Table */}
                <div className="border border-surface-container-high rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container-low border-b border-surface-container-high text-on-surface-variant font-semibold">
                      <tr>
                        <th className="p-3">Schoolnaam</th>
                        <th className="p-3">Schoolcode</th>
                        <th className="p-3">Gekoppeld Bestuur</th>
                        <th className="p-3">Sector</th>
                        <th className="p-3">Uiterste Toetsdatum</th>
                        <th className="p-3 text-right">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-container-high">
                      {schools.map((schoolItem) => {
                        const isEditingThis = editingDeadlineSchoolId === schoolItem.id;
                        const schoolBestuur = besturen.find((b) => b.id === schoolItem.bestuurId) || besturen[0];

                        return (
                          <tr key={schoolItem.id} className="hover:bg-surface-container-lowest/50">
                            <td className="p-3 font-semibold text-on-background">
                              {schoolItem.name || schoolItem.schoolName}
                            </td>
                            <td className="p-3 font-mono font-bold text-primary">
                              {schoolItem.schoolCode}
                            </td>
                            <td className="p-3 text-on-surface-variant">
                              <span className="block font-medium">{schoolBestuur?.name}</span>
                              <span className="text-[10px] font-mono text-outline">{schoolItem.bestuurId || schoolBestuur?.id}</span>
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">
                                {schoolItem.sector}
                              </span>
                            </td>
                            <td className="p-3">
                              {isEditingThis ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="date"
                                    value={editingDeadlineValue}
                                    onChange={(e) => setEditingDeadlineValue(e.target.value)}
                                    className="px-2 py-1 rounded border border-primary text-xs"
                                  />
                                  <button
                                    onClick={() => handleSaveDeadline(schoolItem.id)}
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
                              <button
                                onClick={() => handleExportSchoolXLSX(schoolItem)}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs flex items-center gap-1 ml-auto cursor-pointer"
                                title="Download Schoolrapport XLSX"
                              >
                                <Download className="w-3 h-3" />
                                <span>XLSX</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: VRAGENBANK */}
            {activeTab === 'vragenbank' && (
              <div className="py-5">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <h3 className="text-base font-bold text-on-background">
                      Centraal Beheer Toetsvragen & Modules
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Overzicht van alle basisvragen (vaardigheden, kennisvragen, niveaubepaling) en modulaire vragen.
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

                {/* Questions List */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredQuestions.map((q) => (
                    <div
                      key={`${q.id}_${q.subcategoryId}`}
                      className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-primary/40 transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary bg-sky-1 px-2 py-0.5 rounded">
                            #{q.id}
                          </span>
                          <span className="text-[11px] font-bold text-on-surface-variant uppercase bg-surface-container px-2 py-0.5 rounded">
                            {q.sourceModule}
                          </span>
                          <span className="text-xs font-semibold text-on-background">
                            {q.subcategoryTitle}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-outline-variant">
                          Type: {q.type}
                        </span>
                      </div>
                      <p className="text-xs text-on-background font-medium mb-2 leading-relaxed">
                        {q.questionText}
                      </p>
                      {q.options && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-on-surface-variant bg-surface-container-low p-2.5 rounded-xl">
                          {q.options.map((opt) => (
                            <div key={opt.id} className="flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-surface-container-high flex items-center justify-center text-[10px] font-bold">
                                {opt.id}
                              </span>
                              <span className="truncate">{opt.label}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: XLSX EXPORT ENGINE */}
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
                        Exporteer school- en bestuursrapportages rechtstreeks naar Microsoft Excel (.xlsx) met dynamische tabbladen (Algemeen Overzicht, Kerndoelen Analyse, Modulestatistieken, en Geanonimiseerde Responsen).
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
                      Download het volledige .xlsx rapport voor één specifieke school (Foreach Kandidaat in School_ID).
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
                      Benchmark alle scholen onder het Bestuur (Foreach School in Bestuur_ID, Foreach Kandidaat in Bestuur_ID).
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

            {/* TAB 4: AVG & RETENTIE */}
            {activeTab === 'avg' && (
              <div className="py-5 space-y-4">
                <div className="p-5 rounded-2xl bg-sky-1/40 border border-primary/20">
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
    </div>
  );
};
