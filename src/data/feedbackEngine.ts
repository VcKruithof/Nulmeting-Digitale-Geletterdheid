import {
  AnswersMap,
  AssessmentResult,
  CategoryScore,
  CalibrationStatus,
  KerndoelId,
  SubcategoryScore,
  UserProfile,
} from '../types';
import { QUESTIONS } from './questionsData';
import {
  RAW_SUBCATEGORIES,
  getSubcategoryCode,
  getSectorKerndoelCode,
  getSectorCategoryTitle,
  getSectorCategoryShortTitle,
  getSectorKerndoelNumber,
  getScoreLevel,
} from '../utils/kerndoelHelper';

export function evaluateSelfCalibration(
  selfAvg: number,
  knowledgeCorrect: number,
  knowledgeTotal: number,
  subTitle: string
): {
  status: CalibrationStatus;
  label: string;
  feedback: string;
} {
  const knowledgePerc =
    knowledgeTotal > 0 ? Math.round((knowledgeCorrect / knowledgeTotal) * 100) : 0;

  // 1. More skilled than estimated (Vaardiger dan gedacht)
  // Demonstrable knowledge is higher than the self-estimate
  const isMoreSkilled =
    (selfAvg <= 1.0 && knowledgeCorrect >= 1) ||
    (selfAvg <= 1.5 && knowledgeCorrect >= 2) ||
    (selfAvg <= 2.0 && knowledgeCorrect >= 3) ||
    (selfAvg <= 2.5 && knowledgeCorrect >= 3);

  // 2. Step needed to match self-estimate (Stapje extra nodig)
  // The self-estimate is higher than demonstrable knowledge (e.g. 2 and 3 chosen -> 2.5 with <= 1/3 correct)
  const isStepNeeded =
    !isMoreSkilled && (
      (selfAvg >= 2.0 && knowledgeCorrect === 0) ||
      (selfAvg >= 2.5 && knowledgeCorrect <= 1) ||
      (selfAvg >= 3.0 && knowledgeCorrect <= 1) ||
      (selfAvg >= 3.5 && knowledgeCorrect <= 2)
    );

  if (isMoreSkilled) {
    return {
      status: 'more_skilled',
      label: 'Vaardiger dan gedacht',
      feedback: `Je bent op het gebied van ${subTitle.toLowerCase()} vaardiger dan je denkt! Je schatte jezelf bescheiden in (${selfAvg}/4.0), maar je beantwoordde ${knowledgeCorrect} van de ${knowledgeTotal} kennisvragen goed (${knowledgePerc}%). Vertrouw gerust meer op je parate vakkennis!`,
    };
  }

  if (isStepNeeded) {
    return {
      status: 'step_needed',
      label: 'Stapje extra nodig',
      feedback: `Je schatte jezelf op ${subTitle.toLowerCase()} in op niveau ${selfAvg}/4.0, maar bij de inhoudelijke kennisvragen (${knowledgeCorrect}/${knowledgeTotal} goed, ${knowledgePerc}%) kan op dit specifieke gebied nog een stapje meer gezet worden om aan het zelf-ingeschatte niveau te voldoen. Gerichte verdieping in de kernbegrippen brengt theorie en praktijk perfect in balans.`,
    };
  }

  // 3. Realistic / Aligned (Zelfbeeld klopt)
  if (selfAvg <= 1.5 && knowledgeCorrect === 0) {
    return {
      status: 'in_balance',
      label: 'Zelfbeeld klopt',
      feedback: `Je zelfbeeld op ${subTitle.toLowerCase()} klopt: je herkent eerlijk dat dit onderwerp nieuw voor je is (${selfAvg}/4.0). Dat is een helder en realistisch vertrekpunt voor gerichte scholing en groei.`,
    };
  }

  if (selfAvg >= 3.0 && knowledgeCorrect === knowledgeTotal) {
    return {
      status: 'in_balance',
      label: 'Zelfbeeld klopt',
      feedback: `Je zelfbeeld op ${subTitle.toLowerCase()} klopt: je schat jezelf vaardig in (${selfAvg}/4.0) en dat bevestig je overtuigend met ${knowledgeCorrect} van de ${knowledgeTotal} goed beantwoorde kennisvragen (${knowledgePerc}%).`,
    };
  }

  return {
    status: 'in_balance',
    label: 'Zelfbeeld klopt',
    feedback: `Je zelfbeeld op ${subTitle.toLowerCase()} klopt: jouw inschatting (${selfAvg}/4.0) sluit goed aan bij jouw parate basiskennis (${knowledgeCorrect}/${knowledgeTotal} goed, ${knowledgePerc}%). Een stevige en realistische basis om op voort te bouwen.`,
  };
}

