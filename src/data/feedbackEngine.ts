import {
  AnswersMap,
  AssessmentResult,
  CategoryScore,
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

    // The 3 parts for this subcategory:
    // 1. Kennis percentage (0 - 100%)
    // 2. Inschatting percentage (0 - 100% scaled from 1.0..4.0)
    // 3. Vaardigheden percentage (0 - 100% from Question 1 checklist items)
    const selfPercentage = Math.round(((selfAssessmentAvg - 1) / 3) * 100);
    const checklistPercentage =
      checklistTotal > 0 ? Math.round((checklistCount / checklistTotal) * 100) : 0;

    // Combined score: average of the three components (kennis, inschatting, vaardigheden)
    const combinedPercentage = Math.round(
      (knowledgePercentage + selfPercentage + checklistPercentage) / 3
    );

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
      selfPercentage,
      checklistCount,
      checklistTotal,
      checklistPercentage,
      combinedPercentage,
      level: subLevelObj.label,
      feedbackText,
      knowledgeQuestionIds: def.knowledgeQuestionIds,
      selfAssessmentQuestionIds: def.selfAssessmentQuestionIds,
      q1ItemIds: def.q1ItemIds,
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
    return `${s.code}. ${s.title}: niveau ${s.level} (Kennis: ${s.knowledgePercentage}%, Acties in de klas: ${s.checklistCount}/${s.checklistTotal}, Zelfkennis: ${s.selfAssessmentAvg}/4.0). Je toont hier een sterke beheersing.`;
  });

  const growthAreas = sortedSubcats.slice(-3).reverse().map((s) => {
    return `${s.code}. ${s.title}: niveau ${s.level} (Kennis: ${s.knowledgePercentage}%, Acties in de klas: ${s.checklistCount}/${s.checklistTotal}, Zelfkennis: ${s.selfAssessmentAvg}/4.0). Hier liggen de snelste ontwikkelkansen voor jou en je lessen.`;
  });

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
