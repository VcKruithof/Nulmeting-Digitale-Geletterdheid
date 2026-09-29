import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Download,
  Printer,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Sparkles,
  Layers,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { AssessmentResult, Question, AnswersMap, SubcategoryScore } from '../types';
import { exportAssessmentToPDF } from '../utils/pdfGenerator';
import { SubgoalDetailModal } from './SubgoalDetailModal';
import { getScoreLevel } from '../utils/kerndoelHelper';

interface ResultsViewProps {
  result: AssessmentResult;
  questions: Question[];
  answers: AnswersMap;
  onRetake: () => void;
  onDeleteAndRetake?: () => void;
  onViewHistory?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  result,
  questions,
  answers,
  onRetake,
  onDeleteAndRetake,
  onViewHistory,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'wrong' | 'knowledge' | 'self'>('all');
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({});
  const [selectedSubgoal, setSelectedSubgoal] = useState<SubcategoryScore | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00b6ed', '#F0832E', '#38C263', '#C3B7FF', '#FFE981'],
    });
  }, []);

  const handleExportPDF = () => {
    setIsExporting(true);
    try {
      exportAssessmentToPDF(result);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleQuestionExpand = (qId: number) => {
    setExpandedQuestions((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const currentAnswers = result.answers || answers || {};

  const isQuestionCorrect = (q: Question) => {
    if (q.type !== 'knowledge' || !q.correctOptionId) return null;
    const userAns = currentAnswers[q.id];
    if (!userAns) return false;
    return String(userAns).toLowerCase() === q.correctOptionId.toLowerCase();
  };

  const filteredQuestions = questions.filter((q) => {
    if (filterType === 'knowledge') return q.type === 'knowledge';
    if (filterType === 'self') return q.type === 'self-assessment' || q.type === 'checklist';
    if (filterType === 'wrong') {
      if (q.type !== 'knowledge') return false;
      return isQuestionCorrect(q) === false;
    }
    return true;
  });

  const wrongCount = questions.filter(
    (q) => q.type === 'knowledge' && isQuestionCorrect(q) === false
  ).length;

  const cat1 = result.categories.find((c) => c.id === 'cat1') || result.categories[0];
  const cat2 = result.categories.find((c) => c.id === 'cat2') || result.categories[1];
  const cat3 = result.categories.find((c) => c.id === 'cat3') || result.categories[2];

  const allSubcategories = result.categories.flatMap((c) => c.subcategories);
  const inBalanceSubcats = allSubcategories.filter((s) => s.selfCalibrationStatus === 'in_balance');
  const moreSkilledSubcats = allSubcategories.filter((s) => s.selfCalibrationStatus === 'more_skilled');
  const stepNeededSubcats = allSubcategories.filter((s) => s.selfCalibrationStatus === 'step_needed');

  // Calculate circular stroke offset
  const radius = 45;
  const circumference = 2 * Math.PI * radius; // 282.7
  const strokeDashoffset = circumference - (result.overallScorePercentage / 100) * circumference;

  const levelInfo = getScoreLevel(result.overallScorePercentage);

  return (
    <div className="w-full max-w-6xl mx-auto pt-24 pb-16 px-4 sm:px-8 md:px-10 print:pt-0 print:pb-0 print:px-0 print:max-w-none">
      {/* ================= PAGE 1: HERO & LEVEL SCALE ================= */}
      <div className="print-break-inside-avoid">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 md:mb-12 print:mb-8 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-sky-1 text-on-primary-container font-label-sm text-xs px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                Cloudwise Nulmeting DG • {result.user.targetGroup || 'PO'}
              </span>
              <span className="text-xs text-on-surface-variant">
                Opgeslagen op {new Date().toLocaleDateString('nl-NL')}
              </span>
            </div>
            <h1 className="font-display-lg text-3xl sm:text-4xl md:text-5xl print:text-3xl text-on-background tracking-tight mb-3">
              Jouw Resultaten
            </h1>
            <p className="font-body-lg text-base sm:text-lg print:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
              Hier is een overzicht van je prestaties op de Cloudwise nulmeting. Jouw{' '}
              <strong>totaalscore</strong> is opgebouwd uit de <strong>kennisvragen</strong> en de{' '}
              <strong>acties in de klas</strong>. De <strong>zelfkennisvragen</strong> zijn gekoppeld aan de kennisvragen om gerichte feedback te geven op jouw <strong>zelfbeeld</strong>.
            </p>
          </div>

          {/* Circular Progress score card */}
          <div className="flex flex-col items-center bg-surface-container-lowest p-6 sm:p-8 rounded-[24px] ambient-shadow border border-white/80 shrink-0 self-center md:self-auto print:shadow-none print:border-gray-200">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-surface-container-low mb-4">
              <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" fill="none" r="45" stroke="#e8e8e8" strokeWidth="10" />
                <circle
                  className="transition-all duration-1000 ease-out"
                  cx="50"
                  cy="50"
                  fill="none"
                  r="45"
                  stroke="#00b6ed"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeWidth="10"
                  strokeLinecap="round"
                />
              </svg>
              <div className="flex flex-col items-center z-10">
                <span className="font-display-lg text-4xl font-extrabold text-primary">
                  {result.overallScorePercentage}%
                </span>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                  Totaalscore
                </span>
              </div>
            </div>
            <div className="bg-sky-1 text-on-primary-container px-4 py-2 rounded-full font-label-md text-sm font-bold flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <span>{result.overallLevel}</span>
            </div>
            <div className="mt-3 text-center text-xs text-on-surface-variant">
              <div className="font-medium">
                Kennis: <strong>{result.overallKnowledgePercentage}%</strong> • Acties klas: <strong>{result.overallChecklistPercentage ?? Math.round((result.overallChecklistCount / result.overallChecklistTotal) * 100)}%</strong>
              </div>
              <div className="text-[10px] text-on-surface-variant/75 mt-0.5">
                (Zelfkennis gekoppeld voor feedback op zelfbeeld)
              </div>
            </div>
          </div>
        </header>

        {/* Scoring Level Legend Bar */}
        <section className="mb-10 p-5 bg-surface-container-lowest rounded-2xl ambient-shadow border border-[#e8e8e8] print:shadow-none print:mb-0">
          <div className="flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-primary" />
            <h2 className="font-headline-md text-sm font-bold text-on-background uppercase tracking-wider">
              Niveauberekening & Eindscore Schaal
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div
              className={`p-3 rounded-xl border text-center transition-all ${
                result.overallScorePercentage < 50
                  ? 'bg-amber-100/70 border-amber-400 ring-2 ring-amber-400 shadow-xs'
                  : 'bg-surface-container-low/60 border-[#e8e8e8] text-on-surface-variant'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                &le; 50%
              </span>
              <span className="text-xs sm:text-sm font-bold block text-on-background">
                Beginnende gebruiker
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border text-center transition-all ${
                result.overallScorePercentage >= 50 && result.overallScorePercentage < 70
                  ? 'bg-sky-1 border-primary ring-2 ring-primary shadow-xs'
                  : 'bg-surface-container-low/60 border-[#e8e8e8] text-on-surface-variant'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                50% – 70%
              </span>
              <span className="text-xs sm:text-sm font-bold block text-on-background">
                Lerend gebruiker
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border text-center transition-all ${
                result.overallScorePercentage >= 70 && result.overallScorePercentage < 90
                  ? 'bg-emerald-100/70 border-emerald-500 ring-2 ring-emerald-500 shadow-xs'
                  : 'bg-surface-container-low/60 border-[#e8e8e8] text-on-surface-variant'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                70% – 90%
              </span>
              <span className="text-xs sm:text-sm font-bold block text-on-background">
                Gevorderd gebruiker
              </span>
            </div>

            <div
              className={`p-3 rounded-xl border text-center transition-all ${
                result.overallScorePercentage >= 90
                  ? 'bg-purple-100/70 border-purple-500 ring-2 ring-purple-500 shadow-xs'
                  : 'bg-surface-container-low/60 border-[#e8e8e8] text-on-surface-variant'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider block mb-0.5">
                &gt; 90%
              </span>
              <span className="text-xs sm:text-sm font-bold block text-on-background">
                Expert gebruiker
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ================= PAGE 2: KERNDOELEN BLOCKS (STARTS ON PAGE 2) ================= */}
      <section className="print-break-before-page grid grid-cols-1 md:grid-cols-12 print:grid-cols-12 gap-6 print:gap-4 mb-10 print:mb-0">
        {/* Category 1: Praktische kennis en vaardigheden */}
        {cat1 && (
          <div className="col-span-1 md:col-span-12 print:col-span-12 bg-surface-container-lowest rounded-[24px] print:rounded-2xl p-6 sm:p-8 print:p-5 ambient-shadow print:shadow-none hover-lift border-t-4 border-primary-container border-x border-b border-[#e8e8e8]/60 print-break-inside-avoid">
            <div className="flex justify-between items-start mb-6 print:mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-sky-1 text-primary">
                    {cat1.kerndoelCode}
                  </span>
                </div>
                <h2 className="font-headline-md text-xl sm:text-2xl print:text-lg text-on-background mb-1">
                  {cat1.title}
                </h2>
                <p className="font-body-md text-sm print:text-xs text-on-surface-variant">
                  Digitale systemen, media en informatie, data en AI.
                </p>
              </div>
              <div className="bg-primary-container text-on-primary w-12 h-12 print:w-10 print:h-10 rounded-full flex items-center justify-center font-headline-md text-lg print:text-base font-bold shrink-0">
                {cat1.combinedScorePercentage}%
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-4 print:gap-2.5">
              {cat1.subcategories.map((sub) => {
                const subCombined = sub.combinedPercentage ?? sub.knowledgePercentage;
                const checkPerc = sub.checklistPercentage ?? (sub.checklistTotal > 0 ? Math.round((sub.checklistCount / sub.checklistTotal) * 100) : 0);

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubgoal(sub)}
                    className="text-left p-4 print:p-2.5 rounded-xl bg-surface-container-low/40 hover:bg-sky-1/30 border border-outline-variant/40 hover:border-primary/50 transition-all duration-200 group cursor-pointer print-break-inside-avoid"
                  >
                    <div className="flex justify-between mb-1.5 items-center gap-2">
                      <span className="font-label-md text-sm print:text-xs font-bold text-on-background group-hover:text-primary transition-colors">
                        {sub.code}. {sub.title}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-1 text-primary">
                          {sub.level}
                        </span>
                        <span className="font-label-md text-sm print:text-xs font-bold text-primary">
                          {subCombined}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-track mb-2">
                      <div
                        className="progress-fill primary"
                        style={{ width: `${subCombined}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-[11px] print:text-[10px] text-on-surface-variant font-medium gap-1 mt-1">
                      <div className="flex items-center gap-1.5">
                        <span>Kennis: <strong className="text-on-background">{sub.knowledgePercentage}%</strong></span>
                        <span>•</span>
                        <span>Acties: <strong className="text-on-background">{checkPerc}%</strong></span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.selfCalibrationStatus === 'more_skilled'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : sub.selfCalibrationStatus === 'step_needed'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-sky-1 text-primary border border-sky-2'
                        }`}
                        title={sub.selfCalibrationFeedback}
                      >
                        {sub.selfCalibrationStatus === 'more_skilled' && '★ '}
                        {sub.selfCalibrationStatus === 'step_needed' && '↗ '}
                        {sub.selfCalibrationStatus === 'in_balance' && '✓ '}
                        {sub.selfCalibrationLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Category 2: Ontwerpen en maken */}
        {cat2 && (
          <div className="col-span-1 md:col-span-6 print:col-span-6 bg-surface-container-lowest rounded-[24px] print:rounded-2xl p-6 sm:p-8 print:p-5 ambient-shadow print:shadow-none hover-lift border-t-4 border-green-2 border-x border-b border-[#e8e8e8]/60 flex flex-col print-break-inside-avoid">
            <div className="flex justify-between items-start mb-6 print:mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                    {cat2.kerndoelCode}
                  </span>
                </div>
                <h2 className="font-headline-md text-xl print:text-lg font-bold text-on-background mb-1">
                  {cat2.title}
                </h2>
                <p className="font-body-md text-sm print:text-xs text-on-surface-variant">
                  Creëren met technologie en computational thinking.
                </p>
              </div>
              <div className="bg-green-2 text-on-primary w-12 h-12 print:w-10 print:h-10 rounded-full flex items-center justify-center font-headline-md text-lg print:text-base font-bold shrink-0">
                {cat2.combinedScorePercentage}%
              </div>
            </div>

            <div className="flex-grow flex flex-col justify-center gap-4 print:gap-2.5">
              {cat2.subcategories.map((sub) => {
                const subCombined = sub.combinedPercentage ?? sub.knowledgePercentage;
                const checkPerc = sub.checklistPercentage ?? (sub.checklistTotal > 0 ? Math.round((sub.checklistCount / sub.checklistTotal) * 100) : 0);

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubgoal(sub)}
                    className="text-left p-4 print:p-2.5 rounded-xl bg-surface-container-low/40 hover:bg-green-50 border border-outline-variant/40 hover:border-green-400 transition-all duration-200 group cursor-pointer print-break-inside-avoid"
                  >
                    <div className="flex justify-between mb-1.5 items-center gap-2">
                      <span className="font-label-md text-sm print:text-xs font-bold text-on-background group-hover:text-green-700 transition-colors">
                        {sub.code}. {sub.title}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                          {sub.level}
                        </span>
                        <span className="font-label-md text-sm print:text-xs font-bold text-green-700">
                          {subCombined}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-track mb-2">
                      <div
                        className="progress-fill green"
                        style={{ width: `${subCombined}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-[11px] print:text-[10px] text-on-surface-variant font-medium gap-1 mt-1">
                      <div className="flex items-center gap-1.5">
                        <span>Kennis: <strong className="text-on-background">{sub.knowledgePercentage}%</strong></span>
                        <span>•</span>
                        <span>Acties: <strong className="text-on-background">{checkPerc}%</strong></span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.selfCalibrationStatus === 'more_skilled'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : sub.selfCalibrationStatus === 'step_needed'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-green-100 text-green-800 border border-green-200'
                        }`}
                        title={sub.selfCalibrationFeedback}
                      >
                        {sub.selfCalibrationStatus === 'more_skilled' && '★ '}
                        {sub.selfCalibrationStatus === 'step_needed' && '↗ '}
                        {sub.selfCalibrationStatus === 'in_balance' && '✓ '}
                        {sub.selfCalibrationLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Category 3: De gedigitaliseerde wereld */}
        {cat3 && (
          <div className="col-span-1 md:col-span-6 print:col-span-6 bg-surface-container-lowest rounded-[24px] print:rounded-2xl p-6 sm:p-8 print:p-5 ambient-shadow print:shadow-none hover-lift border-t-4 border-orange-2 border-x border-b border-[#e8e8e8]/60 flex flex-col print-break-inside-avoid">
            <div className="flex justify-between items-start mb-6 print:mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800">
                    {cat3.kerndoelCode}
                  </span>
                </div>
                <h2 className="font-headline-md text-xl print:text-lg font-bold text-on-background mb-1">
                  {cat3.title}
                </h2>
                <p className="font-body-md text-sm print:text-xs text-on-surface-variant">
                  Veiligheid, privacy, digitaal welzijn en maatschappelijke impact.
                </p>
              </div>
              <div className="bg-orange-2 text-on-primary w-12 h-12 print:w-10 print:h-10 rounded-full flex items-center justify-center font-headline-md text-lg print:text-base font-bold shrink-0">
                {cat3.combinedScorePercentage}%
              </div>
            </div>

            <div className="flex-grow flex flex-col justify-center gap-4 print:gap-2.5">
              {cat3.subcategories.map((sub) => {
                const subCombined = sub.combinedPercentage ?? sub.knowledgePercentage;
                const checkPerc = sub.checklistPercentage ?? (sub.checklistTotal > 0 ? Math.round((sub.checklistCount / sub.checklistTotal) * 100) : 0);

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setSelectedSubgoal(sub)}
                    className="text-left p-4 print:p-2.5 rounded-xl bg-surface-container-low/40 hover:bg-orange-50 border border-outline-variant/40 hover:border-orange-400 transition-all duration-200 group cursor-pointer print-break-inside-avoid"
                  >
                    <div className="flex justify-between mb-1.5 items-center gap-2">
                      <span className="font-label-md text-sm print:text-xs font-bold text-on-background group-hover:text-orange-700 transition-colors">
                        {sub.code}. {sub.title}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800">
                          {sub.level}
                        </span>
                        <span className="font-label-md text-sm print:text-xs font-bold text-orange-700">
                          {subCombined}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-track mb-2">
                      <div
                        className="progress-fill orange"
                        style={{ width: `${subCombined}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between text-[11px] print:text-[10px] text-on-surface-variant font-medium gap-1 mt-1">
                      <div className="flex items-center gap-1.5">
                        <span>Kennis: <strong className="text-on-background">{sub.knowledgePercentage}%</strong></span>
                        <span>•</span>
                        <span>Acties: <strong className="text-on-background">{checkPerc}%</strong></span>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          sub.selfCalibrationStatus === 'more_skilled'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : sub.selfCalibrationStatus === 'step_needed'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}
                        title={sub.selfCalibrationFeedback}
                      >
                        {sub.selfCalibrationStatus === 'more_skilled' && '★ '}
                        {sub.selfCalibrationStatus === 'step_needed' && '↗ '}
                        {sub.selfCalibrationStatus === 'in_balance' && '✓ '}
                        {sub.selfCalibrationLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Primary Actions Bar */}
      <div className="flex flex-wrap items-center justify-center gap-4 mb-10 no-print">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="bg-surface-container-lowest border border-primary text-primary px-6 py-3 rounded-lg font-label-md text-sm font-bold hover:bg-surface-container-low transition-colors duration-200 cursor-pointer shadow-xs flex items-center gap-2"
        >
          <span>{showDetails ? 'Verberg details & adviezen' : 'Bekijk details & adviezen'}</span>
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="bg-sky-2 text-on-primary px-6 py-3 rounded-lg font-label-md text-sm font-bold hover:bg-primary-container transition-colors duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_8px_rgba(0,0,0,0.15)] flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>{isExporting ? 'Bezig met genereren...' : 'Download rapport (PDF)'}</span>
        </button>

        <button
          onClick={handlePrint}
          className="bg-surface-container-lowest border border-outline-variant text-on-surface-variant px-5 py-3 rounded-lg font-label-md text-sm font-semibold hover:bg-surface-container-low transition-colors duration-200 cursor-pointer flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Printen</span>
        </button>
      </div>

      {/* ================= IN-DEPTH DETAILS SECTION (EXPANDABLE) ================= */}
      {showDetails && (
        <div className="space-y-8 print:space-y-6 animate-in fade-in duration-300 print-break-before-page">
          {/* Zelfbeeld & Zelfkennis Feedback Overview */}
          <div className="bg-surface-container-lowest rounded-[24px] p-6 sm:p-8 print:p-5 ambient-shadow print:shadow-none border border-[#e8e8e8] print-break-inside-avoid">
            <div className="flex items-center gap-2.5 mb-2">
              <Sparkles className="w-5 h-5 text-orange-2" />
              <h2 className="font-headline-md text-xl font-bold text-on-background">
                Inzicht in Zelfbeeld & Zelfkennis
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Jouw eigen inschatting op de 18 zelfkennisvragen is direct gekoppeld aan de 27 inhoudelijke kennisvragen (3 per subdomein). In plaats van een los percentage geeft dit gerichte feedback op hoe realistisch of bescheiden je naar je eigen digitale vaardigheden kijkt:
            </p>

            {result.selfCalibrationOverview && (
              <div className="p-4 rounded-xl bg-surface-container-low/70 border border-[#e8e8e8] mb-6">
                <p className="text-sm font-semibold text-primary leading-relaxed">
                  {result.selfCalibrationOverview.summary}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <span>✓</span> Zelfbeeld klopt
                    </span>
                    <span className="text-base font-extrabold text-primary">
                      {inBalanceSubcats.length}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                    Onderdelen waar jouw eigen inschatting nauwkeurig aansluit bij je behaalde score op de kennisvragen.
                  </p>
                </div>
                {inBalanceSubcats.length > 0 && (
                  <div className="pt-2 border-t border-sky-200/60 flex flex-wrap gap-1.5">
                    {inBalanceSubcats.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubgoal(sub)}
                        title={`${sub.title} (${sub.knowledgePercentage}% kennis, ${sub.selfAssessmentAvg}/4.0 inschatting) - Klik voor details`}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-primary border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer"
                      >
                        {sub.code}. {sub.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>★</span> Vaardiger dan gedacht
                    </span>
                    <span className="text-base font-extrabold text-emerald-800">
                      {moreSkilledSubcats.length}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                    Onderdelen waar je jezelf bescheiden inschatte, maar hoog scoorde op de kennisvragen. Vertrouw gerust meer op je vakkennis!
                  </p>
                </div>
                {moreSkilledSubcats.length > 0 && (
                  <div className="pt-2 border-t border-emerald-200/60 flex flex-wrap gap-1.5">
                    {moreSkilledSubcats.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubgoal(sub)}
                        title={`${sub.title} (${sub.knowledgePercentage}% kennis, ${sub.selfAssessmentAvg}/4.0 inschatting) - Klik voor details`}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors cursor-pointer"
                      >
                        {sub.code}. {sub.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>↗</span> Stapje extra nodig
                    </span>
                    <span className="text-base font-extrabold text-amber-800">
                      {stepNeededSubcats.length}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-3">
                    Onderdelen waar op dit specifieke gebied nog een stapje meer gezet kan worden om aan het zelf-ingeschatte niveau te voldoen.
                  </p>
                </div>
                {stepNeededSubcats.length > 0 && (
                  <div className="pt-2 border-t border-amber-200/60 flex flex-wrap gap-1.5">
                    {stepNeededSubcats.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => setSelectedSubgoal(sub)}
                        title={`${sub.title} (${sub.knowledgePercentage}% kennis, ${sub.selfAssessmentAvg}/4.0 inschatting) - Klik voor details`}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                      >
                        {sub.code}. {sub.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Strengths & Growth Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-4 print-break-inside-avoid">
            <div className="bg-surface-container-lowest rounded-[24px] p-6 sm:p-8 print:p-5 ambient-shadow print:shadow-none border border-[#e8e8e8] print-break-inside-avoid">
              <div className="flex items-center gap-2.5 text-success mb-4">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h3 className="font-headline-md text-lg font-bold text-on-background">
                  Jouw Sterkste Punten
                </h3>
              </div>
              <ul className="space-y-3">
                {result.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-green-2 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface-container-lowest rounded-[24px] p-6 sm:p-8 print:p-5 ambient-shadow print:shadow-none border border-[#e8e8e8] print-break-inside-avoid">
              <div className="flex items-center gap-2.5 text-orange-2 mb-4">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-headline-md text-lg font-bold text-on-background">
                  Voornaamste Ontwikkelkansen
                </h3>
              </div>
              <ul className="space-y-3">
                {result.growthAreas.map((grw, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-on-surface-variant">
                    <span className="w-2 h-2 rounded-full bg-orange-2 mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{grw}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Role Specific Advice & 3-Step Action Plan */}
          <div className="bg-surface-container-lowest rounded-[24px] ambient-shadow print:shadow-none p-6 sm:p-8 print:p-5 border border-[#e8e8e8] print-break-inside-avoid">
            <div className="flex items-center gap-2.5 mb-2">
              <Award className="w-5 h-5 text-primary" />
              <h2 className="font-headline-md text-xl font-bold text-primary">
                Adviezen op Maat voor {result.user.role.replace('_', ' ')}
              </h2>
            </div>
            <p className="text-sm text-on-surface-variant mb-6">
              Praktische handvatten voor in de klas en binnen het schoolteam.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {result.roleSpecificAdvice.map((adv, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-surface-container-low/60 border border-outline-variant/60 rounded-xl flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-sky-1 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-on-background leading-relaxed">{adv}</p>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-bold text-on-background uppercase tracking-wider mb-3">
              Jouw 3-Stappen Ontwikkelroute:
            </h3>
            <div className="space-y-3">
              {result.actionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-surface-container-low border border-[#e8e8e8] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-sky-1 text-on-primary-container">
                        {step.priority}
                      </span>
                      <span className="text-xs font-bold text-on-background">{step.title}</span>
                    </div>
                    <p className="text-xs text-on-surface-variant">{step.description}</p>
                  </div>
                  <span className="text-xs font-semibold text-primary bg-white border border-outline-variant/60 px-3 py-1 rounded-lg self-start sm:self-center">
                    {step.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 50 Questions Full Review */}
          <div className="bg-surface-container-lowest rounded-[24px] ambient-shadow print:shadow-none p-6 sm:p-8 print:p-5 border border-[#e8e8e8] print-break-inside-avoid">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="font-headline-md text-xl font-bold text-primary">
                  Inzage Vragen & Uitgebreide Toelichting
                </h2>
                <p className="text-sm text-on-surface-variant">
                  Bekijk welke antwoorden goed en fout waren inclusief didactische toelichting.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 no-print">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  Alle ({questions.length})
                </button>
                <button
                  onClick={() => setFilterType('wrong')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterType === 'wrong'
                      ? 'bg-red-600 text-white'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  Onjuist ({wrongCount})
                </button>
                <button
                  onClick={() => setFilterType('knowledge')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterType === 'knowledge'
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  Kennisvragen
                </button>
                <button
                  onClick={() => setFilterType('self')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filterType === 'self'
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  Zelfinschatting
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredQuestions.map((q) => {
                const isExpanded = expandedQuestions[q.id] ?? false;
                const correctStatus = isQuestionCorrect(q);
                const userAns = currentAnswers[q.id];

                let userAnsLabel = 'Niet beantwoord';
                if (q.type === 'checklist') {
                  const checked = Array.isArray(userAns) ? userAns.length : 0;
                  userAnsLabel = `${checked} van ${q.checklistItems?.length || 27} vaardigheden aangevinkt`;
                } else if (userAns && q.options) {
                  const found = q.options.find((o) => o.id === userAns);
                  if (found) userAnsLabel = found.label;
                }

                let correctAnsLabel = '';
                if (q.correctOptionId && q.options) {
                  const found = q.options.find((o) => o.id === q.correctOptionId);
                  if (found) correctAnsLabel = found.label;
                }

                return (
                  <div
                    key={q.id}
                    className="border border-[#e8e8e8] rounded-xl overflow-hidden bg-white transition-all print-break-inside-avoid"
                  >
                    <button
                      type="button"
                      onClick={() => toggleQuestionExpand(q.id)}
                      className="w-full p-4 text-left flex items-start justify-between gap-3 hover:bg-surface-container-low/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          {q.type === 'knowledge' ? (
                            correctStatus ? (
                              <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                                <XCircle className="w-4 h-4" />
                              </div>
                            )
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-sky-1 text-primary flex items-center justify-center text-xs font-bold">
                              {q.id}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                              Vraag {q.id} • {q.subcategoryTitle}
                            </span>
                            {q.type === 'knowledge' && (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  correctStatus
                                    ? 'bg-green-50 text-green-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {correctStatus ? 'Goed' : 'Fout'}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-on-background leading-snug">
                            {q.questionText}
                          </h4>
                        </div>
                      </div>

                      <div className="shrink-0 text-on-surface-variant mt-1">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-4 sm:p-5 bg-surface-container-low/40 border-t border-[#e8e8e8] space-y-3 text-xs sm:text-sm">
                        <div className="p-3 bg-white rounded-lg border border-outline-variant/60">
                          <span className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                            Jouw Antwoord:
                          </span>
                          <p
                            className={`font-medium ${
                              q.type === 'knowledge'
                                ? correctStatus
                                  ? 'text-green-700'
                                  : 'text-red-700'
                                : 'text-on-background'
                            }`}
                          >
                            {userAnsLabel}
                          </p>
                        </div>

                        {q.type === 'knowledge' && !correctStatus && correctAnsLabel && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="block text-xs font-bold text-green-800 uppercase tracking-wider mb-1">
                              Correcte Antwoord:
                            </span>
                            <p className="font-semibold text-green-900">{correctAnsLabel}</p>
                          </div>
                        )}

                        {q.type === 'self-assessment' && (() => {
                          const linkedSubcat = allSubcategories.find((s) => s.id === q.subcategoryId);
                          if (!linkedSubcat) return null;
                          return (
                            <div
                              className={`p-3 rounded-lg border flex items-start gap-2.5 ${
                                linkedSubcat.selfCalibrationStatus === 'more_skilled'
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                  : linkedSubcat.selfCalibrationStatus === 'step_needed'
                                  ? 'bg-amber-50 border-amber-200 text-amber-950'
                                  : 'bg-sky-50 border-sky-200 text-slate-900'
                              }`}
                            >
                              <Sparkles className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <span className="font-bold block mb-0.5">
                                  Koppeling aan kennisvragen ({linkedSubcat.code}. {linkedSubcat.title}):
                                </span>
                                <p className="leading-relaxed">
                                  {linkedSubcat.selfCalibrationFeedback}
                                </p>
                              </div>
                            </div>
                          );
                        })()}

                        {q.explanation && (
                          <div className="p-3.5 bg-sky-1/30 rounded-lg border border-sky-1 flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <div>
                              <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                                Didactische Toelichting:
                              </span>
                              <p className="text-xs text-on-primary-container leading-relaxed">
                                {q.explanation}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Retake & Footer Actions (One-attempt constraint) */}
      <div className="py-8 no-print border-t border-[#e8e8e8] mt-8 flex flex-col items-center gap-4">
        <div className="bg-surface-container-low/70 border border-outline-variant/60 rounded-2xl p-4 sm:p-5 max-w-xl text-center">
          <div className="flex items-center justify-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
            <Info className="w-4 h-4" />
            <span>Nulmeting Beleid</span>
          </div>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            De nulmeting kan <strong>maar 1 keer</strong> gemaakt worden. Wil je de test opnieuw maken? Dan dien je eerst jouw huidige resultaten te verwijderen.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3.5">
          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant text-xs sm:text-sm font-semibold text-on-surface-variant hover:text-on-background hover:bg-surface-container-low transition-all cursor-pointer shadow-xs"
            >
              <Award className="w-4 h-4 text-primary" />
              <span>Bekijk opgeslagen archief</span>
            </button>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-xs sm:text-sm font-bold text-red-700 hover:border-red-300 transition-all cursor-pointer shadow-xs"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Resultaten verwijderen & test opnieuw maken</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[24px] p-6 sm:p-7 max-w-md w-full ambient-shadow border border-[#e8e8e8]">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-on-background text-center mb-2">
              Huidige resultaten verwijderen?
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant text-center mb-6 leading-relaxed">
              De test kan maar <strong>1 keer</strong> gemaakt worden. Als je doorgaat, worden je huidige antwoorden en scorekaart definitief gewist zodat je de nulmeting met een schone lei opnieuw kunt starten.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-5 py-2.5 rounded-xl border border-outline-variant text-xs sm:text-sm font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  if (onDeleteAndRetake) {
                    onDeleteAndRetake();
                  } else {
                    onRetake();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ja, verwijderen & herstart</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subgoal Drilldown Modal */}
      {selectedSubgoal && (
        <SubgoalDetailModal
          subgoal={selectedSubgoal}
          answers={currentAnswers}
          targetGroup={result.user?.targetGroup || 'PO'}
          onClose={() => setSelectedSubgoal(null)}
        />
      )}
    </div>
  );
};