export function calculateAssessmentResults(
  user: UserProfile,
  answers: AnswersMap
): AssessmentResult {
  const targetGroup = user.targetGroup || 'PO';
  const q1Checked: string[] = Array.isArray(answers[1]) ? (answers[1] as string[]) : [];

  // Calculate Subcategory Scores
  const subcategoryScores: SubcategoryScore[] = RAW_SUBCATEGORIES.map((def) => {
    // 1. Checklist items checked for this subcategory
    const checklistCount = def.q1ItemIds.filter((itemId) => q1Checked.includes(itemId)).length;
    const checklistTotal = def.q1ItemIds.length;

    // 2. Knowledge questions
    let knowledgeCorrect = 0;
    const knowledgeTotal = def.knowledgeQuestionIds.length;
    def.knowledgeQuestionIds.forEach((qId) => {
      const q = QUESTIONS.find((item) => item.id === qId);
      const userAnswer = answers[qId];
      if (q && q.correctOptionId && userAnswer) {
        if (String(userAnswer).toLowerCase() === q.correctOptionId.toLowerCase()) {
          knowledgeCorrect++;
        }
      }
    });

    const knowledgePercentage =
      knowledgeTotal > 0 ? Math.round((knowledgeCorrect / knowledgeTotal) * 100) : 0;

    // 3. Self-assessment scale
    let selfSum = 0;
    let selfCount = 0;
    def.selfAssessmentQuestionIds.forEach((qId) => {
      const userAnswer = answers[qId];
      if (userAnswer) {
        const val = Number(userAnswer);
        if (!isNaN(val) && val >= 1 && val <= 4) {
          selfSum += val;
          selfCount++;
        }
      }
    });

    const selfAssessmentAvg = selfCount > 0 ? Number((selfSum / selfCount).toFixed(1)) : 1.0;

    // Koppeling zelfkennis aan kennisvragen:
    // Er wordt geen willekeurig percentage meer berekend voor zelfkennis.
    // In plaats daarvan wordt feedback gegeven op het zelfbeeld in relatie tot de getoonde kennis.
    const calibration = evaluateSelfCalibration(
      selfAssessmentAvg,
      knowledgeCorrect,
      knowledgeTotal,
      def.rawTitle
    );

    const checklistPercentage =
      checklistTotal > 0 ? Math.round((checklistCount / checklistTotal) * 100) : 0;

    // Subcategorie score is gebaseerd op aantoonbare kennis en acties in de klas
    const combinedPercentage =
      checklistTotal > 0
        ? Math.round((knowledgePercentage + checklistPercentage) / 2)
        : knowledgePercentage;

    const subLevelObj = getScoreLevel(combinedPercentage);
    const subCode = getSubcategoryCode(def.id, targetGroup);

    let feedbackText = '';
    if (combinedPercentage >= 90) {
      feedbackText = `Uitstekende beheersing van ${def.rawTitle.toLowerCase()}. Je beschikt over diepgaande vakkennis en kunt collega's inspireren.`;
    } else if (combinedPercentage >= 70) {
      feedbackText = `Goede theoretische basis en zelfstandige toepassing van ${def.rawTitle.toLowerCase()} in jouw onderwijspraktijk.`;
    } else if (combinedPercentage >= 50) {
      feedbackText = `Je hebt een degelijke basis in ${def.rawTitle.toLowerCase()}, met gerichte scholing groei je snel door.`;
    } else {
      feedbackText = `Nog volop ontwikkelkansen op het gebied van ${def.rawTitle.toLowerCase()}. Start met concrete basishandvatten.`;
    }

    return {
      id: def.id as any,
      code: subCode,
      title: def.rawTitle,
      kerndoelId: def.kerndoelId,
      knowledgeCorrect,
      knowledgeTotal,
      knowledgePercentage,
      selfAssessmentAvg,
      checklistCount,
      checklistTotal,
      checklistPercentage,
      combinedPercentage,
      level: subLevelObj.label,
      feedbackText,
      knowledgeQuestionIds: def.knowledgeQuestionIds,
      selfAssessmentQuestionIds: def.selfAssessmentQuestionIds,
      q1ItemIds: def.q1ItemIds,
      selfCalibrationStatus: calibration.status,
      selfCalibrationLabel: calibration.label,
      selfCalibrationFeedback: calibration.feedback,
    };
  });

  // Category definitions with dynamic kerndoel labels
  const categoryConfigs: {
    id: KerndoelId;
    accentColor: string;
    bgTint: string;
    mainQuestionId: number;
  }[] = [
    {
      id: 'cat1',
      accentColor: '#00b6ed',
      bgTint: '#C9E8FB',
      mainQuestionId: 3,
    },
    {
      id: 'cat2',
      accentColor: '#38C263',
      bgTint: '#d4f7dc',
      mainQuestionId: 24,
    },
    {
      id: 'cat3',
      accentColor: '#F0832E',
      bgTint: '#ffe8d6',
      mainQuestionId: 35,
    },
  ];

  let totalKnowledgeCorrect = 0;
  let totalKnowledgeQuestions = 0;
  let totalSelfSum = 0;
  let totalSelfCount = 0;

  const categories: CategoryScore[] = categoryConfigs.map((catConfig) => {
    const catId = catConfig.id as 'cat1' | 'cat2' | 'cat3';
    const subcats = subcategoryScores.filter((s) => s.kerndoelId === catId);

    const catKnowledgeCorrect = subcats.reduce((acc, s) => acc + s.knowledgeCorrect, 0);
    const catKnowledgeTotal = subcats.reduce((acc, s) => acc + s.knowledgeTotal, 0);
    const catKnowledgePercentage =
      catKnowledgeTotal > 0 ? Math.round((catKnowledgeCorrect / catKnowledgeTotal) * 100) : 0;

    const catChecklistCount = subcats.reduce((acc, s) => acc + s.checklistCount, 0);
    const catChecklistTotal = subcats.reduce((acc, s) => acc + s.checklistTotal, 0);
    const catChecklistPercentage =
      catChecklistTotal > 0 ? Math.round((catChecklistCount / catChecklistTotal) * 100) : 0;

    let catSelfSum = subcats.reduce((acc, s) => acc + s.selfAssessmentAvg, 0);
    let catSelfCount = subcats.length;

    const catSelfAvg = catSelfCount > 0 ? Number((catSelfSum / catSelfCount).toFixed(1)) : 1.0;

    // Categorie score is gebouwd door de kennisvragen en de acties in de klas (zelfkennis uitgesloten)
    const combinedScorePercentage = Math.round(
      (catKnowledgePercentage + catChecklistPercentage) / 2
    );

    const catLevelObj = getScoreLevel(combinedScorePercentage);
    const dynamicTitle = getSectorCategoryTitle(catId, targetGroup);
    const dynamicShortTitle = getSectorCategoryShortTitle(catId, targetGroup);
    const dynamicKerndoelCode = getSectorKerndoelCode(catId, targetGroup);

    let summaryFeedback = '';
    if (combinedScorePercentage >= 90) {
      summaryFeedback = `Je hebt een zeer sterke grip op ${dynamicShortTitle}. Zowel je vakkennis als je praktische didactische inzet zijn van expert niveau. Je bent uitstekend toegerust om de schoolbrede leerlijn mede vorm te geven.`;
    } else if (combinedScorePercentage >= 70) {
      summaryFeedback = `Je hanteert ${dynamicShortTitle} met vertrouwen in je eigen werk en in de klas. De volgende stap is het verdiepen van meer complexe deelgebieden en structurele borging in lessen.`;
    } else if (combinedScorePercentage >= 50) {
      summaryFeedback = `Je hebt de eerste essentiële basisbegrippen van ${dynamicShortTitle} onder de knie. Met gerichte scholing en praktische werkvormen kun je dit snel uitbreiden naar zelfstandige lesactiviteiten.`;
    } else {
      summaryFeedback = `Op het gebied van ${dynamicShortTitle} ligt er een mooi leertraject klaar. Focus allereerst op de basisvaardigheden en eenvoudige, direct toepasbare praktijkvoorbeelden.`;
    }

    totalKnowledgeCorrect += catKnowledgeCorrect;
    totalKnowledgeQuestions += catKnowledgeTotal;
    totalSelfSum += catSelfAvg;
    totalSelfCount += 1;

    return {
      id: catId,
      title: dynamicTitle,
      shortTitle: dynamicShortTitle,
      kerndoelCode: dynamicKerndoelCode,
      accentColor: catConfig.accentColor,
      bgTint: catConfig.bgTint,
      knowledgeCorrect: catKnowledgeCorrect,
      knowledgeTotal: catKnowledgeTotal,
      knowledgePercentage: catKnowledgePercentage,
      selfAssessmentAvg: catSelfAvg,
      checklistCount: catChecklistCount,
      checklistTotal: catChecklistTotal,
      checklistPercentage: catChecklistPercentage,
      combinedScorePercentage,
      levelLabel: catLevelObj.label,
      summaryFeedback,
      subcategories: subcats,
    };
  });

  const overallKnowledgePercentage =
    totalKnowledgeQuestions > 0
      ? Math.round((totalKnowledgeCorrect / totalKnowledgeQuestions) * 100)
      : 0;

  const overallSelfAssessmentAvg =
    totalSelfCount > 0 ? Number((totalSelfSum / totalSelfCount).toFixed(1)) : 1.0;

  const overallChecklistCount = q1Checked.length;
  const overallChecklistTotal = 27;
  const overallChecklistPercentage =
    overallChecklistTotal > 0
      ? Math.round((overallChecklistCount / overallChecklistTotal) * 100)
      : 0;

  // TOTAALSCORE: Gebouwd door de kennisvragen en de acties in de klas (50% kennis, 50% acties in de klas)
  // De zelfkennis vragen worden hierin NIET meegenomen.
  const overallScorePercentage = Math.round(
    (overallKnowledgePercentage + overallChecklistPercentage) / 2
  );

  const overallLevelObj = getScoreLevel(overallScorePercentage);
  const overallLevel = overallLevelObj.label;

  // Strengths & Growth Areas derivation based on combined subcategory performance (inclusief zelfkennis)
  const sortedSubcats = [...subcategoryScores].sort(
    (a, b) => b.combinedPercentage - a.combinedPercentage
  );

  const strengths = sortedSubcats.slice(0, 3).map((s) => {
    return `${s.code}. ${s.title}: niveau ${s.level} (Kennis: ${s.knowledgePercentage}%, Acties in de klas: ${s.checklistCount}/${s.checklistTotal}, Zelfbeeld: ${s.selfCalibrationLabel}). Je toont hier een sterke beheersing.`;
  });

  const growthAreas = sortedSubcats.slice(-3).reverse().map((s) => {
    return `${s.code}. ${s.title}: niveau ${s.level} (Kennis: ${s.knowledgePercentage}%, Acties in de klas: ${s.checklistCount}/${s.checklistTotal}, Zelfbeeld: ${s.selfCalibrationLabel}). Hier liggen de snelste ontwikkelkansen voor jou en je lessen.`;
  });

  // Calculate overall calibration summary
  const inBalanceCount = subcategoryScores.filter((s) => s.selfCalibrationStatus === 'in_balance').length;
  const moreSkilledCount = subcategoryScores.filter((s) => s.selfCalibrationStatus === 'more_skilled').length;
  const stepNeededCount = subcategoryScores.filter((s) => s.selfCalibrationStatus === 'step_needed').length;

  let calibrationSummary = '';
  if (moreSkilledCount >= 3) {
    calibrationSummary = `Je bent over het geheel genomen bescheiden: op maar liefst ${moreSkilledCount} van de 9 subdomeinen scoor je hoger op de kennisvragen dan je vooraf inschatte. Je mag volop vertrouwen op je eigen vakkennis!`;
  } else if (stepNeededCount >= 3) {
    calibrationSummary = `Je hebt een ambitieus en positief zelfbeeld. Op ${stepNeededCount} onderdelen kan nog een extra stapje gezet worden om aan je zelf-ingeschatte niveau te voldoen. Gerichte verdieping helpt theorie en praktijk perfect op elkaar af te stemmen.`;
  } else {
    calibrationSummary = `Je beschikt over een heel evenwichtig en realistisch zelfbeeld: op ${inBalanceCount} van de 9 subdomeinen sluit je eigen inschatting nauwkeurig aan bij wat je laat zien in de kennisvragen.`;
  }

  const selfCalibrationOverview = {
    inBalanceCount,
    moreSkilledCount,
    stepNeededCount,
    summary: calibrationSummary,
  };

  // Role-specific Advice
  const roleSpecificAdvice = getRoleSpecificAdvice(user.role, overallLevel);

  // Concrete Action Steps
  const actionSteps = generateActionSteps(user.role, sortedSubcats);

  return {
    user,
    completedAt: new Date().toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    overallScorePercentage,
    overallLevel,
    overallKnowledgeCorrect: totalKnowledgeCorrect,
    overallKnowledgeTotal: totalKnowledgeQuestions,
    overallKnowledgePercentage,
    overallSelfAssessmentAvg,
    overallChecklistCount,
    overallChecklistTotal,
    overallChecklistPercentage,
    categories,
    strengths,
    growthAreas,
    roleSpecificAdvice,
    actionSteps,
    selfCalibrationOverview,
  };
}

