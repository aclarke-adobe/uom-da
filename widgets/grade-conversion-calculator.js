/*
 * Graduate coursework grade conversion eligibility calculator.
 *
 * Rebuild of the study.unimelb.edu.au Vue tool (conv-tool.js). Data and calculation come live
 * from the University's public PostgREST API; the question flow, wording and result cards follow
 * the source exactly (see migration-work notes in the widget task report).
 */

const API = 'https://postgradcalc.api.study.unimelb.edu.au';
const API_PROFILE = 'api_v2';
const SOURCE_ORIGIN = 'https://study.unimelb.edu.au';
const LIVE_CALCULATOR = `${SOURCE_ORIGIN}/how-to-apply/graduate-coursework-study/grade-conversion-eligibility-calculator`;
const UNIMELB_INSTITUTION_CODE = '3036';
const MAX_OPTIONS = 20;

const LINKS = {
  languageRequirements: `${SOURCE_ORIGIN}/how-to-apply/english-language-requirements/graduate-english-language-requirements`,
  graduateAccessMelbourne: `${SOURCE_ORIGIN}/how-to-apply/special-entry-access-schemes/access-melbourne-graduate`,
  // source link minus its stale Google Analytics session parameters and `undefined` placeholders
  apply: 'https://unimelb-web.t1cloud.com/T1SMDefault/WebApps/eStudent/SM/eApplications/eAppLogin.aspx?r=&f=%23UM.EAP.CI2LOGIN.WEB',
};

/* source copy (messages.en.json) */
const MSG = {
  scoreTitles: {
    wam: {
      'assessed-by-standard': 'What is the overall percentage you achieved in your most recent qualification?',
      'assessed-by-best-fifty-points': 'What is the percentage you achieved in your relevant area of study (for the course you are applying) in your final 2 years?',
      'assessed-by-final-hundred-points': 'What percentage did you achieve in your final year of study in your most recent qualification?',
      'assessed-by-major-area-of-study': 'What is the percentage you achieved in your subjects of your major area of study for the course you are applying?',
    },
    gpa: {
      'assessed-by-standard': 'What is the GPA you achieved in your most recent study?',
      'assessed-by-best-fifty-points': 'What is the GPA you achieved in your relevant area of study (for the course you are applying) in your final 2 years?',
      'assessed-by-final-hundred-points': 'What is the GPA you achieved in your final year of study in your most recent qualification?',
      'assessed-by-major-area-of-study': 'What is the GPA you achieved in your subjects of your major area of study for the course you are applying?',
    },
  },
  titles: {
    previousIntake: 'Previous intake selected score',
    guaranteed: 'Competitive score',
    minimum: 'Minimum score required',
    language: 'English language requirements',
    howCalculated: 'How is this score calculated?',
    thankYou: 'Thank you for your interest',
    gam: 'Graduate Access Melbourne',
    csp: 'Indicative Commonwealth Supported Place (CSP) score',
  },
  tags: {
    eligible: 'Eligible to apply',
    'not-eligible': 'Not eligible to apply',
    'not-eligible-with-pathway': 'Not eligible to apply',
    unlikely: 'Unlikely to be made an offer',
    'unlikely-with-pathway': 'Unlikely to be made an offer',
  },
  details: {
    'assessed-by-best-fifty-points': 'The required score for this course is based on your performance in relevant discipline subjects at third year level (or equivalent).',
    'assessed-by-final-hundred-points': 'The required score for this course is calculated as an average of your final year of study (or equivalent).',
    'assessed-by-major-area-of-study': 'The required score for this course is calculated based on your performance in discipline subjects that form your major.',
    'assessed-by-standard': 'The required score for this course is calculated as an average of all subjects completed in your degree.',
    calcNotAllowed: 'For further information on the course you have selected please refer to the entry requirements.',
    csp: 'Domestic applicants who satisfy course prerequisites and achieve this score will be competitive for a Commonwealth Supported Place offer, subject to timely submission of a complete application. Meeting this requirement does not guarantee selection.',
    noCalcInDepth: [
      'The course you have selected has a range of assessment criteria but does not include a minimum score.',
      'Please refer to the course entry requirements for this program.',
    ],
    noCalcDifferentStandard: [
      'The course you have selected has a range of assessment criteria including weighted marks and grades that cannot be calculated in the conversion calculator.',
      'Please refer to the course entry requirements for this program.',
    ],
    eligible: ['Based on the information you have provided, you may be eligible to apply and gain admission to the course you have selected. Please review ', 'course entry requirements', ' to confirm your eligibility.'],
    'not-eligible': ['Based on the information you have provided you are unlikely to be eligible for admission. We encourage you to review the ', 'course entry requirements', ' to see if there are other entry pathway options.'],
    'not-eligible-with-pathway': ['Based on the information that you have provided, you may not be eligible for admission but we encourage you to explore ', ' as a pathway to this program.'],
    unlikely: 'Based on the information that you have provided, you are unlikely to be made an offer.',
    'unlikely-with-pathway': ['Based on the information that you have provided, your score may be unlikely for an offer for the course you have selected, but we encourage you to explore ', ' as a pathway to this program.'],
    guaranteed: 'Applicants who satisfy course prerequisites and achieve this score will be competitive for an offer subject to timely submission of a complete application. Meeting this requirement does not guarantee selection.',
    gamEligible: 'If you are applying for a graduate degree and have experienced or are experiencing disadvantage, you may be eligible for Graduate Access Melbourne.',
    gamNotEligible: 'If you are applying for a graduate degree and have experienced or are experiencing disadvantage, you may be eligible for Graduate Access Melbourne (GAM) and could gain admission below the published minimum scores based on your GAM application.',
    gamWhat: "Graduate Access Melbourne (GAM) is the University's equity program for domestic graduate students.",
    gamCta: 'Find out more about the program',
    language: 'All courses at the University of Melbourne are subject to English Language Requirements.',
    languageLink: ['Please view the ', 'Graduate English language requirements', ' for further details.'],
    minimum: 'This score is the minimum score required to be considered for this program. Meeting this requirement does not guarantee selection.',
    notInternational: 'Unfortunately the course you have selected is not available to international students.',
    previousIntake: 'This score is the lowest selected score to which offers were made in a previous intake to applicants who satisfied all the course prerequisites (excluding applications through special entry schemes).',
  },
  entryRequirements: 'See full entry requirements',
  apply: 'Apply',
  newTab: '(opens in a new tab)',
  loadingInstitutions: 'Loading institutions',
  loadingResults: 'Loading your results',
  noCourses: 'No courses match your search. Check the spelling or try part of the course name.',
  noInstitutions: 'No institutions match your search. If you cannot find your institution you will not be able to use the calculator.',
  options: (n) => `${n} ${n === 1 ? 'result' : 'results'} available. Use the up and down arrow keys to choose.`,
  errors: {
    courses: 'Sorry, the list of courses could not be loaded.',
    institutions: 'Sorry, institution search is not available right now.',
    results: 'Sorry, we could not calculate your results.',
    retry: 'Try again',
    fallback: ['Please try again later, or use the ', 'grade conversion eligibility calculator on study.unimelb.edu.au', '.'],
  },
};

const ICONS = {
  info: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M7.21 5.6V3.98h1.58V5.6H7.21Zm-3.75 6.94Q5.37 14.42 8 14.42t4.5-1.88Q14.42 10.63 14.42 8T12.5 3.5Q10.63 1.58 8 1.58T3.46 3.5Q1.58 5.37 1.58 8t1.88 4.54ZM2.33 2.37Q4.7 0 8 0t5.63 2.37Q16 4.7 16 8t-2.37 5.67Q11.3 16 8 16t-5.67-2.33Q0 11.3 0 8t2.33-5.63Zm4.88 9.65V7.21h1.58v4.81H7.21Z"/></svg>',
  chevron: '<svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path fill="currentColor" d="M1.92 1.18 5.72 5l-3.8 3.83L3.08 10l5-5-5-5-1.16 1.18z"/></svg>',
};

