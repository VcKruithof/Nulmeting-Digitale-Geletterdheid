import React, { useState } from 'react';
import {
  ArrowRight,
  Star,
  ListOrdered,
  LayoutGrid,
  Clock,
  CheckCircle2,
  Award,
  Trash2,
  AlertTriangle,
  GraduationCap,
  Building,
  KeyRound,
  LogIn,
  UserCheck,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { AppUser } from '../types';

interface WelcomeScreenProps {
  targetSector: 'PO' | 'VO';
  onSelectTargetSector: (sector: 'PO' | 'VO') => void;
  hasSavedAssessment: boolean;
  currentUser: AppUser | null;
  onOpenAuth: () => void;
  onStart: () => void;
  onViewResults: () => void;
  onDeleteAndRestart?: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  targetSector,
  onSelectTargetSector,
  hasSavedAssessment,
  currentUser,
  onOpenAuth,
  onStart,
  onViewResults,
  onDeleteAndRestart,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="w-full flex-grow pt-24 sm:pt-28 pb-16 px-4 sm:px-8 md:px-10 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary-fixed rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob pointer-events-none" />
      <div className="absolute top-40 right-20 w-72 h-72 bg-sky-1 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center z-10">
        {/* Hero Text Column */}
        <div className="md:col-span-6 flex flex-col gap-6 md:gap-8 text-left">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-yellow-1 px-4 py-2 rounded-full w-max shadow-xs">
            <Star className="w-4 h-4 text-tertiary fill-current" />
            <span className="font-label-md text-label-md text-on-tertiary-container uppercase tracking-wider">
              Nieuwe Assessment 2025/2026
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-display-lg text-3xl sm:text-4xl md:text-5xl text-on-background tracking-tight leading-tight">
            Test jouw{' '}
            <span className="text-primary relative inline-block">
              Digitale Geletterdheid
              <svg
                className="absolute w-full h-3.5 -bottom-1 left-0 text-sky-2 opacity-70"
                preserveAspectRatio="none"
                viewBox="0 0 100 10"
              >
                <path
                  d="M0 5 Q 50 10 100 5"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="4"
                />
              </svg>
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-body-lg text-base sm:text-lg text-on-surface-variant max-w-lg leading-relaxed">
            Ontdek direct hoe vaardig je bent in de moderne digitale wereld. Deze test brengt jouw
            kennis, didactische inschatting en vaardigheden in kaart aan de hand van de actuele
            kerndoelen.
          </p>

          {/* User Account / Schoolcode Requirement Card */}
          {currentUser ? (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-start gap-3 max-w-md animate-fadeIn">
              <UserCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sm text-emerald-900">
                  <span>Ingelogd als {currentUser.displayName}</span>
                </div>
                <div className="text-emerald-700 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>School: <strong>{currentUser.schoolName}</strong></span>
                  <span className="font-mono bg-emerald-200/60 px-1.5 py-0.2 rounded font-bold">
                    {currentUser.schoolCode}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800">
                  Jouw resultaten tellen automatisch mee in het geaggregeerde Cloudwise schoolrapport.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-sky-50 border-2 border-[#00b6ed]/40 text-[#00435a] flex items-start gap-3 max-w-md">
              <KeyRound className="w-5 h-5 text-[#006687] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-bold text-sm block text-[#00435a]">
                  Account & Schoolcode Vereist
                </span>
                <p className="text-gray-700 leading-relaxed">
                  Om de test uit te voeren moet u ingelogd zijn met een account dat gekoppeld is aan een geldige <strong>schoolcode</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Sector Selector */}
          {!hasSavedAssessment && (() => {
            const isCloudwiseAdmin = currentUser?.isCloudwiseAdmin === true;
            const schoolSector = currentUser?.schoolSector;

            // If user is Cloudwise Admin or not logged in, both are selectable.
            // If school is specifically 'PO': PO allowed, VO visible but NOT selectable.
            // If school is specifically 'VO': VO allowed, PO visible but NOT selectable.
            // If school is 'PO/VO': both PO and VO are selectable.
            const isPOAllowed = isCloudwiseAdmin || !schoolSector || schoolSector === 'PO' || schoolSector === 'PO/VO';
            const isVOAllowed = isCloudwiseAdmin || !schoolSector || schoolSector === 'VO' || schoolSector === 'PO/VO';

            return (
              <div className="bg-surface-container-low p-3.5 rounded-2xl border border-outline-variant/60 max-w-md">
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-primary" />
                    <span>Kies jouw onderwijssector:</span>
                  </span>
                  {currentUser && schoolSector && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-100 text-sky-800">
                      School: {schoolSector}
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!isPOAllowed}
                    onClick={() => isPOAllowed && onSelectTargetSector('PO')}
                    title={!isPOAllowed ? 'Niet selecteerbaar: uw school is gekoppeld aan VO' : 'Primair Onderwijs (PO)'}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                      !isPOAllowed
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 opacity-60 cursor-not-allowed select-none'
                        : targetSector === 'PO'
                        ? 'bg-primary text-white shadow-xs cursor-pointer'
                        : 'bg-white text-on-surface-variant hover:bg-sky-1/40 border border-[#e8e8e8] cursor-pointer'
                    }`}
                  >
                    <span>Primair Onderwijs (PO)</span>
                    {!isPOAllowed && <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                  </button>
                  <button
                    type="button"
                    disabled={!isVOAllowed}
                    onClick={() => isVOAllowed && onSelectTargetSector('VO')}
                    title={!isVOAllowed ? 'Niet selecteerbaar: uw school is gekoppeld aan PO' : 'Voortgezet Onderwijs (VO)'}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                      !isVOAllowed
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 opacity-60 cursor-not-allowed select-none'
                        : targetSector === 'VO'
                        ? 'bg-primary text-white shadow-xs cursor-pointer'
                        : 'bg-white text-on-surface-variant hover:bg-sky-1/40 border border-[#e8e8e8] cursor-pointer'
                    }`}
                  >
                    <span>Voortgezet Onderwijs (VO)</span>
                    {!isVOAllowed && <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
                  </button>
                </div>

                {/* Status explanation */}
                {currentUser && schoolSector && schoolSector !== 'PO/VO' && !isCloudwiseAdmin && (
                  <p className="text-[11px] text-gray-500 mt-2 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-gray-400 shrink-0" />
                    <span>
                      Vastgesteld op <strong>{schoolSector}</strong> op basis van uw school ({currentUser.schoolName}).
                    </span>
                  </p>
                )}
                {currentUser && (schoolSector === 'PO/VO' || isCloudwiseAdmin) && (
                  <p className="text-[11px] text-[#006687] mt-2 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#006687] shrink-0" />
                    <span>Combinatieschool (PO & VO): u kunt vrij schakelen tussen beide sectoren.</span>
                  </p>
                )}
              </div>
            );
          })()}

          {/* User status & Single-attempt policy notice */}
          {hasSavedAssessment && (
            <div className="p-4 rounded-2xl bg-sky-1/40 border border-sky-1 space-y-2 max-w-md">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Nulmeting reeds voltooid</span>
              </div>
              <p className="text-xs text-on-primary-container leading-relaxed">
                Je hebt deze test al gemaakt. Omdat de test <strong>maar 1 keer</strong> gemaakt kan worden, kun je hieronder direct jouw resultaten inzien. Wil je de test toch opnieuw maken? Verwijder dan eerst jouw huidige resultaten.
              </p>
            </div>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 mt-2">
            {hasSavedAssessment ? (
              <>
                <button
                  onClick={onViewResults}
                  className="bg-primary hover:bg-surface-tint text-on-primary font-label-md text-label-md py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 font-bold cursor-pointer"
                >
                  <Award className="w-4 h-4" />
                  <span>Mijn Resultaten bekijken</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-label-md text-xs sm:text-sm py-3 px-6 rounded-full transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer font-semibold"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                  <span>Resultaten wissen & herstarten</span>
                </button>
              </>
            ) : !currentUser ? (
              /* When not logged in, prompt to log in / register with schoolcode */
              <button
                onClick={onOpenAuth}
                className="bg-[#006687] hover:bg-[#00506b] text-white font-label-md text-label-md py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2.5 font-bold cursor-pointer group"
              >
                <LogIn className="w-4 h-4" />
                <span>Inloggen / Account Maken met Schoolcode</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              /* Logged in with valid schoolcode */
              <button
                onClick={onStart}
                className="bg-primary hover:bg-surface-tint text-on-primary font-label-md text-label-md py-4 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer font-bold"
              >
                <span>Start de test ({currentUser.schoolName})</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
          </div>
        </div>

        {/* Bento Grid Features Column */}
        <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8 md:mt-0">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest p-6 rounded-[24px] ambient-shadow border-t-4 border-primary-container transform hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-sky-1 rounded-xl flex items-center justify-center mb-4 text-primary">
              <ListOrdered className="w-7 h-7" />
            </div>
            <h3 className="font-headline-md text-xl font-bold text-on-background mb-2">50 Vragen</h3>
            <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
              Een zorgvuldig samengestelde set vragen die parate vakkennis, zelfinschatting en
              didactische vaardigheden dekt.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-lowest p-6 rounded-[24px] ambient-shadow border-t-4 border-green-2 transform hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-green-2/20 rounded-xl flex items-center justify-center mb-4 text-success">
              <LayoutGrid className="w-7 h-7" />
            </div>
            <h3 className="font-headline-md text-xl font-bold text-on-background mb-2">
              3 Categorieën
            </h3>
            <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
              Praktische kennis & vaardigheden, Ontwerpen & maken en De gedigitaliseerde wereld.
            </p>
          </div>

          {/* Card 3 (Full width) */}
          <div className="sm:col-span-2 bg-surface-container-lowest p-6 rounded-[24px] ambient-shadow flex items-start gap-4 transform hover:-translate-y-1 transition-transform duration-300">
            <div className="w-12 h-12 bg-purple-2/30 rounded-xl flex items-center justify-center shrink-0 text-secondary">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-label-md text-base font-bold text-on-background mb-1">
                Tijdsindicatie & Eenmalige Afname
              </h3>
              <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">
                Neem ongeveer 15-20 minuten de tijd. De scores worden gekoppeld aan de schoolcode voor een geaggregeerd Cloudwise schoolrapport.
              </p>
            </div>
          </div>
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
              De test kan maar <strong>1 keer</strong> gemaakt worden. Om opnieuw te beginnen worden jouw eerder opgeslagen antwoorden en resultaten gewist. Weet je het zeker?
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
                  if (onDeleteAndRestart) {
                    onDeleteAndRestart();
                  } else {
                    onStart();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ja, resultaten wissen & herstarten</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
