import React, { useState } from 'react';
import {
  KeyRound,
  Building,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Layers,
  Lock,
  Unlock,
} from 'lucide-react';
import { AppUser, School } from '../types';
import { validateSchoolCode, validateActivationCode, linkSchoolToUser } from '../services/firebase';

interface EnterSchoolCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  onSuccess: (updatedUser: AppUser, school: School) => void;
}

export const EnterSchoolCodeModal: React.FC<EnterSchoolCodeModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSuccess,
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [previewSchool, setPreviewSchool] = useState<School | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ school: School; user: AppUser } | null>(null);

  if (!isOpen) return null;

  // Real-time checking of entered code
  const handleInputChange = async (value: string) => {
    setCodeInput(value);
    setError(null);
    setSuccessInfo(null);
    const cleaned = value.trim();

    if (cleaned.length >= 3) {
      setIsValidating(true);
      try {
        // 1. Check activation code (CW-ACT-...)
        if (cleaned.toUpperCase().startsWith('CW-ACT-') || cleaned.toUpperCase().startsWith('ACT-')) {
          const act = await validateActivationCode(cleaned);
          if (act) {
            setPreviewSchool({
              id: act.schoolId,
              bestuurId: act.bestuurId,
              name: act.schoolName,
              schoolName: act.schoolName,
              schoolCode: cleaned.toUpperCase(),
              city: 'Gekoppeld via activeringscode',
              sector: act.targetSector,
              isActive: true,
              assignedModules: act.assignedModules,
              createdAt: act.createdAt,
            });
            setError(null);
            return;
          }
        }

        // 2. Standard school code in Firestore
        const school = await validateSchoolCode(cleaned);
        if (school) {
          setPreviewSchool(school);
          setError(null);
        } else {
          setPreviewSchool(null);
          if (cleaned.length >= 5) {
            setError('Geen school gevonden met deze code. Controleer de code.');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsValidating(false);
      }
    } else {
      setPreviewSchool(null);
    }
  };

  const handleApplyPreset = (presetCode: string) => {
    handleInputChange(presetCode);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('U moet ingelogd zijn om een schoolcode te koppelen.');
      return;
    }
    if (!codeInput.trim()) {
      setError('Voer een geldige schoolcode in.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await linkSchoolToUser(currentUser.uid, codeInput.trim());
      if (res.success && res.user && res.school) {
        setSuccessInfo({ school: res.school, user: res.user });
        onSuccess(res.user, res.school);
      } else {
        setError(res.error || 'Het ontgrendelen is mislukt. Controleer de code.');
      }
    } catch (err: any) {
      setError('Fout bij ontgrendelen: ' + (err.message || 'Onbekende fout'));
    } finally {
      setIsSubmitting(false);
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
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold tracking-wider uppercase text-sky-200">
                Toets Ontgrendelen
              </span>
              <h2 className="text-2xl font-bold font-headline-md leading-tight">
                Schoolcode Invoeren
              </h2>
            </div>
          </div>
          <p className="text-sm text-sky-100 mt-1 leading-relaxed">
            Koppel uw unieke schoolcode of activeringscode om de klaargezette nulmeting en specifieke modules voor uw school te ontgrendelen.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          {successInfo ? (
            <div className="p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-4 animate-fadeIn text-emerald-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-emerald-900">
                    Toets Succesvol Ontgrendeld!
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Gekoppeld aan <strong>{successInfo.school.name || successInfo.school.schoolName}</strong>
                  </p>
                </div>
              </div>

              <div className="bg-white/80 p-3 rounded-xl border border-emerald-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Schoolcode:</span>
                  <span className="font-mono font-bold text-emerald-900">{successInfo.user.schoolCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sector:</span>
                  <span className="font-bold text-emerald-900">{successInfo.user.schoolSector || 'PO'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Geactiveerde Modules:</span>
                  <span className="font-bold text-emerald-900">
                    {(successInfo.user.assignedModules && successInfo.user.assignedModules.length > 0
                      ? successInfo.user.assignedModules
                      : ['kerndoelen']
                    ).join(', ')}
                  </span>
                </div>
              </div>

              <p className="text-xs text-emerald-800">
                De juiste toetsvragen en modules staan nu klaar. U kunt direct beginnen met de nulmeting.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <span>Direct naar de Toets</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Ongeldige code</p>
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* Input Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#00435a] uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[#006687]" />
                    <span>Schoolcode of Activeringscode</span>
                  </label>
                  {isValidating && (
                    <span className="text-xs text-[#006687] animate-pulse">Controleren...</span>
                  )}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    value={codeInput}
                    onChange={(e) => handleInputChange(e.target.value)}
                    placeholder="Bijv. #SCOD1001 of CW-ACT-..."
                    className="w-full pl-4 pr-10 py-3.5 bg-gray-50 border-2 border-gray-300 rounded-2xl text-base font-mono font-bold tracking-wider text-[#00435a] focus:ring-2 focus:ring-[#00b6ed] focus:border-[#00b6ed] outline-none uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal transition-all"
                  />
                  {previewSchool && (
                    <CheckCircle2 className="w-5 h-5 absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-600" />
                  )}
                </div>
              </div>

              {/* School Preview Badge */}
              {previewSchool && (
                <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                        <Building className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-emerald-950">
                          {previewSchool.name || previewSchool.schoolName}
                        </h4>
                        <p className="text-xs text-emerald-800">
                          {[previewSchool.city, `Sector: ${previewSchool.sector}`].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded font-bold text-[10px]">
                      Gevonden
                    </span>
                  </div>

                  {/* Modules Preview */}
                  <div className="pt-2 border-t border-emerald-200/60 text-xs text-emerald-900 flex items-center gap-1.5 flex-wrap">
                    <Layers className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="font-semibold">Klaargezette Modules:</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono">
                      Kerndoelen (basis)
                    </span>
                    {previewSchool.assignedModules && previewSchool.assignedModules.filter((m) => m !== 'kerndoelen').map((m) => (
                      <span key={m} className="bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-mono capitalize">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !codeInput.trim()}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
                  codeInput.trim()
                    ? 'bg-[#006687] hover:bg-[#00506b] text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span>Toets Ontgrendelen...</span>
                ) : (
                  <>
                    <Unlock className="w-5 h-5" />
                    <span>Toets Ontgrendelen</span>
                  </>
                )}
              </button>

              {/* Demo presets helper for quick testing */}
              <div className="pt-4 border-t border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Voorbeeldcodes om direct te testen:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPreset('#SCOD1001')}
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-[#006687] hover:bg-sky-50 text-left transition-all cursor-pointer"
                  >
                    <span className="font-mono font-bold text-xs text-[#006687] block">#SCOD1001</span>
                    <span className="text-[11px] text-gray-600 block">De Regenboog (PO • ParnasSys)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('#SCOD2001')}
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-[#006687] hover:bg-sky-50 text-left transition-all cursor-pointer"
                  >
                    <span className="font-mono font-bold text-xs text-[#006687] block">#SCOD2001</span>
                    <span className="text-[11px] text-gray-600 block">Montessori College (VO • Magister)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('#SCOD1002')}
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-[#006687] hover:bg-sky-50 text-left transition-all cursor-pointer"
                  >
                    <span className="font-mono font-bold text-xs text-[#006687] block">#SCOD1002</span>
                    <span className="text-[11px] text-gray-600 block">De Komeet (PO • Drive & Teams)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyPreset('#SCOD2002')}
                    className="p-2.5 rounded-xl border border-gray-200 hover:border-[#006687] hover:bg-sky-50 text-left transition-all cursor-pointer"
                  >
                    <span className="font-mono font-bold text-xs text-[#006687] block">#SCOD2002</span>
                    <span className="text-[11px] text-gray-600 block">Gymnasium Midden (VO • Teams)</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
