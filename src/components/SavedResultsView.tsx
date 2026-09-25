import React, { useState } from 'react';
import {
  Award,
  Calendar,
  ArrowRight,
  Download,
  Trash2,
  PlusCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { SavedAssessment, AssessmentResult } from '../types';
import { exportAssessmentToPDF } from '../utils/pdfGenerator';

interface SavedResultsViewProps {
  savedAssessments: SavedAssessment[];
  onSelectAssessment: (result: AssessmentResult) => void;
  onDeleteAssessment: (id: string) => void;
  onStartNewTest: () => void;
  onDeleteAllAndRestart?: () => void;
}

export const SavedResultsView: React.FC<SavedResultsViewProps> = ({
  savedAssessments,
  onSelectAssessment,
  onDeleteAssessment,
  onStartNewTest,
  onDeleteAllAndRestart,
}) => {
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  return (
    <div className="w-full max-w-5xl mx-auto pt-24 pb-16 px-4 sm:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <span className="inline-block bg-sky-1 text-on-primary-container font-label-sm text-xs px-3.5 py-1 rounded-full uppercase tracking-wider font-bold mb-2">
            Mijn Archief & Voortgang
          </span>
          <h1 className="font-display-lg text-2xl sm:text-3xl md:text-4xl text-on-background font-bold tracking-tight">
            Mijn Opgeslagen Resultaten
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Overzicht van jouw voltooide nulmeting Digitale Geletterdheid.
          </p>
        </div>

        {savedAssessments.length > 0 ? (
          <button
            onClick={() => setShowDeleteAllConfirm(true)}
            className="inline-flex items-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-label-md text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-center font-bold"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Resultaten wissen & test herstarten</span>
          </button>
        ) : (
          <button
            onClick={onStartNewTest}
            className="inline-flex items-center gap-2 bg-primary hover:bg-surface-tint text-on-primary font-label-md text-sm px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-center font-bold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Nieuwe test maken</span>
          </button>
        )}
      </div>

      {/* Policy banner if results exist */}
      {savedAssessments.length > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-sky-1/30 border border-sky-1 flex items-start gap-3">
          <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-on-primary-container leading-relaxed">
            <span className="font-bold block mb-0.5">Let op: Eenmalige afname</span>
            De test kan slechts 1 keer gemaakt worden. Als je de test opnieuw wilt afnemen, kun je jouw huidige resultaten wissen.
          </div>
        </div>
      )}

      {/* List of Saved Assessments */}
      {savedAssessments.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-[24px] ambient-shadow p-10 sm:p-14 text-center border border-[#e8e8e8]">
          <div className="w-16 h-16 rounded-2xl bg-sky-1 text-primary flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-on-background mb-2">
            Nog geen opgeslagen nulmetingen
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md mx-auto mb-6 leading-relaxed">
            Je hebt nog geen voltooide nulmeting in jouw archief. Start de test om jouw digitale
            competenties in kaart te brengen en direct een PDF rapport te ontvangen.
          </p>
          <button
            onClick={onStartNewTest}
            className="inline-flex items-center gap-2 bg-primary-container hover:bg-primary text-white font-bold text-sm px-7 py-3 rounded-xl transition-all cursor-pointer shadow-md"
          >
            <span>Start jouw eerste nulmeting</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {savedAssessments.map((item) => {
            const formattedDate = new Date(item.createdAt).toLocaleDateString('nl-NL', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className="bg-surface-container-lowest rounded-[20px] ambient-shadow p-5 sm:p-6 border border-[#e8e8e8] hover:border-primary-container transition-all flex flex-col md:flex-row md:items-center justify-between gap-5 group"
              >
                {/* Left info */}
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary-container text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                    <span className="text-lg font-extrabold leading-none">
                      {item.result.overallScorePercentage}%
                    </span>
                    <span className="text-[9px] uppercase tracking-wider opacity-90 mt-0.5">
                      Score
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="bg-sky-1 text-on-primary-container text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                        {item.result.overallLevel}
                      </span>
                      <span className="text-xs text-on-surface-variant flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-on-background">
                      {item.result.categories?.[0]?.kerndoelCode?.includes('1.1') ? 'Nulmeting Digitale Geletterdheid (PO)' : 'Nulmeting Digitale Geletterdheid (VO/PO)'}
                    </h3>

                    <p className="text-xs text-on-surface-variant mt-1">
                      {item.result.overallKnowledgeCorrect} van {item.result.overallKnowledgeTotal} kennisvragen goed • Inschatting {item.result.overallSelfAssessmentAvg}/4.0
                    </p>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-[#f0f0f0]">
                  <button
                    onClick={() => onSelectAssessment(item.result)}
                    className="px-4 py-2 bg-primary hover:bg-surface-tint text-on-primary text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Bekijk Resultaten</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => exportAssessmentToPDF(item.result)}
                    className="p-2 bg-surface-container-low hover:bg-surface-container-high text-primary rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">PDF</span>
                  </button>

                  <button
                    onClick={() => setItemToDelete(item.id)}
                    className="p-2 text-on-surface-variant hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Verwijder nulmeting"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Single Item Delete Confirm */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full ambient-shadow border border-[#e8e8e8]">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-on-background text-center mb-2">
              Nulmeting verwijderen?
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant text-center mb-6 leading-relaxed">
              Weet je zeker dat je deze nulmeting wilt verwijderen? Na het verwijderen kun je direct een nieuwe test maken.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-5 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteAssessment(itemToDelete);
                  setItemToDelete(null);
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ja, verwijderen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All & Restart Confirm */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-[24px] p-6 max-w-md w-full ambient-shadow border border-[#e8e8e8]">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-on-background text-center mb-2">
              Resultaten wissen & test herstarten?
            </h3>
            <p className="text-xs sm:text-sm text-on-surface-variant text-center mb-6 leading-relaxed">
              De test kan maar <strong>1 keer</strong> gemaakt worden. Om de test opnieuw te kunnen maken worden jouw opgeslagen resultaten en antwoorden gewist.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteAllConfirm(false)}
                className="px-5 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-xl transition-colors cursor-pointer"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAllConfirm(false);
                  if (onDeleteAllAndRestart) {
                    onDeleteAllAndRestart();
                  } else {
                    onStartNewTest();
                  }
                }}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ja, wissen & herstarten</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
