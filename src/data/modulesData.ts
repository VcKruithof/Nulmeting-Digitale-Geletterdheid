import { ModularModule, Question, ModuleScore, AnswersMap, TargetFunctionRole } from '../types';

export const SYSTEM_MODULES: ModularModule[] = [
  {
    id: 'kerndoelen',
    name: 'Kerndoelen Digitale Geletterdheid',
    shortName: 'Kerndoelen Basis',
    description: 'De landelijke basis voor praktische kennis, privacy, mediawijsheid en didactiek. Standaard voor alle onderwijsprofessionals.',
    isBase: true,
    sector: 'BEIDE',
    icon: 'Layers',
    targetRoles: ['leerkracht', 'directie', 'oop_lesgevend', 'oop_niet_lesgevend', 'intern_begeleider', 'ict_coordinator'],
    questionCount: 40,
  },
  {
    id: 'parnassys',
    name: 'ParnasSys Leerlingvolgsysteem',
    shortName: 'ParnasSys',
    description: 'Leerlingadministratie, groepsplannen, toetsanalyses, en communicatie binnen het primair onderwijs.',
    isBase: false,
    sector: 'PO',
    icon: 'Database',
    targetRoles: ['leerkracht', 'directie', 'intern_begeleider', 'oop_lesgevend'],
    questionCount: 4,
  },
  {
    id: 'magister',
    name: 'Magister Onderwijsplatform',
    shortName: 'Magister',
    description: 'Cijferregistratie, absentiebeheer, studiewijzers en oudercommunicatie in het voortgezet onderwijs.',
    isBase: false,
    sector: 'VO',
    icon: 'GraduationCap',
    targetRoles: ['leerkracht', 'directie', 'oop_lesgevend'],
    questionCount: 4,
  },
  {
    id: 'teams',
    name: 'Microsoft Teams & Office 365',
    shortName: 'MS Teams',
    description: 'Samenwerken in klassen-teams, digitaal inleveren van opdrachten, vergaderen en OneNote Class Notebook.',
    isBase: false,
    sector: 'BEIDE',
    icon: 'Users',
    targetRoles: ['leerkracht', 'directie', 'oop_lesgevend', 'oop_niet_lesgevend', 'ict_coordinator'],
    questionCount: 4,
  },
  {
    id: 'googledrive',
    name: 'Google Workspace & Google Drive',
    shortName: 'Google Drive',
    description: 'Delen van bestanden, samenwerkingsdocumenten, Google Classroom en veilige rechtenstructuur.',
    isBase: false,
    sector: 'BEIDE',
    icon: 'FolderKanban',
    targetRoles: ['leerkracht', 'directie', 'oop_lesgevend', 'oop_niet_lesgevend', 'ict_coordinator'],
    questionCount: 4,
  },
];

export const SCALE_OPTIONS = [
  { id: '1', label: '1 - Oriënterend: Ik ben hier nog niet mee bekend of heb continue begeleiding nodig.', scaleValue: 1 },
  { id: '2', label: '2 - Basisvaardig: Ik kan standaard routinetaken zelfstandig uitvoeren.', scaleValue: 2 },
  { id: '3', label: '3 - Zelfstandig: Ik pas dit soepel toe in mijn dagelijkse werk en help collega’s.', scaleValue: 3 },
  { id: '4', label: '4 - Gevorderd / Expert: Ik beheer instellingen en richt processen schoolbreed optimaal in.', scaleValue: 4 },
];

