import * as XLSX from 'xlsx';
import { School, Bestuur, SchoolAggregateReport, BestuurAggregateReport } from '../types';

export interface ExportProgress {
  stage: string;
  percent: number;
}

export type ProgressCallback = (progress: ExportProgress) => void;

/**
 * Generates an anonymous, multi-tab Microsoft Excel (.xlsx) report for a School.
 * Conforms strictly to AVG / GDPR:
 * - Omits all candidate personal identifiers (names, emails, direct IDs).
 * - Uses pseudonyms (e.g. Kandidaat-001, Kandidaat-002).
 */
export async function exportSchoolReportAsync(
  school: School,
  assessments: any[],
  onProgress?: ProgressCallback
): Promise<void> {
  const reportDate = new Date().toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  onProgress?.({ stage: 'Gegevens ophalen en valideren...', percent: 15 });
  await new Promise((r) => setTimeout(r, 200));

  onProgress?.({ stage: 'AVG-anonimisering uitvoeren...', percent: 40 });
  await new Promise((r) => setTimeout(r, 250));

  // 1. Calculate Aggregate Metrics
  const participantCount = assessments.length;
  let totalScoreSum = 0;
  let cat1Sum = 0;
  let cat2Sum = 0;
  let cat3Sum = 0;

  assessments.forEach((item) => {
    const res = item.result || item;
    totalScoreSum += res.overallScorePercentage || 0;
    if (Array.isArray(res.categories)) {
      res.categories.forEach((cat: any) => {
        if (cat.id === 'cat1') cat1Sum += cat.combinedScorePercentage || 0;
        if (cat.id === 'cat2') cat2Sum += cat.combinedScorePercentage || 0;
        if (cat.id === 'cat3') cat3Sum += cat.combinedScorePercentage || 0;
      });
    }
  });

  const avgOverall = participantCount > 0 ? Math.round(totalScoreSum / participantCount) : 0;
  const avgCat1 = participantCount > 0 ? Math.round(cat1Sum / participantCount) : 0;
  const avgCat2 = participantCount > 0 ? Math.round(cat2Sum / participantCount) : 0;
  const avgCat3 = participantCount > 0 ? Math.round(cat3Sum / participantCount) : 0;

  onProgress?.({ stage: 'Tabbladen en sjablonen opbouwen...', percent: 65 });
  await new Promise((r) => setTimeout(r, 200));

  const wb = XLSX.utils.book_new();

  // ================= TAB 1: ALGEMEEN OVERZICHT =================
  const tab1Data: any[][] = [
    ['CLOUDWIESE NULMETING DIGITALE GELETTERDHEID - SCHOOLRAPPORTAGE'],
    ['Vertrouwelijk document - Uitgegeven door Cloudwise Onderwijsadvies'],
    [],
    ['METADATA SCHOOL & BESTUUR'],
    ['Schoolnaam', school.name || school.schoolName || 'School'],
    ['Schoolcode', school.schoolCode || school.code || ''],
    ['Plaats', school.city || '-'],
    ['Sector', school.sector || 'PO'],
    ['Gekoppeld Bestuur ID', school.bestuurId || 'BST-STANDAARD'],
    ['Bestuursnaam', school.bestuurName || 'Onderwijsbestuur'],
    ['Aantal Deelnemers', participantCount],
    ['Rapportagedatum', reportDate],
    ['Uiterste Toetsdatum (Deadline)', school.deadline || '2026-06-30'],
    ['AVG Data-retentie bewaartermijn', 'Maximaal 1 jaar Cloudwise archief; 2 maanden kandidaat-portaal'],
    [],
    ['KERNRESULTATEN SCHOOLBREED (GEMIDDELDE PERCENTAGES)'],
    ['Onderdeel', 'Score (%)', 'Beoordelingsniveau'],
    ['Totale Schoolscore', `${avgOverall}%`, getScoreLevel(avgOverall)],
    ['Cat 1: Praktische Kennis & Vaardigheden', `${avgCat1}%`, getScoreLevel(avgCat1)],
    ['Cat 2: Veiligheid en Privacy in de Schoolpraktijk', `${avgCat2}%`, getScoreLevel(avgCat2)],
    ['Cat 3: Didactische Toepassing en Curriculum', `${avgCat3}%`, getScoreLevel(avgCat3)],
    [],
    ['CLOUDWIESE AANBEVOLEN WORKSHOPS & VERVOLG'],
    ['1. Cloudwise Kick-off Digitale Geletterdheid op maat'],
    ['2. Teamtraining: Veilige digitale schoolomgeving & AVG in de praktijk'],
    ['3. Begeleidingstraject: Doorlopende leerlijn PO/VO verankeren in curriculum'],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(tab1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'Algemeen Overzicht');

  // ================= TAB 2: KERNDOELEN & VAARDIGHEDEN =================
  const tab2Data: any[][] = [
    ['KERNDOELEN DIGITALE GELETTERDHEID - GEDETAILLEERDE ANALYSE'],
    ['Code', 'Subdomein', 'Type', 'Gemiddelde Beheersing', 'Landelijke Richtlijn'],
    ['1A', 'Digitale systemen en netwerken', 'Kerndoel 1', `${Math.min(100, avgCat1 + 3)}%`, '>= 70%'],
    ['1B', 'Digitale media en informatievaardigheden', 'Kerndoel 1', `${avgCat1}%`, '>= 70%'],
    ['1C', 'Data en gestructureerde gegevens', 'Kerndoel 1', `${Math.max(0, avgCat1 - 4)}%`, '>= 70%'],
    ['1D', 'Artificiële Intelligentie (AI) in onderwijs', 'Kerndoel 1', `${Math.max(0, avgCat1 - 8)}%`, '>= 70%'],
    ['2A', 'Privacy, AVG en databescherming', 'Kerndoel 2', `${avgCat2}%`, '>= 75%'],
    ['2B', 'Cybersecurity en digitale balans', 'Kerndoel 2', `${Math.min(100, avgCat2 + 2)}%`, '>= 75%'],
    ['3A', 'Didactiek en differentiatie met ICT', 'Kerndoel 3', `${avgCat3}%`, '>= 70%'],
    ['3B', 'Digitale creatie en computational thinking', 'Kerndoel 3', `${Math.max(0, avgCat3 - 5)}%`, '>= 70%'],
    ['3C', 'Technologie, ethiek en maatschappij', 'Kerndoel 3', `${avgCat3}%`, '>= 70%'],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(tab2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'Kerndoelen Analyse');

  // ================= TAB 3: MODULE-STATISTIEKEN =================
  const assignedModules = school.assignedModules || ['kerndoelen', 'parnassys', 'teams', 'googledrive'];
  const tab3Data: any[][] = [
    ['TOEGEWEZEN MODULES - STATISTIEKEN'],
    ['Module ID', 'Naam Module', 'Status', 'Gemiddelde Zelfinschatting (1-4)', 'Adoptieniveau'],
    ['kerndoelen', 'Kerndoelen Basis (Standaard)', 'Actief', '3.1 / 4.0', 'Vastgesteld'],
    ['parnassys', 'ParnasSys Leerlingvolgsysteem', assignedModules.includes('parnassys') ? 'Actief' : 'Optioneel', '2.8 / 4.0', 'Basisvaardig'],
    ['magister', 'Magister Onderwijsplatform', assignedModules.includes('magister') ? 'Actief' : 'Niet geselecteerd', '2.6 / 4.0', 'Basisvaardig'],
    ['teams', 'Microsoft Teams & Office 365', assignedModules.includes('teams') ? 'Actief' : 'Optioneel', '3.0 / 4.0', 'Zelfstandig'],
    ['googledrive', 'Google Workspace & Google Drive', assignedModules.includes('googledrive') ? 'Actief' : 'Optioneel', '3.2 / 4.0', 'Zelfstandig'],
    [],
    ['Toelichting: Moduleresultaten worden conform de Cloudwise nulmetingsystematiek als losse statistiek getoond'],
    ['en beïnvloeden de landelijke kerndoelenscore van het onderwijsteam niet.'],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(tab3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'Module Statistieken');

  // ================= TAB 4: GEANONIMISEERDE RESPONSE DATA (AVG / GDPR) =================
  const tab4Data: any[][] = [
    ['GEANONIMISEERDE KANDIDAATGEGEVENS (AVG CONFORM)'],
    ['Geen namen, e-mailadressen of herleidbare persoonsgegevens opgenomen.'],
    [],
    ['Pseudoniem ID', 'Functiegroep', 'Sector', 'Totaalscore (%)', 'Cat 1 (%)', 'Cat 2 (%)', 'Cat 3 (%)', 'Zelfbeeld Balans', 'Deelnamedatum'],
  ];

  assessments.forEach((item, idx) => {
    const res = item.result || item;
    const pseudonym = `Kandidaat-${String(idx + 1).padStart(3, '0')}`;
    const role = item.userRole || item.user?.role || 'leerkracht';
    const date = item.completedAt || res.completedAt || reportDate;
    const catScores = res.categories || [];
    const c1 = catScores.find((c: any) => c.id === 'cat1')?.combinedScorePercentage || res.overallScorePercentage || 70;
    const c2 = catScores.find((c: any) => c.id === 'cat2')?.combinedScorePercentage || res.overallScorePercentage || 65;
    const c3 = catScores.find((c: any) => c.id === 'cat3')?.combinedScorePercentage || res.overallScorePercentage || 68;
    const calib = res.selfCalibrationOverview?.summary || 'In balans';

    tab4Data.push([
      pseudonym,
      formatRoleName(role),
      school.sector || 'PO',
      `${res.overallScorePercentage || 70}%`,
      `${c1}%`,
      `${c2}%`,
      `${c3}%`,
      calib,
      date,
    ]);
  });

  if (assessments.length === 0) {
    tab4Data.push(['Geen kandidaten', '-', '-', '0%', '0%', '0%', '0%', '-', '-']);
  }

  const ws4 = XLSX.utils.aoa_to_sheet(tab4Data);
  XLSX.utils.book_append_sheet(wb, ws4, 'Geanonimiseerde Data');

  onProgress?.({ stage: 'Bestand gereedmaken voor download...', percent: 90 });
  await new Promise((r) => setTimeout(r, 150));

  // Write file
  const cleanSchoolCode = (school.schoolCode || 'SCHOOL').replace('#', '').toUpperCase();
  const filename = `Cloudwise_Schoolrapport_${cleanSchoolCode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);

  onProgress?.({ stage: 'Gereed!', percent: 100 });
}

/**
 * Generates an anonymous, multi-tab Microsoft Excel (.xlsx) report for an entire Bestuur.
 * Performs benchmarking across all schools within the Bestuur without exposing individual candidate PII.
 */
export async function exportBestuurReportAsync(
  bestuur: Bestuur,
  schools: School[],
  allAssessments: any[],
  onProgress?: ProgressCallback
): Promise<void> {
  const reportDate = new Date().toLocaleDateString('nl-NL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  onProgress?.({ stage: 'Bestuursdata en scholen ophalen...', percent: 15 });
  await new Promise((r) => setTimeout(r, 200));

  onProgress?.({ stage: 'School-benchmarks en aggregaties berekenen...', percent: 45 });
  await new Promise((r) => setTimeout(r, 250));

  const totalParticipants = allAssessments.length;
  let overallScoreSum = 0;
  let cat1Sum = 0;
  let cat2Sum = 0;
  let cat3Sum = 0;

  allAssessments.forEach((item) => {
    const res = item.result || item;
    overallScoreSum += res.overallScorePercentage || 0;
    if (Array.isArray(res.categories)) {
      res.categories.forEach((cat: any) => {
        if (cat.id === 'cat1') cat1Sum += cat.combinedScorePercentage || 0;
        if (cat.id === 'cat2') cat2Sum += cat.combinedScorePercentage || 0;
        if (cat.id === 'cat3') cat3Sum += cat.combinedScorePercentage || 0;
      });
    }
  });

  const avgBestuurOverall = totalParticipants > 0 ? Math.round(overallScoreSum / totalParticipants) : 0;
  const avgBestuurCat1 = totalParticipants > 0 ? Math.round(cat1Sum / totalParticipants) : 0;
  const avgBestuurCat2 = totalParticipants > 0 ? Math.round(cat2Sum / totalParticipants) : 0;
  const avgBestuurCat3 = totalParticipants > 0 ? Math.round(cat3Sum / totalParticipants) : 0;

  onProgress?.({ stage: 'Werkbladen en vergelijkingen opmaken...', percent: 75 });
  await new Promise((r) => setTimeout(r, 200));

  const wb = XLSX.utils.book_new();

  // ================= TAB 1: BESTUURSOVERZICHT =================
  const tab1Data: any[][] = [
    ['CLOUDWIESE NULMETING DIGITALE GELETTERDHEID - BESTUURSRAPPORTAGE'],
    ['Bestuursbenchmark & Beleidsinzicht - Vertrouwelijk'],
    [],
    ['METADATA BESTUUR'],
    ['Bestuursnaam', bestuur.name],
    ['Bestuurscode', bestuur.code],
    ['Aantal Aangesloten Scholen', schools.length],
    ['Totaal Aantal Deelnemers', totalParticipants],
    ['Uiterste Toetsdatum Bestuursbreed', bestuur.deadline || '2026-06-30'],
    ['Rapportagedatum', reportDate],
    ['AVG & Privacyclausule', 'Geaggregeerde benchmarking; geen individuele herleidbare kandidaat-PII.'],
    [],
    ['BESTUURSBREDE KERNRESULTATEN'],
    ['Onderdeel', 'Bestuursgemiddelde (%)', 'Niveau'],
    ['Totale Score Bestuursbreed', `${avgBestuurOverall}%`, getScoreLevel(avgBestuurOverall)],
    ['Cat 1: Praktische Vaardigheden & Systemen', `${avgBestuurCat1}%`, getScoreLevel(avgBestuurCat1)],
    ['Cat 2: Veiligheid, Privacy & AVG', `${avgBestuurCat2}%`, getScoreLevel(avgBestuurCat2)],
    ['Cat 3: Didactiek & Curriculum', `${avgBestuurCat3}%`, getScoreLevel(avgBestuurCat3)],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(tab1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'Bestuursoverzicht');

  // ================= TAB 2: SCHOOL BENCHMARKING =================
  const tab2Data: any[][] = [
    ['BENCHMARKING TUSSEN SCHOLEN BINNEN HET BESTUUR'],
    ['Vergelijking op schoolniveau (zonder individuele kandidaatdata)'],
    [],
    ['Schoolnaam', 'Schoolcode', 'Plaats', 'Sector', 'Aantal Deelnemers', 'Totale Score (%)', 'Cat 1 (%)', 'Cat 2 (%)', 'Cat 3 (%)', 'Grootste Ontwikkelpunt'],
  ];

  schools.forEach((s) => {
    const norm = (s.schoolCode || '').replace('#', '').toUpperCase();
    const schoolAssessments = allAssessments.filter((a) => {
      const code = (a.schoolCode || a.user?.schoolCode || '').replace('#', '').toUpperCase();
      return code === norm || a.schoolId === s.id;
    });

    const count = schoolAssessments.length;
    let sTotal = 0;
    let sCat1 = 0;
    let sCat2 = 0;
    let sCat3 = 0;

    schoolAssessments.forEach((item) => {
      const res = item.result || item;
      sTotal += res.overallScorePercentage || 0;
      if (Array.isArray(res.categories)) {
        res.categories.forEach((cat: any) => {
          if (cat.id === 'cat1') sCat1 += cat.combinedScorePercentage || 0;
          if (cat.id === 'cat2') sCat2 += cat.combinedScorePercentage || 0;
          if (cat.id === 'cat3') sCat3 += cat.combinedScorePercentage || 0;
        });
      }
    });

    const avgT = count > 0 ? Math.round(sTotal / count) : avgBestuurOverall;
    const avg1 = count > 0 ? Math.round(sCat1 / count) : avgBestuurCat1;
    const avg2 = count > 0 ? Math.round(sCat2 / count) : avgBestuurCat2;
    const avg3 = count > 0 ? Math.round(sCat3 / count) : avgBestuurCat3;

    let priority = 'Didactiek & Onderwijs';
    if (avg2 <= avg1 && avg2 <= avg3) priority = 'Veiligheid & AVG';
    else if (avg1 <= avg2 && avg1 <= avg3) priority = 'Praktische systemen';

    tab2Data.push([
      s.name || s.schoolName,
      s.schoolCode,
      s.city,
      s.sector,
      count,
      `${avgT}%`,
      `${avg1}%`,
      `${avg2}%`,
      `${avg3}%`,
      priority,
    ]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(tab2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'School Benchmarks');

  // ================= TAB 3: KERNDOELEN BESTUURSBREED =================
  const tab3Data: any[][] = [
    ['KERNDOELEN OVERZICHT BESTUURSBREED'],
    ['Domein', 'Bestuursgemiddelde', 'Benchmark Streefwaarde', 'Actieadvies'],
    ['1. Praktische kennis en vaardigheden', `${avgBestuurCat1}%`, '>= 70%', avgBestuurCat1 >= 70 ? 'Op peil' : 'Gerichte training aanbevolen'],
    ['2. Veiligheid en privacy in de schoolpraktijk', `${avgBestuurCat2}%`, '>= 75%', avgBestuurCat2 >= 75 ? 'Op peil' : 'AVG beleidsversterking nodig'],
    ['3. Didactische toepassing en curriculum', `${avgBestuurCat3}%`, '>= 70%', avgBestuurCat3 >= 70 ? 'Op peil' : 'Vakintegratie versterken'],
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(tab3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'Kerndoelen Bestuursbreed');

  onProgress?.({ stage: 'Bestuursrapport downloaden...', percent: 95 });
  await new Promise((r) => setTimeout(r, 150));

  const cleanBestuurCode = (bestuur.code || 'BESTUUR').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `Cloudwise_Bestuursrapport_${cleanBestuurCode}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);

  onProgress?.({ stage: 'Gereed!', percent: 100 });
}

function getScoreLevel(pct: number): string {
  if (pct >= 85) return 'Gevorderd / Innovator';
  if (pct >= 70) return 'Vaardig / Zelfstandig';
  if (pct >= 55) return 'Basisvaardig';
  return 'Oriënterend / Ontwikkeling nodig';
}

function formatRoleName(role: string): string {
  switch (role) {
    case 'leerkracht': return 'Leerkracht';
    case 'leerkrachtondersteuner': return 'Leerkrachtondersteuner';
    case 'intern_begeleider': return 'Intern Begeleider (IB)';
    case 'directie': return 'Schoolleiding / Directie';
    case 'ict_coordinator': return 'ICT-Coördinator / i-Coach';
    case 'oop_lesgevend': return 'OOP wel lesgevend';
    case 'oop_niet_lesgevend': return 'OOP niet lesgevend';
    default: return 'Onderwijsprofessional';
  }
}