// BEGIN MIGRATED_COURSES (generated from content/find/courses/graduate)
const MIGRATED_COURSES = new Set([
  'diploma-in-languages-gshss doctor-of-clinical-dentistry doctor-of-dental-surgery',
  'doctor-of-education doctor-of-medicine doctor-of-optometry',
  'doctor-of-philosophy-agricultural-sciences',
  'doctor-of-philosophy-architecture-building-and-planning doctor-of-philosophy-arts',
  'doctor-of-philosophy-education doctor-of-philosophy-engineering-and-it',
  'doctor-of-philosophy-fine-arts-and-music doctor-of-philosophy-indigenous-knowledge',
  'doctor-of-philosophy-law doctor-of-philosophy-medicine-dentistry-and-health-sciences',
  'doctor-of-philosophy-science doctor-of-philosophy-veterinary-science',
  'doctor-of-physiotherapy doctor-of-veterinary-medicine doctoral-program-in-accounting',
  'doctoral-program-in-actuarial-studies',
  'doctoral-program-in-business-administration-and-analytics',
  'doctoral-program-in-decision-risk-and-financial-sciences',
  'doctoral-program-in-economics doctoral-program-in-finance',
  'doctoral-program-in-management doctoral-program-in-marketing',
  'executive-master-of-arts executive-master-of-business-administration',
  'graduate-certificate-in-aboriginal-health-in-rural-communities',
  'graduate-certificate-in-adolescent-health-and-wellbeing',
  'graduate-certificate-in-agricultural-sciences',
  'graduate-certificate-in-applied-business-analytics',
  'graduate-certificate-in-arboriculture',
  'graduate-certificate-in-artificial-intelligence-online graduate-certificate-in-arts',
  'graduate-certificate-in-arts-advanced',
  'graduate-certificate-in-bushfire-planning-and-management',
  'graduate-certificate-in-business graduate-certificate-in-business-administration',
  'graduate-certificate-in-business-administration-online',
  'graduate-certificate-in-cancer-nursing graduate-certificate-in-cancer-sciences',
  'graduate-certificate-in-climate-change-and-health',
  'graduate-certificate-in-clinical-education',
  'graduate-certificate-in-clinical-rehabilitation',
  'graduate-certificate-in-clinical-research',
  'graduate-certificate-in-clinical-ultrasound graduate-certificate-in-counselling',
  'graduate-certificate-in-critical-care-nursing',
  'graduate-certificate-in-critical-care-nursing-emergency',
  'graduate-certificate-in-cyber-security-online',
  'graduate-certificate-in-dental-public-health',
  'graduate-certificate-in-dental-therapy-advanced-clinical-practice',
  'graduate-certificate-in-design-for-health-and-wellbeing',
  'graduate-certificate-in-digital-engineering-infrastructure',
  'graduate-certificate-in-disaster-and-terror-medicine',
  'graduate-certificate-in-domestic-gender-based-violence-research-and-practice',
  'graduate-certificate-in-early-childhood-research',
  'graduate-certificate-in-education-learning-difficulties',
  'graduate-certificate-in-educational-research',
  'graduate-certificate-in-english-for-the-global-workplace',
  'graduate-certificate-in-entrepreneurship graduate-certificate-in-environment',
  'graduate-certificate-in-environmental-design graduate-certificate-in-evaluation',
  'graduate-certificate-in-food-science graduate-certificate-in-garden-design',
  'graduate-certificate-in-genomics-and-health',
  'graduate-certificate-in-green-infrastructure',
  'graduate-certificate-in-health-economics-and-economic-evaluation',
  'graduate-certificate-in-health-leadership',
  'graduate-certificate-in-human-resource-management',
  'graduate-certificate-in-indigenous-business-leadership',
  'graduate-certificate-in-indigenous-research-and-leadership',
  'graduate-certificate-in-infectious-disease-epidemiology',
  'graduate-certificate-in-international-education-ib',
  'graduate-certificate-in-journalism-advanced',
  'graduate-certificate-in-language-and-cultural-literacy',
  'graduate-certificate-in-modern-languages-education',
  'graduate-certificate-in-paediatric-intensive-care-nursing',
  'graduate-certificate-in-paediatric-nursing',
  'graduate-certificate-in-physiotherapy-exercise-and-women-s-health',
  'graduate-certificate-in-physiotherapy-paediatrics',
  'graduate-certificate-in-physiotherapy-pelvic-floor-physiotherapy',
  'graduate-certificate-in-primary-care-nursing graduate-certificate-in-public-health',
  'graduate-certificate-in-public-health-online',
  'graduate-certificate-in-publishing-and-communications-advanced',
  'graduate-certificate-in-science graduate-certificate-in-sexual-health',
  'graduate-certificate-in-small-animal-emergency-and-critical-care',
  'graduate-certificate-in-sports-medicine',
  'graduate-certificate-in-supply-chain-and-operations-management',
  'graduate-certificate-in-surgical-education',
  'graduate-certificate-in-sustainable-business graduate-certificate-in-tesol',
  'graduate-certificate-in-translation graduate-certificate-in-university-teaching',
  'graduate-certificate-in-urban-horticulture graduate-certificate-in-visual-art',
  'graduate-certificate-in-wellbeing-science',
  'graduate-certificate-in-youth-mental-health-online',
  'graduate-diploma-in-actuarial-science',
  'graduate-diploma-in-adolescent-health-and-wellbeing',
  'graduate-diploma-in-agricultural-sciences',
  'graduate-diploma-in-applied-business-analytics graduate-diploma-in-arts',
  'graduate-diploma-in-arts-advanced',
  'graduate-diploma-in-arts-and-cultural-management-advanced',
  'graduate-diploma-in-asian-law graduate-diploma-in-banking-and-finance-law',
  'graduate-diploma-in-biostatistics graduate-diploma-in-built-environments',
  'graduate-diploma-in-built-environments-advanced',
  'graduate-diploma-in-business-administration-online',
  'graduate-diploma-in-clinical-education graduate-diploma-in-clinical-psychology',
  'graduate-diploma-in-clinical-rehabilitation graduate-diploma-in-clinical-research',
  'graduate-diploma-in-clinical-ultrasound graduate-diploma-in-communications-law',
  'graduate-diploma-in-computer-science graduate-diploma-in-construction-law',
  'graduate-diploma-in-corporate-law graduate-diploma-in-counselling',
  'graduate-diploma-in-disaster-and-terror-medicine',
  'graduate-diploma-in-dispute-resolution graduate-diploma-in-early-childhood-teaching',
  'graduate-diploma-in-economics',
  'graduate-diploma-in-employment-and-labour-relations-law',
  'graduate-diploma-in-energy-and-resources-law graduate-diploma-in-environment',
  'graduate-diploma-in-environmental-law graduate-diploma-in-food-science',
  'graduate-diploma-in-foundational-data-science',
  'graduate-diploma-in-genomics-and-health',
  'graduate-diploma-in-global-competition-and-consumer-law',
  'graduate-diploma-in-government-law graduate-diploma-in-health-and-medical-law',
  'graduate-diploma-in-hearing-health-care graduate-diploma-in-human-rights-law',
  'graduate-diploma-in-intellectual-property-law',
  'graduate-diploma-in-international-economic-law graduate-diploma-in-international-law',
  'graduate-diploma-in-international-tax graduate-diploma-in-journalism-advanced',
  'graduate-diploma-in-laws graduate-diploma-in-mental-health-nursing-practice',
  'graduate-diploma-in-music-composition graduate-diploma-in-music-ethnomusicology',
  'graduate-diploma-in-music-musicology graduate-diploma-in-music-practical-music',
  'graduate-diploma-in-music-tailored-program',
  'graduate-diploma-in-perioperative-medicine',
  'graduate-diploma-in-physiotherapy-paediatrics graduate-diploma-in-property-valuation',
  'graduate-diploma-in-psychology graduate-diploma-in-psychology-advanced',
  'graduate-diploma-in-publishing-and-communications-advanced',
  'graduate-diploma-in-science graduate-diploma-in-science-advanced',
  'graduate-diploma-in-sports-medicine graduate-diploma-in-surgical-anatomy',
  'graduate-diploma-in-tax graduate-diploma-in-urban-horticulture',
  'graduate-diploma-in-veterinary-professional-leadership-and-management',
  'graduate-diploma-in-youth-mental-health-online juris-doctor',
  'master-of-actuarial-science master-of-actuarial-science-enhanced',
  'master-of-actuarial-science-extended master-of-adolescent-health-and-wellbeing',
  'master-of-advanced-nursing-practice',
  'master-of-advanced-nursing-practice-master-of-public-health',
  'master-of-advanced-nursing-practice-nurse-practitioner',
  'master-of-advanced-social-work-research master-of-agricultural-sciences',
  'master-of-agricultural-sciences-dual-degree master-of-applied-business-analytics',
  'master-of-applied-econometrics master-of-applied-econometrics-enhanced',
  'master-of-applied-linguistics master-of-applied-positive-psychology',
  'master-of-applied-psychology master-of-architectural-engineering',
  'master-of-architecture master-of-architecture-master-of-construction-management',
  'master-of-architecture-master-of-property',
  'master-of-architecture-master-of-urban-cultural-heritage',
  'master-of-architecture-master-of-urban-design',
  'master-of-architecture-master-of-urban-planning master-of-art-curatorship',
  'master-of-artificial-intelligence-online',
  'master-of-arts-advanced-seminar-shorter-thesis',
  'master-of-arts-and-cultural-management master-of-arts-thesis-only',
  'master-of-banking-and-finance-law master-of-biomedical-engineering',
  'master-of-biomedical-science master-of-biostatistics',
  'master-of-biostatistics-enhanced master-of-biotechnology master-of-business',
  'master-of-business-administration master-of-business-administration-online',
  'master-of-business-administration-part-time master-of-business-analytics',
  'master-of-cancer-sciences master-of-chemical-engineering master-of-civil-engineering',
  'master-of-climate-science master-of-clinical-audiology master-of-clinical-dentistry',
  'master-of-clinical-education master-of-clinical-rehabilitation',
  'master-of-clinical-research master-of-clinical-ultrasound',
  'master-of-commerce-actuarial-science master-of-commercial-law',
  'master-of-computer-science master-of-construction-law',
  'master-of-construction-management',
  'master-of-construction-management-master-of-property master-of-contemporary-art',
  'master-of-contemporary-chinese-studies master-of-counselling',
  'master-of-creative-arts-therapy master-of-creative-writing-publishing-and-editing',
  'master-of-criminology master-of-cultural-materials-conservation',
  'master-of-cyber-security-online master-of-dance master-of-data-science',
  'master-of-design-and-production master-of-development-studies',
  'master-of-digital-infrastructure-engineering master-of-digital-marketing',
  'master-of-economics master-of-ecosystem-management-and-conservation',
  'master-of-education master-of-education-in-evidence-based-teaching',
  'master-of-education-online master-of-education-research',
  'master-of-electrical-engineering master-of-employment-and-labour-relations-law',
  'master-of-energy-and-resources-law master-of-energy-systems',
  'master-of-engineering-management master-of-engineering-structures',
  'master-of-entrepreneurship master-of-entrepreneurship-enhanced master-of-environment',
  'master-of-environmental-engineering master-of-environmental-law',
  'master-of-environmental-science master-of-environmental-systems-engineering',
  'master-of-evaluation master-of-film-and-television master-of-finance',
  'master-of-finance-enhanced master-of-fine-arts',
  'master-of-food-and-packaging-innovation master-of-food-science',
  'master-of-genetic-counselling master-of-genomics-and-health master-of-geography',
  'master-of-geoscience master-of-global-competition-and-consumer-law',
  'master-of-global-media-communication master-of-health-and-medical-law',
  'master-of-human-resource-management master-of-human-rights-law',
  'master-of-indigenous-business-leadership master-of-industrial-engineering',
  'master-of-industrial-research-chemistry master-of-information-systems',
  'master-of-information-technology master-of-instructional-leadership',
  'master-of-intellectual-property-law master-of-international-business',
  'master-of-international-education-international-baccalaureate',
  'master-of-international-journalism master-of-international-relations',
  'master-of-international-tax master-of-journalism master-of-landscape-architecture',
  'master-of-landscape-architecture-master-of-urban-design',
  'master-of-landscape-architecture-master-of-urban-planning',
  'master-of-law-and-development master-of-laws master-of-learning-intervention',
  'master-of-management master-of-management-accounting',
  'master-of-management-accounting-and-finance',
  'master-of-management-entrepreneurship-and-innovation master-of-management-finance',
  'master-of-management-human-resources master-of-management-marketing',
  'master-of-management-supply-chain-management master-of-marketing',
  'master-of-marketing-communications master-of-mechanical-engineering',
  'master-of-mechatronics-engineering master-of-medical-technology-innovation',
  'master-of-medicine master-of-modern-languages-education',
  'master-of-music-opera-performance master-of-music-orchestral-performance',
  'master-of-music-performance-teaching master-of-music-research',
  'master-of-music-therapy master-of-narrative-therapy-and-community-work',
  'master-of-nursing-science master-of-philosophy-agricultural-sciences',
  'master-of-philosophy-architecture-building-and-planning',
  'master-of-philosophy-education master-of-philosophy-engineering-and-it',
  'master-of-philosophy-law master-of-philosophy-mdhs-biomedical-science',
  'master-of-philosophy-mdhs-dental-science master-of-philosophy-mdhs-health-sciences',
  'master-of-philosophy-mdhs-medicine',
  'master-of-philosophy-mdhs-population-and-global-health',
  'master-of-philosophy-mdhs-psychological-sciences master-of-philosophy-science',
  'master-of-philosophy-veterinary-science master-of-physiotherapy-paediatrics',
  'master-of-physiotherapy-pelvic-health master-of-private-law',
  'master-of-professional-psychology master-of-property',
  'master-of-property-master-of-urban-planning master-of-psychiatry-online',
  'master-of-psychology-clinical-neuropsychology',
  'master-of-psychology-clinical-neuropsychology-doctor-of-philosophy',
  'master-of-psychology-clinical-psychology',
  'master-of-psychology-clinical-psychology-doctor-of-philosophy',
  'master-of-psychology-educational-and-developmental',
  'master-of-psychology-educational-and-developmental-doctor-of-philosophy',
  'master-of-public-and-international-law master-of-public-health',
  'master-of-public-health-online master-of-public-policy-and-management',
  'master-of-publishing-and-communications master-of-science-bioinformatics',
  'master-of-science-biosciences master-of-science-chemistry',
  'master-of-science-earth-sciences master-of-science-epidemiology',
  'master-of-science-mathematics-and-statistics master-of-science-physics',
  'master-of-screenwriting master-of-social-policy master-of-social-work',
  'master-of-software-engineering master-of-speech-pathology master-of-sports-medicine',
  'master-of-surgery master-of-tax master-of-teaching-early-childhood',
  'master-of-teaching-early-childhood-and-primary master-of-teaching-primary',
  'master-of-teaching-secondary master-of-tesol master-of-theatre',
  'master-of-translation-and-interpreting master-of-urban-and-cultural-heritage',
  'master-of-urban-design master-of-urban-horticulture master-of-urban-planning',
  'master-of-urban-planning-master-of-urban-design master-of-veterinary-studies',
  'master-of-youth-mental-health-online',
  'professional-certificate-in-business-administration',
  'professional-certificate-in-education-clil',
  'professional-certificate-in-educational-neuroscience',
  'professional-certificate-in-evidence-based-teaching',
  'professional-certificate-in-indigenous-research',
  'professional-certificate-in-instructional-leadership',
  'professional-certificate-in-language-and-cultural-literacy',
  'professional-certificate-in-leadership',
  'professional-certificate-in-positive-education',
  'professional-certificate-in-translation professional-certificate-in-treaty',
  'professional-certificate-in-wellbeing-coaching',
  'professional-certificate-in-wellbeing-leadership',
  'professional-certificate-in-wellbeing-science',
  'senior-executive-master-of-business-administration single-subject-study-in-law',
  'specialist-certificate-in-cancer-nursing specialist-certificate-in-cancer-sciences',
  'specialist-certificate-in-clinical-leadership',
  'specialist-certificate-in-clinical-rehabilitation',
  'specialist-certificate-in-clinical-ultrasound',
  'specialist-certificate-in-clinical-ultrasound-practical',
  'specialist-certificate-in-criminology-forensic-disability',
  'specialist-certificate-in-critical-care-nursing',
  'specialist-certificate-in-design-for-health-and-wellbeing',
  'specialist-certificate-in-disaster-and-terror-medicine',
  'specialist-certificate-in-disaster-health-management',
  'specialist-certificate-in-empowering-health-in-aboriginal-communities',
  'specialist-certificate-in-global-competition-law',
  'specialist-certificate-in-implementation-science',
  'specialist-certificate-in-inclusive-music-teaching',
  'specialist-certificate-in-law-digital-law-and-technological-innovation',
  'specialist-certificate-in-legal-leadership',
  'specialist-certificate-in-paediatric-critical-care-nursing',
  'specialist-certificate-in-paediatric-nursing specialist-certificate-in-public-health',
  'specialist-certificate-in-registered-nurse-prescribing specialist-certificate-in-tax',
].join(' ').split(' '));
const NO_ENTRY_REQUIREMENTS = new Set(['graduate-certificate-in-climate-change-and-health', 'graduate-certificate-in-critical-care-nursing-emergency']);
// END MIGRATED_COURSES

