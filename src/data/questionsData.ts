import { Question } from '../types';

export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns a cloned list of questions where the multiple choice options
 * for all knowledge questions are randomly shuffled.
 * Self-assessment scale questions (1-4) and checklists remain intact.
 */
export function getShuffledQuestions(sourceList: Question[] = QUESTIONS): Question[] {
  return sourceList.map((q) => {
    if (q.type === 'knowledge' && q.options && q.options.length > 1) {
      return {
        ...q,
        options: shuffleArray(q.options),
      };
    }
    return q;
  });
}

export const QUESTIONS: Question[] = [
  // ==================== DEEL 0: ALGEMENE ZELFINSCHATTING ====================
  {
    id: 1,
    categoryBadge: 'DEEL 0: ALGEMENE ZELFINSCHATTING',
    subcategoryTitle: 'Algemeen Vaardighedenoverzicht (27 Praktijkvaardigheden)',
    kerndoelId: 'algemeen',
    subcategoryId: 'algemeen',
    type: 'checklist',
    questionText:
      'Welke vaardigheden beheers en/of pas jij op dit moment toe in jouw onderwijspraktijk? Kruis alle vaardigheden aan die voor jou van toepassing zijn.',
    topAccentColor: '#F0832E',
    checklistItems: [
      // 1A / 22A / 21A: Digitale systemen (3 items)
      {
        id: 'q1_1',
        label:
          'Apparatuur & verbinding: Ik sluit randapparatuur (digibord, audio, camera, documentcamera) zelfstandig aan en herstart systemen bij een storing.',
        subcategoryId: '1A',
        tag: 'Digitale systemen',
      },
      {
        id: 'q1_2',
        label:
          'Netwerk & cloudstructuur: Ik werk veilig in een cloudomgeving (Google Workspace / Microsoft 365) en organiseer bestanden logisch in mappen en shares.',
        subcategoryId: '1A',
        tag: 'Digitale systemen',
      },
      {
        id: 'q1_3',
        label:
          'Systeembegrip overbrengen: Ik laat leerlingen spelenderwijs ontdekken hoe input, verwerking en output (hardware & software) in apparaten samenwerken.',
        subcategoryId: '1A',
        tag: 'Digitale systemen',
      },

      // 1B / 22B / 21B: Digitale media en informatie (4 items)
      {
        id: 'q1_4',
        label:
          'Bronkritiek & factchecking: Ik controleer online lesbronnen systematisch op auteur, datum, commerciële belangen en mogelijke manipulatie.',
        subcategoryId: '1B',
        tag: 'Digitale media & info',
      },
      {
        id: 'q1_5',
        label:
          'Geavanceerd zoeken: Ik gebruik gerichte zoekcommando’s, trefwoorden en filters in zoekmachines om snel geschikt lesmateriaal te vinden.',
        subcategoryId: '1B',
        tag: 'Digitale media & info',
      },
      {
        id: 'q1_6',
        label:
          'Beïnvloeding herkennen: Ik signaleer gesponsorde content, clickbait en gepersonaliseerde advertenties op websites en sociale platforms.',
        subcategoryId: '1B',
        tag: 'Digitale media & info',
      },
      {
        id: 'q1_7',
        label:
          'Informatievaardigheden bijbrengen: Ik ontwerp opdrachten waarin leerlingen zoekresultaten kritisch vergelijken en betrouwbare bronnen selecteren.',
        subcategoryId: '1B',
        tag: 'Digitale media & info',
      },

      // 1C / 22C / 21C: Data (3 items)
      {
        id: 'q1_8',
        label:
          'Gegevens organiseren: Ik orden en beheer leerling- of toetsgegevens in tabellen en spreadsheets met behulp van filters en eenvoudige formules.',
        subcategoryId: '1C',
        tag: 'Data',
      },
      {
        id: 'q1_9',
        label:
          'Datavisualisatie: Ik zet cijfermatige informatie om in overzichtelijke grafieken of schema’s om trends en resultaten zichtbaar te maken.',
        subcategoryId: '1C',
        tag: 'Data',
      },
      {
        id: 'q1_10',
        label:
          'Digitale voetafdruk bespreken: Ik voer gesprekken met leerlingen over welke gegevens apps en platforms van hen verzamelen en opslaan.',
        subcategoryId: '1C',
        tag: 'Data',
      },

      // 1D / 22D / 21D: Artificiële intelligentie (4 items)
      {
        id: 'q1_11',
        label:
          'AI-werkingsprincipe: Ik begrijp dat generatieve AI-modellen voorspellingen doen op basis van patronen in trainingsdata en niet zelfstandig redeneren.',
        subcategoryId: '1D',
        tag: 'Artificiële intelligentie',
      },
      {
        id: 'q1_12',
        label:
          'AI-productiviteit: Ik gebruik AI-assistenten om lesteksten te differentiëren, werkvormen te bedenken of toetsvragen te formuleren.',
        subcategoryId: '1D',
        tag: 'Artificiële intelligentie',
      },
      {
        id: 'q1_13',
        label:
          'Ethisch AI-gebruik: Ik let bij het invoeren van prompts op privacy (geen herleidbare leerlingdata) en houd rekening met vooroordelen (bias).',
        subcategoryId: '1D',
        tag: 'Artificiële intelligentie',
      },
      {
        id: 'q1_14',
        label:
          'AI-evaluatie in de les: Ik leer leerlingen om AI-gegenereerde antwoorden grondig na te trekken op feitelijke juistheid (hallucinaties).',
        subcategoryId: '1D',
        tag: 'Artificiële intelligentie',
      },

      // 2A / 23A / 22A: Creëren met digitale technologie (3 items)
      {
        id: 'q1_15',
        label:
          'Digitale documentverzorging: Ik maak gestructureerde tekstdocumenten en werkbladen met duidelijke koppen, afbeeldingen en hyperlinks.',
        subcategoryId: '2A',
        tag: 'Creëren met technologie',
      },
      {
        id: 'q1_16',
        label:
          'Rijke media ontwerpen: Ik produceer digitale presentaties, interactieve quizzen of instructievideo’s afgestemd op de leerdoelen.',
        subcategoryId: '2A',
        tag: 'Creëren met technologie',
      },
      {
        id: 'q1_17',
        label:
          'Creatieve opdrachten: Ik laat leerlingen digitale eindproducten ontwerpen (bijv. podcasts, posters, video’s) met aandacht voor doel en doelgroep.',
        subcategoryId: '2A',
        tag: 'Creëren met technologie',
      },

      // 2B / 23B / 22B: Programmeren & Computational Thinking (3 items)
      {
        id: 'q1_18',
        label:
          'Computationeel denken: Ik herken basisprincipes zoals opdelen in deelproblemen, patroonherkenning en stapsgewijze instructies (algoritmes).',
        subcategoryId: '2B',
        tag: 'Programmeren',
      },
      {
        id: 'q1_19',
        label:
          'Programmeeromgevingen inzetten: Ik leid programmeeractiviteiten met fysieke robots (Bee-Bot/LEGO) of visuele programmeertools (Scratch/MakeCode).',
        subcategoryId: '2B',
        tag: 'Programmeren',
      },
      {
        id: 'q1_20',
        label:
          'Fouten opsporen (debuggen): Ik begeleid leerlingen bij het systematisch testen van hun code en het herstellen van fouten in logische stappen.',
        subcategoryId: '2B',
        tag: 'Programmeren',
      },

      // 3A / 24A / 23A: Veiligheid en privacy (3 items)
      {
        id: 'q1_21',
        label:
          'Veilige accountbeveiliging: Ik gebruik unieke, sterke wachtwoorden, twee-factor-authenticatie (2FA) en vergrendel mijn scherm bij afwezigheid.',
        subcategoryId: '3A',
        tag: 'Veiligheid & privacy',
      },
      {
        id: 'q1_22',
        label:
          'Digitale dreigingen signaleren: Ik herken phishingberichten, verdachte links en onveilige e-mailbijlagen onmiddellijk in mijn werkcontext.',
        subcategoryId: '3A',
        tag: 'Veiligheid & privacy',
      },
      {
        id: 'q1_23',
        label:
          'Privacy-instructie: Ik breng leerlingen bij welke persoonlijke gegevens ze nooit online moeten delen en hoe ze accounts privé instellen.',
        subcategoryId: '3A',
        tag: 'Veiligheid & privacy',
      },

      // 3B / 24B / 23B: Digitale technologie, jezelf en de ander (2 items)
      {
        id: 'q1_24',
        label:
          'Digitale balans & welzijn: Ik doseer mijn eigen schermtijd en notificaties bewust om werkdruk te reguleren en geconcentreerd te blijven.',
        subcategoryId: '3B',
        tag: 'Jezelf en de ander',
      },
      {
        id: 'q1_25',
        label:
          'Sociale omgang online: Ik bespreek met de groep thema’s als online pesten, groepsdruk in klassen-WhatsApp en respectvolle communicatie.',
        subcategoryId: '3B',
        tag: 'Jezelf en de ander',
      },

      // 3C / 24C / 23C: Digitale technologie, samenleving en wereld (2 items)
      {
        id: 'q1_26',
        label:
          'Maatschappelijke reflectie: Ik bespreek met leerlingen hoe technologie onze democratie, nieuwsconsumptie en beroepen van de toekomst verandert.',
        subcategoryId: '3C',
        tag: 'Samenleving & wereld',
      },
      {
        id: 'q1_27',
        label:
          'Duurzaamheid & inclusiviteit: Ik besteed aandacht aan e-waste, het energieverbruik van datacenters en gelijke digitale kansen voor iedereen.',
        subcategoryId: '3C',
        tag: 'Samenleving & wereld',
      },
    ],
  },
  {
    id: 2,
    categoryBadge: 'DEEL 0: ALGEMENE ZELFINSCHATTING',
    subcategoryTitle: 'DG in de klas (Zelfvertrouwen)',
    kerndoelId: 'algemeen',
    subcategoryId: 'algemeen',
    type: 'self-assessment',
    questionText:
      'Hoe zeker voel jij je om digitale geletterdheid bewust terug te laten komen in jouw lessen?',
    topAccentColor: '#F0832E',
    options: [
      {
        id: '1',
        label: 'Niveau 1: Ik voel me hier nog onzeker over en doe dit nog weinig.',
        scaleValue: 1,
      },
      {
        id: '2',
        label: 'Niveau 2: Ik besteed er soms aandacht aan wanneer het onderwerp vanzelf langskomt.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik verwerk digitale geletterdheid bewust in mijn lessen en opdrachten.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: 'Niveau 4: Ik ondersteun collega’s bij het vormgeven van digitale geletterdheid in de klas.',
        scaleValue: 4,
      },
    ],
  },

  // ==================== CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN ====================
  {
    id: 3,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: 'Categorie Hoofdvraag 1',
    kerndoelId: 'cat1',
    subcategoryId: 'algemeen',
    type: 'self-assessment',
    questionText:
      'In hoeverre beheers en pas jij praktische digitale kennis en vaardigheden toe?',
    topAccentColor: '#00b6ed',
    options: [
      {
        id: '1',
        label: 'Niveau 1: Ik doe hier nog niks of heel weinig mee.',
        scaleValue: 1,
      },
      {
        id: '2',
        label: 'Niveau 2: Ik pas praktische vaardigheden toe voor mijn eigen dagelijkse werk.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik leer leerlingen hoe ze om moeten gaan met digitale systemen, media, data en AI.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: "Niveau 4: Ik ondersteun en adviseer collega's bij het aanleren van praktische digitale vaardigheden.",
        scaleValue: 4,
      },
    ],
  },
  {
    id: 4,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1A. Digitale systemen',
    kerndoelId: 'cat1',
    subcategoryId: '1A',
    type: 'knowledge',
    questionText:
      "Welk onderdeel van een computer is primair verantwoordelijk voor het verwerken van instructies en gegevens (de 'hersenen' van de computer)?",
    topAccentColor: '#00b6ed',
    correctOptionId: 'b',
    explanation:
      "De CPU (Central Processing Unit / Processor) voert alle berekeningen en instructies van software uit en wordt daarom gezien als de 'hersenen' van het apparaat.",
    options: [
      { id: 'a', label: 'RAM (Werkgeheugen)' },
      { id: 'b', label: 'CPU (Processor)' },
      { id: 'c', label: 'SSD (Opslag)' },
      { id: 'd', label: 'Moederbord' },
    ],
  },
  {
    id: 5,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1A. Digitale systemen',
    kerndoelId: 'cat1',
    subcategoryId: '1A',
    type: 'knowledge',
    questionText: 'Wat is de hoofdfunctie van een router in een netwerk?',
    topAccentColor: '#00b6ed',
    correctOptionId: 'c',
    explanation:
      'Een router verbindt verschillende netwerken met elkaar (zoals jouw lokale netwerk op school/thuis en het wereldwijde internet) en zorgt dat gegevenspakketjes naar het juiste adres worden gestuurd.',
    options: [
      { id: 'a', label: 'Het beveiligen van een computer tegen virussen.' },
      { id: 'b', label: 'Het omzetten van bestanden naar printopmaak.' },
      { id: 'c', label: 'Het verbinden van netwerken, zoals thuisnetwerk en internet.' },
      { id: 'd', label: 'Het vergroten van opslagruimte op apparaten.' },
    ],
  },
  {
    id: 6,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1A. Digitale systemen',
    kerndoelId: 'cat1',
    subcategoryId: '1A',
    type: 'knowledge',
    questionText: 'Welke sneltoets gebruik je om geselecteerde tekst te knippen?',
    topAccentColor: '#00b6ed',
    correctOptionId: 'd',
    explanation:
      'Ctrl + X (of Cmd + X op Mac) is de standaard sneltoets voor knippen. Ctrl + C is kopiëren, Ctrl + Z is ongedaan maken en Ctrl + K is hyperlink invoegen.',
    options: [
      { id: 'a', label: 'Ctrl + Z' },
      { id: 'b', label: 'Ctrl + C' },
      { id: 'c', label: 'Ctrl + K' },
      { id: 'd', label: 'Ctrl + X' },
    ],
  },
  {
    id: 7,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1A. Digitale systemen',
    kerndoelId: 'cat1',
    subcategoryId: '1A',
    type: 'self-assessment',
    questionText:
      'Hoe zelfstandig kun je eenvoudige technische/hardwarematige problemen in de klas oplossen (bijv. audiostoring, digibord instellingen, netwerkverbinding)?',
    topAccentColor: '#00b6ed',
    options: [
      { id: '1', label: 'Niveau 1: Ik kan dit niet zelf en vraag direct hulp.', scaleValue: 1 },
      {
        id: '2',
        label: 'Niveau 2: Ik kan basisproblemen zelfstandig oplossen met een handleiding of simpel herstarten.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik los de meeste dagelijkse problemen zelf op en help leerlingen hierbij.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: "Niveau 4: Ik help en instrueer collega's bij het oplossen van technische problemen.",
        scaleValue: 4,
      },
    ],
  },
  {
    id: 8,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1A. Digitale systemen',
    kerndoelId: 'cat1',
    subcategoryId: '1A',
    type: 'self-assessment',
    questionText:
      'In hoeverre ken jij de digitale apparatuur en onderdelen die in en rond de school worden gebruikt, zoals een laptop, digibord, printer, router, modem of access point?',
    topAccentColor: '#00b6ed',
    options: [
      {
        id: '1',
        label: 'Niveau 1: Ik weet hier nog weinig van en herken niet altijd welke apparatuur waarvoor dient.',
        scaleValue: 1,
      },
      {
        id: '2',
        label:
          'Niveau 2: Ik herken de belangrijkste apparatuur en onderdelen en weet globaal waarvoor ze worden gebruikt.',
        scaleValue: 2,
      },
      {
        id: '3',
        label:
          'Niveau 3: Ik kan aan leerlingen of collega’s uitleggen wat deze apparatuur en onderdelen doen en hoe ze samenwerken.',
        scaleValue: 3,
      },
      {
        id: '4',
        label:
          'Niveau 4: Ik kan zelfstandig met alle schoolapparatuur werken, weet instellingen aan te passen en ondersteun anderen.',
        scaleValue: 4,
      },
    ],
  },
  {
    id: 9,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1B. Digitale media en informatie',
    kerndoelId: 'cat1',
    subcategoryId: '1B',
    type: 'knowledge',
    questionText:
      'Welke zoekoperator gebruik je in een zoekmachine om te zoeken op een exacte opeenvolging van woorden?',
    topAccentColor: '#00b6ed',
    correctOptionId: 'a',
    explanation:
      'Door zoektermen tussen aanhalingstekens te plaatsen (bijv. "digitale geletterdheid in het basisonderwijs"), zoekt de zoekmachine uitsluitend op die exacte opeenvolgende zin.',
    options: [
      { id: 'a', label: 'Aanhalingstekens (" ")' },
      { id: 'b', label: 'Asterisk (*)' },
      { id: 'c', label: 'Hekje (#)' },
      { id: 'd', label: 'Plusteken (+)' },
    ],
  },
  {
    id: 10,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1B. Digitale media en informatie',
    kerndoelId: 'cat1',
    subcategoryId: '1B',
    type: 'knowledge',
    questionText: "Wat wordt bedoeld met de term 'filterbubbel'?",
    topAccentColor: '#00b6ed',
    correctOptionId: 'c',
    explanation:
      'Een filterbubbel ontstaat wanneer algoritmes het informatie-aanbod personaliseren op basis van jouw eerdere zoekgedrag en voorkeuren, waardoor je voornamelijk bevestigende en gelijksoortige informatie te zien krijgt.',
    options: [
      { id: 'a', label: 'Een programma dat ongewenste e-mails filtert.' },
      { id: 'b', label: 'Een blokkade tegen pop-upadvertenties op websites.' },
      { id: 'c', label: 'Een online omgeving waarin je vooral gelijksoortige informatie ziet.' },
      { id: 'd', label: 'Een manier om zoekresultaten op datum te sorteren.' },
    ],
  },
  {
    id: 11,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1B. Digitale media en informatie',
    kerndoelId: 'cat1',
    subcategoryId: '1B',
    type: 'knowledge',
    questionText:
      'Welke van de volgende criteria is het krachtigst om de betrouwbaarheid van een online nieuwsartikel vast te stellen?',
    topAccentColor: '#00b6ed',
    correctOptionId: 'c',
    explanation:
      'Verifieerbaarheid van de auteur, de onderliggende organisatie, deskundigheid en controleerbare bronvermeldingen vormen het fundament van bronkritiek.',
    options: [
      { id: 'a', label: 'Het artikel bevat veel afbeeldingen en grafieken.' },
      { id: 'b', label: 'Het artikel heeft een publicatiedatum.' },
      { id: 'c', label: 'Auteur, bron en organisatie zijn goed te controleren.' },
      { id: 'd', label: 'De website heeft een moderne professionele lay-out.' },
    ],
  },
  {
    id: 12,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1B. Digitale media en informatie',
    kerndoelId: 'cat1',
    subcategoryId: '1B',
    type: 'self-assessment',
    questionText:
      'Hoe vaardig ben je in het kritisch beoordelen van de betrouwbaarheid en relevantie van online informatie voor je werk?',
    topAccentColor: '#00b6ed',
    options: [
      {
        id: '1',
        label: 'Niveau 1: Ik vind het lastig om desinformatie of onbetrouwbare bronnen te herkennen.',
        scaleValue: 1,
      },
      {
        id: '2',
        label: 'Niveau 2: Ik kan voor eigen gebruik goed bepalen of een bron betrouwbaar is.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik leer leerlingen expliciet hoe zij bronnen kritisch moeten evalueren en zoeken.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: "Niveau 4: Ik coach collega's in het aanleren van informatievaardigheden aan leerlingen.",
        scaleValue: 4,
      },
    ],
  },
  {
    id: 13,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1B. Digitale media en informatie',
    kerndoelId: 'cat1',
    subcategoryId: '1B',
    type: 'self-assessment',
    questionText:
      'In welke mate leer je leerlingen hoe zij efficiënt en doelgericht informatie kunnen zoeken op het internet?',
    topAccentColor: '#00b6ed',
    options: [
      { id: '1', label: 'Niveau 1: Nog niet.', scaleValue: 1 },
      { id: '2', label: 'Niveau 2: Incidenteel bij spreekbeurten of werkstukken.', scaleValue: 2 },
      {
        id: '3',
        label: 'Niveau 3: Doelgericht met specifieke zoekstrategieën en evaluatiemethoden.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: 'Niveau 4: Ik ontwikkel lesmateriaal of een leerlijn over informatievaardigheden voor de school.',
        scaleValue: 4,
      },
    ],
  },
  {
    id: 14,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1C. Data',
    kerndoelId: 'cat1',
    subcategoryId: '1C',
    type: 'knowledge',
    questionText: "Wat is een voorbeeld van 'gestructureerde data'?",
    topAccentColor: '#00b6ed',
    correctOptionId: 'd',
    explanation:
      'Gestructureerde data is data die volgens een vast stramien of datamodel is opgeslagen, zoals rijen en kolommen in een database of spreadsheet met duidelijke velden (naam, datum, bedrag).',
    options: [
      { id: 'a', label: 'Een verzameling van willekeurige spraakopnames.' },
      { id: 'b', label: 'Een videobestand op YouTube.' },
      { id: 'c', label: 'Een handgeschreven brief op papier.' },
      { id: 'd', label: 'Een tabel in een database met namen, datums en bedragen.' },
    ],
  },
  {
    id: 15,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1C. Data',
    kerndoelId: 'cat1',
    subcategoryId: '1C',
    type: 'knowledge',
    questionText: 'Wat doen cookies meestal op een website?',
    topAccentColor: '#00b6ed',
    correctOptionId: 'b',
    explanation:
      'Cookies zijn kleine tekstbestandjes die websites op je apparaat plaatsen om voorkeuren, loginsessie of browsegedrag te onthouden.',
    options: [
      { id: 'a', label: 'Ze maken je internet sneller.' },
      { id: 'b', label: 'Ze slaan gegevens over je bezoek op.' },
      { id: 'c', label: 'Ze verwijderen automatisch virussen.' },
      { id: 'd', label: 'Ze blokkeren alle advertenties.' },
    ],
  },
  {
    id: 16,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1C. Data',
    kerndoelId: 'cat1',
    subcategoryId: '1C',
    type: 'knowledge',
    questionText: 'Wanneer laat je mogelijk online data achter?',
    topAccentColor: '#00b6ed',
    correctOptionId: 'a',
    explanation:
      'Vrijwel elke interactie op het web — inclusief klikken, scrollen, paginaweergaves en dwell time — genereert telemetrie en interactiedata.',
    options: [
      { id: 'a', label: 'Bij klikken op links of knoppen.' },
      { id: 'b', label: 'Alleen bij het maken van een account.' },
      { id: 'c', label: 'Alleen bij het uploaden van bestanden.' },
      { id: 'd', label: 'Nooit als je niets opslaat.' },
    ],
  },
  {
    id: 17,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1C. Data',
    kerndoelId: 'cat1',
    subcategoryId: '1C',
    type: 'self-assessment',
    questionText:
      'In hoeverre zie jij data als iets dat niet alleen online bestaat, maar overal kan voorkomen?',
    topAccentColor: '#00b6ed',
    options: [
      { id: '1', label: 'Niveau 1: Ik vind het begrip data nog onduidelijk.', scaleValue: 1 },
      { id: '2', label: 'Niveau 2: Ik koppel data vooral aan internet en accounts.', scaleValue: 2 },
      {
        id: '3',
        label: 'Niveau 3: Ik herken data ook in papier, gedrag, tellingen en metingen.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: 'Niveau 4: Ik gebruik het woord data bewust bij voorbeelden in de klas.',
        scaleValue: 4,
      },
    ],
  },
  {
    id: 18,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1C. Data',
    kerndoelId: 'cat1',
    subcategoryId: '1C',
    type: 'self-assessment',
    questionText:
      'In hoeverre ben jij je bewust van de online data die jij en leerlingen achterlaten bij het gebruiken van websites, apps en digitale leeromgevingen?',
    topAccentColor: '#00b6ed',
    options: [
      {
        id: '1',
        label: 'Niveau 1: Ik sta hier nog weinig bij stil in mijn eigen gebruik.',
        scaleValue: 1,
      },
      {
        id: '2',
        label: 'Niveau 2: Ik weet dat websites en apps gegevens kunnen verzamelen.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik bespreek met leerlingen welke online data zij achterlaten.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: 'Niveau 4: Ik help collega’s bewuste keuzes maken rond online data.',
        scaleValue: 4,
      },
    ],
  },
  {
    id: 19,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1D. Artificiële Intelligentie (AI)',
    kerndoelId: 'cat1',
    subcategoryId: '1D',
    type: 'knowledge',
    questionText:
      'Wat is de kernfunctie van een Large Language Model (LLM) zoals ChatGPT, Copilot of Gemini?',
    topAccentColor: '#00b6ed',
    correctOptionId: 'c',
    explanation:
      'Een Large Language Model is een statistisch neuraal netwerk dat getraind is op enorme hoeveelheden tekst om het meest waarschijnlijke volgende woord/teken te voorspellen op basis van geleerde patronen.',
    options: [
      { id: 'a', label: 'Live zoeken in een database met garanties.' },
      { id: 'b', label: 'Woorden zoeken in grote data.' },
      { id: 'c', label: 'Waarschijnlijke tekst voorspellen op basis van patronen.' },
      { id: 'd', label: 'Berekeningen altijd foutloos uitvoeren.' },
    ],
  },
  {
    id: 20,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1D. Artificiële Intelligentie (AI)',
    kerndoelId: 'cat1',
    subcategoryId: '1D',
    type: 'knowledge',
    questionText: "Wat betekent de term 'hallucinatie' bij een generatief AI-model?",
    topAccentColor: '#00b6ed',
    correctOptionId: 'd',
    explanation:
      'Een AI-hallucinatie treedt op wanneer het model feitelijk onjuiste, niet-bestaande of verzonnen antwoorden genereert, maar deze presenteert met een hoge mate van overtuiging.',
    options: [
      { id: 'a', label: 'De computer raakt oververhit door een opdracht.' },
      { id: 'b', label: 'De gebruiker interpreteert de gegenereerde tekst verkeerd.' },
      { id: 'c', label: 'Er zit een virus in de gebruikte AI-software.' },
      { id: 'd', label: 'Het model geeft zeker klinkende maar onjuiste informatie.' },
    ],
  },
  {
    id: 21,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1D. Artificiële Intelligentie (AI)',
    kerndoelId: 'cat1',
    subcategoryId: '1D',
    type: 'knowledge',
    questionText: "Wat maakt een 'prompt' (instructie aan een AI) over het algemeen het meest effectief?",
    topAccentColor: '#00b6ed',
    correctOptionId: 'a',
    explanation:
      'Een effectieve prompt biedt een duidelijke rol/context, een afgebakende taak, doelgroep, voorbeelden en de gewenste outputstructuur (lengte, stijl, format).',
    options: [
      { id: 'a', label: 'Duidelijke context, taak en gewenste vorm geven.' },
      { id: 'b', label: 'Zo kort mogelijk, niet te veel informatie geven.' },
      { id: 'c', label: 'Veel hoofdletters en leestekens gebruiken.' },
      { id: 'd', label: 'Steekwoorden achter elkaar voor het beste zoekresultaat.' },
    ],
  },
  {
    id: 22,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1D. Artificiële Intelligentie (AI)',
    kerndoelId: 'cat1',
    subcategoryId: '1D',
    type: 'self-assessment',
    questionText:
      'In welke mate gebruik je generatieve AI-tools (bijv. voor lesvoorbereiding, inspiratie of tekstherziening)?',
    topAccentColor: '#00b6ed',
    options: [
      { id: '1', label: 'Niveau 1: Nog nooit gebruikt of ik weet niet hoe het werkt.', scaleValue: 1 },
      {
        id: '2',
        label: 'Niveau 2: Ik experimenteer er incidenteel mee voor mijn eigen werk.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik zet AI intentioneel in voor lesvoorbereiding en lesmateriaal.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: 'Niveau 4: Ik geef workshops, adviseer of inspireer collega’s over het effectief en ethisch inzetten van AI.',
        scaleValue: 4,
      },
    ],
  },
  {
    id: 23,
    categoryBadge: 'CATEGORIE 1: PRAKTISCHE KENNIS EN VAARDIGHEDEN',
    subcategoryTitle: '1D. Artificiële Intelligentie (AI)',
    kerndoelId: 'cat1',
    subcategoryId: '1D',
    type: 'self-assessment',
    questionText:
      'In welke mate begeleid je leerlingen bij het kritisch en ethisch inzetten van AI-toepassingen?',
    topAccentColor: '#00b6ed',
    options: [
      { id: '1', label: 'Niveau 1: Niet, ik verbied het of neem het niet mee in de les.', scaleValue: 1 },
      {
        id: '2',
        label: "Niveau 2: Ik bespreek incidenteel de risico's (zoals desinformatie of onjuist brongebruik).",
        scaleValue: 2,
      },
      {
        id: '3',
        label:
          'Niveau 3: Ik leer leerlingen actief hoe ze prompts bouwen en AI-output kritisch verifiëren.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: 'Niveau 4: Ik ontwikkel beleid en lesmodules rondom AI voor het onderwijs op mijn school.',
        scaleValue: 4,
      },
    ],
  },

  // ==================== CATEGORIE 2: ONTWERPEN EN MAKEN ====================
  {
    id: 24,
    categoryBadge: 'CATEGORIE 2: ONTWERPEN EN MAKEN',
    subcategoryTitle: 'Categorie Hoofdvraag 2',
    kerndoelId: 'cat2',
    subcategoryId: 'algemeen',
    type: 'self-assessment',
    questionText:
      'Welke plek heeft het digitaal ontwerpen, creëren en programmeren in jouw onderwijspraktijk?',
    topAccentColor: '#38C263',
    options: [
      { id: '1', label: 'Niveau 1: Ik doe nog niets met digitaal ontwerpen of maken.', scaleValue: 1 },
      {
        id: '2',
        label: 'Niveau 2: Ik maak zelf incidenteel digitale producten of lesmaterialen met verschillende tools.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik laat leerlingen digitale producten maken en breng ze basisprincipes van programmeren bij.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: "Niveau 4: Ik begeleid collega's bij het integreren van digitaal maken, programmeren en mediaconstructie.",
        scaleValue: 4,
      },
    ],
  },
  {
    id: 25,
    categoryBadge: 'CATEGORIE 2: ONTWERPEN EN MAKEN',
    subcategoryTitle: '2A. Creëren met digitale technologie',
    kerndoelId: 'cat2',
    subcategoryId: '2A',
    type: 'knowledge',
    questionText:
      'Welk digitaal documenttype is het meest geschikt om te verspreiden als je wilt dat de lay-out en opmaak op elk apparaat exact hetzelfde blijft?',
    topAccentColor: '#38C263',
    correctOptionId: 'c',
    explanation:
      'PDF (Portable Document Format) is ontworpen om typografie, afbeeldingen en lay-out op ieder besturingssysteem en beeldscherm exact gelijk weer te geven.',
    options: [
      { id: 'a', label: '.DOCX' },
      { id: 'b', label: '.TXT' },
      { id: 'c', label: '.PDF' },
      { id: 'd', label: '.HTML' },
    ],
  },
  {
    id: 26,
    categoryBadge: 'CATEGORIE 2: ONTWERPEN EN MAKEN',
    subcategoryTitle: '2A. Creëren met digitale technologie',
    kerndoelId: 'cat2',
    subcategoryId: '2A',
    type: 'knowledge',
    questionText: 'Wat laat zien dat een digitale boodschap goed is afgestemd op de doelgroep?',
    topAccentColor: '#38C263',
    correctOptionId: 'b',
    explanation:
      'Een effectieve digitale uiting stemt toon, visuele vormgeving, taalniveau en voorbeelden doelgericht af op de belevingswereld van de specifieke doelgroep.',
    options: [
      { id: 'a', label: 'De boodschap gebruikt dezelfde stijl als eerdere producten.' },
      { id: 'b', label: 'De toon, vorm en voorbeelden passen bij de ontvanger.' },
      { id: 'c', label: 'De boodschap bevat voldoende technische mogelijkheden.' },
      { id: 'd', label: 'De ontvanger krijgt alle beschikbare informatie tegelijk.' },
    ],
  },
  {
    id: 27,
    categoryBadge: 'CATEGORIE 2: ONTWERPEN EN MAKEN',
    subcategoryTitle: '2A. Creëren met digitale technologie',
    kerndoelId: 'cat2',
    subcategoryId: '2A',
    type: 'knowledge',
    questionText: 'Waarom is een infographic vaak effectiever dan een lange lap tekst om een proces uit te leggen?',
    topAccentColor: '#38C263',
    correctOptionId: 'd',
    explanation:
      'Een infographic combineert visuele hiërarchie, iconen en compacte data om onderlinge relaties, processtappen of kwantitatieve inzichten in één oogopslag inzichtelijk te maken.',
    options: [
      { id: 'a', label: 'Omdat een infographic minder opslagruimte op de computer inneemt.' },
      { id: 'b', label: 'Omdat infographics uitsluitend door vormgevers worden begrepen.' },
      { id: 'c', label: 'Omdat het verplicht is volgens de onderwijsrichtlijnen.' },
      { id: 'd', label: 'Omdat visuele structuren en stappen in één oogopslag inzichtelijk worden.' },
    ],
  },
  {
    id: 28,
    categoryBadge: 'CATEGORIE 2: ONTWERPEN EN MAKEN',
    subcategoryTitle: '2A. Creëren met digitale technologie',
    kerndoelId: 'cat2',
    subcategoryId: '2A',
    type: 'self-assessment',
    questionText:
      "Hoe vaardig voel je je in het zelf maken van creatieve digitale lesmaterialen (zoals video's, infographics, interactieve werkbladen)?",
    topAccentColor: '#38C263',
    options: [
      { id: '1', label: 'Niveau 1: Ik gebruik alleen fysiek of bestaand digitaal materiaal.', scaleValue: 1 },
      { id: '2', label: 'Niveau 2: Ik pas bestaande digitale sjablonen aan voor eigen gebruik.', scaleValue: 2 },
      {
        id: '3',
        label: 'Niveau 3: Ik creëer zelfstandig aantrekkelijk digitaal lesmateriaal met diverse tools (bijv. Canva, Docs, Google Sites).',
        scaleValue: 3,
      },
      {
        id: '4',
        label: "Niveau 4: Ik ondersteun collega's bij het ontwerpen van hoogwaardige digitale content en hoe ze leerlingen hierin begeleiden.",
        scaleValue: 4,
      },
    ],
  },
  {
    id: 29,
    categoryBadge: 'CATEGORIE 2: ONTWERPEN EN MAKEN',
    subcategoryTitle: '2A. Creëren met digitale technologie',
    kerndoelId: 'cat2',
    subcategoryId: '2A',
    type: 'self-assessment',
    questionText:
      "In hoeverre stimuleer en begeleid je leerlingen om zelf digitale media en producten (zoals podcasts, video's of presentaties) te ontwerpen?",
    topAccentColor: '#38C263',
    options: [
      { id: '1', label: 'Niveau 1: Nog niet.', scaleValue: 1 },
      {
        id: '2',
        label: 'Niveau 2: Leerlingen maken bij mij incidenteel een standaard document of presentatie.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Leerlingen maken bij mij uiteenlopende mediaproducten waarbij ontwerpprincipes centraal staan.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: "Niveau 4: Ik organiseer vakoverstijgende maker-projecten, thematische eindproducten of schoolbrede expo's.",
        scaleValue: 4,
      },
    ],
  },
  {
    id: 30,
    categoryBadge: 'CATEGORIE 2: ONTWERPEN EN MAKEN',
    subcategoryTitle: '2B. Programmeren',
    kerndoelId: 'cat2',
    subcategoryId: '2B',
    type: 'knowledge',
    questionText: "Wat is een 'algoritme' in de context van informatica en programmeren?",
    topAccentColor: '#38C263',
    correctOptionId: 'a',
    explanation:
      'Een algoritme is een ondubbelzinnige, stapsgewijze reeks instructies om een specifiek probleem op te lossen of een taak uit te voeren.',
    options: [
      { id: 'a', label: 'Een stappenplan om een probleem op te lossen.' },
      { id: 'b', label: 'Een formule die alleen wetenschappers gebruiken.' },
      { id: 'c', label: 'Een fout in de code van een programma.' },
      { id: 'd', label: 'Een fysiek onderdeel van een computer.' },
    ],
  },
  {
    id: 31,
    categoryBadge: 'CATEGORIE 2: ONTWERPEN EN MAKEN',
    subcategoryTitle: '2B. Programmeren',
    kerndoelId: 'cat2',
    subcategoryId: '2B',
    type: 'knowledge',
    questionText: "Wat is de functie van een 'loop' (herhaling) in een programmeertaal?",
    topAccentColor: '#38C263',
    correctOptionId: 'c',
    explanation:
      'Een loop (zoals for/while) zorgt ervoor dat een instructieblok herhaald wordt uitgevoerd zolang aan een bepaalde conditie voldaan is of voor een vast aantal keren.',
    options: [
      { id: 'a', label: 'Een actie opnieuw uitvoeren wanneer de computer crasht.' },
      { id: 'b', label: 'Het programma direct en definitief afsluiten.' },
      { id: 'c', label: 'Een stuk code meerdere keren laten uitvoeren.' },
      { id: 'd', label: 'Meerdere variabelen aan elkaar knopen.' },
    ],
  },
  {
    id: 32,
    categoryBadge: 'CATEGORIE 2: ONTWERPEN EN MAKEN',
    subcategoryTitle: '2B. Programmeren',
    kerndoelId: 'cat2',
    subcategoryId: '2B',
    type: 'knowledge',
    questionText: 'Wat betekent debuggen bij programmeren?',
    topAccentColor: '#38C263',
    correctOptionId: 'b',
    explanation:
      "Debuggen is het systematisch lokaliseren, analyseren en herstellen van fouten ('bugs') of ongewenst gedrag in softwarecode.",
    options: [
      { id: 'a', label: 'Code mooier opmaken zodat deze beter leesbaar is.' },
      { id: 'b', label: 'Fouten in een programma opsporen en verbeteren.' },
      { id: 'c', label: 'Nieuwe functies toevoegen aan bestaande code.' },
      { id: 'd', label: 'Een programma sneller maken door code te verwijderen.' },
    ],
  },
  {
    id: 33,
    categoryBadge: 'CATEGORIE 2: ONTWERPEN EN MAKEN',
    subcategoryTitle: '2B. Programmeren',
    kerndoelId: 'cat2',
    subcategoryId: '2B',
    type: 'self-assessment',
    questionText:
      'In hoeverre begrijp en beheers je zelf de basisconcepten van programmeren (zoals algoritme, als/dan-voorwaarden en variabelen)?',
    topAccentColor: '#38C263',
    options: [
      { id: '1', label: 'Niveau 1: Ik begrijp of ken deze programmeerconcepten nog niet.', scaleValue: 1 },
      {
        id: '2',
        label: 'Niveau 2: Ik begrijp de theorie globaal, maar kan het zelf nauwelijks toepassen.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik kan een eenvoudig programma bouwen in bijv. Scratch, Micro:bit of Blockly.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: "Niveau 4: Ik beheers programmeerconcepten goed en begeleid collega's bij computational thinking.",
        scaleValue: 4,
      },
    ],
  },
  {
    id: 34,
    categoryBadge: 'CATEGORIE 2: ONTWERPEN EN MAKEN',
    subcategoryTitle: '2B. Programmeren',
    kerndoelId: 'cat2',
    subcategoryId: '2B',
    type: 'self-assessment',
    questionText:
      'In hoeverre zet je programmeer- en robotica-activiteiten (bijv. Scratch, Micro:bit, Bee-Bot, LEGO Spike) in tijdens de les?',
    topAccentColor: '#38C263',
    options: [
      { id: '1', label: 'Niveau 1: Nog niet.', scaleValue: 1 },
      {
        id: '2',
        label: 'Niveau 2: Incidenteel tijdens een speciale themaweek of eenmalige workshop.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Regelmatig verweven in mijn reguliere lesprogramma.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: 'Niveau 4: Ik help de school een doorlopende leerlijn programmeren en robotica op te zetten.',
        scaleValue: 4,
      },
    ],
  },

  // ==================== CATEGORIE 3: DE GEDIGITALISEERDE WERELD ====================
  {
    id: 35,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: 'Categorie Hoofdvraag 3',
    kerndoelId: 'cat3',
    subcategoryId: 'algemeen',
    type: 'self-assessment',
    questionText:
      'Hoe bewust en actief ga jij in jouw onderwijspraktijk om met de impact van de gedigitaliseerde wereld?',
    topAccentColor: '#F0832E',
    options: [
      { id: '1', label: 'Niveau 1: Ik ben hier nog niet actief mee bezig.', scaleValue: 1 },
      {
        id: '2',
        label: 'Niveau 2: Ik neem privacy en online veiligheid in acht voor mijn eigen handelen.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik leer mijn leerlingen over veiligheid, online omgangsvormen en maatschappelijke impact.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: 'Niveau 4: Ik adviseer het schoolteam/bestuur over privacy, ethiek en mediawijsheid op school.',
        scaleValue: 4,
      },
    ],
  },
  {
    id: 36,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3A. Veiligheid en privacy',
    kerndoelId: 'cat3',
    subcategoryId: '3A',
    type: 'knowledge',
    questionText: 'Wat is het belangrijkste voordeel van Twee-Factor-Authenticatie (2FA)?',
    topAccentColor: '#F0832E',
    correctOptionId: 'a',
    explanation:
      '2FA voegt een essentiële tweede verificatielaag toe (zoals een authenticator app code of pushbericht), zodat aanvallers zelfs met een gestolen wachtwoord geen toegang krijgen tot het account.',
    options: [
      { id: 'a', label: 'Inloggen vraagt naast je wachtwoord nog een extra controle.' },
      { id: 'b', label: 'Je internetverbinding wordt hierdoor sneller.' },
      { id: 'c', label: 'Je hoeft nooit meer een wachtwoord te onthouden.' },
      { id: 'd', label: 'Documenten worden automatisch dubbel opgeslagen.' },
    ],
  },
  {
    id: 37,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3A. Veiligheid en privacy',
    kerndoelId: 'cat3',
    subcategoryId: '3A',
    type: 'knowledge',
    questionText: 'Welke gegevens gelden als persoonsgegevens van een leerling?',
    topAccentColor: '#F0832E',
    correctOptionId: 'd',
    explanation:
      'Volgens de AVG/GDPR is alle informatie die direct of indirect herleidbaar is tot een natuurlijk persoon (zoals naam, foto, e-mailadres, BSN of leerlingnummer) een persoonsgegeven.',
    options: [
      { id: 'a', label: 'Gemiddelde schoolstatistieken zonder persoonsvermelding.' },
      { id: 'b', label: 'Vakkenoverzichten en schoolroosters van de locatie.' },
      { id: 'c', label: 'Algemene klassenregels en lesdoelen.' },
      { id: 'd', label: 'Naam, pasfoto, e-mailadres of leerlingnummer.' },
    ],
  },
  {
    id: 38,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3A. Veiligheid en privacy',
    kerndoelId: 'cat3',
    subcategoryId: '3A',
    type: 'knowledge',
    questionText: "Wat is de definitie van 'phishing'?",
    topAccentColor: '#F0832E',
    correctOptionId: 'b',
    explanation:
      'Phishing is een vorm van social engineering waarbij criminelen zich voordoen als betrouwbare instanties (via e-mail, sms of chat) om inloggegevens, privégegevens of geld afhandig te maken.',
    options: [
      { id: 'a', label: 'Het illegaal downloaden van lesbestanden van internet.' },
      { id: 'b', label: 'Via misleidende nepberichten gegevens of geld proberen te ontfutselen.' },
      { id: 'c', label: 'Een server overbelasten met veel aanvragen.' },
      { id: 'd', label: 'Ongevraagd cookies plaatsen op een browser.' },
    ],
  },
  {
    id: 39,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3A. Veiligheid en privacy',
    kerndoelId: 'cat3',
    subcategoryId: '3A',
    type: 'self-assessment',
    questionText:
      'In hoeverre pas je zelf veiligheids- en privacymaatregelen toe (zoals sterke wachtwoorden, 2FA, veilige opslag van leerlinggegevens)?',
    topAccentColor: '#F0832E',
    options: [
      {
        id: '1',
        label: 'Niveau 1: Ik gebruik vaak eenvoudige wachtwoorden en denk weinig na over privacy.',
        scaleValue: 1,
      },
      {
        id: '2',
        label: 'Niveau 2: Ik houd me aan de basisregels en het protocol van de school.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik werk zeer zorgvuldig met data en wijs leerlingen actief op privacy en beveiliging.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: "Niveau 4: Ik controleer en adviseer de organisatie over privacy- en veiligheidsrisico's.",
        scaleValue: 4,
      },
    ],
  },
  {
    id: 40,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3A. Veiligheid en privacy',
    kerndoelId: 'cat3',
    subcategoryId: '3A',
    type: 'self-assessment',
    questionText:
      'In welke mate instrueer je leerlingen over het veilig omgaan met hun online identiteit en persoonsgegevens?',
    topAccentColor: '#F0832E',
    options: [
      { id: '1', label: 'Niveau 1: Nog niet.', scaleValue: 1 },
      {
        id: '2',
        label: 'Niveau 2: Alleen reactief als er aanleiding voor is (bijv. een incident).',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik geef gericht les over wachtwoordbeheer, gegevens delen en privacy.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: "Niveau 4: Ik borg het thema 'privacy en veiligheid' in het curriculum van onze school.",
        scaleValue: 4,
      },
    ],
  },
  {
    id: 41,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3B. Digitale technologie, jezelf en de ander',
    kerndoelId: 'cat3',
    subcategoryId: '3B',
    type: 'knowledge',
    questionText:
      'Welke eigenschap van digitale communicatie maakt cyberpesten vaak complexer en harder dan traditioneel pesten?',
    topAccentColor: '#F0832E',
    correctOptionId: 'c',
    explanation:
      'Online pestberichten kunnen 24/7 doorgaan tot in de veilige thuishaven, kunnen razendsnel door een enorm publiek worden gezien/gedeeld en blijven vaak langdurig digitaal aanwezig.',
    options: [
      { id: 'a', label: 'Cyberpesten gebeurt uitsluitend tijdens schooltijden.' },
      { id: 'b', label: 'Berichten zijn altijd direct door iedereen te wissen.' },
      { id: 'c', label: 'Het kan 24/7 doorgaan en een zeer groot publiek bereiken.' },
      { id: 'd', label: 'Scholen hebben hier geen pedagogische rol in.' },
    ],
  },
  {
    id: 42,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3B. Digitale technologie, jezelf en de ander',
    kerndoelId: 'cat3',
    subcategoryId: '3B',
    type: 'knowledge',
    questionText: "Wat wordt in de tech-wereld bedoeld met 'Persuasive Design' (verleidend ontwerp)?",
    topAccentColor: '#F0832E',
    correctOptionId: 'a',
    explanation:
      'Persuasive design omvat psychologische ontwerptrucs (zoals oneindig scrollen, rode notificatie-badges en variabele beloningen) die ontwikkeld zijn om gebruikers zo lang en frequent mogelijk in de app te houden.',
    options: [
      { id: 'a', label: 'Ontwerptrucs die gebruikers zo lang en vaak mogelijk vasthouden.' },
      { id: 'b', label: 'Grafisch ontwerp dat een website sneller doet laden.' },
      { id: 'c', label: 'Apps toegankelijk maken voor slechtzienden.' },
      { id: 'd', label: 'Lesmateriaal beter te onthouden maken.' },
    ],
  },
  {
    id: 43,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3B. Digitale technologie, jezelf en de ander',
    kerndoelId: 'cat3',
    subcategoryId: '3B',
    type: 'knowledge',
    questionText: "Wat houdt het begrip 'digitale afdruk' (digital footprint) in?",
    topAccentColor: '#F0832E',
    correctOptionId: 'd',
    explanation:
      'Je digitale afdruk is het geheel van alle data, zoekopdrachten, foto’s, reacties en sporen die je bewust en onbewust achterlaat tijdens internet- en appgebruik.',
    options: [
      { id: 'a', label: 'De hoeveelheid stroom die een datacenter verbruikt.' },
      { id: 'b', label: 'De vingerafdruk om een telefoon te ontgrendelen.' },
      { id: 'c', label: 'De totale opslagruimte die een app inneemt.' },
      { id: 'd', label: 'Het geheel aan online sporen en data dat iemand achterlaat.' },
    ],
  },
  {
    id: 44,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3B. Digitale technologie, jezelf en de ander',
    kerndoelId: 'cat3',
    subcategoryId: '3B',
    type: 'self-assessment',
    questionText:
      'Hoe bewust ga je zelf om met je digitale balans, schermtijd en online omgangsvormen?',
    topAccentColor: '#F0832E',
    options: [
      {
        id: '1',
        label: 'Niveau 1: Ik ervaar regelmatig digitale overbelasting en vind grenzen stellen lastig.',
        scaleValue: 1,
      },
      {
        id: '2',
        label: 'Niveau 2: Ik ben me bewust van mijn schermtijd en probeer een goede balans te bewaren.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik bewaak mijn eigen balans goed en bespreek dit als rolmodel met leerlingen.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: "Niveau 4: Ik help leerlingen én collega's bij het creëren van een gezonde digitale leefstijl.",
        scaleValue: 4,
      },
    ],
  },
  {
    id: 45,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3B. Digitale technologie, jezelf en de ander',
    kerndoelId: 'cat3',
    subcategoryId: '3B',
    type: 'self-assessment',
    questionText:
      'In hoeverre bespreek je met leerlingen onderwerpen als cyberpesten, groepsdruk op social media en online welzijn?',
    topAccentColor: '#F0832E',
    options: [
      { id: '1', label: 'Niveau 1: Nog niet.', scaleValue: 1 },
      {
        id: '2',
        label: 'Niveau 2: Incidenteel of reactief als er problemen zijn in de groep of het nieuws.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Proactief en preventief aan de hand van concrete lessuggesties.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: "Niveau 4: Ik coördineer preventieve programma's of sociaal-veiligheidsbeleid rondom media op school.",
        scaleValue: 4,
      },
    ],
  },
  {
    id: 46,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3C. Digitale technologie, samenleving en wereld',
    kerndoelId: 'cat3',
    subcategoryId: '3C',
    type: 'knowledge',
    questionText:
      'Wat is een groot ecologisch probleem dat direct samenhangt met de snelle omloop van digitale apparaten?',
    topAccentColor: '#F0832E',
    correctOptionId: 'c',
    explanation:
      'Elektronisch afval (e-waste) groeit exponentieel en leidt tot milieuvervuiling en uitputting van zeldzame aardmetalen en grondstoffen bij de productie van nieuwe hardware.',
    options: [
      { id: 'a', label: 'Het opraken van papier in het onderwijs.' },
      { id: 'b', label: 'De groei van de ozonlaag door datacentra.' },
      { id: 'c', label: 'Toename van e-waste en schaarste aan zeldzame grondstoffen.' },
      { id: 'd', label: 'Een tekort aan beschikbare wifi-frequenties.' },
    ],
  },
  {
    id: 47,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3C. Digitale technologie, samenleving en wereld',
    kerndoelId: 'cat3',
    subcategoryId: '3C',
    type: 'knowledge',
    questionText: "Wat wordt bedoeld met de 'digitale kloof' (digital divide)?",
    topAccentColor: '#F0832E',
    correctOptionId: 'a',
    explanation:
      'De digitale kloof beschrijft de ongelijkheid tussen groepen mensen met en zonder toegang tot moderne digitale technologieën én de vaardigheden om deze effectief te benutten.',
    options: [
      { id: 'a', label: 'Ongelijkheid in toegang tot én vaardigheid met moderne digitale technologie.' },
      { id: 'b', label: 'Verschil in internetsnelheid tussen verschillende provincies.' },
      { id: 'c', label: 'De technische scheiding tussen hardware en software.' },
      { id: 'd', label: 'Verschil tussen docenten vóór en na de introductie van AI.' },
    ],
  },
  {
    id: 48,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3C. Digitale technologie, samenleving en wereld',
    kerndoelId: 'cat3',
    subcategoryId: '3C',
    type: 'knowledge',
    questionText:
      'Op welke manier kunnen aanbevelingsalgoritmes op sociale media bijdragen aan maatschappelijke polarisatie?',
    topAccentColor: '#F0832E',
    correctOptionId: 'd',
    explanation:
      'Aanbevelingssystemen optimaliseren voor engagement en kijktijd. Emotionerende, sensationele of extreme content levert de meeste interacties op en krijgt daardoor vaker voorrang in de feed.',
    options: [
      { id: 'a', label: 'Iedereen krijgt exact dezelfde neutrale informatie te zien.' },
      { id: 'b', label: 'Nepaccounts worden automatisch verwijderd door het systeem.' },
      { id: 'c', label: 'Berichten van educatieve accounts worden altijd geblokkeerd.' },
      { id: 'd', label: 'Extreme of emotionerende content krijgt vaker voorrang vanwege hoge betrokkenheid.' },
    ],
  },
  {
    id: 49,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3C. Digitale technologie, samenleving en wereld',
    kerndoelId: 'cat3',
    subcategoryId: '3C',
    type: 'self-assessment',
    questionText:
      'Hoe goed ben je op de hoogte van de maatschappelijke, ethische en ecologische impact van technologie op onze wereld?',
    topAccentColor: '#F0832E',
    options: [
      { id: '1', label: 'Niveau 1: Ik verdiep me hier zelden of nooit in.', scaleValue: 1 },
      {
        id: '2',
        label: 'Niveau 2: Ik volg de actualiteit hieromtrent globaal via het nieuws.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik heb hier actuele kennis over en verweef deze maatschappelijke vraagstukken in mijn lessen.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: 'Niveau 4: Ik organiseer gesprekken, themabijeenkomsten of onderwijsvernieuwing over technofilosofie en ethiek.',
        scaleValue: 4,
      },
    ],
  },
  {
    id: 50,
    categoryBadge: 'CATEGORIE 3: DE GEDIGITALISEERDE WERELD',
    subcategoryTitle: '3C. Digitale technologie, samenleving en wereld',
    kerndoelId: 'cat3',
    subcategoryId: '3C',
    type: 'self-assessment',
    questionText:
      'In hoeverre daag je leerlingen uit om kritisch na te denken over de rol van technologie in de maatschappij en hun eigen toekomst?',
    topAccentColor: '#F0832E',
    options: [
      { id: '1', label: 'Niveau 1: Nog niet.', scaleValue: 1 },
      {
        id: '2',
        label: 'Niveau 2: Soms bij het bespreken van een actueel nieuwsbericht.',
        scaleValue: 2,
      },
      {
        id: '3',
        label: 'Niveau 3: Ik zet regelmatig kritische reflectieopdrachten in over de impact van tech op de maatschappij.',
        scaleValue: 3,
      },
      {
        id: '4',
        label: 'Niveau 4: Ik ontwikkel vakoverschrijdende projecten rondom digitaal burgerschap en technologie.',
        scaleValue: 4,
      },
    ],
  },
];
