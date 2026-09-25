import React, { useState } from 'react';
import {
  ListFilter,
  RotateCcw,
  User,
  LogOut,
  Building,
  ShieldAlert,
  LogIn,
  Shield,
} from 'lucide-react';
import { AppUser } from '../types';

interface HeaderProps {
  activeTab: 'test' | 'results';
  currentScreen: 'welcome' | 'quiz' | 'results' | 'history';
  currentQuestionIndex?: number;
  totalQuestions?: number;
  savedResultsCount: number;
  currentUser: AppUser | null;
  onNavigate: (tab: 'test' | 'results') => void;
  onOpenNavigator?: () => void;
  onResetQuiz?: () => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenCloudwiseAdmin: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  currentScreen,
  currentQuestionIndex = 0,
  totalQuestions = 50,
  savedResultsCount,
  currentUser,
  onNavigate,
  onOpenNavigator,
  onResetQuiz,
  onOpenAuth,
  onSignOut,
  onOpenCloudwiseAdmin,
}) => {
  const [logoError, setLogoError] = useState(false);

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed top-0 w-full z-40 flex justify-between items-center px-4 sm:px-6 md:px-8 h-20 bg-surface shadow-xs border-b border-[#e8e8e8]/60 no-print"
    >
      {/* Brand / Logo */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('test')}
          className="flex items-center gap-2 text-left focus:outline-none cursor-pointer group"
        >
          {!logoError ? (
            <img
              alt="Cloudwise Logo"
              className="h-8 md:h-9 object-contain"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnT-e57RSuT5OloPwh_Fyrpm9D8jw1tXk8XvzqDlaq-1ml46VRl0yiFQCQ9Hrq_BpNE8y2IK9eHsUkq3TbvpZBAa1bezTycF7jjnOs_GlNS9NVkLGluU5qEz0vNM-jdPK7soqO28KqaxSfpZW-IlS24d4uxjvFcC2ana6uQP-On_WAFnHaeB4mydOfO-voO2VnRfEWl3tK941jekN15xKy6tzBlBLiXk4hNGnijEMoUJD2WbQ7CVIsd8iFGUg-QA1P87E"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="text-2xl font-extrabold text-primary tracking-tight">Cloudwise</div>
          )}
        </button>
      </div>

      {/* Nav Links (Desktop) */}
      <div className="hidden lg:flex items-center gap-6">
        <button
          onClick={() => onNavigate('test')}
          className={`font-label-md text-label-md pb-1 cursor-pointer transition-colors duration-200 ${
            activeTab === 'test'
              ? 'text-primary font-bold border-b-2 border-primary'
              : 'text-on-surface-variant hover:text-primary-container'
          }`}
        >
          Test maken
        </button>

        {currentUser && (
          <button
            onClick={() => onNavigate('results')}
            className={`font-label-md text-label-md pb-1 cursor-pointer transition-colors duration-200 flex items-center gap-1.5 ${
              activeTab === 'results'
                ? 'text-primary font-bold border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary-container'
            }`}
          >
            <span>Mijn Resultaten</span>
            {savedResultsCount > 0 && (
              <span className="bg-sky-1 text-on-primary-container text-[11px] font-bold px-2 py-0.2 rounded-full">
                {savedResultsCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Right Controls & User Info */}
      <div className="flex items-center gap-3">
        {/* Cloudwise Admin Access Badge / Button - Enkel zichtbaar wanneer ingelogd met beheeraccount */}
        {currentUser?.isCloudwiseAdmin && (
          <button
            onClick={onOpenCloudwiseAdmin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-950 text-xs font-bold transition-all cursor-pointer shadow-xs"
            title="Cloudwise Beheerder Portaal & Schoolrapportages"
          >
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            <span>Cloudwise Beheer</span>
          </button>
        )}

        {/* Quiz-specific quick actions */}
        {currentUser && currentScreen === 'quiz' && (
          <div className="flex items-center gap-2">
            {onOpenNavigator && (
              <button
                onClick={onOpenNavigator}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bcc8d0]/70 hover:border-primary text-xs font-semibold text-primary hover:bg-sky-1/30 transition-all cursor-pointer"
                title="Vragenoverzicht"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Overzicht</span>
              </button>
            )}
            {onResetQuiz && (
              <button
                onClick={onResetQuiz}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#bcc8d0]/70 hover:border-red-400 text-xs font-semibold text-on-surface-variant hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                title="Sessie herstarten"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Herstart</span>
              </button>
            )}
          </div>
        )}

        {/* User Profile / Login status */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className="text-right hidden md:block">
              <span className="text-xs font-bold text-gray-800 block truncate max-w-[140px]">
                {currentUser.displayName || currentUser.email}
              </span>
              <span className="text-[10px] text-[#006687] font-semibold flex items-center justify-end gap-1">
                <Building className="w-2.5 h-2.5" />
                {currentUser.schoolName || 'School'} ({currentUser.schoolCode})
              </span>
            </div>

            <button
              onClick={onSignOut}
              className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title="Uitloggen"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#006687] hover:bg-[#00506b] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Inloggen / Registreren</span>
          </button>
        )}
      </div>
    </nav>
  );
};
