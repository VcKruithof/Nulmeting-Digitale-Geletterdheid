import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  validateSchoolCode,
  saveUserProfile,
  getUserProfile,
  checkUserIsAdmin,
  normalizeSchoolCode,
} from '../services/firebase';
import { AppUser, School, UserRole } from '../types';
import {
  KeyRound,
  Mail,
  Lock,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  School as SchoolIcon,
  HelpCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AppUser) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'register',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [schoolCodeInput, setSchoolCodeInput] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('leerkracht');
  const [targetSector, setTargetSector] = useState<'PO' | 'VO'>('PO');

  // School validation state
  const [validatedSchool, setValidatedSchool] = useState<School | null>(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

  // General auth state
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time school code validation
  const handleSchoolCodeChange = async (val: string) => {
    setSchoolCodeInput(val);
    setCodeError(null);
    const cleaned = val.trim();
    if (cleaned.length >= 3) {
      setIsValidatingCode(true);
      try {
        const school = await validateSchoolCode(cleaned);
        if (school) {
          setValidatedSchool(school);
          setCodeError(null);
          if (school.sector === 'PO' || school.sector === 'VO') {
            setTargetSector(school.sector);
          }
        } else {
          setValidatedSchool(null);
          if (cleaned.length >= 6) {
            setCodeError('Schoolcode niet gevonden. Controleer de code met uw school of Cloudwise.');
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsValidatingCode(false);
      }
    } else {
      setValidatedSchool(null);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);

    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      let profile = await getUserProfile(cred.user.uid);
      const isAdmin = await checkUserIsAdmin(cred.user.uid, cred.user.email);

      if (!profile) {
        if (isAdmin) {
          profile = {
            uid: cred.user.uid,
            email: cred.user.email || email,
            displayName: cred.user.displayName || 'Cloudwise Beheerder',
            role: 'directie',
            schoolId: 'cloudwise_beheer',
            schoolCode: '#BEHEER',
            schoolName: 'Cloudwise Onderwijsadvies',
            targetSector: 'PO',
            isCloudwiseAdmin: true,
            createdAt: new Date().toISOString(),
          };
          await saveUserProfile(profile);
        } else {
          setMode('register');
          setAuthError('Voer uw unieke schoolcode in om uw account te voltooien.');
          setIsLoading(false);
          return;
        }
      } else {
        profile.isCloudwiseAdmin = isAdmin || profile.isCloudwiseAdmin;
      }

      onSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setAuthError('Onjuist e-mailadres of wachtwoord. Probeer opnieuw of maak een nieuw account aan.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Inloggen met e-mail/wachtwoord is momenteel niet ingeschakeld. U kunt direct inloggen met uw Google-account of contact opnemen met Cloudwise.');
      } else if (err.code === 'auth/invalid-email') {
        setAuthError('Voer een geldig e-mailadres in.');
      } else {
        setAuthError('Inloggen mislukt: ' + (err.message || 'Controleer uw gegevens'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // Strict requirement: school code MUST be validated
    if (!validatedSchool) {
      setCodeError('Een geldige schoolcode is verplicht om een account aan te maken.');
      return;
    }

    if (!fullName.trim()) {
      setAuthError('Vul uw volledige naam in.');
      return;
    }

    if (password.length < 6) {
      setAuthError('Wachtwoord moet minimaal 6 tekens lang zijn.');
      return;
    }

    setIsLoading(true);

    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: fullName.trim() });

      const resolvedSchoolName = validatedSchool.name || validatedSchool.schoolName || 'School';
      const resolvedSchoolSector = (validatedSchool.sector as 'PO' | 'VO' | 'PO/VO') || 'PO';
      let effectiveTargetSector: 'PO' | 'VO' = targetSector;
      if (resolvedSchoolSector === 'PO') effectiveTargetSector = 'PO';
      if (resolvedSchoolSector === 'VO') effectiveTargetSector = 'VO';

      const newProfile: AppUser = {
        uid: cred.user.uid,
        email: cred.user.email || email.trim(),
        displayName: fullName.trim(),
        role: selectedRole,
        schoolId: validatedSchool.id,
        schoolCode: normalizeSchoolCode(validatedSchool.schoolCode),
        schoolName: resolvedSchoolName,
        schoolSector: resolvedSchoolSector,
        targetSector: effectiveTargetSector,
        isCloudwiseAdmin: false, // Strict: Never assigned on registration. Only granted in Firebase.
        createdAt: new Date().toISOString(),
      };

      await saveUserProfile(newProfile);
      onSuccess(newProfile);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setAuthError('Dit e-mailadres is al in gebruik. Kies hierboven voor "Inloggen".');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('Registreren met e-mail/wachtwoord is momenteel niet geactiveerd. U kunt direct inloggen met uw Google-account!');
      } else {
        setAuthError('Account aanmaken mislukt: ' + (err.message || 'Controleer uw invoer'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const res = await signInWithPopup(auth, googleProvider);
      let profile = await getUserProfile(res.user.uid);
      const isAdmin = await checkUserIsAdmin(res.user.uid, res.user.email);

      if (!profile) {
        // If first time Google login, verify if schoolcode is provided
        if (!validatedSchool) {
          // Switch to register tab with pre-filled name & email to require schoolcode
          setEmail(res.user.email || '');
          setFullName(res.user.displayName || '');
          setMode('register');
          setAuthError('Koppel nu uw unieke schoolcode om uw account te voltooien.');
          setIsLoading(false);
          return;
        }

        const resolvedSchoolName = validatedSchool.name || validatedSchool.schoolName || 'School';
        const resolvedSchoolSector = (validatedSchool.sector as 'PO' | 'VO' | 'PO/VO') || 'PO';
        let effectiveTargetSector: 'PO' | 'VO' = targetSector;
        if (resolvedSchoolSector === 'PO') effectiveTargetSector = 'PO';
        if (resolvedSchoolSector === 'VO') effectiveTargetSector = 'VO';

        profile = {
          uid: res.user.uid,
          email: res.user.email || '',
          displayName: res.user.displayName || fullName || 'Onderwijsprofessional',
          role: selectedRole,
          schoolId: validatedSchool.id,
          schoolCode: normalizeSchoolCode(validatedSchool.schoolCode),
          schoolName: resolvedSchoolName,
          schoolSector: resolvedSchoolSector,
          targetSector: effectiveTargetSector,
          isCloudwiseAdmin: isAdmin,
          createdAt: new Date().toISOString(),
        };
        await saveUserProfile(profile);
      } else {
        profile.isCloudwiseAdmin = isAdmin || profile.isCloudwiseAdmin;
      }

      onSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setAuthError('Google login niet gelukt: ' + (err.message || 'Probeer het opnieuw'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#006687] via-[#008dbb] to-[#00b6ed] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-sky-200">
                Cloudwise Onderwijs Inlog
              </span>
              <h2 className="text-2xl font-bold font-headline-md leading-tight">
                {mode === 'login' ? 'Inloggen bij Nulmeting' : 'Maak uw Account aan'}
              </h2>
            </div>
          </div>
          <p className="text-sm text-sky-100 mt-1">
            {mode === 'login'
              ? 'Log in met uw schoolaccount om uw nulmeting uit te voeren en resultaten te bekijken.'
              : 'Voor deelname is een geverifieerde schoolcode van uw school of Cloudwise vereist.'}
          </p>

          {/* Mode Tabs */}
          <div className="flex gap-2 mt-4 bg-black/20 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-[#006687] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Inloggen
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setAuthError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-[#006687] shadow-sm'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              Nieuw Account (met schoolcode)
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6">
          {authError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Let op</p>
                <p>{authError}</p>
              </div>
            </div>
          )}

          {/* REGISTER FORM */}
          {mode === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-5">
              {/* STEP 1: Mandatory School Code Verification */}
              <div className="p-4 bg-sky-50/70 border-2 border-[#00b6ed]/30 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-[#00435a] flex items-center gap-2">
                    <SchoolIcon className="w-4 h-4 text-[#006687]" />
                    Schoolcode <span className="text-red-500">* (Verplicht)</span>
                  </label>
                  {isValidatingCode && (
                    <span className="text-xs text-[#006687] animate-pulse">Controleren...</span>
                  )}
                </div>

                <div className="relative">
                  <KeyRound className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={schoolCodeInput}
                    onChange={(e) => handleSchoolCodeChange(e.target.value)}
                    placeholder="Voer uw schoolcode in"
                    className="w-full pl-11 pr-10 py-3 bg-white border border-gray-300 rounded-xl text-base font-mono font-bold tracking-wider text-[#00435a] focus:ring-2 focus:ring-[#00b6ed] focus:border-transparent outline-none uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal"
                  />
                  {validatedSchool && (
                    <CheckCircle2 className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                  )}
                </div>

                {/* Validated School Badge */}
                {validatedSchool && (
                  <div className="p-3.5 bg-emerald-50 border-2 border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-fadeIn shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <span className="font-bold text-sm text-emerald-950 block">
                          {validatedSchool.name || validatedSchool.schoolName || 'School gevonden'}
                        </span>
                        <span className="text-emerald-800 text-[11px] font-medium">
                          {[validatedSchool.city, `Sector: ${validatedSchool.sector}`].filter(Boolean).join(' • ')}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-200 text-emerald-900 rounded-lg font-bold text-[11px] whitespace-nowrap">
                      Geverifieerde school
                    </span>
                  </div>
                )}

                {codeError && (
                  <div className="text-xs text-red-600 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{codeError}</span>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-0.5">
                  <span className="text-gray-500">
                    Voer de unieke schoolcode in die uw school of Cloudwise heeft verstrekt. Deze wordt direct gecontroleerd.
                  </span>
                </div>
              </div>

              {/* Name and Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Volledige Naam <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Bijv. Vincent Kruithof"
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00b6ed] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    E-mailadres <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="naam@school.nl"
                      className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00b6ed] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Role & Sector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Uw Functie / Rol
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#00b6ed] outline-none"
                  >
                    <option value="leerkracht">Leerkracht / Docent</option>
                    <option value="ict_coordinator">ICT-coördinator / iCoach</option>
                    <option value="intern_begeleider">Intern Begeleider (IB'er)</option>
                    <option value="directie">Directie / Schoolleider</option>
                    <option value="leerkrachtondersteuner">Onderwijsassistent / Ondersteuner</option>
                    <option value="overig">Overig</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Onderwijssector</span>
                    {validatedSchool && (
                      <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        School: {validatedSchool.sector}
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={validatedSchool?.sector === 'VO'}
                      onClick={() => validatedSchool?.sector !== 'VO' && setTargetSector('PO')}
                      title={validatedSchool?.sector === 'VO' ? 'Niet selecteerbaar: uw school is gekoppeld aan VO' : 'Primair Onderwijs (PO)'}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                        validatedSchool?.sector === 'VO'
                          ? 'bg-gray-100 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed select-none'
                          : targetSector === 'PO'
                          ? 'bg-[#006687] text-white border-[#006687] cursor-pointer'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <span>PO (Primair)</span>
                      {validatedSchool?.sector === 'VO' && <Lock className="w-3 h-3 text-gray-400 shrink-0" />}
                    </button>
                    <button
                      type="button"
                      disabled={validatedSchool?.sector === 'PO'}
                      onClick={() => validatedSchool?.sector !== 'PO' && setTargetSector('VO')}
                      title={validatedSchool?.sector === 'PO' ? 'Niet selecteerbaar: uw school is gekoppeld aan PO' : 'Voortgezet Onderwijs (VO)'}
                      className={`py-2 px-2 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                        validatedSchool?.sector === 'PO'
                          ? 'bg-gray-100 text-gray-400 border-gray-200 opacity-60 cursor-not-allowed select-none'
                          : targetSector === 'VO'
                          ? 'bg-[#006687] text-white border-[#006687] cursor-pointer'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <span>VO (Voortgezet)</span>
                      {validatedSchool?.sector === 'PO' && <Lock className="w-3 h-3 text-gray-400 shrink-0" />}
                    </button>
                  </div>
                  {validatedSchool && (validatedSchool.sector === 'PO' || validatedSchool.sector === 'VO') && (
                    <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                      <span>Vastgesteld op {validatedSchool.sector} op basis van uw school ({validatedSchool.name || validatedSchool.schoolName}).</span>
                    </p>
                  )}
                  {validatedSchool && validatedSchool.sector === 'PO/VO' && (
                    <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                      ✓ Combinatieschool: u kunt kiezen tussen PO en VO.
                    </p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Wachtwoord kiezen <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimaal 6 tekens"
                    className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00b6ed] outline-none"
                  />
                </div>
              </div>

              {/* Submit Register Button */}
              <button
                type="submit"
                disabled={isLoading || !validatedSchool}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  validatedSchool
                    ? 'bg-[#006687] hover:bg-[#00506b] text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span>Account aanmaken...</span>
                ) : (
                  <>
                    <span>Account aanmaken & Starten</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* LOGIN FORM */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  E-mailadres
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="naam@school.nl"
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00b6ed] outline-none"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Uw wachtwoord"
                    className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00b6ed] outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-[#006687] hover:bg-[#00506b] text-white font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                {isLoading ? <span>Inloggen...</span> : <span>Inloggen</span>}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-gray-500 font-semibold">Of meld aan met</span>
            </div>
          </div>

          {/* Google SSO Login */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-2xl border-2 border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm flex items-center justify-center gap-3 transition-colors cursor-pointer"
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
            <span>Inloggen met Google Schoolaccount</span>
          </button>

          {/* Privacy Note */}
          <p className="text-[11px] text-gray-500 text-center leading-relaxed">
            De schoolcode koppelt uw score veilig en geanonimiseerd aan het geaggregeerde schoolrapport voor Cloudwise. Uw individuele antwoorden blijven beschermd conform de AVG.
          </p>
        </div>
      </div>
    </div>
  );
};
