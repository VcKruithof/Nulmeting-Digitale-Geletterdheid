export type TargetSector = 'PO' | 'VO' | 'Beide';

export interface SubcategoryMetaDefinition {
  id: string; // '1A', '1B', etc.
  rawCode: string; // 'A', 'B', 'C', 'D'
  rawTitle: string; // 'Digitale systemen'
  kerndoelId: 'cat1' | 'cat2' | 'cat3';
  q1ItemIds: string[];
  knowledgeQuestionIds: number[];
  selfAssessmentQuestionIds: number[];
}

export const RAW_SUBCATEGORIES: SubcategoryMetaDefinition[] = [
  {
    id: '1A',
    rawCode: 'A',
    rawTitle: 'Digitale systemen',
    kerndoelId: 'cat1',
    q1ItemIds: ['q1_1', 'q1_2', 'q1_3'],
    knowledgeQuestionIds: [4, 5, 6],
    selfAssessmentQuestionIds: [7, 8],
  },
  {
    id: '1B',
    rawCode: 'B',
    rawTitle: 'Digitale media en informatie',
    kerndoelId: 'cat1',
    q1ItemIds: ['q1_4', 'q1_5', 'q1_6', 'q1_7'],
    knowledgeQuestionIds: [9, 10, 11],
    selfAssessmentQuestionIds: [12, 13],
  },
  {
    id: '1C',
    rawCode: 'C',
    rawTitle: 'Data',
    kerndoelId: 'cat1',
    q1ItemIds: ['q1_8', 'q1_9', 'q1_10'],
    knowledgeQuestionIds: [14, 15, 16],
    selfAssessmentQuestionIds: [17, 18],
  },
  {
    id: '1D',
    rawCode: 'D',
    rawTitle: 'Artificiële Intelligentie (AI)',
    kerndoelId: 'cat1',
    q1ItemIds: ['q1_11', 'q1_12', 'q1_13', 'q1_14'],
    knowledgeQuestionIds: [19, 20, 21],
    selfAssessmentQuestionIds: [22, 23],
  },
  {
    id: '2A',
    rawCode: 'A',
    rawTitle: 'Creëren met digitale technologie',
    kerndoelId: 'cat2',
    q1ItemIds: ['q1_15', 'q1_16', 'q1_17'],
    knowledgeQuestionIds: [25, 26, 27],
    selfAssessmentQuestionIds: [28, 29],
  },
  {
    id: '2B',
    rawCode: 'B',
    rawTitle: 'Programmeren & Computational Thinking',
    kerndoelId: 'cat2',
    q1ItemIds: ['q1_18', 'q1_19', 'q1_20'],
    knowledgeQuestionIds: [30, 31, 32],
    selfAssessmentQuestionIds: [33, 34],
  },
  {
    id: '3A',
    rawCode: 'A',
    rawTitle: 'Veiligheid en privacy',
    kerndoelId: 'cat3',
    q1ItemIds: ['q1_21', 'q1_22', 'q1_23'],
    knowledgeQuestionIds: [36, 37, 38],
    selfAssessmentQuestionIds: [39, 40],
  },
  {
    id: '3B',
    rawCode: 'B',
    rawTitle: 'Digitale technologie, jezelf en de ander',
    kerndoelId: 'cat3',
    q1ItemIds: ['q1_24', 'q1_25'],
    knowledgeQuestionIds: [41, 42, 43],
    selfAssessmentQuestionIds: [44, 45],
  },
  {
    id: '3C',
    rawCode: 'C',
    rawTitle: 'Digitale technologie, samenleving en wereld',
    kerndoelId: 'cat3',
    q1ItemIds: ['q1_26', 'q1_27'],
    knowledgeQuestionIds: [46, 47, 48],
    selfAssessmentQuestionIds: [49, 50],
  },
];

export function isVOSector(sector?: TargetSector | string): boolean {
  if (!sector) return false;
  return String(sector).toUpperCase() === 'VO';
}

export function getSectorKerndoelNumber(
  catId: 'cat1' | 'cat2' | 'cat3',
  sector?: TargetSector | string
): number {
  const isVO = isVOSector(sector);
  if (catId === 'cat1') return isVO ? 21 : 22;
  if (catId === 'cat2') return isVO ? 22 : 23;
  if (catId === 'cat3') return isVO ? 23 : 24;
  return isVO ? 21 : 22;
}

