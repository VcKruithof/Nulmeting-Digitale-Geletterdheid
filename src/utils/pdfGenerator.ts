import { jsPDF } from 'jspdf';
import { AssessmentResult } from '../types';

export function exportAssessmentToPDF(result: AssessmentResult): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180 mm
  const footerHeight = 14;
  const maxContentY = pageHeight - footerHeight - 3; // 280 mm safe limit

  // Colors
  const primaryNavy: [number, number, number] = [0, 102, 135]; // #006687
  const skyBlue: [number, number, number] = [0, 182, 237]; // #00b6ed
  const orangeAccent: [number, number, number] = [240, 131, 46]; // #F0832E
  const greenAccent: [number, number, number] = [56, 194, 99]; // #38C263
  const darkText: [number, number, number] = [26, 28, 28]; // #1a1c1c
  const mutedText: [number, number, number] = [90, 105, 115]; // #5a6973
  const lightBg: [number, number, number] = [245, 248, 250]; // #f5f8fa

  // Helper to get role display name
  const getRoleName = (role: string) => {
    switch (role) {
      case 'leerkracht':
        return 'Leerkracht';
      case 'leerkrachtondersteuner':
        return 'Leerkrachtondersteuner';
      case 'intern_begeleider':
        return 'Intern Begeleider (IB)';
      case 'directie':
        return 'Directie / Schoolleider';
      case 'ict_coordinator':
        return 'ICT-coördinator / i-Coach';
      default:
        return 'Onderwijsprofessional';
    }
  };

  let currentPage = 1;
  let currentY = 0;

  // Page Header renderer (Page 1 vs subsequent pages)
  function renderPageHeader(title: string = 'NULMETING DIGITALE GELETTERDHEID — RAPPORTAGE') {
    if (currentPage === 1) {
      // Primary header bar
      doc.setFillColor(...primaryNavy);
      doc.rect(0, 0, pageWidth, 26, 'F');

      // Accent strip
      doc.setFillColor(...orangeAccent);
      doc.rect(0, 26, pageWidth, 2.2, 'F');

      // Header Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14.5);
      doc.text('NULMETING DIGITALE GELETTERDHEID', margin, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Individueel Competentie- & Ontwikkelrapport (PO/VO)', margin, 19.5);

      // Brand watermark top right
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('Cloudwise Onderwijs', pageWidth - margin, 15, { align: 'right' });

      currentY = 34;
    } else {
      // Clean header on subsequent pages
      doc.setFillColor(...primaryNavy);
      doc.rect(0, 0, pageWidth, 16, 'F');

      doc.setFillColor(...skyBlue);
      doc.rect(0, 16, pageWidth, 2, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(title.toUpperCase(), margin, 11);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Kandidaat: ${result.user.fullName || 'Deelnemer'}`, pageWidth - margin, 11, {
        align: 'right',
      });

      currentY = 24;
    }
  }

  // Ensures enough space on current page; if not, starts a clean new page
  function ensureSpace(neededHeight: number, pageTitle?: string): void {
    if (currentY + neededHeight > maxContentY) {
      doc.addPage();
      currentPage++;
      renderPageHeader(pageTitle);
    }
  }

  // Initialize Page 1
  renderPageHeader();

  // ================= 1. CANDIDATE INFO BOX =================
  ensureSpace(24);
  doc.setFillColor(...lightBg);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2.5, 2.5, 'F');
  doc.setDrawColor(210, 225, 238);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2.5, 2.5, 'S');

  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Kandidaat: ${result.user.fullName || 'Deelnemer'}`, margin + 6, currentY + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...mutedText);
  doc.text(`Functie: ${getRoleName(result.user.role)}`, margin + 6, currentY + 13.5);

  const targetOrSchool = result.user.schoolName
    ? `School: ${result.user.schoolName}`
    : `Doelgroep: ${result.user.targetGroup || 'PO / VO'}`;
  doc.text(targetOrSchool, margin + 6, currentY + 19.5);

  doc.text(`Datum: ${result.completedAt}`, pageWidth - margin - 6, currentY + 7.5, { align: 'right' });
  doc.text(`Vragen: 50 vragen voltooid`, pageWidth - margin - 6, currentY + 13.5, { align: 'right' });
  doc.text(`Status: Voltooid`, pageWidth - margin - 6, currentY + 19.5, { align: 'right' });

  currentY += 28;

  // ================= 2. OVERALL SCORE & LEVEL BANNER =================
  ensureSpace(33);
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...skyBlue);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, currentY, contentWidth, 33, 2.5, 2.5, 'FD');

  // Left Score Badge
  doc.setFillColor(...skyBlue);
  doc.roundedRect(margin + 4, currentY + 4, 45, 25, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(`${result.overallScorePercentage}%`, margin + 26.5, currentY + 17, { align: 'center' });
  doc.setFontSize(7.5);
  doc.text('TOTAALSCORE', margin + 26.5, currentY + 23.5, { align: 'center' });

  // Right side details
  doc.setTextColor(...darkText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(`Profielniveau: ${result.overallLevel}`, margin + 55, currentY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...mutedText);
  const actiesPerc =
    result.overallChecklistPercentage ??
    Math.round((result.overallChecklistCount / result.overallChecklistTotal) * 100);
  doc.text(
    `Kennis: ${result.overallKnowledgeCorrect}/${result.overallKnowledgeTotal} (${result.overallKnowledgePercentage}%)   |   Acties klas: ${result.overallChecklistCount}/${result.overallChecklistTotal} (${actiesPerc}%)   |   Zelfkennis: ${result.overallSelfAssessmentAvg}/4.0`,
    margin + 55,
    currentY + 17
  );
  doc.setFontSize(7.8);
  doc.setTextColor(...darkText);
  doc.text(
    'Totaalscore gebouwd uit kennis & acties in de klas. Zelfkennis bepaalt de subdomeinniveaus.',
    margin + 55,
    currentY + 24
  );

  currentY += 37;

  // ================= 3. KERNDOELEN OVERVIEW (3 CARDS) =================
  ensureSpace(12);
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Resultaten per Kerndoel', margin, currentY);
  currentY += 6;

  result.categories.forEach((cat) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitSummary = doc.splitTextToSize(cat.summaryFeedback, contentWidth - 16);
    const textLineHeight = 3.6;
    const summaryHeight = splitSummary.length * textLineHeight;
    // Dynamic card height fitting all text with comfortable padding
    const cardHeight = Math.max(34, 18 + summaryHeight + 4.5);

    ensureSpace(cardHeight + 4, 'Resultaten per Kerndoel (Vervolg)');

    // Card background
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(215, 228, 238);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, currentY, contentWidth, cardHeight, 2, 2, 'FD');

    // Left accent bar
    if (cat.id === 'cat1') doc.setFillColor(...skyBlue);
    else if (cat.id === 'cat2') doc.setFillColor(...greenAccent);
    else doc.setFillColor(...orangeAccent);
    doc.roundedRect(margin, currentY, 3.5, cardHeight, 1.2, 1.2, 'F');

    // Title
    doc.setTextColor(...darkText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(cat.title, margin + 8, currentY + 7.5);

    // Score & Level
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...primaryNavy);
    doc.text(
      `${cat.combinedScorePercentage}%  (${cat.levelLabel})`,
      pageWidth - margin - 6,
      currentY + 7.5,
      { align: 'right' }
    );

    // Metrics line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text(
      `Kennisvragen: ${cat.knowledgeCorrect}/${cat.knowledgeTotal} (${cat.knowledgePercentage}%)   •   Acties in de klas: ${cat.checklistCount}/${cat.checklistTotal} (${cat.checklistPercentage}%)   •   Zelfkennis: ${cat.selfAssessmentAvg}/4.0`,
      margin + 8,
      currentY + 13.5
    );

    // Summary feedback
    doc.setTextColor(...darkText);
    doc.setFontSize(8);
    doc.text(splitSummary, margin + 8, currentY + 19);

    currentY += cardHeight + 4;
  });

  // ================= 4. STRENGTHS & GROWTH AREAS BOX =================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const bulletLineHeight = 3.6;

  const strItems = result.strengths.slice(0, 2);
  const strLinesList = strItems.map((s) => doc.splitTextToSize(`• ${s}`, contentWidth - 14));
  const strTotalLines = strLinesList.reduce((acc, lines) => acc + lines.length, 0);

  const grwItems = result.growthAreas.slice(0, 2);
  const grwLinesList = grwItems.map((g) => doc.splitTextToSize(`• ${g}`, contentWidth - 14));
  const grwTotalLines = grwLinesList.reduce((acc, lines) => acc + lines.length, 0);

  const strengthsBlockHeight = strTotalLines * bulletLineHeight + (strItems.length > 1 ? 2 : 0);
  const growthBlockHeight = grwTotalLines * bulletLineHeight + (grwItems.length > 1 ? 2 : 0);
  const totalStrengthsBoxHeight = 6 + 5 + strengthsBlockHeight + 4 + 5 + growthBlockHeight + 6;

  // If this box doesn't fit on Page 1 before the footer, it will cleanly start on Page 2
  ensureSpace(totalStrengthsBoxHeight + 6, 'Sterke Punten & Ontwikkelkansen');

  doc.setFillColor(...lightBg);
  doc.setDrawColor(215, 228, 238);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, currentY, contentWidth, totalStrengthsBoxHeight, 2.5, 2.5, 'FD');

  let innerY = currentY + 6.5;

  // Header 1: Strengths
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Belangrijkste Sterke Punten:', margin + 6, innerY);
  innerY += 5.5;

  // Strength lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkText);
  strLinesList.forEach((lines) => {
    doc.text(lines, margin + 6, innerY);
    innerY += lines.length * bulletLineHeight + 1.8;
  });

  innerY += 1.5;

  // Header 2: Growth areas
  doc.setTextColor(...orangeAccent);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('Aanbevolen Ontwikkelkansen:', margin + 6, innerY);
  innerY += 5.5;

  // Growth lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...darkText);
  grwLinesList.forEach((lines) => {
    doc.text(lines, margin + 6, innerY);
    innerY += lines.length * bulletLineHeight + 1.8;
  });

  currentY += totalStrengthsBoxHeight + 6;

  // ================= 5. SUBCATEGORIES TABLE =================
  const tableHeaderHeight = 7;
  const rowHeight = 7.5;
  const totalTableRows = 9;
  const totalTableHeight = 7 + tableHeaderHeight + totalTableRows * rowHeight + 6;

  ensureSpace(totalTableHeight, 'Overzicht van alle 9 Subdomeinen');

  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Overzicht van alle 9 Subdomeinen', margin, currentY);
  currentY += 6;

  // Table header
  doc.setFillColor(235, 243, 250);
  doc.rect(margin, currentY, contentWidth, tableHeaderHeight, 'F');
  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.text('Subdomein', margin + 3, currentY + 4.8);
  doc.text('Kennisvragen', margin + 68, currentY + 4.8);
  doc.text('Acties klas', margin + 98, currentY + 4.8);
  doc.text('Zelfkennis', margin + 126, currentY + 4.8);
  doc.text('Niveau', margin + 152, currentY + 4.8);

  currentY += tableHeaderHeight;

  const allSubcats = result.categories.flatMap((c) => c.subcategories);
  allSubcats.forEach((sub, idx) => {
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }
    doc.setDrawColor(228, 234, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

    doc.setTextColor(...darkText);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.text(`${sub.code}. ${sub.title}`, margin + 3, currentY + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedText);
    doc.setFontSize(7.5);
    doc.text(
      `${sub.knowledgeCorrect}/${sub.knowledgeTotal} (${sub.knowledgePercentage}%)`,
      margin + 68,
      currentY + 5.2
    );
    doc.text(
      `${sub.checklistCount}/${sub.checklistTotal} (${sub.checklistPercentage}%)`,
      margin + 98,
      currentY + 5.2
    );
    doc.text(`${sub.selfAssessmentAvg} / 4.0`, margin + 126, currentY + 5.2);

    doc.setTextColor(...primaryNavy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.text(sub.level, margin + 152, currentY + 5.2);

    currentY += rowHeight;
  });

  currentY += 8;

  // ================= 6. ROLE-SPECIFIC ADVICE =================
  ensureSpace(20, 'Persoonlijke Adviezen & Actieplan');

  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`Persoonlijke Adviezen voor ${getRoleName(result.user.role)}`, margin, currentY);
  currentY += 6;

  result.roleSpecificAdvice.slice(0, 4).forEach((adv) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const splitAdv = doc.splitTextToSize(adv, contentWidth - 14);
    const advLineHeight = 3.6;
    const textHeight = splitAdv.length * advLineHeight;
    const advBoxHeight = Math.max(11, 4.5 + textHeight + 2.5);

    ensureSpace(advBoxHeight + 2.5, 'Persoonlijke Adviezen (Vervolg)');

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(215, 228, 238);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, advBoxHeight, 1.5, 1.5, 'FD');

    doc.setFillColor(...skyBlue);
    doc.circle(margin + 4.5, currentY + 4.5, 1.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...darkText);
    doc.text(splitAdv, margin + 8.5, currentY + 4.8);

    currentY += advBoxHeight + 2.5;
  });

  currentY += 4;

  // ================= 7. CONCRETE ACTION STEPS (ACTIEPLAN) =================
  ensureSpace(24, 'Actieplan & Concrete Ontwikkelstappen');

  doc.setTextColor(...primaryNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Concrete Ontwikkelstappen (Actieplan)', margin, currentY);
  currentY += 6;

  result.actionSteps.forEach((step) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    const descLines = doc.splitTextToSize(step.description, contentWidth - 12);
    const descLineHeight = 3.6;
    const descHeight = descLines.length * descLineHeight;
    const stepBoxHeight = Math.max(16, 5 + 4.5 + descHeight + 3);

    ensureSpace(stepBoxHeight + 3, 'Actieplan (Vervolg)');

    doc.setFillColor(...lightBg);
    doc.roundedRect(margin, currentY, contentWidth, stepBoxHeight, 2, 2, 'F');
    doc.setDrawColor(210, 225, 238);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, currentY, contentWidth, stepBoxHeight, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    if (step.priority === 'Direct') doc.setTextColor(...orangeAccent);
    else if (step.priority === 'Middellange termijn') doc.setTextColor(...skyBlue);
    else doc.setTextColor(...greenAccent);

    doc.text(`[${step.priority.toUpperCase()}] ${step.title}`, margin + 5, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...darkText);
    doc.text(descLines, margin + 5, currentY + 9.5);

    currentY += stepBoxHeight + 3;
  });

  // ================= 8. DYNAMIC FOOTERS ACROSS ALL PAGES =================
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Footer divider line
    doc.setDrawColor(220, 230, 238);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);

    // Footer text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedText);
    doc.text(
      `Pagina ${p} van ${totalPages} — Nulmeting Digitale Geletterdheid`,
      margin,
      pageHeight - 6.5
    );
    doc.text('Cloudwise © 2026', pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  }

  // Save PDF
  const sanitizedName = (result.user.fullName || 'Resultaten')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_]/g, '');
  const filename = `Nulmeting_Digitale_Geletterdheid_${sanitizedName}_${new Date().toISOString().slice(0, 10)}.pdf`;

  doc.save(filename);
}