export const MODULAR_QUESTIONS: Question[] = [
  // ================= PARNASSYS (PO) =================
  {
    id: 101,
    moduleId: 'parnassys',
    categoryBadge: 'MODULE: PARNASSYS (PO)',
    subcategoryTitle: '1. Groepsoverzichten & Leerlinggegevens',
    kerndoelId: 'module',
    subcategoryId: 'mod_parnassys',
    type: 'module-assessment',
    questionText: 'Hoe schat jij jouw vaardigheid in bij het invoeren van observaties, notities en het interpreteren van groepsoverzichten in ParnasSys?',
    topAccentColor: '#2E8BF0',
    options: SCALE_OPTIONS,
  },
  {
    id: 102,
    moduleId: 'parnassys',
    categoryBadge: 'MODULE: PARNASSYS (PO)',
    subcategoryTitle: '2. Toetsresultaten & Trendanalyses',
    kerndoelId: 'module',
    subcategoryId: 'mod_parnassys',
    type: 'module-assessment',
    questionText: 'In welke mate kun je toetsresultaten invoeren, analyseren via vaardigheidsscores en omzetten in handelingsgerichte acties?',
    topAccentColor: '#2E8BF0',
    options: SCALE_OPTIONS,
  },
  {
    id: 103,
    moduleId: 'parnassys',
    categoryBadge: 'MODULE: PARNASSYS (PO)',
    subcategoryTitle: '3. Groepsplannen & Zorgdossiers',
    kerndoelId: 'module',
    subcategoryId: 'mod_parnassys',
    type: 'module-assessment',
    questionText: 'Hoe zelfstandig werk jij met het aanmaken, evalueren en delen van groepsplannen en individuele leerlingdossiers?',
    topAccentColor: '#2E8BF0',
    options: SCALE_OPTIONS,
  },
  {
    id: 104,
    moduleId: 'parnassys',
    categoryBadge: 'MODULE: PARNASSYS (PO)',
    subcategoryTitle: '4. AVG & Rechtenbeheer in ParnasSys',
    kerndoelId: 'module',
    subcategoryId: 'mod_parnassys',
    type: 'module-assessment',
    questionText: 'In hoeverre zorg jij voor strikt AVG-conform gebruik van ParnasSys (uitloggen, geheimhouding, zorgvuldig delen met externen)?',
    topAccentColor: '#2E8BF0',
    options: SCALE_OPTIONS,
  },

  // ================= MAGISTER (VO) =================
  {
    id: 201,
    moduleId: 'magister',
    categoryBadge: 'MODULE: MAGISTER (VO)',
    subcategoryTitle: '1. Cijferregistratie & PTA-Beheer',
    kerndoelId: 'module',
    subcategoryId: 'mod_magister',
    type: 'module-assessment',
    questionText: 'Hoe vaardig ben jij in het correct invoeren van toetsresultaten, wegingen en voortgangsnotities in Magister?',
    topAccentColor: '#8E24AA',
    options: SCALE_OPTIONS,
  },
  {
    id: 202,
    moduleId: 'magister',
    categoryBadge: 'MODULE: MAGISTER (VO)',
    subcategoryTitle: '2. Studiewijzers & Huiswerkplanning',
    kerndoelId: 'module',
    subcategoryId: 'mod_magister',
    type: 'module-assessment',
    questionText: 'Hoe soepel beheer jij digitale studiewijzers, opdrachten en inlevermomenten voor leerlingen via Magister?',
    topAccentColor: '#8E24AA',
    options: SCALE_OPTIONS,
  },
  {
    id: 203,
    moduleId: 'magister',
    categoryBadge: 'MODULE: MAGISTER (VO)',
    subcategoryTitle: '3. Aanwezigheid & Absentieregistratie',
    kerndoelId: 'module',
    subcategoryId: 'mod_magister',
    type: 'module-assessment',
    questionText: 'In welke mate houd jij aanwezigheid, te-laatmeldingen en lesaantekeningen direct en accuraat bij per lesuur?',
    topAccentColor: '#8E24AA',
    options: SCALE_OPTIONS,
  },
  {
    id: 204,
    moduleId: 'magister',
    categoryBadge: 'MODULE: MAGISTER (VO)',
    subcategoryTitle: '4. Communicatie & Ouderportaal',
    kerndoelId: 'module',
    subcategoryId: 'mod_magister',
    type: 'module-assessment',
    questionText: 'Hoe effectief gebruik jij de communicatiefuncties in Magister richting leerlingen en ouders volgens de schoolrichtlijnen?',
    topAccentColor: '#8E24AA',
    options: SCALE_OPTIONS,
  },

  // ================= MICROSOFT TEAMS =================
  {
    id: 301,
    moduleId: 'teams',
    categoryBadge: 'MODULE: MICROSOFT TEAMS',
    subcategoryTitle: '1. Kanalen & Klassen-organisatie',
    kerndoelId: 'module',
    subcategoryId: 'mod_teams',
    type: 'module-assessment',
    questionText: 'Hoe zelfstandig richt jij klassenteams in met overzichtelijke kanalen, tabbladen en bestandsstructuren?',
    topAccentColor: '#464EB8',
    options: SCALE_OPTIONS,
  },
  {
    id: 302,
    moduleId: 'teams',
    categoryBadge: 'MODULE: MICROSOFT TEAMS',
    subcategoryTitle: '2. Opdrachten & Feedback',
    kerndoelId: 'module',
    subcategoryId: 'mod_teams',
    type: 'module-assessment',
    questionText: 'In hoeverre gebruik jij de functionaliteit Opdrachten (Assignments) inclusief rubrics en digitale feedback in Teams?',
    topAccentColor: '#464EB8',
    options: SCALE_OPTIONS,
  },
  {
    id: 303,
    moduleId: 'teams',
    categoryBadge: 'MODULE: MICROSOFT TEAMS',
    subcategoryTitle: '3. OneNote Class Notebook',
    kerndoelId: 'module',
    subcategoryId: 'mod_teams',
    type: 'module-assessment',
    questionText: 'Hoe vertrouwd ben jij met het distribueren van lespagina’s en digitaal nakijken via het Klasnotitieblok (OneNote)?',
    topAccentColor: '#464EB8',
    options: SCALE_OPTIONS,
  },
  {
    id: 304,
    moduleId: 'teams',
    categoryBadge: 'MODULE: MICROSOFT TEAMS',
    subcategoryTitle: '4. Hybride Communicatie & Veiligheid',
    kerndoelId: 'module',
    subcategoryId: 'mod_teams',
    type: 'module-assessment',
    questionText: 'Hoe vaardig leid jij online bijeenkomsten en bewaak je de omgangsvormen en microfoon-/chatinstellingen van deelnemers?',
    topAccentColor: '#464EB8',
    options: SCALE_OPTIONS,
  },

  // ================= GOOGLE WORKSPACE / GOOGLE DRIVE =================
  {
    id: 401,
    moduleId: 'googledrive',
    categoryBadge: 'MODULE: GOOGLE WORKSPACE',
    subcategoryTitle: '1. Mappenstructuur & Gedeelde Drives',
    kerndoelId: 'module',
    subcategoryId: 'mod_googledrive',
    type: 'module-assessment',
    questionText: 'Hoe gestructureerd beheer jij bestanden in Google Drive en maak je optimaal gebruik van Gedeelde Drives (Shared Drives)?',
    topAccentColor: '#0F9D58',
    options: SCALE_OPTIONS,
  },
  {
    id: 402,
    moduleId: 'googledrive',
    categoryBadge: 'MODULE: GOOGLE WORKSPACE',
    subcategoryTitle: '2. Samenwerken & Versiegeschiedenis',
    kerndoelId: 'module',
    subcategoryId: 'mod_googledrive',
    type: 'module-assessment',
    questionText: 'Hoe soepel werk jij gelijktijdig met collega’s of leerlingen in Google Documenten/Spreadsheets en herstel je eerdere versies?',
    topAccentColor: '#0F9D58',
    options: SCALE_OPTIONS,
  },
  {
    id: 403,
    moduleId: 'googledrive',
    categoryBadge: 'MODULE: GOOGLE WORKSPACE',
    subcategoryTitle: '3. Toegangsrechten & Veilig Delen',
    kerndoelId: 'module',
    subcategoryId: 'mod_googledrive',
    type: 'module-assessment',
    questionText: 'In hoeverre pas je strikte toegangsrechten toe (alleen lezer, reageerder, bewerker) om per ongeluk openbaar delen te voorkomen?',
    topAccentColor: '#0F9D58',
    options: SCALE_OPTIONS,
  },
  {
    id: 404,
    moduleId: 'googledrive',
    categoryBadge: 'MODULE: GOOGLE WORKSPACE',
    subcategoryTitle: '4. Google Formulieren & Classroom',
    kerndoelId: 'module',
    subcategoryId: 'mod_googledrive',
    type: 'module-assessment',
    questionText: 'Hoe zelfstandig maak jij formulieren (enquêtes/quizzen) of beheer je lesmateriaal via Google Classroom?',
    topAccentColor: '#0F9D58',
    options: SCALE_OPTIONS,
  },
];