export function getSectorKerndoelCode(
  catId: 'cat1' | 'cat2' | 'cat3',
  sector?: TargetSector | string
): string {
  const num = getSectorKerndoelNumber(catId, sector);
  return `Kerndoel ${num}`;
}

export function getSectorCategoryBadge(
  catId: 'cat1' | 'cat2' | 'cat3',
  sector?: TargetSector | string
): string {
  const num = getSectorKerndoelNumber(catId, sector);
  if (catId === 'cat1') return `KERNDOEL ${num}: PRAKTISCHE KENNIS EN VAARDIGHEDEN`;
  if (catId === 'cat2') return `KERNDOEL ${num}: CREËREN MET DIGITALE TECHNOLOGIE`;
  if (catId === 'cat3') return `KERNDOEL ${num}: DIGITALE TECHNOLOGIE, JEZELF EN DE SAMENLEVING`;
  return `KERNDOEL ${num}`;
}

export function getSectorCategoryTitle(
  catId: 'cat1' | 'cat2' | 'cat3',
  sector?: TargetSector | string
): string {
  const num = getSectorKerndoelNumber(catId, sector);
  if (catId === 'cat1') return `Kerndoel ${num}: Praktische kennis en vaardigheden`;
  if (catId === 'cat2') return `Kerndoel ${num}: Creëren met digitale technologie`;
  if (catId === 'cat3') return `Kerndoel ${num}: Digitale technologie, jezelf en de samenleving`;
  return `Kerndoel ${num}`;
}

export function getSectorCategoryShortTitle(
  catId: 'cat1' | 'cat2' | 'cat3',
  sector?: TargetSector | string
): string {
  const num = getSectorKerndoelNumber(catId, sector);
  if (catId === 'cat1') return `Kerndoel ${num}: Praktische Kennis`;
  if (catId === 'cat2') return `Kerndoel ${num}: Creëren & Maken`;
  if (catId === 'cat3') return `Kerndoel ${num}: De Digitale Wereld`;
  return `Kerndoel ${num}`;
}

export function getSubcategoryCode(subId: string, sector?: TargetSector | string): string {
  const isVO = isVOSector(sector);
  switch (subId) {
    case '1A':
      return isVO ? '21A' : '22A';
    case '1B':
      return isVO ? '21B' : '22B';
    case '1C':
      return isVO ? '21C' : '22C';
    case '1D':
      return isVO ? '21D' : '22D';
    case '2A':
      return isVO ? '22A' : '23A';
    case '2B':
      return isVO ? '22B' : '23B';
    case '3A':
      return isVO ? '23A' : '24A';
    case '3B':
      return isVO ? '23B' : '24B';
    case '3C':
      return isVO ? '23C' : '24C';
    default:
      return subId;
  }
}

export function getSubcategoryFullTitle(
  subId: string,
  rawTitle: string,
  sector?: TargetSector
): string {
  const code = getSubcategoryCode(subId, sector);
  return `${code}. ${rawTitle}`;
}

export function getScoreLevel(score: number): {
  label: string;
  badgeClass: string;
  description: string;
} {
  // Thresholds strictly adhering to user request:
  // <= 50 -> beginnende gebruiker
  // 50-70 -> lerend gebruiker
  // 70-90 -> gevorderd gebruiker
  // > 90 (>= 90) -> expert gebruiker
  if (score >= 90) {
    return {
      label: 'Expert gebruiker',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
      description:
        'Je beschikt over uitstekende vakkennis, vaardigheden en didactisch inzicht. Je kunt collega’s coachen en een leidende rol spelen bij de schoolontwikkeling.',
    };
  }
  if (score >= 70) {
    return {
      label: 'Gevorderd gebruiker',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description:
        'Je beheerst digitale geletterdheid zelfstandig op een hoog niveau en past dit doelgericht toe in je dagelijkse onderwijspraktijk.',
    };
  }
  if (score >= 50) {
    return {
      label: 'Lerend gebruiker',
      badgeClass: 'bg-sky-1 text-primary border-primary/30',
      description:
        'Je hebt een degelijke basiskennis en past digitale toepassingen al regelmatig toe. Met gerichte verdieping groei je snel door.',
    };
  }
  return {
    label: 'Beginnende gebruiker',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    description:
      'Je zet de eerste stappen in digitale geletterdheid. Met praktische basistrainingen bouw je snel meer zelfvertrouwen op.',
  };
}
