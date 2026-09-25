import React from 'react';
import { X } from 'lucide-react';
import { Question, AnswersMap } from '../types';
import { getSectorCategoryTitle, TargetSector } from '../utils/kerndoelHelper';

interface QuestionNavigatorProps {
  isOpen: boolean;
  questions: Question[];
  currentQuestionIndex: number;
  answers: AnswersMap;
  targetGroup?: TargetSector;
  onSelectQuestion: (index: number) => void;
  onClose: () => void;
}

export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  isOpen,
  questions,
  currentQuestionIndex,
  answers,
  targetGroup = 'PO',
  onSelectQuestion,
  onClose,
}) => {
  if (!isOpen) return null;

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] ambient-shadow w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-[#e8e8e8]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e8e8e8] flex items-center justify-between bg-[#f9f9f9]">
          <div>
            <h3 className="font-extrabold text-base text-[#006687]">Vragenoverzicht</h3>
            <p className="text-xs text-[#5a6973]">
              {answeredCount} van de {questions.length} vragen beantwoord
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#5a6973] hover:text-[#1a1c1c] hover:bg-[#e8e8e8] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legend */}
        <div className="px-6 py-2.5 bg-white border-b border-[#f0f0f0] flex flex-wrap items-center gap-4 text-xs font-medium text-[#5a6973]">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#00b6ed]" />
            <span>Huidige vraag</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#C9E8FB] border border-[#00b6ed]" />
            <span>Beantwoord</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-[#f3f3f3] border border-[#bcc8d0]" />
            <span>Nog niet beantwoord</span>
          </div>
        </div>

        {/* Question Grid */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Group by Categories */}
          {['algemeen', 'cat1', 'cat2', 'cat3'].map((catId) => {
            const catQuestions = questions.filter((q) => q.kerndoelId === catId);
            if (catQuestions.length === 0) return null;

            let groupTitle = 'Deel 0: Algemene Zelfinschatting';
            let badgeColor = 'bg-[#ffe8d6] text-[#b85b12]';

            if (catId === 'cat1' || catId === 'cat2' || catId === 'cat3') {
              groupTitle = getSectorCategoryTitle(catId as any, targetGroup);
              if (catId === 'cat1') badgeColor = 'bg-[#C9E8FB] text-[#00435a]';
              if (catId === 'cat2') badgeColor = 'bg-[#d4f7dc] text-[#248242]';
              if (catId === 'cat3') badgeColor = 'bg-[#ffe8d6] text-[#b85b12]';
            }

            return (
              <div key={catId}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${badgeColor}`}>
                    {catId === 'algemeen' ? 'Deel 0' : catId.toUpperCase()}
                  </span>
                  <h4 className="text-xs font-bold text-[#1a1c1c]">{groupTitle}</h4>
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {catQuestions.map((q) => {
                    const index = questions.findIndex((item) => item.id === q.id);
                    const isCurrent = index === currentQuestionIndex;
                    const isAnswered =
                      q.type === 'checklist' ? true : Boolean(answers[q.id]);

                    let btnStyle = 'bg-[#f3f3f3] text-[#5a6973] border border-[#bcc8d0]/60 hover:bg-[#e8e8e8]';
                    if (isCurrent) {
                      btnStyle = 'bg-[#006687] text-white font-bold ring-2 ring-[#00b6ed] ring-offset-1';
                    } else if (isAnswered) {
                      btnStyle = 'bg-[#C9E8FB] text-[#00435a] font-semibold border border-[#71CBF4]';
                    }

                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          onSelectQuestion(index);
                          onClose();
                        }}
                        className={`h-9 rounded-xl flex items-center justify-center text-xs transition-all cursor-pointer ${btnStyle}`}
                        title={`Vraag ${q.id}: ${q.subcategoryTitle}`}
                      >
                        {q.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#f9f9f9] border-t border-[#e8e8e8] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#006687] hover:bg-[#004d66] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Sluiten
          </button>
        </div>
      </div>
    </div>
  );
};