/* ---------- helpers ---------- */

const slugify = (name) => String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const normalise = (text) => String(text || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const camelCase = (key) => key.replace(/_([a-z])/g, (m, c) => c.toUpperCase());

function camelKeys(row) {
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [camelCase(k), v]));
}

/**
 * Link to a graduate course page (or its entry requirements). Same-site when the page has been
 * migrated under /find/courses/graduate/, otherwise the absolute study.unimelb.edu.au URL.
 */
function courseHref(name, entryRequirements = false) {
  const slug = slugify(name);
  const local = MIGRATED_COURSES.has(slug)
    && !(entryRequirements && NO_ENTRY_REQUIREMENTS.has(slug));
  if (local) return `/find/courses/graduate/${slug}${entryRequirements ? '/entry-requirements' : ''}`;
  return `${SOURCE_ORIGIN}/find/courses/graduate/${slug}${entryRequirements ? '/entry-requirements/' : ''}`;
}

/**
 * Tiny element builder.
 * @param {string} tag tag name with optional classes (`p.gcc-x.gcc-y`)
 * @param {object} [attrs] attributes; `text` sets textContent, `html` sets innerHTML
 * @param {...(Node|string)} children
 */
function h(tag, attrs = {}, ...children) {
  const [name, ...classes] = tag.split('.');
  const el = document.createElement(name);
  if (classes.length) el.className = classes.join(' ');
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === null || v === undefined || v === false) return;
    if (k === 'text') el.textContent = v;
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  });
  children.flat().forEach((c) => {
    if (c !== null && c !== undefined && c !== false) el.append(c);
  });
  return el;
}