function getRoleSpecificAdvice(role: UserProfile['role'], level?: string): string[] {
  const safeLevel = String(level || '');
  const isHigh = safeLevel.includes('Expert') || safeLevel.includes('Gevorderd');

  switch (role) {
    case 'leerkracht':
      return [
        'Integreer Digitale Geletterdheid als natuurlijk onderdeel in bestaande vakken zoals wereldoriëntatie, taal en rekenen i.p.v. als los vak.',
        'Gebruik kant-en-klare lesmaterialen en unplugged computational thinking activiteiten om zonder technische drempel te starten.',
        isHigh
          ? 'Deel jouw best practices en succesvolle lesvoorbeelden tijdens een teamoverleg of studiedag om collega’s mee te nemen.'
          : 'Koppel je aan een ervaren collega of i-Coach om samen één les per maand rondom AI, privacy of programmeren voor te bereiden.',
        'Focus op de dialoog met leerlingen over digitale balans, sociale mediadruk en betrouwbaarheid van online bronnen.',
      ];
    case 'leerkrachtondersteuner':
      return [
        'Begeleid kleine groepjes leerlingen bij praktische digitale opdrachten (bijv. zoekopdrachten, Scratch of robotica).',
        'Ondersteun de groepsleerkracht bij het klaarzetten en storingsvrij houden van digitale leermiddelen en digibord tools.',
        'Help leerlingen die extra ondersteuning nodig hebben bij tekstverwerking, bronvermelding en wachtwoordveiligheid.',
        'Volg praktische workshops over educatieve apps om jouw ondersteunende rol nog krachtiger te maken.',
      ];
    case 'intern_begeleider':
      return [
        'Kijk met een IB-blik naar kansengelijkheid en de digitale kloof: hebben alle leerlingen gelijke toegang en digitale vaardigheden?',
        'Borg dat software en digitale testomgevingen voldoen aan AVG/privacy-eisen rondom gevoelige leerlingdossiers en zorgplannen.',
        'Zet digitale hulpmiddelen (zoals voorleessoftware, spraak-naar-tekst en adaptieve leersystemen) gericht in voor zorgleerlingen.',
        'Betrek digitale geletterdheid bij het signaleren van sociaal-emotionele veiligheid en online welzijn (cyberpesten/groepsdruk).',
      ];
    case 'directie':
      return [
        'Zorg voor structurele facilitering in tijd, studiedagen en budget voor de professionele ontwikkeling van het hele team.',
        'Veranker de nieuwe landelijke kerndoelen Digitale Geletterdheid in het schoolplan en de doorlopende leerlijn.',
        'Stel een i-Coach of digi-werkgroep aan om de visie naar de dagelijkse lespraktijk te vertalen.',
        'Evalueer regelmatig het privacy- en informatieveiligheidsbeleid (IBP) en het protocol rond verantwoorde AI op school.',
      ];
    case 'ict_coordinator':
      return [
        'Bouw voort op je rol als innovator door collega’s hands-on te coachen met concrete lessuggesties en co-teaching.',
        'Creëer een centrale overzichtskaart van beschikbare hardware (Micro:bits, Bee-Bots, iPads) en softwarelicenties met praktische handleidingen.',
        'Organiseer laagdrempelige "Digi-Cafés" of korte inspiratiesessies van 15 minuten tijdens teamvergaderingen.',
        'Bewaak de aansluiting tussen de technische infrastructuur (netwerk, single sign-on) en de didactische wensen van het team.',
      ];
    default:
      return [
        'Blijf jezelf oriënteren op actuele technologische ontwikkelingen zoals generatieve AI en dataveiligheid.',
        'Pas praktische digitale vaardigheden toe om dagelijkse werkprocessen efficiënter en aangenamer te maken.',
        'Neem deel aan schoolbrede initiatieven rondom mediawijsheid en digitaal welzijn.',
      ];
  }
}

