import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { AnswersMap, AssessmentResult, SavedAssessment, Question, UserProfile, AppUser } from './types';
import { QUESTIONS, getShuffledQuestions } from './data/questionsData';
import { calculateAssessmentResults } from './data/feedbackEngine';
import { Header } from './components/Header';
import { WelcomeScreen } from './components/WelcomeScreen';
import { QuestionCard } from './components/QuestionCard';
import { QuestionNavigator } from './components/QuestionNavigator';
import { ResultsView } from './components/ResultsView';
import { SavedResultsView } from './components/SavedResultsView';
import { AuthModal } from './components/AuthModal';
import { CloudwiseAdminModal } from './components/CloudwiseAdminModal';
import {
  auth,
  getUserProfile,
  saveAssessmentRecord,
  checkUserIsAdmin,
  validateSchoolCode,
  getUserAssessments,
} from './services/firebase';

const CURRENT_STATE_STORAGE_KEY = 'cloudwise_dg_current_state_v4';
const SAVED_ASSESSMENTS_STORAGE_KEY = 'cloudwise_dg_saved_assessments_v4';
const SECTOR_STORAGE_KEY = 'cloudwise_dg_sector_v4';

type AppScreen = 'welcome' | 'quiz' | 'results' | 'history';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [activeTab, setActiveTab] = useState<'test' | 'results'>('test');
  const [targetSector, setTargetSector] = useState<'PO' | 'VO'>(() => {
    try {
      const savedSector = localStorage.getItem(SECTOR_STORAGE_KEY);
      return savedSector === 'VO' ? 'VO' : 'PO';
    } catch {
      return 'PO';
    }
  });

  const [savedAssessments, setSavedAssessments] = useState<SavedAssessment[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_ASSESSMENTS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [questions, setQuestions] = useState<Question[]>(() => getShuffledQuestions());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswersMap>({});
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [isNavigatorOpen, setIsNavigatorOpen] = useState<boolean>(false);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Authentication & Cloudwise Admin states
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCloudwiseAdminOpen, setIsCloudwiseAdminOpen] = useState<boolean>(false);

  // 1. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid);
          const isAdmin = await checkUserIsAdmin(firebaseUser.uid, firebaseUser.email);

          if (profile) {
            let effectiveSchoolSector: 'PO' | 'VO' | 'PO/VO' = profile.schoolSector || 'PO/VO';
            // Verify latest school sector from Firebase
            if (profile.schoolCode) {
              try {
                const school = await validateSchoolCode(profile.schoolCode);
                if (school && school.sector) {
                  effectiveSchoolSector = school.sector as 'PO' | 'VO' | 'PO/VO';
                }
              } catch (e) {
                console.warn('Could not refresh school sector from Firebase:', e);
              }
            }

            const updatedUser: AppUser = {
              ...profile,
              schoolSector: effectiveSchoolSector,
              isCloudwiseAdmin: isAdmin || profile.isCloudwiseAdmin,
            };

            setCurrentUser(updatedUser);

            // Fetch user's saved assessments from Firestore
            try {
              const userAssessments = await getUserAssessments(firebaseUser.uid);
              if (userAssessments && userAssessments.length > 0) {
                setSavedAssessments(userAssessments);
                const latest = userAssessments[userAssessments.length - 1];
                if (latest?.result) {
                  setResults(latest.result);
                }
              }
            } catch (err) {
              console.warn('Could not load user assessments:', err);
            }

            // Enforce targetSector if school is strictly PO or VO
            if (effectiveSchoolSector === 'PO') {
              setTargetSector('PO');
            } else if (effectiveSchoolSector === 'VO') {
              setTargetSector('VO');
            } else if (profile.targetSector) {
              setTargetSector(profile.targetSector);
            }
          } else {
            if (isAdmin) {
              const adminUser: AppUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email || '',
                displayName: firebaseUser.displayName || 'Cloudwise Beheerder',
                role: 'directie',
                schoolId: 'cloudwise_beheer',
                schoolCode: '#BEHEER',
                schoolName: 'Cloudwise Onderwijsadvies',
                targetSector: 'PO',
                isCloudwiseAdmin: true,
                createdAt: new Date().toISOString(),
              };
              setCurrentUser(adminUser);
            } else {
              // Regular users must register with a valid schoolcode
              setCurrentUser(null);
              setIsAuthModalOpen(true);
            }
          }
        } catch (e) {
          console.warn('Error fetching user profile:', e);
        }
      } else {
        // User logged out or unauthenticated: strictly revoke test/results access
        setCurrentUser(null);
        setSavedAssessments([]);
        setAnswers({});
        setResults(null);
        setCurrentQuestionIndex(0);
        setScreen('welcome');
        setActiveTab('test');
        try {
          localStorage.removeItem(CURRENT_STATE_STORAGE_KEY);
          localStorage.removeItem(SAVED_ASSESSMENTS_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Restore current session state on initial load
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(CURRENT_STATE_STORAGE_KEY);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        if (parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
          setQuestions(parsed.questions);
        }
        if (parsed.answers) setAnswers(parsed.answers);
        if (typeof parsed.currentQuestionIndex === 'number') {
          setCurrentQuestionIndex(parsed.currentQuestionIndex);
        }
        if (parsed.results) setResults(parsed.results);
        if (parsed.targetSector === 'VO' || parsed.targetSector === 'PO') {
          setTargetSector(parsed.targetSector);
        }
        if (parsed.screen && parsed.screen !== 'welcome') {
          setScreen(parsed.screen);
          if (parsed.screen === 'history' || parsed.screen === 'results') {
            setActiveTab('results');
          } else {
            setActiveTab('test');
          }
        }
      }
    } catch (e) {
      console.warn('Could not restore current session state:', e);
    }
  }, []);

  // 3. Save current progress state
  useEffect(() => {
    try {
      const stateToSave = {
        screen,
        currentQuestionIndex,
        answers,
        results,
        questions,
        targetSector,
      };
      localStorage.setItem(CURRENT_STATE_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Could not save current progress:', e);
    }
  }, [screen, currentQuestionIndex, answers, results, questions, targetSector]);

  // 4. Save target sector preference
  useEffect(() => {
    try {
      localStorage.setItem(SECTOR_STORAGE_KEY, targetSector);
    } catch (e) {
      console.warn('Could not save sector:', e);
    }
  }, [targetSector]);

  // 5. Persist saved assessments list
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_ASSESSMENTS_STORAGE_KEY, JSON.stringify(savedAssessments));
    } catch (e) {
      console.warn('Could not persist saved assessments:', e);
    }
  }, [savedAssessments]);

  // Handle start test CTA: Enforce account requirement!
  const handleStartTest = () => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    setScreen('quiz');
    setActiveTab('test');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler for selecting an option on multiple choice / self assessment
  const handleSelectOption = (optionId: string) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId,
    }));
  };

  // Handler for toggling Question 1 checklist items
  const handleToggleChecklistItem = (itemId: string) => {
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return;
    setAnswers((prev) => {
      const currentList: string[] = Array.isArray(prev[currentQ.id])
        ? (prev[currentQ.id] as string[])
        : [];

      const exists = currentList.includes(itemId);
      const updated = exists
        ? currentList.filter((id) => id !== itemId)
        : [...currentList, itemId];

      return {
        ...prev,
        [currentQ.id]: updated,
      };
    });
  };

  // Move to next question or complete assessment
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Calculate results and save to archive + Firebase Firestore
      const activeParticipant: UserProfile = {
        fullName: currentUser?.displayName || 'Deelnemer',
        email: currentUser?.email,
        schoolName: currentUser?.schoolName || 'Het Mozaïek',
        role: currentUser?.role || 'leerkracht',
        targetGroup: targetSector,
      };

      const calculated = calculateAssessmentResults(activeParticipant, answers);
      const resultId = `assessment_${Date.now()}`;
      const finalResult: AssessmentResult = {
        ...calculated,
        id: resultId,
        answers: answers,
      };

      const newSavedItem: SavedAssessment = {
        id: resultId,
        userId: currentUser?.uid || 'deelnemer',
        user: activeParticipant,
        createdAt: new Date().toISOString(),
        result: finalResult,
        answers: answers,
        schoolId: currentUser?.schoolId,
        schoolCode: currentUser?.schoolCode,
        schoolName: currentUser?.schoolName,
      };

      setResults(finalResult);
      setSavedAssessments((prev) => [newSavedItem, ...prev]);

      // Save to Firebase Firestore to build up the aggregate school report!
      if (currentUser) {
        saveAssessmentRecord(finalResult, currentUser).catch((err) => {
          console.warn('Could not save assessment to Firestore:', err);
        });
      }

      setScreen('results');
      setActiveTab('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Move to previous question
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Navigation from Top Header Tabs
  const handleHeaderNavigate = (tab: 'test' | 'results') => {
    if (tab === 'test') {
      setActiveTab('test');
      if (currentUser && answers && Object.keys(answers).length > 0 && screen === 'quiz') {
        setScreen('quiz');
      } else {
        setScreen('welcome');
      }
    } else if (tab === 'results') {
      if (!currentUser) {
        setIsAuthModalOpen(true);
        setActiveTab('test');
        setScreen('welcome');
        return;
      }
      setActiveTab('results');
      if (results) {
        setScreen('results');
      } else {
        setScreen('history');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle starting a fresh test
  const handleStartFreshTest = () => {
    setQuestions(getShuffledQuestions());
    setAnswers({});
    setCurrentQuestionIndex(0);
    setResults(null);
    setScreen('quiz');
    setActiveTab('test');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete all results & restart
  const handleDeleteAllAndRestart = () => {
    setSavedAssessments([]);
    setAnswers({});
    setResults(null);
    setCurrentQuestionIndex(0);
    setQuestions(getShuffledQuestions());
    try {
      localStorage.removeItem(CURRENT_STATE_STORAGE_KEY);
      localStorage.removeItem(SAVED_ASSESSMENTS_STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    setScreen('welcome');
    setActiveTab('test');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Past assessment select
  const handleSelectPastAssessment = (assessment: SavedAssessment) => {
    setResults(assessment.result);
    setAnswers(assessment.answers);
    setScreen('results');
    setActiveTab('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete individual assessment
  const handleDeleteSavedAssessment = (id: string) => {
    setSavedAssessments((prev) => prev.filter((item) => item.id !== id));
    if (results && results.id === id) {
      setResults(null);
      setAnswers({});
      setCurrentQuestionIndex(0);
      setScreen('welcome');
      setActiveTab('test');
    }
  };

  // Sign out handler - completely clear ongoing test, results, and reset to welcome
  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign out error:', e);
    }
    setCurrentUser(null);
    setAnswers({});
    setResults(null);
    setCurrentQuestionIndex(0);
    setQuestions(getShuffledQuestions());
    setSavedAssessments([]);
    try {
      localStorage.removeItem(CURRENT_STATE_STORAGE_KEY);
      localStorage.removeItem(SAVED_ASSESSMENTS_STORAGE_KEY);
    } catch (e) {
      console.error('Error clearing storage on logout:', e);
    }
    setIsAuthModalOpen(false);
    setIsNavigatorOpen(false);
    setIsCloudwiseAdminOpen(false);
    setScreen('welcome');
    setActiveTab('test');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectTargetSector = (newSector: 'PO' | 'VO') => {
    if (currentUser && !currentUser.isCloudwiseAdmin) {
      if (currentUser.schoolSector === 'PO' && newSector !== 'PO') return;
      if (currentUser.schoolSector === 'VO' && newSector !== 'VO') return;
    }
    setTargetSector(newSector);
  };

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface font-sans selection:bg-primary-fixed selection:text-on-primary-container">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        currentScreen={screen}
        currentQuestionIndex={currentQuestionIndex + 1}
        totalQuestions={questions.length}
        savedResultsCount={currentUser ? savedAssessments.length : 0}
        currentUser={currentUser}
        onNavigate={handleHeaderNavigate}
        onOpenNavigator={() => setIsNavigatorOpen(true)}
        onResetQuiz={() => setShowResetConfirm(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
        onOpenCloudwiseAdmin={() => setIsCloudwiseAdminOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {(!currentUser || screen === 'welcome') && (
          <WelcomeScreen
            targetSector={targetSector}
            onSelectTargetSector={handleSelectTargetSector}
            hasSavedAssessment={currentUser ? savedAssessments.length > 0 : false}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthModalOpen(true)}
            onStart={handleStartTest}
            onViewResults={() => {
              if (!currentUser) {
                setIsAuthModalOpen(true);
                return;
              }
              if (results) {
                setScreen('results');
              } else {
                setScreen('history');
              }
              setActiveTab('results');
            }}
            onDeleteAndRestart={handleDeleteAllAndRestart}
          />
        )}

        {currentUser && screen === 'quiz' && currentQ && (
          <QuestionCard
            question={currentQ}
            currentIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            currentAnswer={answers[currentQ.id]}
            targetGroup={targetSector}
            onSelectOption={handleSelectOption}
            onToggleChecklistItem={handleToggleChecklistItem}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onOpenNavigator={() => setIsNavigatorOpen(true)}
          />
        )}

        {currentUser && screen === 'results' && results && (
          <ResultsView
            result={results}
            questions={questions}
            answers={answers}
            onRetake={handleStartFreshTest}
            onDeleteAndRetake={handleDeleteAllAndRestart}
            onViewHistory={() => {
              setScreen('history');
              setActiveTab('results');
            }}
          />
        )}

        {currentUser && screen === 'history' && (
          <SavedResultsView
            savedAssessments={savedAssessments}
            onSelectAssessment={handleSelectPastAssessment}
            onDeleteAssessment={handleDeleteSavedAssessment}
            onStartNewTest={handleStartFreshTest}
            onDeleteAllAndRestart={handleDeleteAllAndRestart}
          />
        )}
      </main>

      {/* Auth & Schoolcode Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          const effective = user.schoolSector || user.targetSector;
          if (effective === 'PO') {
            setTargetSector('PO');
          } else if (effective === 'VO') {
            setTargetSector('VO');
          } else if (user.targetSector) {
            setTargetSector(user.targetSector);
          }
        }}
      />

      {/* Cloudwise Admin & School Reports Modal */}
      <CloudwiseAdminModal
        isOpen={isCloudwiseAdminOpen}
        onClose={() => setIsCloudwiseAdminOpen(false)}
        localAssessments={savedAssessments}
        currentUser={currentUser}
        onAdminLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />

      {/* Question Navigator Modal */}
      <QuestionNavigator
        isOpen={isNavigatorOpen}
        questions={questions}
        currentQuestionIndex={currentQuestionIndex}
        answers={answers}
        targetGroup={targetSector}
        onSelectQuestion={(idx) => {
          setCurrentQuestionIndex(idx);
          setIsNavigatorOpen(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onClose={() => setIsNavigatorOpen(false)}
      />

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-[24px] p-6 max-w-md w-full ambient-shadow border border-[#e8e8e8]">
            <h3 className="text-lg font-bold text-on-background mb-2">
              Huidige sessie herstarten?
            </h3>
            <p className="text-sm text-on-surface-variant mb-6">
              Weet je zeker dat je opnieuw wilt beginnen met deze vragenlijst? Eerder voltooide en
              opgeslagen nulmetingen in jouw archief blijven bewaard.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors cursor-pointer"
              >
                Annuleren
              </button>
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  handleStartFreshTest();
                }}
                className="px-5 py-2 text-xs font-bold bg-orange-2 hover:bg-orange-600 text-white rounded-lg transition-colors cursor-pointer"
              >
                Ja, herstarten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