function newTabLink(href, text, className) {
  return h(`a${className ? `.${className}` : ''}`, { href, target: '_blank', rel: 'noopener' }, text, h('span.gcc-sr-only', { text: ` ${MSG.newTab}` }));
}

function debounce(fn, wait) {
  let timer;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- API ---------- */

async function apiGet(path, signal) {
  const resp = await fetch(`${API}${path}`, { headers: { 'Accept-Profile': API_PROFILE }, signal });
  if (!resp.ok) throw new Error(`${path}: HTTP ${resp.status}`);
  return resp.json();
}

async function apiCalculate(body) {
  const resp = await fetch(`${API}/rpc/postgrad_calc`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'params=single-object',
      'Content-Profile': API_PROFILE,
    },
    body,
  });
  if (!resp.ok) throw new Error(`postgrad_calc: HTTP ${resp.status}`);
  const json = await resp.json();
  if (!json || typeof json !== 'object' || !('message' in json)) throw new Error('postgrad_calc: unexpected response');
  return json;
}

/* ---------- search ---------- */

/** Levenshtein distance, capped (returns max + 1 once exceeded). */
function editDistance(a, b, max = 1) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, row[j]);
    }
    if (rowMin > max) return max + 1;
    prev = row;
  }
  return prev[b.length];
}

/** true when token is (within one typo of) the start of a word */
function fuzzyPrefix(token, words) {
  if (token.length < 4) return false;
  return words.some((w) => [-1, 0, 1].some((d) => {
    const len = token.length + d;
    return len > 0 && len <= w.length && editDistance(token, w.slice(0, len)) <= 1;
  }));
}

/**
 * Course name search: every query word must match the start of a word in the name (or appear
 * inside it); falls back to one-typo matching when nothing matches exactly.
 */
function searchCourses(courses, query) {
  const q = normalise(query);
  if (q.length < 2) return [];
  const tokens = q.split(' ');
  const rank = (fuzzy) => {
    const hits = [];
    courses.forEach((course) => {
      const { norm, words } = course.search;
      let score = 0;
      const ok = tokens.every((t) => {
        if (words.some((w) => w.startsWith(t))) return true;
        if (norm.includes(t)) { score += 1; return true; }
        if (fuzzy && fuzzyPrefix(t, words)) { score += 2; return true; }
        return false;
      });
      if (!ok) return;
      if (norm.startsWith(q)) score -= 2;
      else if (norm.includes(q)) score -= 1;
      hits.push({ course, score });
    });
    return hits;
  };
  let hits = rank(false);
  if (!hits.length) hits = rank(true);
  return hits
    .sort((a, b) => a.score - b.score
      || a.course.name.length - b.course.name.length
      || a.course.name.localeCompare(b.course.name))
    .slice(0, MAX_OPTIONS)
    .map((hit) => hit.course);
}

const institutionCache = new Map();