/**
 * Calculates scores for any assigned modules.
 * These do NOT affect the base Kerndoelen score.
 */
export function calculateModuleScores(
  assignedModuleIds: string[],
  answers: AnswersMap
): ModuleScore[] {
  const resultScores: ModuleScore[] = [];

  assignedModuleIds.forEach((modId) => {
    if (modId === 'kerndoelen') return; // Base handled separately

    const moduleDef = SYSTEM_MODULES.find((m) => m.id === modId);
    if (!moduleDef) return;

    const moduleQuestions = MODULAR_QUESTIONS.filter((q) => q.moduleId === modId);
    if (moduleQuestions.length === 0) return;

    let totalRating = 0;
    let answeredCount = 0;

    moduleQuestions.forEach((q) => {
      const ans = answers[q.id];
      if (ans && typeof ans === 'string') {
        const val = parseInt(ans, 10);
        if (!isNaN(val) && val >= 1 && val <= 4) {
          totalRating += val;
          answeredCount++;
        }
      }
    });

    const avgRating = answeredCount > 0 ? +(totalRating / answeredCount).toFixed(1) : 2.0;

    let level = 'Basisvaardig';
    let feedback = '';
    const recommendations: string[] = [];

    if (avgRating <= 1.8) {
      level = 'Oriënterend';
      feedback = `Binnen ${moduleDef.name} ben je bezig met de basisbeginselen. Een gestructureerde introductietraining zorgt voor directe rust en zekerheid.`;
      recommendations.push(`Cloudwise Basistraining: Efficiënt starten met ${moduleDef.shortName}`);
      recommendations.push('Samen met een directe collega de vaste weekroutine doorlopen');
    } else if (avgRating <= 2.8) {
      level = 'Basisvaardig';
      feedback = `Je beheerst de gangbare dagelijkse handelingen binnen ${moduleDef.name}. Tijdswinst is nu te behalen door handige snelkoppelingen en automatisering.`;
      recommendations.push(`Verdiepingstraining: Tips & Tricks voor gevorderd gebruik van ${moduleDef.shortName}`);
      recommendations.push('Tips uitwisselen tijdens het schoolbrede teamoverleg');
    } else if (avgRating <= 3.6) {
      level = 'Zelfstandig';
      feedback = `Je beweegt je zeer zelfstandig door ${moduleDef.name} en haalt er veel profijt uit in je dagelijkse onderwijspraktijk.`;
      recommendations.push('Verbinden met schoolafspraken rondom datastructuren en eenduidige werkwijze');
      recommendations.push('Als vraagbaak optreden voor startende collega’s');
    } else {
      level = 'Gevorderd / Expert';
      feedback = `Uitstekende beheersing van ${moduleDef.name}. Je bent in staat collega’s te ondersteunen en beleidsmatig mee te denken over inrichting.`;
      recommendations.push('Meehelpen als key-user of digicoach binnen de school of het bestuur');
      recommendations.push('Cloudwise Train-de-Trainer sessies voor digicoaches');
    }

    resultScores.push({
      moduleId: modId,
      moduleName: moduleDef.name,
      averageRating: avgRating,
      level,
      feedback,
      recommendations,
    });
  });

  return resultScores;
}
