import React from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Award,
  Check,
  BookOpen,
  Info,
} from 'lucide-react';
import { AnswersMap, SubcategoryScore } from '../types';
import { QUESTIONS } from '../data/questionsData';
import { RAW_SUBCATEGORIES, TargetSector } from '../utils/kerndoelHelper';

interface SubgoalDetailModalProps {
  subgoal: SubcategoryScore | null;
  answers: AnswersMap;
  targetGroup?: TargetSector;
  onClose: () => void;
}

export const SubgoalDetailModal: React.FC<SubgoalDetailModalProps> = ({
  subgoal,
  answers,
  targetGroup = 'PO',
  onClose,
}) => {
  if (!subgoal) return null;

  // Retrieve fallback meta definition if properties are missing
  const metaDef = RAW_SUBCATEGORIES.find((r) => r.id === subgoal.id);
  const q1ItemIds = Array.isArray(subgoal.q1ItemIds) ? subgoal.q1ItemIds : (metaDef?.q1ItemIds || []);
  const knowledgeQuestionIds = Array.isArray(subgoal.knowledgeQuestionIds)
    ? subgoal.knowledgeQuestionIds
    : (metaDef?.knowledgeQuestionIds || []);
  const selfAssessmentQuestionIds = Array.isArray(subgoal.selfAssessmentQuestionIds)
    ? subgoal.selfAssessmentQuestionIds
    : (metaDef?.selfAssessmentQuestionIds || []);

  // Retrieve Question 1 checklist items belonging to this subgoal
  const q1Question = QUESTIONS.find((q) => q.id === 1);
  const safeAnswers = answers || {};
  const q1Answers = Array.isArray(safeAnswers[1]) ? (safeAnswers[1] as string[]) : [];
  const linkedQ1Items = (q1Question?.checklistItems || []).filter(
    (item) => item.subcategoryId === subgoal.id || q1ItemIds.includes(item.id)
  );

  // Retrieve Knowledge questions
  const knowledgeQuestions = knowledgeQuestionIds
    .map((id) => QUESTIONS.find((q) => q.id === id))
    .filter(Boolean);

  // Retrieve Self-assessment questions
  const selfQuestions = selfAssessmentQuestionIds
    .map((id) => QUESTIONS.find((q) => q.id === id))
    .filter(Boolean);

  // Compute safe percentages for the 3 components
  const knowledgePerc =
    subgoal.knowledgePercentage ??
    (subgoal.knowledgeTotal > 0
      ? Math.round((subgoal.knowledgeCorrect / subgoal.knowledgeTotal) * 100)
      : 0);
  const selfPerc =
    subgoal.selfPercentage ??
    Math.round(((subgoal.selfAssessmentAvg - 1) / 3) * 100);
  const checklistPerc =
    subgoal.checklistPercentage ??
    (subgoal.checklistTotal > 0
      ? Math.round((subgoal.checklistCount / subgoal.checklistTotal) * 100)
      : 0);
  const totalCombined =
    subgoal.combinedPercentage ??
    Math.round((knowledgePerc + selfPerc + checklistPerc) / 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] ambient-shadow w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-[#e8e8e8]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-surface-container-low border-b border-[#e8e8e8] flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-sky-1 text-primary px-2.5 py-0.5 rounded-full">
                Subdoel Detailinzage
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full">
                {subgoal.level}
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-primary text-white px-2.5 py-0.5 rounded-full">
                Totaalscore: {totalCombined}%
              </span>
            </div>
            <h2 className="font-headline-md text-xl sm:text-2xl font-bold text-primary">
              {subgoal.code}. {subgoal.title}
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              Het niveau van dit subdomein (<strong>{subgoal.level}</strong>) is gebaseerd op de combinatie van kennisvragen ({knowledgePerc}%), acties in de klas ({checklistPerc}%) en zelfkennisvragen ({selfPerc}%).
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:text-on-background hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
            title="Sluiten"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Metrics Bar (The 3 components) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Metric 1: Kennisvragen */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-[#e8e8e8] shadow-xs">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                1. Kennisvragen
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-md text-xl font-extrabold text-primary">
                  {subgoal.knowledgeCorrect} / {subgoal.knowledgeTotal}
                </span>
                <span className="text-xs font-semibold text-primary/80">
                  ({knowledgePerc}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${knowledgePerc}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Zelfkennisvragen */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-[#e8e8e8] shadow-xs">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                2. Zelfkennis (Inschatting)
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-md text-xl font-extrabold text-orange-2">
                  {subgoal.selfAssessmentAvg}
                </span>
                <span className="text-xs font-semibold text-on-surface-variant">/ 4.0</span>
                <span className="text-xs font-semibold text-orange-2/90">
                  ({selfPerc}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-orange-2 rounded-full transition-all"
                  style={{ width: `${selfPerc}%` }}
                />
              </div>
            </div>

            {/* Metric 3: Acties in de klas */}
            <div className="bg-surface-container-lowest p-4 rounded-xl border border-[#e8e8e8] shadow-xs">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                3. Acties in de klas
              </span>
              <div className="flex items-baseline gap-2">
                <span className="font-headline-md text-xl font-extrabold text-green-2">
                  {subgoal.checklistCount} / {subgoal.checklistTotal}
                </span>
                <span className="text-xs font-semibold text-green-700">
                  ({checklistPerc}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-high rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-green-2 rounded-full transition-all"
                  style={{
                    width: `${checklistPerc}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 1: Kennisvragen Details */}
          <div className="bg-surface-container-low/50 rounded-2xl p-5 border border-[#e8e8e8]">
            <div className="flex items-center gap-2 mb-3 text-primary">
              <BookOpen className="w-4 h-4" />
              <h3 className="font-headline-md text-base font-bold text-on-background">
                1. Kennisvragen voor {subgoal.code} ({subgoal.knowledgeCorrect}/{subgoal.knowledgeTotal} goed)
              </h3>
            </div>

            <div className="space-y-3">
              {knowledgeQuestions.map((q) => {
                if (!q) return null;
                const userAns = answers[q.id];
                const isCorrect =
                  String(userAns || '').toLowerCase() === String(q.correctOptionId || '').toLowerCase();
                const userOption = q.options?.find((o) => o.id === userAns);
                const correctOption = q.options?.find((o) => o.id === q.correctOptionId);

                return (
                  <div
                    key={q.id}
                    className="p-4 bg-white rounded-xl border border-[#e8e8e8] shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          {isCorrect ? (
                            <div className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center">
                              <XCircle className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                            Vraag {q.id}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-on-background">
                            {q.questionText}
                          </h4>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          isCorrect
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {isCorrect ? 'Goed' : 'Fout'}
                      </span>
                    </div>

                    <div className="pl-7 space-y-1.5 text-xs">
                      <div className="text-on-surface-variant">
                        <span className="font-bold text-on-background">Jouw antwoord: </span>
                        <span className={isCorrect ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                          {userOption?.label || 'Niet ingevuld'}
                        </span>
                      </div>

                      {!isCorrect && correctOption && (
                        <div className="text-green-800">
                          <span className="font-bold">Juiste antwoord: </span>
                          <span className="font-medium">{correctOption.label}</span>
                        </div>
                      )}

                      {q.explanation && (
                        <div className="mt-2 p-2.5 bg-sky-1/40 rounded-lg text-xs text-on-primary-container flex items-start gap-2 border border-sky-1">
                          <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Eigen Didactische Inschatting Details */}
          <div className="bg-surface-container-low/50 rounded-2xl p-5 border border-[#e8e8e8]">
            <div className="flex items-center gap-2 mb-3 text-orange-2">
              <Sparkles className="w-4 h-4" />
              <h3 className="font-headline-md text-base font-bold text-on-background">
                2. Zelfkennisvragen (Inschatting • Gemiddeld: {subgoal.selfAssessmentAvg}/4.0)
              </h3>
            </div>

            <div className="space-y-3">
              {selfQuestions.map((q) => {
                if (!q) return null;
                const userAns = answers[q.id];
                const selectedOption = q.options?.find((o) => o.id === userAns);
                const scaleVal = selectedOption?.scaleValue || 1;

                return (
                  <div
                    key={q.id}
                    className="p-4 bg-white rounded-xl border border-[#e8e8e8] shadow-xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block">
                          Vraag {q.id}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-on-background">
                          {q.questionText}
                        </h4>
                      </div>

                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 shrink-0">
                        Niveau {scaleVal} / 4
                      </span>
                    </div>

                    <div className="p-3 bg-surface-container-low/60 rounded-lg text-xs text-on-background border border-outline-variant/50">
                      <span className="font-bold text-on-surface-variant block mb-0.5">
                        Jouw gekozen niveau:
                      </span>
                      <p className="font-medium text-primary leading-relaxed">
                        {selectedOption?.label || 'Niet ingevuld'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Vaardigheden uit Vraag 1 Checklist */}
          <div className="bg-surface-container-low/50 rounded-2xl p-5 border border-[#e8e8e8]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-green-2">
                <CheckCircle2 className="w-4 h-4" />
                <h3 className="font-headline-md text-base font-bold text-on-background">
                  3. Acties in de klas (Vraag 1 Praktijkvaardigheden)
                </h3>
              </div>
              <span className="text-xs font-bold text-green-800 bg-green-100 px-2.5 py-0.5 rounded-full border border-green-200">
                {subgoal.checklistCount} van de {subgoal.checklistTotal} aangevinkt
              </span>
            </div>

            <p className="text-xs text-on-surface-variant mb-3">
              Onderstaande acties in de klas uit de startvraag tellen direct mee voor het subdoel {subgoal.code}:
            </p>

            <div className="space-y-2">
              {linkedQ1Items.map((item) => {
                const isChecked = q1Answers.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                      isChecked
                        ? 'bg-green-50/70 border-green-200 text-green-900'
                        : 'bg-white border-[#e8e8e8] text-on-surface-variant opacity-75'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isChecked ? (
                        <div className="w-5 h-5 rounded-md bg-green-600 text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-md border border-outline-variant bg-surface-container-low flex items-center justify-center text-on-surface-variant" />
                      )}
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded ${
                            isChecked
                              ? 'bg-green-200 text-green-900'
                              : 'bg-surface-container-high text-on-surface-variant'
                          }`}
                        >
                          {isChecked ? 'Aangevinkt' : 'Niet aangevinkt'}
                        </span>
                      </div>
                      <p className={`text-xs ${isChecked ? 'font-semibold text-on-background' : 'text-on-surface-variant'}`}>
                        {item.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#f9f9f9] border-t border-[#e8e8e8] flex items-center justify-between">
          <span className="text-xs text-on-surface-variant font-medium">
            Subdoel {subgoal.code} • {subgoal.title}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
