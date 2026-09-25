import React, { useState, useEffect } from 'react';
import {
  School,
  SchoolAggregateReport,
  SavedAssessment,
  AppUser,
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
} from 'lucide-react';

interface CloudwiseAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  localAssessments: SavedAssessment[];
  currentUser: AppUser | null;
  onAdminLoginSuccess: (user: AppUser) => void;
}

export const CloudwiseAdminModal: React.FC<CloudwiseAdminModalProps> = ({
  isOpen,
  onClose,
  localAssessments,
  currentUser,
  onAdminLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'schools' | 'reports'>('schools');
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState<boolean>(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Verify admin status whenever modal opens or currentUser changes
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
        loadSchools();
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

  const loadSchools = async () => {
    setIsLoadingSchools(true);
    try {
      let list = await getAllSchools();
      if (list.length === 0) {
        list = await seedInitialSchoolsInFirebase();
      }
      setSchools(list);
      if (list.length > 0 && !selectedSchool) {
        setSelectedSchool(list[0]);
      }
    } catch (err) {
      console.error('Failed loading schools:', err);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  // Handle deleting a school
  const handleDeleteSchool = async (schoolId: string, schoolCode: string, schoolName: string) => {
    if (!window.confirm(`Weet u zeker dat u "${schoolName}" (${schoolCode}) wilt verwijderen?`)) {
      return;
    }
    try {
      await deleteSchoolByCloudwise(schoolId, schoolCode);
      setSchools((prev) => prev.filter((s) => s.id !== schoolId));
      if (selectedSchool?.id === schoolId) {
        const remaining = schools.filter((s) => s.id !== schoolId);
        setSelectedSchool(remaining.length > 0 ? remaining[0] : null);
      }
      setFormSuccess(`School "${schoolName}" succesvol verwijderd.`);
    } catch (e) {
      console.error('Failed deleting school:', e);
    }
  };

  // Handle Admin Login via Email/Password
  const handleAdminEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, adminEmailInput.trim(), adminPasswordInput);
      const isAdmin = await checkUserIsAdmin(cred.user.uid, cred.user.email);

      if (!isAdmin) {
        await signOut(auth);
        setLoginError(
          `Toegang geweigerd: het account "${cred.user.email}" heeft geen Cloudwise beheerdersrechten.`
        );
        setIsLoggingIn(false);
        return;
      }

      let profile = await getUserProfile(cred.user.uid);
      if (!profile) {
        profile = {
          uid: cred.user.uid,
          email: cred.user.email || adminEmailInput.trim(),
          displayName: cred.user.displayName || 'Cloudwise Beheerder',
          role: 'directie',
          schoolId: 'cloudwise_hq',
          schoolCode: '#CLOUDWISE2026',
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
      loadSchools();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setLoginError('Onjuist beheerderse-mailadres of wachtwoord.');
      } else {
        setLoginError(err.message || 'Inloggen mislukt. Controleer uw gegevens.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Admin Login via Google SSO
  const handleAdminGoogleLogin = async () => {
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      const isAdmin = await checkUserIsAdmin(res.user.uid, res.user.email);

      if (!isAdmin) {
        await signOut(auth);
        setLoginError(
          `Toegang geweigerd: Google-account "${res.user.email}" beschikt niet over de Cloudwise beheerdersrol.`
        );
        setIsLoggingIn(false);
        return;
      }

      let profile = await getUserProfile(res.user.uid);
      if (!profile) {
        profile = {
          uid: res.user.uid,
          email: res.user.email || '',
          displayName: res.user.displayName || 'Vincent Kruithof (Beheerder)',
          role: 'directie',
          schoolId: 'cloudwise_hq',
          schoolCode: '#CLOUDWISE2026',
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
      loadSchools();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setLoginError('Google aanmelding niet gelukt: ' + (err.message || 'Probeer het opnieuw'));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Generate a random unique schoolcode helper
  const handleAutoGenerateCode = () => {
    const prefix = newName ? newName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') : 'SCH';
    const year = new Date().getFullYear();
    const rand = Math.floor(10 + Math.random() * 90);
    setNewCode(`#SCOD${year}${prefix || 'CLW'}${rand}`);
  };

  // Handle adding new school
  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    setIsSubmitting(true);
    setFormSuccess(null);

    try {
      const added = await addSchoolByCloudwise({
        name: newName.trim(),
        schoolCode: normalizeSchoolCode(newCode),
        city: newCity.trim() || 'Nederland',
        sector: newSector,
        isActive: true,
        notes: `Toegevoegd via Cloudwise Beheer op ${new Date().toLocaleDateString('nl-NL')}`,
      });

      setSchools((prev) => [added, ...prev.filter((s) => s.id !== added.id)]);
      setSelectedSchool(added);
      setFormSuccess(`School "${added.name}" succesvol geregistreerd met code ${added.schoolCode}!`);
      setNewName('');
      setNewCode('');
      setNewCity('');
      setShowAddForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load aggregate report when selected school changes
  useEffect(() => {
    if (selectedSchool && isAuthorizedAdmin) {
      loadReport(selectedSchool);
    }
  }, [selectedSchool, isAuthorizedAdmin]);

  const loadReport = async (school: School) => {
    try {
      const res = await getAggregatedSchoolReport(school, localAssessments);
      setReport(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSwitchAdminAccount = async () => {
    await signOut(auth);
    setIsAuthorizedAdmin(false);
    setAccessDeniedMessage(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl max-w-5xl w-full shadow-2xl overflow-hidden my-4 max-h-[94vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#00384c] via-[#004f6e] to-[#006687] p-6 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center justify-between gap-4 pr-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-400/20 backdrop-blur-md flex items-center justify-center border border-amber-300/40 shadow-inner">
                <Lock className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-bold text-[10px] tracking-wider uppercase flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    Strikt Beveiligd Cloudwise Portaal
                  </span>
                  {isAuthorizedAdmin && (
                    <span className="text-xs text-sky-200 font-mono">
                      Beheerder: {currentUser?.email || PRIMARY_ADMIN_EMAIL}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold font-headline-md leading-tight text-white mt-0.5">
                  Cloudwise Beheerportaal & Schoolrapportages
                </h2>
              </div>
            </div>

            {isAuthorizedAdmin && (
              <button
                onClick={handleSwitchAdminAccount}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white/90 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Wissel van beheeraccount"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Afmelden</span>
              </button>
            )}
          </div>

          {/* Tab Navigation (Only visible when authenticated as admin) */}
          {isAuthorizedAdmin && (
            <div className="flex gap-3 mt-6 border-b border-white/15">
              <button
                onClick={() => setActiveTab('schools')}
                className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'schools'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-white/70 hover:text-white'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Schoolcodes & Klantbeheer</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
                  {schools.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`pb-3 px-2 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'reports'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-white/70 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Geaggregeerd Schoolrapport (Gemiddelde Scores)</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-200 text-xs font-semibold">
                  Exclusief Cloudwise
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* LOADING STATE */}
          {isCheckingAccess ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-[#006687] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm font-semibold text-[#00435a]">
                Beheerdersrechten verifiëren...
              </p>
            </div>
          ) : !isAuthorizedAdmin ? (
            /* ============================================================ */
            /* INLOGMUUR / ACCESS DENIED SCREEN                             */
            /* ============================================================ */
            <div className="max-w-xl mx-auto py-6 space-y-6">
              {/* Access Warning Banner */}
              <div className="p-5 bg-amber-50/90 border-2 border-amber-200 rounded-3xl space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-800">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-amber-950">
                      Beveiligde Inlogmuur — Beheerdersrol Vereist
                    </h3>
                    <p className="text-xs text-amber-900 leading-relaxed">
                      Het Cloudwise beheerportaal en de geaggregeerde schoolrapporten zijn strikt afgeschermd.
                      Alleen geautoriseerde Cloudwise-medewerkers met een toegekende beheerdersrol hebben toegang.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white/80 rounded-xl border border-amber-200/60 text-xs text-amber-950 font-medium">
                  <strong>Strikte beveiligingsregel:</strong> Deze rol wordt nooit toegekend aan reguliere gebruikers bij registratie en is voorbehouden aan Cloudwise beheer.
                </div>
              </div>

              {/* Show message if already logged in with a non-admin account */}
              {accessDeniedMessage && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-xs animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block text-red-950">Toegang Geweigerd</span>
                    <p>{accessDeniedMessage}</p>
                    <p className="text-red-700 pt-1">
                      Meld u hieronder aan met het geautoriseerde Cloudwise beheerdersaccount.
                    </p>
                  </div>
                </div>
              )}

              {loginError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-900 text-xs animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-red-950">Authenticatiefout</span>
                    <p>{loginError}</p>
                  </div>
                </div>
              )}

              {/* Administrator Login Form */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-[#00435a] flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-[#006687]" />
                    <span>Inloggen als Cloudwise Beheerder</span>
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Log in met uw Google Workspace account of beheerderse-mailadres.
                  </p>
                </div>

                {/* Google Workspace SSO for Admins */}
                <button
                  type="button"
                  onClick={handleAdminGoogleLogin}
                  disabled={isLoggingIn}
                  className="w-full py-3.5 px-4 rounded-2xl border-2 border-gray-200 hover:border-[#006687] bg-white hover:bg-sky-50/50 text-gray-800 font-bold text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer shadow-xs"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Inloggen met Google (@edu.cloudwise.nl)</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-3 text-gray-500 font-semibold">Of beheerder inloggen met e-mail</span>
                  </div>
                </div>

                <form onSubmit={handleAdminEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Beheerder E-mailadres
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        required
                        value={adminEmailInput}
                        onChange={(e) => setAdminEmailInput(e.target.value)}
                        placeholder="v.kruithof@edu.cloudwise.nl"
                        className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00b6ed] outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                      Wachtwoord
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        required
                        value={adminPasswordInput}
                        onChange={(e) => setAdminPasswordInput(e.target.value)}
                        placeholder="Wachtwoord"
                        className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00b6ed] outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-3.5 px-6 rounded-2xl bg-[#006687] hover:bg-[#00506b] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    {isLoggingIn ? (
                      <span>Beheerdersrol controleren...</span>
                    ) : (
                      <>
                        <span>Inloggen & Beheerdersrol Valideren</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="p-3 bg-gray-50 rounded-xl text-[11px] text-gray-500 text-center leading-relaxed">
                  Geautoriseerde beheerder: <code className="font-bold text-[#006687]">{PRIMARY_ADMIN_EMAIL}</code>.
                </div>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* AUTHORIZED ADMIN CONTENT                                     */
            /* ============================================================ */
            <>
              {formSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-900 text-sm animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                  <button
                    onClick={() => setFormSuccess(null)}
                    className="text-emerald-700 hover:text-emerald-950 text-xs font-bold underline cursor-pointer"
                  >
                    Sluiten
                  </button>
                </div>
              )}

              {/* TAB 1: SCHOOLS & CODES MANAGEMENT */}
              {activeTab === 'schools' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#00435a]">
                        Gekoppelde Scholen & Schoolcodes
                      </h3>
                      <p className="text-xs text-gray-600">
                        Wanneer Cloudwise een nieuwe klant heeft, voegt u hier de schoolcode toe. Leerkrachten kunnen enkel een account aanmaken met een geldige code.
                      </p>
                    </div>

                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="px-4 py-2.5 bg-[#006687] hover:bg-[#00506b] text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Nieuwe School & Code Toevoegen</span>
                    </button>
                  </div>

                  {/* Add New School Form */}
                  {showAddForm && (
                    <div className="p-5 bg-sky-50/70 border-2 border-[#00b6ed]/30 rounded-2xl animate-fadeIn space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-[#00435a] flex items-center gap-2">
                          <SchoolIcon className="w-4 h-4 text-[#006687]" />
                          Nieuwe Klant / School Registreren
                        </h4>
                        <button
                          onClick={() => setShowAddForm(false)}
                          className="text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                        >
                          Annuleren
                        </button>
                      </div>

                      <form onSubmit={handleAddSchool} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Schoolnaam <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              placeholder="Bijv. Het Mozaïek"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00b6ed] outline-none font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Plaats / Locatie
                            </label>
                            <input
                              type="text"
                              value={newCity}
                              onChange={(e) => setNewCity(e.target.value)}
                              placeholder="Bijv. Utrecht"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00b6ed] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">
                              Sector
                            </label>
                            <select
                              value={newSector}
                              onChange={(e) => setNewSector(e.target.value as any)}
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00b6ed] outline-none font-medium"
                            >
                              <option value="PO">Primair Onderwijs (PO)</option>
                              <option value="VO">Voortgezet Onderwijs (VO)</option>
                              <option value="PO/VO">Combinatie PO / VO</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-bold text-gray-700">
                              Schoolcode <span className="text-red-500">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={handleAutoGenerateCode}
                              className="text-xs text-[#006687] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3" /> Genereer unieke code
                            </button>
                          </div>
                          <div className="relative">
                            <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              required
                              value={newCode}
                              onChange={(e) => setNewCode(e.target.value)}
                              placeholder="Bijv. #SCOD..."
                              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-mono font-bold uppercase tracking-wider text-[#00435a] focus:ring-2 focus:ring-[#00b6ed] outline-none"
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Geef deze code aan de schoolleider of ICT-coördinator. Zij verstrekken deze aan hun team.
                          </p>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 cursor-pointer"
                          >
                            Annuleren
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 bg-[#006687] hover:bg-[#00506b] text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                          >
                            {isSubmitting ? 'Bezig met opslaan...' : 'School & Code Opslaan'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Schools Table */}
                  <div className="bg-white border border-outline-variant/50 rounded-2xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-bold border-b border-gray-200">
                          <tr>
                            <th className="py-3.5 px-4">School & Locatie</th>
                            <th className="py-3.5 px-4">Schoolcode</th>
                            <th className="py-3.5 px-4">Sector</th>
                            <th className="py-3.5 px-4 text-center">Status</th>
                            <th className="py-3.5 px-4 text-right">Actie</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {schools.map((school) => {
                            const isCopied = copiedCode === school.schoolCode;
                            return (
                              <tr key={school.id} className="hover:bg-sky-50/40 transition-colors">
                                <td className="py-3.5 px-4">
                                  <span className="font-bold text-[#00435a] block">{school.name}</span>
                                  <span className="text-xs text-gray-500">{school.city}</span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 bg-sky-100 text-[#00435a] rounded-lg font-mono font-bold text-xs">
                                      {school.schoolCode}
                                    </span>
                                    <button
                                      onClick={() => handleCopyCode(school.schoolCode)}
                                      title="Kopieer schoolcode"
                                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-[#006687] transition-colors cursor-pointer"
                                    >
                                      {isCopied ? (
                                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-semibold">
                                    {school.sector}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Actief
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedSchool(school);
                                        setActiveTab('reports');
                                      }}
                                      className="px-3 py-1.5 bg-white border border-[#006687] text-[#006687] hover:bg-sky-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                      Bekijk Rapport
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSchool(school.id, school.schoolCode, school.name)}
                                      title="Verwijder school"
                                      className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
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
                </div>
              )}

              {/* TAB 2: AGGREGATED SCHOOL REPORTS (EXCLUSIVE TO CLOUDWISE) */}
              {activeTab === 'reports' && (
                <div className="space-y-6">
                  {/* Privacy Boundary Banner */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-bold text-amber-950 block">
                        Strikte Afscherming & AVG Richtlijnen:
                      </span>
                      Alle individuele scores van leerkrachten worden op een grote berg gegooid en vormen samen dit geaggregeerde schoolresultaat. 
                      Conform de vereisten wordt dit schoolrapport aan niemand anders getoond en kan het uitsluitend door Cloudwise adviseurs worden geraadpleegd en besproken.
                    </div>
                  </div>

                  {/* School Selector Bar */}
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Building className="w-5 h-5 text-[#006687]" />
                      <div>
                        <label className="block text-[11px] font-bold text-gray-500 uppercase">
                          Selecteer School voor Geaggregeerd Rapport
                        </label>
                        <select
                          value={selectedSchool?.id || ''}
                          onChange={(e) => {
                            const s = schools.find((item) => item.id === e.target.value);
                            if (s) setSelectedSchool(s);
                          }}
                          className="text-base font-bold text-[#00435a] bg-transparent border-none outline-none cursor-pointer"
                        >
                          {schools.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.city}) — Code: {s.schoolCode}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-white border border-gray-300 hover:border-[#006687] text-gray-700 hover:text-[#006687] rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Rapport Afdrukken / PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Report Presentation */}
                  {report ? (
                    <div className="space-y-6">
                      {/* Summary Metric Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-5 bg-white border border-outline-variant/50 rounded-2xl shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase">Deelnemers</span>
                            <Users className="w-4 h-4 text-[#006687]" />
                          </div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-[#00435a]">
                              {report.participantCount}
                            </span>
                            <span className="text-xs text-gray-600">onderwijsprofessionals</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            {report.participantCount > 0
                              ? 'Gekoppeld via code ' + report.schoolCode
                              : 'Nog geen afgeronde testen'}
                          </p>
                        </div>

                        <div className="p-5 bg-white border border-outline-variant/50 rounded-2xl shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase">Gemiddelde Schoolscore</span>
                            <Award className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-3xl font-extrabold text-[#00435a]">
                              {report.averageScorePercentage}%
                            </span>
                            <span className="text-xs font-bold text-emerald-700">
                              {report.averageScorePercentage >= 75
                                ? 'Gevorderd'
                                : report.averageScorePercentage >= 55
                                ? 'Vaardig'
                                : 'Basisniveau'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Gewogen gemiddelde van alle afgenomen nulmetingen
                          </p>
                        </div>

                        <div className="p-5 bg-white border border-outline-variant/50 rounded-2xl shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase">Sector & Locatie</span>
                            <Layers className="w-4 h-4 text-purple-600" />
                          </div>
                          <div className="mt-2 flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-[#00435a]">
                              {report.sector || 'PO'}
                            </span>
                            <span className="text-xs text-gray-600">{report.city}</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Landelijke Kerndoelen Digitale Geletterdheid
                          </p>
                        </div>
                      </div>

                      {/* Domain Scores Breakdown */}
                      <div className="bg-white border border-outline-variant/50 rounded-2xl p-6 shadow-xs space-y-4">
                        <h4 className="font-bold text-base text-[#00435a] flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-[#006687]" />
                          <span>Gemiddelde Resultaten per Hoofddomein</span>
                        </h4>

                        <div className="space-y-4">
                          {report.domainAverages.map((dom) => (
                            <div key={dom.id} className="p-4 bg-gray-50/80 rounded-xl space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <span className="font-bold text-sm text-[#00435a] block">
                                    {dom.title}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {dom.shortTitle}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="text-lg font-extrabold text-[#006687]">
                                    {dom.averagePercentage}%
                                  </span>
                                </div>
                              </div>

                              {/* Bar */}
                              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    dom.averagePercentage >= 70
                                      ? 'bg-emerald-500'
                                      : dom.averagePercentage >= 50
                                      ? 'bg-[#00b6ed]'
                                      : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.max(5, dom.averagePercentage)}%` }}
                                ></div>
                              </div>

                              <div className="flex justify-between text-[11px] text-gray-600 pt-1">
                                <span>Kennisvragen: {dom.averageKnowledgePercentage}% goed</span>
                                <span>Zelfinschatting: {dom.averageSelfAssessmentAvg} / 4.0</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Priority Areas: "Waar moet schoolbreed aan gewerkt worden?" */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-3">
                          <h4 className="font-bold text-sm text-amber-950 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            <span>Waar moet schoolbreed aan gewerkt worden?</span>
                          </h4>
                          <ul className="space-y-2 text-xs text-amber-900">
                            {report.priorityDevelopmentAreas.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                          <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Sterke Schoolbrede Pijlers</span>
                          </h4>
                          <ul className="space-y-2 text-xs text-emerald-900">
                            {report.keyStrengths.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Cloudwise Advies & Interventies */}
                      <div className="p-5 bg-sky-50/70 border border-[#00b6ed]/30 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-[#00435a] flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#006687]" />
                            <span>Aanbevolen Cloudwise Interventies voor {report.schoolName}</span>
                          </h4>
                          <span className="text-[11px] font-semibold text-[#006687]">
                            Adviesrapport voor Cloudwise Onderwijsadviseur
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {report.recommendedCloudwiseWorkshops.map((ws, idx) => (
                            <div key={idx} className="p-3 bg-white border border-sky-100 rounded-xl text-xs space-y-1">
                              <span className="font-bold text-[#006687] block">Optie {idx + 1}</span>
                              <span className="text-gray-800 font-medium">{ws}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Selecteer een school om het geaggregeerde rapport te laden...
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500 shrink-0">
          <span>Cloudwise Nulmeting Digitale Geletterdheid — Beheersysteem</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold cursor-pointer transition-colors"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