/** PostgREST filter value: keep letters, digits, apostrophes, hyphens and ampersands */
function institutionTokens(query) {
  return query
    .normalize('NFC')
    .split(/[^\p{L}\p{N}'&-]+/u)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 6);
}

/**
 * Server-side institution search (instead of downloading all 27,000 rows / 5.5 MB): every word must
 * match name or alias (first query), or name, alias or country (second query, used to fill up).
 */
async function searchInstitutions(query, signal) {
  const tokens = institutionTokens(query);
  if (!tokens.length) return [];
  const key = tokens.join(' ').toLowerCase();
  if (institutionCache.has(key)) return institutionCache.get(key);

  const build = (columns, limit) => {
    const params = new URLSearchParams();
    params.set('institution_code', `neq.${UNIMELB_INSTITUTION_CODE}`);
    params.set('and', `(${tokens.map((t) => `or(${columns.map((c) => `${c}.ilike.*${t}*`).join(',')})`).join(',')})`);
    params.set('select', 'institution_code,institution_alias,name,country,gpa_defaults');
    params.set('order', 'name.asc');
    params.set('limit', limit);
    return `/v_institution?${params}`;
  };
  const [named, anywhere] = await Promise.all([
    apiGet(build(['name', 'institution_alias'], 200), signal),
    apiGet(build(['name', 'institution_alias', 'country'], 60), signal),
  ]);

  const q = normalise(query);
  const [first] = q.split(' ');
  const scoreOf = (inst) => {
    const name = normalise(inst.name);
    const alias = normalise(inst.institution_alias);
    const words = name.split(' ');
    const wholeWord = words.includes(first) ? 0 : 0.5;
    if (name.startsWith(q)) return wholeWord;
    if (words.some((w) => w.startsWith(first)) && name.includes(q)) return 1 + wholeWord;
    if (name.includes(q)) return 2;
    if (alias.includes(q)) return 3;
    return 4;
  };
  const seen = new Set();
  const ranked = [...named, ...anywhere]
    .filter((row) => !seen.has(row.institution_code) && seen.add(row.institution_code))
    .map((row, i) => ({ row, i, score: scoreOf(row) }))
    .sort((a, b) => a.score - b.score
      || (a.score < 3 ? a.row.name.length - b.row.name.length : 0)
      || a.i - b.i)
    .slice(0, MAX_OPTIONS)
    .map(({ row }) => camelKeys(row));
  institutionCache.set(key, ranked);
  return ranked;
}

/* ---------- combobox (ARIA 1.2 editable combobox with list autocomplete) ---------- */

function createCombobox({
  root, search, optionLabel, displayValue, isSelected, onSelect, minLength, wait, emptyMessage,
  loadingMessage,
}) {
  const input = root.querySelector('[role="combobox"]');
  const list = root.querySelector('[role="listbox"]');
  const status = root.querySelector('.gcc-combobox-status');
  let items = [];
  let active = -1;
  let controller;
  let requestId = 0;
  let pending = false;
  let selectWhenReady = false;

  // option counts are for screen readers; empty and loading states are shown to everyone
  const setStatus = (text) => {
    status.textContent = text;
    status.classList.toggle('is-visible', !!text && (text === emptyMessage || text === loadingMessage));
  };

  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  };

  const setActive = (index) => {
    active = index;
    [...list.children].forEach((li, i) => {
      li.setAttribute('aria-selected', i === index ? 'true' : 'false');
      li.classList.toggle('is-active', i === index);
    });
    const li = list.children[index];
    if (li) {
      input.setAttribute('aria-activedescendant', li.id);
      li.scrollIntoView({ block: 'nearest' });
    } else input.removeAttribute('aria-activedescendant');
  };

  const open = () => {
    if (!items.length) return;
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    setActive(active < 0 ? 0 : active);
  };

  const render = () => {
    list.replaceChildren(...items.map((item, i) => h('li', {
      id: `${list.id}-${i}`,
      role: 'option',
      'aria-selected': 'false',
      class: `gcc-option-item${isSelected(item) ? ' is-selected' : ''}`,
    }, optionLabel(item))));
    active = items.length ? 0 : -1;
  };

  const select = (index) => {
    const item = items[index];
    if (!item) return;
    onSelect(item);
    input.value = displayValue(item);
    setStatus('');
    close();
  };

  const run = debounce(async (query) => {
    requestId += 1;
    const id = requestId;
    if (controller) controller.abort();
    if (query.trim().length < minLength) {
      pending = false;
      selectWhenReady = false;
      items = [];
      setStatus('');
      render();
      close();
      return;
    }
    controller = new AbortController();
    if (loadingMessage) {
      root.classList.add('is-loading');
      setStatus(loadingMessage);
    }
    try {
      const found = await search(query, controller.signal);
      if (id !== requestId) return;
      pending = false;
      items = found;
      render();
      if (selectWhenReady && items.length) {
        selectWhenReady = false;
        select(0);
        return;
      }
      selectWhenReady = false;
      setStatus(items.length ? MSG.options(items.length) : emptyMessage);
      if (items.length && document.activeElement === input) open();
      else close();
    } catch (error) {
      if (error.name === 'AbortError' || id !== requestId) return;
      pending = false;
      selectWhenReady = false;
      items = [];
      render();
      close();
      setStatus('');
    } finally {
      if (id === requestId) root.classList.remove('is-loading');
    }
  }, wait);

  input.addEventListener('input', () => {
    pending = true;
    selectWhenReady = false;
    run(input.value);
  });

  input.addEventListener('keydown', (e) => {
    const isOpen = !list.hidden;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) open();
        else setActive(Math.min(active + 1, items.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) open();
        else setActive(Math.max(active - 1, 0));
        break;
      case 'Enter':
        // Enter while results for the latest keystrokes are pending picks the first fresh match
        if (pending) {
          e.preventDefault();
          selectWhenReady = true;
        } else if (isOpen && active >= 0) {
          e.preventDefault();
          select(active);
        }
        break;
      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          close();
        }
        break;
      case 'Tab':
        close();
        break;
      default:
    }
  });

  // keep focus in the input while choosing with the pointer
  list.addEventListener('mousedown', (e) => e.preventDefault());
  list.addEventListener('click', (e) => {
    const li = e.target.closest('[role="option"]');
    if (li) select([...list.children].indexOf(li));
  });
  list.addEventListener('mousemove', (e) => {
    const li = e.target.closest('[role="option"]');
    const index = li ? [...list.children].indexOf(li) : -1;
    if (index >= 0 && index !== active) setActive(index);
  });

  input.addEventListener('blur', () => {
    close();
    run.cancel();
    pending = false;
    selectWhenReady = false;
    setStatus('');
    // like the source (Headless UI), an unfinished search reverts to the current selection
    input.value = displayValue(null);
  });

  return {
    input,
    reset() {
      run.cancel();
      pending = false;
      selectWhenReady = false;
      if (controller) controller.abort();
      items = [];
      render();
      close();
      setStatus('');
      input.value = '';
    },
  };
}

/* ---------- widget ---------- */

const initialState = () => ({
  selectedCourse: null,
  isUnimelbStudent: null,
  isSponsored: null,
  selectedStatus: null,
  previousInstitution: null,
  selectedGradingType: null,
  weightedAverageMark: null,
  gradePointAverage: null,
  institutionMaxGpa: null,
  institutionGpaPassMark: null,
  gpaPassMarkFromDefaults: false,
  institutionWamPassMark: null,
  calculateResults: false,
});

/**
 * @param {Element} widget the widget block element
 */
