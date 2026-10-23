import React, { useState, useEffect } from 'react';
import {
  School,
  ActivationCode,
  TargetFunctionRole,
  Bestuur,
  AppUser,
} from '../types';
import {
  generateActivationCode,
  getSchoolActivationCodes,
  DEFAULT_BESTUREN,
} from '../services/firebase';
import { SYSTEM_MODULES } from '../data/modulesData';
import {
  KeyRound,
  Users,
  Copy,
  CheckCircle,
  Plus,
  ShieldAlert,
  Building,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Clock,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface SchoolAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  currentUser: AppUser | null;
}

export const SchoolAccountModal: React.FC<SchoolAccountModalProps> = ({
  isOpen,
  onClose,
  school,
  currentUser,
}) => {
  const [activationCodes, setActivationCodes] = useState<ActivationCode[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedEmailText, setCopiedEmailText] = useState<boolean>(false);

  // New Code Form state
  const [showGenerateForm, setShowGenerateForm] = useState<boolean>(false);
  const [targetFunction, setTargetFunction] = useState<TargetFunctionRole | 'alle'>('leerkracht');
  const [selectedModules, setSelectedModules] = useState<string[]>(['kerndoelen']);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedSuccess, setGeneratedSuccess] = useState<string | null>(null);

  // Load existing activation codes
  useEffect(() => {
    if (!isOpen || !school) return;
    loadCodes();
  }, [isOpen, school]);

  const loadCodes = async () => {
    const list = await getSchoolActivationCodes(school.id);
    if (list.length > 0) {
      setActivationCodes(list);
    } else {
      // Provide initial mock/seeded activation code if none in DB
      setActivationCodes([
        {
          code: `CW-ACT-${school.schoolCode.replace('#', '').slice(0, 4)}-LK`,
          schoolId: school.id,
          bestuurId: school.bestuurId || 'bestuur_opo_mh',
          schoolName: school.name || school.schoolName || 'School',
          targetSector: school.sector === 'VO' ? 'VO' : 'PO',
          targetFunction: 'leerkracht',
          assignedModules: ['kerndoelen', school.sector === 'VO' ? 'magister' : 'parnassys', 'googledrive'],
          maxUses: 50,
          usedCount: 12,
          isUsed: false,
          createdAt: new Date().toISOString(),
          createdByName: 'Schoolleiding',
        },
      ]);
    }
  };

  if (!isOpen) return null;

  const bestuur = DEFAULT_BESTUREN.find((b) => b.id === school.bestuurId) || DEFAULT_BESTUREN[0];
  const deadline = school.deadline || bestuur.deadline || '2026-06-30';

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleToggleModule = (modId: string) => {
    if (modId === 'kerndoelen') return; // Base is mandatory
    if (selectedModules.includes(modId)) {
      setSelectedModules(selectedModules.filter((m) => m !== modId));
    } else {
      setSelectedModules([...selectedModules, modId]);
    }
  };

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const newCode = await generateActivationCode({
        schoolId: school.id,
        bestuurId: school.bestuurId || bestuur.id,
        schoolName: school.name || school.schoolName || 'School',
        targetSector: school.sector === 'VO' ? 'VO' : 'PO',
        targetFunction,
        assignedModules: selectedModules,
        maxUses: 60,
      });

      setActivationCodes([newCode, ...activationCodes]);
      setGeneratedSuccess(`Activeringscode ${newCode.code} succesvol aangemaakt!`);
      setShowGenerateForm(false);
      setTimeout(() => setGeneratedSuccess(null), 4000);
    } catch (err) {
      console.warn('Error generating code:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const emailTemplate = `Beste collega,

Binnenkort starten we met de Cloudwise Nulmeting Digitale Geletterdheid voor onze school (${school.name}).
Met deze nulmeting brengen we onze vaardigheden, parate vakkennis en behoeften in kaart volgens de nieuwe landelijke kerndoelen.

Jouw unieke activeringscode voor ons team is: ${activationCodes[0]?.code || '#ACTIVEREN'}
Toets uiterste inleverdatum: ${new Date(deadline).toLocaleDateString('nl-NL', { year: 'numeric', month: 'long', day: 'numeric' })}

Na het invullen ontvang je direct jouw persoonlijke rapport met praktische tips en ontwikkelpunten.
Let op: jouw individuele antwoorden zijn vertrouwelijk en worden conform AVG geanonimiseerd verwerkt.

Met vriendelijke groet,
De schoolleiding / ICT-coördinator`;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailTemplate);
    setCopiedEmailText(true);
    setTimeout(() => setCopiedEmailText(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-surface-container-lowest rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-surface-container-high my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-5 border-b border-surface-container-high">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-primary bg-sky-1 px-2.5 py-0.5 rounded-full">
                  Schoolaccount Beheer (RBAC Niveau 2)
                </span>
                <span className="text-xs text-on-surface-variant font-mono">
                  {school.schoolCode}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-on-background mt-0.5">
                {school.name || school.schoolName}
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

        {/* Hierarchy & Context Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-5">
          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container">
            <span className="text-xs text-on-surface-variant block font-medium">Bovenliggend Bestuur</span>
            <span className="text-sm font-bold text-primary block mt-0.5">{bestuur.name}</span>
            <span className="text-[11px] text-on-surface-variant/80 font-mono">Bestuur ID: {bestuur.code}</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container">
            <span className="text-xs text-on-surface-variant block font-medium">Toetsdeadline Team</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-on-background">
                {new Date(deadline).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <span className="text-[11px] text-on-surface-variant/80">Vastgesteld door Administrator</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-sky-1/40 border border-primary/20">
            <span className="text-xs text-primary block font-medium">AVG / Privacy Waarborg</span>
            <span className="text-xs text-on-background block mt-0.5 leading-snug">
              Kandidaten behouden strikt anonieme antwoorden. Geen directe schoolinzage in individuele scores.
            </span>
          </div>
        </div>

        {generatedSuccess && (
          <div className="p-3.5 mb-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-sm font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{generatedSuccess}</span>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-on-background flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-primary" />
              Activeringscodes voor het Schoolteam
            </h3>
            <p className="text-xs text-on-surface-variant">
              Kandidaten hebben een activeringscode nodig om de nulmeting te starten. Hierdoor worden ze automatisch gekoppeld aan {school.name}.
            </p>
          </div>
          <button
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Nieuwe Code Genereren</span>
          </button>
        </div>

        {/* Generate Code Form */}
        {showGenerateForm && (
          <form onSubmit={handleCreateCode} className="p-5 mb-6 rounded-2xl bg-surface-container-low border border-primary/30">
            <h4 className="font-bold text-on-background text-sm mb-3">
              Nieuwe Activeringscode Aanmaken
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Doelgroep / Functie
                </label>
                <select
                  value={targetFunction}
                  onChange={(e) => setTargetFunction(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm text-on-background"
                >
                  <option value="leerkracht">Leerkracht (PO / VO)</option>
                  <option value="directie">Schoolleiding / Directie</option>
                  <option value="oop_lesgevend">Onderwijsondersteunend personeel (OOP wel lesgevend)</option>
                  <option value="oop_niet_lesgevend">Onderwijsondersteunend personeel (OOP niet lesgevend)</option>
                  <option value="intern_begeleider">Intern Begeleider (IB)</option>
                  <option value="ict_coordinator">ICT-Coördinator / i-Coach</option>
                  <option value="alle">Alle Functies (Algemene schoolcode)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">
                  Doelsector
                </label>
                <input
                  type="text"
                  disabled
                  value={`${school.sector} Onderwijs`}
                  className="w-full px-3 py-2 rounded-xl border border-surface-container bg-surface-container text-sm text-on-surface-variant"
                />
              </div>
            </div>

            {/* Modular Package Selection */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Toegewezen Modules voor deze doelgroep (Kerndoelen staat standaard aan):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SYSTEM_MODULES.map((mod) => {
                  const isChecked = selectedModules.includes(mod.id);
                  const isBase = mod.isBase;
                  return (
                    <label
                      key={mod.id}
                      onClick={() => !isBase && handleToggleModule(mod.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        isChecked
                          ? 'border-primary bg-sky-1/30 font-semibold text-primary'
                          : 'border-surface-container-high bg-surface-container-lowest text-on-surface-variant'
                      } ${isBase ? 'opacity-90 cursor-default' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isBase}
                          onChange={() => {}}
                          className="rounded text-primary"
                        />
                        <span>{mod.name}</span>
                      </div>
                      {isBase && <span className="text-[10px] uppercase font-bold text-primary bg-sky-1 px-1.5 py-0.5 rounded">Standaard</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowGenerateForm(false)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container rounded-xl cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="submit"
                disabled={isGenerating}
                className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 cursor-pointer"
              >
                {isGenerating ? 'Aanmaken...' : 'Code Genereren'}
              </button>
            </div>
          </form>
        )}

        {/* Codes Table */}
        <div className="border border-surface-container-high rounded-2xl overflow-hidden mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low border-b border-surface-container-high text-on-surface-variant font-semibold">
              <tr>
                <th className="p-3">Activeringscode</th>
                <th className="p-3">Doelgroep</th>
                <th className="p-3">Modules</th>
                <th className="p-3">Gebruik</th>
                <th className="p-3 text-right">Actie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {activationCodes.map((codeItem) => (
                <tr key={codeItem.code} className="hover:bg-surface-container-lowest/50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary text-sm bg-sky-1/60 px-2 py-0.5 rounded">
                        {codeItem.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(codeItem.code)}
                        className="p-1 text-on-surface-variant hover:text-primary rounded cursor-pointer"
                        title="Kopieer activeringscode"
                      >
                        {copiedCode === codeItem.code ? (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="p-3 capitalize font-medium text-on-background">
                    {codeItem.targetFunction.replace('_', ' ')}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {codeItem.assignedModules.map((m) => (
                        <span key={m} className="text-[10px] bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-on-surface-variant">
                    {codeItem.usedCount} van {codeItem.maxUses || 50} geactiveerd
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleCopyCode(codeItem.code)}
                      className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                    >
                      {copiedCode === codeItem.code ? 'Gekopieerd!' : 'Kopieer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ready-to-use Invitation Template */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-surface-container-high">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-on-background flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              Kant-en-klare teamuitnodiging voor e-mail
            </span>
            <button
              onClick={handleCopyEmail}
              className="text-xs font-bold text-primary hover:text-primary-container flex items-center gap-1 cursor-pointer"
            >
              {copiedEmailText ? <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmailText ? 'Tekst gekopieerd!' : 'Kopieer e-mailtekst'}</span>
            </button>
          </div>
          <p className="text-xs text-on-surface-variant font-mono bg-surface-container-lowest p-3 rounded-xl border border-surface-container overflow-x-auto whitespace-pre-wrap">
            {emailTemplate}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-surface-container-high flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-surface-container-low hover:bg-surface-container font-semibold text-sm text-on-surface-variant rounded-xl cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
