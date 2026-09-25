import React from 'react';
import { ArrowLeft, ArrowRight, Check, ListFilter } from 'lucide-react';
import { Question } from '../types';
import {
  getSectorCategoryBadge,
  getSubcategoryCode,
  TargetSector,
} from '../utils/kerndoelHelper';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  currentAnswer: string | string[] | undefined;
  targetGroup?: TargetSector;
  onSelectOption: (optionId: string) => void;
  onToggleChecklistItem: (itemId: string) => void;
  onNext: () => void;
  onPrevious: () => void;
  onOpenNavigator?: () => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  currentAnswer,
  targetGroup = 'PO',
  onSelectOption,
  onToggleChecklistItem,
  onNext,
  onPrevious,
  onOpenNavigator,
}) => {
  const percentage = Math.round(((currentIndex + 1) / totalQuestions) * 100);
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isFirstQuestion = currentIndex === 0;

  const isOptionSelected = (optionId: string) => {
    if (typeof currentAnswer === 'string') {
      return currentAnswer === optionId;
    }
    return false;
  };

  const isChecklistItemSelected = (itemId: string) => {
    if (Array.isArray(currentAnswer)) {
      return currentAnswer.includes(itemId);
    }
    return false;
  };

  const selectedChecklistCount = Array.isArray(currentAnswer) ? currentAnswer.length : 0;
  const hasAnswered = question.type === 'checklist' ? true : Boolean(currentAnswer);
  const isChecklistView = question.type === 'checklist';

  // Compute dynamic badge & title based on targetGroup
  let displayCategoryBadge = question.categoryBadge;
  let displaySubcategoryTitle = question.subcategoryTitle;

  if (question.kerndoelId === 'cat1' || question.kerndoelId === 'cat2' || question.kerndoelId === 'cat3') {
    displayCategoryBadge = getSectorCategoryBadge(question.kerndoelId, targetGroup);

    if (question.subcategoryId && question.subcategoryId !== 'algemeen') {
      const code = getSubcategoryCode(question.subcategoryId, targetGroup);
      const cleanTitle = question.subcategoryTitle.replace(/^[0-9][A-Z]\.\s*/, '');
      displaySubcategoryTitle = `${code}. ${cleanTitle}`;
    }
  }

  return (
    <div
      className={`w-full ${
        isChecklistView ? 'max-w-6xl xl:max-w-7xl' : 'max-w-3xl'
      } mx-auto ${isChecklistView ? 'pt-20 pb-10' : 'pt-24 pb-16'} px-4 sm:px-6 md:px-8`}
    >
      {/* Context Header */}
      <header className={`text-center ${isChecklistView ? 'mb-4' : 'mb-6'}`}>
        <span className="inline-block bg-sky-1 text-on-primary-container px-3.5 py-1 rounded-full font-label-sm text-xs font-bold uppercase tracking-wider mb-2">
          {displayCategoryBadge}
        </span>
        <h1
          className={`font-headline-md ${
            isChecklistView ? 'text-xl sm:text-2xl' : 'text-xl sm:text-2xl'
          } text-primary font-bold mb-1`}
        >
          {displaySubcategoryTitle}
        </h1>
      </header>

      {/* Test Card */}
      <article
        className={`bg-surface-container-lowest rounded-[24px] ambient-shadow ${
          isChecklistView ? 'p-5 sm:p-7 md:p-8' : 'p-6 sm:p-8 md:p-[48px]'
        } relative overflow-hidden border border-white/80`}
      >
        {/* Top Accent Line */}
        <div
          className="absolute top-0 left-0 w-full h-2"
          style={{ backgroundColor: question.topAccentColor || '#F0832E' }}
        />

        {/* Progress Section */}
        <div className={isChecklistView ? 'mb-4 sm:mb-6' : 'mb-6 sm:mb-8'}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-md text-sm font-semibold text-on-surface-variant">
              Vraag {currentIndex + 1} van {totalQuestions}
            </span>
            <span className="font-label-md text-sm font-bold text-primary">{percentage}%</span>
          </div>
          <div className="w-full h-3 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-container rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Question Area */}
        <div className={isChecklistView ? 'mb-4 sm:mb-6' : 'mb-6 sm:mb-8'}>
          {question.type === 'knowledge' && (
            <span className="inline-block text-[11px] font-bold text-primary uppercase tracking-wider bg-sky-1/60 px-2.5 py-1 rounded-md mb-3">
              Kennisvraag
            </span>
          )}
          {question.type === 'self-assessment' && (
            <span className="inline-block text-[11px] font-bold text-tertiary uppercase tracking-wider bg-yellow-1/60 px-2.5 py-1 rounded-md mb-3">
              Eigen Didactische Inschatting
            </span>
          )}
          {question.type === 'checklist' && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-block text-[11px] font-bold text-primary uppercase tracking-wider bg-sky-1 px-3 py-1 rounded-md">
                  Zelfinschatting • Vink aan wat jij beheerst of toepast
                </span>
                <span className="text-xs font-bold text-primary bg-sky-1/60 px-2.5 py-1 rounded-md">
                  {selectedChecklistCount} van {question.checklistItems?.length || 27} geselecteerd
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    question.checklistItems?.forEach((item) => {
                      if (!isChecklistItemSelected(item.id)) {
                        onToggleChecklistItem(item.id);
                      }
                    });
                  }}
                  className="text-primary hover:text-primary-container font-bold hover:underline cursor-pointer"
                >
                  Alles selecteren
                </button>
                <span className="text-outline-variant">•</span>
                <button
                  type="button"
                  onClick={() => {
                    question.checklistItems?.forEach((item) => {
                      if (isChecklistItemSelected(item.id)) {
                        onToggleChecklistItem(item.id);
                      }
                    });
                  }}
                  className="text-on-surface-variant hover:text-red-500 font-semibold hover:underline cursor-pointer"
                >
                  Alles wissen
                </button>
              </div>
            </div>
          )}

          <h2
            className={`font-headline-lg-mobile md:font-headline-lg ${
              isChecklistView ? 'text-lg sm:text-xl md:text-2xl' : 'text-xl sm:text-2xl md:text-[28px]'
            } text-on-background leading-tight font-bold tracking-tight`}
          >
            {question.questionText}
          </h2>
        </div>

        {/* ================= MULTIPLE CHOICE / SELF-ASSESSMENT OPTIONS ================= */}
        {question.options && question.options.length > 0 && (
          <form className="space-y-3.5 sm:space-y-4" id="question-form" onSubmit={(e) => e.preventDefault()}>
            {question.options.map((opt) => {
              const selected = isOptionSelected(opt.id);
              return (
                <label
                  key={opt.id}
                  onClick={() => onSelectOption(opt.id)}
                  className={`option-card block cursor-pointer border rounded-xl p-4 sm:p-5 transition-all duration-300 relative group ${
                    selected
                      ? 'border-primary-container bg-sky-1/45 ring-1 ring-primary-container'
                      : 'border-surface-container-high bg-surface-container-lowest hover:border-outline-variant hover:bg-surface-container-low/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5 sm:mt-1">
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                          selected
                            ? 'border-primary-container bg-primary-container'
                            : 'border-outline bg-surface-container-lowest group-hover:border-primary'
                        }`}
                      >
                        {selected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={opt.id}
                        checked={selected}
                        onChange={() => onSelectOption(opt.id)}
                        className="sr-only"
                      />
                    </div>
                    <div className="flex-grow">
                      <span
                        className={`font-body-lg text-base sm:text-lg block leading-normal ${
                          selected ? 'font-semibold text-on-primary-container' : 'text-on-background'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>
                  </div>
                </label>
              );
            })}
          </form>
        )}

        {/* ================= QUESTION 1 CHECKLIST ITEMS (MULTI-COLUMN, ALL VISIBLE) ================= */}
        {question.type === 'checklist' && question.checklistItems && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
            {question.checklistItems.map((item) => {
              const checked = isChecklistItemSelected(item.id);
              const dynamicSubCode = getSubcategoryCode(item.subcategoryId, targetGroup);
              const tagLabel = `${dynamicSubCode}. ${item.tag}`;

              return (
                <label
                  key={item.id}
                  onClick={() => onToggleChecklistItem(item.id)}
                  className={`option-card block cursor-pointer border rounded-xl p-3 sm:p-3.5 transition-all duration-200 relative group ${
                    checked
                      ? 'border-primary-container bg-sky-1/45 ring-1 ring-primary-container shadow-xs'
                      : 'border-surface-container-high bg-surface-container-lowest hover:border-outline-variant hover:bg-surface-container-low/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          checked
                            ? 'border-primary-container bg-primary-container text-white'
                            : 'border-outline bg-surface-container-lowest group-hover:border-primary'
                        }`}
                      >
                        {checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <div className="flex-grow min-w-0">
                      <span className="inline-block text-[10px] font-bold text-primary uppercase tracking-wider bg-sky-1 px-2 py-0.5 rounded mb-1">
                        {tagLabel}
                      </span>
                      <p
                        className={`text-xs sm:text-[13px] leading-snug break-words ${
                          checked ? 'font-semibold text-on-primary-container' : 'text-on-background'
                        }`}
                      >
                        {item.label}
                      </p>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 sm:mt-10 pt-4 border-t border-surface-container-high flex items-center justify-between gap-3">
          <div>
            {!isFirstQuestion && (
              <button
                type="button"
                onClick={onPrevious}
                className="bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md px-5 py-3 rounded-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Vorige</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {onOpenNavigator && (
              <button
                type="button"
                onClick={onOpenNavigator}
                className="sm:hidden p-3 rounded-lg border border-outline-variant text-primary"
                title="Vragenoverzicht"
              >
                <ListFilter className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onNext}
              disabled={!hasAnswered}
              className={`bg-primary-container text-on-primary font-label-md text-label-md px-8 py-3.5 rounded-lg hover:shadow-[0_2px_10px_rgba(0,182,237,0.3)] transition-all flex items-center gap-2 group cursor-pointer ${
                isLastQuestion ? 'bg-green-2 hover:bg-green-600' : ''
              } ${!hasAnswered ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{isLastQuestion ? 'Afronden & Resultaten' : 'Volgende'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </article>
    </div>
  );
};