export default async function decorate(widget) {
  const root = widget.querySelector('.gcc');
  if (!root) return;

  const $ = (sel) => root.querySelector(sel);
  const $$ = (sel) => [...root.querySelectorAll(sel)];
  const cards = Object.fromEntries($$('[data-card]').map((el) => [el.dataset.card, el]));
  const notice = $('.gcc-notice');
  const resultsSection = $('.gcc-results');
  const resultsPanel = $('.gcc-results-panel');
  const resultsHeading = $('.gcc-results-heading');
  const resultsStatus = $('.gcc-results-status');
  const resultsAction = $('.gcc-results-action');
  const resultsButton = $('.gcc-results-button');
  const dialog = $('.gcc-info');

  let state = initialState();
  let courses = [];
  let coursesStatus = 'loading';
  let results = null;
  let resultsKey = null;
  let requestedKey = null;
  let resultsFailed = false;
  let resultsSeq = 0;
  let userAction = false;

  $$('.gcc-info-btn').forEach((btn) => { btn.innerHTML = ICONS.info; });

  /* ----- derived state (mirrors the source Pinia getters) ----- */

  const showComponents = () => {
    const { selectedCourse: course, selectedStatus: status } = state;
    if (course && status) {
      if (status === 'international' && !course.internationalAvailable) return false;
      if (course.calcAllowed) return true;
    }
    return false;
  };

  const gpaDefault = () => {
    const defaults = state.previousInstitution?.gpaDefaults;
    return Array.isArray(defaults)
      ? defaults.find((d) => d.maxGpa === state.institutionMaxGpa)
      : undefined;
  };

  const passMarkForSelectedGrade = () => {
    if (state.selectedGradingType === 'wam') return state.institutionWamPassMark;
    if (state.selectedGradingType === 'gpa') return state.institutionGpaPassMark;
    return null;
  };

  const showQualificationForm = () => !!state.selectedGradingType && !!passMarkForSelectedGrade();

  const resultsReady = () => {
    const s = state;
    if ((s.selectedStatus && !showComponents()) || (s.isUnimelbStudent && s.weightedAverageMark)) {
      return true;
    }
    const base = s.selectedCourse && s.selectedStatus && s.selectedGradingType
      && s.previousInstitution;
    if (s.selectedGradingType === 'wam') {
      return !!base && !!(s.weightedAverageMark && s.institutionWamPassMark);
    }
    if (s.selectedGradingType === 'gpa') {
      return !!base && !!(s.gradePointAverage && s.institutionGpaPassMark);
    }
    return false;
  };

  const displayResults = () => (showComponents()
    ? resultsReady() && state.calculateResults
    : resultsReady());

  const assessmentType = () => {
    const c = state.selectedCourse;
    if (c?.bestFiftyPoints) return 'assessed-by-best-fifty-points';
    if (c?.finalHundredPoints) return 'assessed-by-final-hundred-points';
    if (c?.majorAreaOfStudy) return 'assessed-by-major-area-of-study';
    return 'assessed-by-standard';
  };

  /** the exact request body the source sends (same keys, order and fallbacks) */
  const requestBody = () => {
    const s = state;
    const gpaPass = s.institutionGpaPassMark || 0;
    const maxGpa = s.institutionMaxGpa || 0;
    return JSON.stringify({
      course_code: s.selectedCourse?.courseCode,
      is_unimelb_student: s.isUnimelbStudent,
      is_sponsored: s.isSponsored,
      student_type: s.selectedStatus,
      grading_type: s.isUnimelbStudent ? 'wam' : s.selectedGradingType,
      institution_code: s.isUnimelbStudent
        ? UNIMELB_INSTITUTION_CODE : s.previousInstitution?.institutionCode,
      weighted_average_mark: s.weightedAverageMark,
      institution_wam_pass_mark: s.isUnimelbStudent ? 50 : s.institutionWamPassMark,
      institution_gpa_pass_mark: maxGpa === 0 ? 0 : (gpaPass / maxGpa) * 100,
      institution_max_gpa: s.institutionMaxGpa,
      grade_point_average: s.gradePointAverage,
    });
  };

  /* ----- notice (one at a time, placed next to what failed) ----- */

  let retryAction = null;
  const showNotice = (message, host, retry) => {
    retryAction = retry || null;
    notice.replaceChildren(
      h('p', {}, h('strong', { text: message }), ' ', MSG.errors.fallback[0], h('a', { href: LIVE_CALCULATOR, text: MSG.errors.fallback[1] }), MSG.errors.fallback[2]),
      retry ? h('button.gcc-notice-retry', { type: 'button', text: MSG.errors.retry }) : '',
    );
    if (notice.parentElement !== host) {
      host.insertBefore(notice, host.querySelector(':scope > .gcc-loader, :scope > .gcc-combobox, :scope > .gcc-results-panel'));
    }
    notice.hidden = false;
  };
  const clearNotice = () => {
    notice.hidden = true;
    notice.replaceChildren();
    retryAction = null;
  };
  notice.addEventListener('click', (e) => {
    if (e.target.closest('.gcc-notice-retry') && retryAction) retryAction();
  });

  /* ----- results ----- */

  const formatScore = (score, gradingType) => (gradingType === 'wam'
    ? `${Number(score).toFixed(1)}%`
    : String(score));

  const infoButton = (title, infoId, large) => {
    const btn = h(`button.gcc-info-btn${large ? '.is-large' : ''}`, {
      type: 'button', 'data-info': infoId, 'aria-label': `Information for ${title}`,
    });
    btn.innerHTML = ICONS.info;
    return btn;
  };

  const resultCard = ({
    title, score, gradingType, eligible, neutral, tag, details, more, infoId,
  }) => {
    const tone = (() => {
      if (neutral) return 'neutral';
      return eligible ? 'eligible' : 'not-eligible';
    })();
    return h(
      `div.gcc-result-card.is-${tone}`,
      {},
      title ? h('h3.gcc-result-title', { text: title }) : '',
      infoId ? infoButton(title, infoId, true) : '',
      score ? h('p.gcc-result-score', { text: formatScore(score, gradingType) }) : '',
      tag ? h(`p.gcc-result-tag.is-${tone}`, { text: tag }) : '',
      (details || more) ? h('div.gcc-result-details', {}, details ? h('p', { text: details }) : '', more || '') : '',
    );
  };

  const statusDetails = (r) => {
    const { message } = r;
    const copy = MSG.details[message];
    if (message === 'not-eligible-with-pathway' || message === 'unlikely-with-pathway') {
      return h('p', {}, copy[0], newTabLink(courseHref(r.pathwayCourseName), r.pathwayCourseName || ''), copy[1]);
    }
    if (message === 'eligible' || message === 'not-eligible') {
      return h('p', {}, copy[0], newTabLink(courseHref(state.selectedCourse.name, true), copy[1]), copy[2]);
    }
    return typeof copy === 'string' ? h('p', { text: copy }) : '';
  };

  const scoreCards = (r) => {
    const s = r.scores || {};
    const { message = '' } = r;
    const unlikely = message.includes('unlikely');
    const out = [];
    const isUom = !!state.isUnimelbStudent;
    const wamBlock = isUom || state.selectedGradingType === 'wam';
    const gpaBlock = !isUom && state.selectedGradingType === 'gpa';
    const kind = wamBlock ? 'wam' : 'gpa';
    if (!wamBlock && !gpaBlock) return out;

    out.push(resultCard({
      eligible: r.eligible, tag: MSG.tags[message], more: statusDetails(r),
    }));
    const min = s[`${kind}MinimumScore`];
    const csp = s[`${kind}Csp`];
    const prev = s[`${kind}PreviousIntake`];
    const guaranteed = s[`${kind}Guaranteed`];
    if (min && !unlikely) {
      out.push(resultCard({
        title: MSG.titles.minimum,
        score: min,
        gradingType: wamBlock ? r.gradingType : 'gpa',
        eligible: r.eligible,
        details: MSG.details.minimum,
        infoId: 'university-of-melbourne-score-equivalence',
      }));
    }
    if (csp && !unlikely && !message.includes('not-eligible')) {
      out.push(resultCard({
        title: MSG.titles.csp,
        score: csp,
        gradingType: wamBlock ? r.gradingType : 'gpa',
        eligible: r.eligible,
        details: MSG.details.csp,
        infoId: 'university-of-melbourne-score-csp',
      }));
    }
    if (((wamBlock ? !isUom : true) && r.eligible && prev) || unlikely) {
      out.push(resultCard({
        title: MSG.titles.previousIntake,
        score: prev,
        gradingType: r.gradingType,
        eligible: r.eligible,
        details: MSG.details.previousIntake,
      }));
    }
    if ((wamBlock ? !isUom : true) && r.eligible && guaranteed) {
      out.push(resultCard({
        title: MSG.titles.guaranteed,
        score: guaranteed,
        gradingType: r.gradingType,
        eligible: r.eligible,
        details: MSG.details.guaranteed,
      }));
    }
    const anyScore = ['MinimumScore', 'PreviousIntake', 'Guaranteed']
      .some((k) => s[`wam${k}`] || s[`gpa${k}`]);
    if (anyScore) {
      out.push(resultCard({
        title: MSG.titles.howCalculated,
        eligible: r.eligible,
        details: MSG.details[assessmentType()],
        infoId: assessmentType(),
      }));
    }
    if (!isUom && r.eligible) {
      const [a, link, b] = MSG.details.languageLink;
      out.push(resultCard({
        title: MSG.titles.language,
        eligible: r.eligible,
        details: MSG.details.language,
        more: h('p', {}, a, newTabLink(LINKS.languageRequirements, link), b),
      }));
    }
    if (!isUom && state.selectedStatus === 'domestic' && state.selectedCourse?.gamAvailable) {
      out.push(resultCard({
        title: MSG.titles.gam,
        eligible: r.eligible,
        more: [
          h('p', { text: r.eligible ? MSG.details.gamEligible : MSG.details.gamNotEligible }),
          h('p', { text: MSG.details.gamWhat }),
          h('p', {}, newTabLink(LINKS.graduateAccessMelbourne, MSG.details.gamCta)),
        ],
      }));
    }
    return out;
  };

  const neutralCards = () => {
    const course = state.selectedCourse;
    const base = { title: MSG.titles.thankYou, neutral: true };
    if (state.selectedStatus === 'international' && !course.internationalAvailable) {
      return [resultCard({ ...base, details: MSG.details.notInternational })];
    }
    if (course.noCalcIndepth) {
      return [resultCard({ ...base, more: MSG.details.noCalcInDepth.map((t) => h('p', { text: t })) })];
    }
    if (course.noCalcDifferentStandard) {
      return [resultCard({ ...base, more: MSG.details.noCalcDifferentStandard.map((t) => h('p', { text: t })) })];
    }
    if (!course.calcAllowed) return [resultCard({ ...base, details: MSG.details.calcNotAllowed })];
    return [];
  };

  const entryRequirementsLink = () => {
    const link = newTabLink(courseHref(state.selectedCourse.name, true), MSG.entryRequirements, 'gcc-link-section');
    link.insertAdjacentHTML('beforeend', ICONS.chevron);
    return link;
  };

  let lastAnnouncement = '';
  const announce = (text) => {
    if (text === lastAnnouncement) return;
    lastAnnouncement = text;
    resultsStatus.textContent = text;
  };

  const renderResults = () => {
    if (!displayResults()) {
      resultsSection.hidden = true;
      announce('');
      return;
    }
    resultsSection.hidden = false;
    if (!showComponents()) {
      resultsPanel.classList.remove('is-busy');
      resultsPanel.replaceChildren(...neutralCards(), entryRequirementsLink());
      announce(`${MSG.titles.thankYou}. ${resultsPanel.querySelector('.gcc-result-details')?.textContent || ''}`);
      return;
    }
    const current = resultsKey === requestedKey && results;
    resultsPanel.classList.toggle('is-busy', resultsKey !== requestedKey && !resultsFailed);
    resultsPanel.setAttribute('aria-busy', resultsKey !== requestedKey && !resultsFailed ? 'true' : 'false');
    if (current) {
      const children = [...scoreCards(results), entryRequirementsLink()];
      if (results.eligible) {
        children.push(h('div.gcc-cta-section', {}, newTabLink(LINKS.apply, MSG.apply, 'button primary gcc-apply')));
      }
      resultsPanel.replaceChildren(...children);
      announce(`${MSG.tags[results.message] || ''}. ${[...resultsPanel.querySelectorAll('.gcc-result-title, .gcc-result-score')].map((el) => el.textContent).join(' ')}`);
    } else if (resultsFailed) {
      resultsPanel.replaceChildren();
    } else if (!resultsPanel.children.length || !results) {
      resultsPanel.replaceChildren(h('p.gcc-loader.gcc-results-loader', {}, h('span.gcc-spinner', { 'aria-hidden': 'true' }), MSG.loadingResults));
    }
  };

  const fetchResults = async (key) => {
    resultsSeq += 1;
    const seq = resultsSeq;
    resultsFailed = false;
    renderResults();
    try {
      const json = await apiCalculate(key);
      if (seq !== resultsSeq) return;
      results = json;
      resultsKey = key;
      if (notice.parentElement === resultsSection) clearNotice();
    } catch (error) {
      if (seq !== resultsSeq) return;
      // eslint-disable-next-line no-console
      console.warn('grade conversion calculator: calculation failed', error);
      results = null;
      resultsKey = null;
      resultsFailed = true;
      showNotice(MSG.errors.results, resultsSection, () => fetchResults(key));
    }
    renderResults();
  };

  /* ----- form rendering ----- */

  const syncInputs = (card) => {
    card.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.checked = String(state[radio.dataset.field]) === radio.value;
    });
    card.querySelectorAll('[data-number]').forEach((input) => {
      const value = state[input.dataset.number];
      input.value = value === null || value === undefined ? '' : String(value);
      input.dataset.prev = input.value;
    });
  };

  const scrollToFormBottom = () => {
    const bottom = $('.gcc-cards');
    setTimeout(() => {
      if (bottom.getBoundingClientRect().bottom > window.innerHeight) {
        bottom.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'end' });
      }
    }, 400);
  };

  const update = () => {
    const s = state;
    const components = showComponents();
    const notUom = !s.isUnimelbStudent;
    const intl = s.selectedStatus === 'international';
    const visible = {
      course: true,
      unimelb: !!s.selectedCourse,
      status: !!s.selectedCourse && s.isUnimelbStudent !== null,
      'unimelb-score': !!s.isUnimelbStudent && s.selectedStatus !== null,
      sponsorship: components && notUom && intl,
      institution: components && ((notUom && intl && s.isSponsored !== null)
        || (s.selectedStatus === 'domestic' && notUom)),
      grading: components && notUom && s.previousInstitution !== null,
      'wam-pass': components && notUom && s.selectedGradingType === 'wam',
      'gpa-max': components && notUom && s.selectedGradingType === 'gpa',
      'gpa-pass': components && notUom && s.selectedGradingType === 'gpa' && !!s.institutionMaxGpa && !gpaDefault(),
      'wam-score': components && notUom && showQualificationForm() && s.selectedGradingType === 'wam',
      'gpa-score': components && notUom && showQualificationForm() && s.selectedGradingType === 'gpa',
    };

    let revealed = false;
    Object.entries(cards).forEach(([name, card]) => {
      const show = visible[name];
      if (show && card.hidden) {
        syncInputs(card);
        if (name !== 'course') revealed = true;
      }
      card.hidden = !show;
    });

    // score question wording and help section follow the course's assessment type
    const type = assessmentType();
    $$('[data-score-title]').forEach((label) => {
      label.textContent = MSG.scoreTitles[label.dataset.scoreTitle][type];
      const btn = label.closest('.gcc-card').querySelector('[data-info-assessment]');
      btn.dataset.info = type;
      btn.setAttribute('aria-label', `Information for ${label.textContent}`);
    });

    const showButton = components && resultsReady();
    if (showButton && resultsAction.hidden) revealed = true;
    resultsAction.hidden = !showButton;

    if (revealed && userAction) scrollToFormBottom();
    userAction = false;

    if (displayResults() && components) {
      const key = requestBody();
      if (key !== requestedKey) {
        requestedKey = key;
        fetchResults(key);
        return;
      }
    }
    renderResults();
  };

  /* ----- course question ----- */

  const courseCard = cards.course;
  const courseLoader = courseCard.querySelector('[data-loader="course"]');
  const courseBox = createCombobox({
    root: courseCard.querySelector('[data-combobox="course"]'),
    search: async (query) => searchCourses(courses, query),
    optionLabel: (c) => c.name,
    displayValue: (c) => (c || state.selectedCourse)?.name || '',
    isSelected: (c) => c.courseCode === state.selectedCourse?.courseCode,
    onSelect: (c) => {
      state.selectedCourse = c;
      userAction = true;
      update();
    },
    minLength: 2,
    wait: 300,
    emptyMessage: MSG.noCourses,
  });

  const loadCourses = async () => {
    coursesStatus = 'loading';
    courseLoader.hidden = false;
    courseBox.input.closest('.gcc-combobox').hidden = true;
    try {
      const rows = await apiGet('/v_course');
      courses = rows.map(camelKeys).map((c) => {
        const norm = normalise(c.name);
        return { ...c, search: { norm, words: norm.split(' ') } };
      });
      coursesStatus = 'ready';
      if (notice.parentElement === courseCard.querySelector('.gcc-card-body')) clearNotice();
      const code = new URLSearchParams(window.location.search).get('course_code')
        || widget.dataset.course_code || widget.dataset.courseCode;
      const preselected = code && courses.find((c) => c.courseCode === code);
      if (preselected && !state.selectedCourse) {
        state.selectedCourse = preselected;
        courseBox.input.value = preselected.name;
        update();
      }
    } catch (error) {
      coursesStatus = 'failed';
      // eslint-disable-next-line no-console
      console.warn('grade conversion calculator: courses failed to load', error);
      showNotice(MSG.errors.courses, courseCard.querySelector('.gcc-card-body'), loadCourses);
    } finally {
      courseLoader.hidden = true;
      courseBox.input.closest('.gcc-combobox').hidden = coursesStatus !== 'ready';
    }
  };

  /* ----- institution question ----- */

  const institutionCard = cards.institution;
  const institutionDisplay = (inst) => {
    if (!inst) return '';
    const country = inst.country && inst.country !== 'unknown' ? ` (${inst.country})` : '';
    return `${inst.name}${country}`;
  };
  const institutionBox = createCombobox({
    root: institutionCard.querySelector('[data-combobox="institution"]'),
    search: async (query, signal) => {
      try {
        const found = await searchInstitutions(query, signal);
        if (notice.parentElement === institutionCard.querySelector('.gcc-card-body')) clearNotice();
        return found;
      } catch (error) {
        if (error.name !== 'AbortError') {
          // eslint-disable-next-line no-console
          console.warn('grade conversion calculator: institution search failed', error);
          showNotice(MSG.errors.institutions, institutionCard.querySelector('.gcc-card-body'));
        }
        throw error;
      }
    },
    optionLabel: (inst) => `${inst.name} (${inst.country || ''})`,
    displayValue: (inst) => institutionDisplay(inst || state.previousInstitution),
    isSelected: (inst) => inst.institutionCode === state.previousInstitution?.institutionCode,
    onSelect: (inst) => {
      state.previousInstitution = inst;
      // keep the GPA pass mark in step with the new institution's default scales
      if (state.institutionMaxGpa) {
        const def = gpaDefault();
        if (def) {
          state.institutionGpaPassMark = (def.maxGpa * def.passMark) / 100;
          state.gpaPassMarkFromDefaults = true;
        } else if (state.gpaPassMarkFromDefaults) {
          state.institutionGpaPassMark = null;
          state.gpaPassMarkFromDefaults = false;
        }
      }
      userAction = true;
      update();
    },
    minLength: 3,
    wait: 300,
    emptyMessage: MSG.noInstitutions,
    loadingMessage: MSG.loadingInstitutions,
  });
  /* ----- radios ----- */

  root.addEventListener('change', (e) => {
    const radio = e.target.closest('input[type="radio"][data-field]');
    if (!radio) return;
    const { value } = radio;
    let parsed = value;
    if (value === 'true') parsed = true;
    else if (value === 'false') parsed = false;
    state[radio.dataset.field] = parsed;
    userAction = true;
    update();
  });

  /* ----- number inputs (source NumberInput rules) ----- */

  const commitNumber = (input) => {
    const field = input.dataset.number;
    const parsed = input.value === '' ? null : parseFloat(input.value);
    const value = Number.isNaN(parsed) ? null : parsed;
    if (state[field] === value) return;
    state[field] = value;
    if (field === 'institutionMaxGpa') {
      const def = gpaDefault();
      if (!value) {
        state.institutionGpaPassMark = null;
        state.gradePointAverage = null;
        state.gpaPassMarkFromDefaults = false;
      } else if (def) {
        state.institutionGpaPassMark = (def.maxGpa * def.passMark) / 100;
        state.gpaPassMarkFromDefaults = true;
      } else {
        state.institutionGpaPassMark = null;
        state.gpaPassMarkFromDefaults = false;
      }
    }
    if (field === 'institutionGpaPassMark') state.gpaPassMarkFromDefaults = false;
    userAction = true;
    update();
  };

  const delayed = new Map();
  $$('[data-number]').forEach((input) => {
    if (input.hasAttribute('data-delay')) delayed.set(input, debounce(() => commitNumber(input), 400));
    input.dataset.prev = '';

    input.addEventListener('input', () => {
      const raw = input.value;
      const cleaned = raw.replace(/[^0-9.]/g, '');
      const { maxField } = input.dataset;
      const max = maxField ? state[maxField] : Number(input.dataset.max);
      const invalid = cleaned !== raw
        || cleaned.split('.').length > 2
        || (typeof max === 'number' && parseFloat(cleaned) > max);
      if (invalid) {
        input.value = input.dataset.prev;
        return;
      }
      input.dataset.prev = cleaned;
      if (delayed.has(input)) delayed.get(input)();
      else commitNumber(input);
    });

    const flush = () => {
      if (!delayed.has(input)) return;
      delayed.get(input).cancel();
      commitNumber(input);
    };
    input.addEventListener('blur', flush);
    input.addEventListener('keyup', (e) => {
      if (e.key !== 'Enter') return;
      flush();
      // Enter moves to the next field (or the results button), as in the source
      const focusables = [...$$('.gcc-cards .gcc-text-input'), resultsButton]
        .filter((el) => el.offsetParent !== null);
      const next = focusables[focusables.indexOf(input) + 1];
      if (next) next.focus();
      else input.blur();
    });
  });

  /* ----- results button / reset ----- */

  resultsButton.addEventListener('click', () => {
    state.calculateResults = true;
    update();
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    resultsHeading.focus({ preventScroll: true });
    resultsHeading.scrollIntoView({ behavior, block: 'start' });
  });

  $('.gcc-reset-button').addEventListener('click', () => {
    state = initialState();
    results = null;
    resultsKey = null;
    requestedKey = null;
    resultsFailed = false;
    resultsSeq += 1;
    delayed.forEach((fn) => fn.cancel());
    courseBox.reset();
    institutionBox.reset();
    $$('.gcc-cards input').forEach((input) => {
      if (input.type === 'radio') input.checked = false;
      else if (input.dataset.number) { input.value = ''; input.dataset.prev = ''; }
    });
    if (notice.parentElement === resultsSection) clearNotice();
    resultsPanel.replaceChildren();
    update();
    root.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
    courseBox.input.focus({ preventScroll: true });
  });

  /* ----- information slide-over (native modal dialog) ----- */

  let opener = null;
  const sections = $$('.gcc-info-section');
  const setSection = (section, open) => {
    const btn = section.querySelector('h3 button');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    section.querySelector('.gcc-info-body').hidden = !open;
    section.classList.toggle('is-open', open);
  };

  dialog.addEventListener('click', (e) => {
    const toggle = e.target.closest('.gcc-info-section h3 button');
    if (toggle) {
      const section = toggle.closest('.gcc-info-section');
      setSection(section, toggle.getAttribute('aria-expanded') !== 'true');
      return;
    }
    // a click on the backdrop (outside the panel) closes the dialog
    if (e.target === dialog || e.target.closest('.gcc-info-close')) dialog.close();
  });

  dialog.addEventListener('close', () => {
    document.body.style.removeProperty('overflow');
    if (opener && opener.isConnected) opener.focus();
    opener = null;
  });

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.gcc-info-btn');
    if (!btn) return;
    opener = btn;
    const id = btn.dataset.info;
    sections.forEach((section) => setSection(section, section.dataset.section === id));
    const target = sections.find((section) => section.dataset.section === id);
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    const focusTarget = target?.querySelector('h3 button') || dialog.querySelector('.gcc-info-close');
    focusTarget.focus({ preventScroll: true });
    if (target) setTimeout(() => target.scrollIntoView({ block: 'nearest' }), 100);
  });

  /* ----- start ----- */

  update();
  await loadCourses();
}