function generateActionSteps(
  role: UserProfile['role'],
  sortedSubcats: SubcategoryScore[]
): AssessmentResult['actionSteps'] {
  const lowestCat = sortedSubcats[sortedSubcats.length - 1];
  const secondLowest = sortedSubcats[sortedSubcats.length - 2];
  const topCat = sortedSubcats[0];

  return [
    {
      priority: 'Direct',
      category: `${lowestCat.code}. ${lowestCat.title}`,
      title: `Eerste stap: Versterk ${lowestCat.code} (${lowestCat.title})`,
      description: `Besteed de komende maand gerichte aandacht aan ${lowestCat.title}. Bekijk basisinstructies of probeer één laagdrempelige werkvorm uit in de praktijk.`,
    },
    {
      priority: 'Middellange termijn',
      category: `${secondLowest.code}. ${secondLowest.title}`,
      title: `Didactische verdieping: ${secondLowest.code} (${secondLowest.title})`,
      description: `Verwerk een expliciete opdracht rond ${secondLowest.title} in je maandplanning. Betrek leerlingen bij kritische denkvragen over dit onderwerp.`,
    },
    {
      priority: 'Lange termijn',
      category: `${topCat.code}. ${topCat.title}`,
      title: `Kennisdeling & Borging: ${topCat.code} (${topCat.title})`,
      description: `Jouw sterke score in ${topCat.title} maakt je een waardevolle vraagbaak voor je team. Deel jouw ervaringen en help de doorlopende leerlijn op school versterken.`,
    },
  ];
}
