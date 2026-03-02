// ============================================
// CONFIGURATION & MASTER DATA
// ============================================

// *** สำคัญ: ใส่ URL ของ Google Apps Script Web App ที่ deploy แล้วตรงนี้ ***
const API_URL = 'https://script.google.com/macros/s/AKfycbxPGBcV9iFKwZT603M4Wkaa3lDDT7QCpZQ5tnPBLaKjDuyCXqRW-8LjTXPJDdV3-wos/exec';

// Master Data - Groups
const GROUPS = [
  { id: 'G1', name: 'การพยาบาลผู้ป่วยหนัก', threshold: 60 },
  { id: 'G2', name: 'การพยาบาลผู้ป่วยผ่าตัด', threshold: 60 },
  { id: 'G3', name: 'การพยาบาลผู้ป่วยอุบัติเหตุและฉุกเฉิน', threshold: 60 },
  { id: 'G4', name: 'การพยาบาลผู้คลอด', threshold: 60 },
  { id: 'G5', name: 'การพยาบาลผู้ป่วยอายุรกรรม', threshold: 33.33 },
  { id: 'G6', name: 'การพยาบาลผู้ป่วยศัลยกรรม', threshold: 33.33 },
  { id: 'G7', name: 'การพยาบาลผู้ป่วยกุมารเวชกรรม', threshold: 33.33 },
  { id: 'G8', name: 'การพยาบาลผู้ป่วยนอก', threshold: 33.33 }
];

// Master Data - Wards
const WARDS = [
  { id: 'W1', name: 'ICU1', groupId: 'G1' },
  { id: 'W2', name: 'ICU2', groupId: 'G1' },
  { id: 'W3', name: 'CCU', groupId: 'G1' },
  { id: 'W4', name: 'OR1', groupId: 'G2' },
  { id: 'W5', name: 'OR2', groupId: 'G2' },
  { id: 'W6', name: 'RR', groupId: 'G2' },
  { id: 'W7', name: 'ER', groupId: 'G3' },
  { id: 'W8', name: 'Trauma', groupId: 'G3' },
  { id: 'W9', name: 'LR', groupId: 'G4' },
  { id: 'W10', name: 'PP', groupId: 'G4' },
  { id: 'W11', name: 'Med1', groupId: 'G5' },
  { id: 'W12', name: 'Med2', groupId: 'G5' },
  { id: 'W13', name: 'Surg1', groupId: 'G6' },
  { id: 'W14', name: 'Surg2', groupId: 'G6' },
  { id: 'W15', name: 'Ped1', groupId: 'G7' },
  { id: 'W16', name: 'OPD', groupId: 'G8' }
];

// Course Lists
const SPECIALTY_COURSES_4MONTH = [
  'การพยาบาลผู้ป่วยวิกฤต (ผู้ใหญ่)',
  'การพยาบาลผู้ป่วยวิกฤต (เด็ก)',
  'การพยาบาลเวชปฏิบัติฉุกเฉิน',
  'การพยาบาลผู้ป่วยโรคหัวใจและหลอดเลือด',
  'การพยาบาลผู้ป่วยมะเร็ง',
  'การพยาบาลผู้ป่วยโรคไต',
  'การพยาบาลผู้ป่วยศัลยกรรมอุบัติเหตุ',
  'การพยาบาลผู้ป่วยทารกแรกเกิด',
  'การผดุงครรภ์',
  'การพยาบาลเวชปฏิบัติทั่วไป',
  'การพยาบาลผู้สูงอายุ',
  'การพยาบาลจิตเวชและสุขภาพจิต',
  'การพยาบาลบริหาร/การจัดการ'
];

const SHORT_COURSES = [
  'ACLS Provider',
  'BLS Provider',
  'PALS Provider',
  'Trauma Nursing',
  'Wound Care',
  'IV Therapy',
  'Pain Management',
  'Palliative Care',
  'Infection Control',
  'Quality Improvement'
];

const GRADUATE_COURSES = [
  'พยาบาลศาสตรมหาบัณฑิต (การพยาบาลผู้ใหญ่)',
  'พยาบาลศาสตรมหาบัณฑิต (การพยาบาลเด็ก)',
  'พยาบาลศาสตรมหาบัณฑิต (การพยาบาลผู้สูงอายุ)',
  'พยาบาลศาสตรมหาบัณฑิต (การบริหารการพยาบาล)',
  'สาธารณสุขศาสตรมหาบัณฑิต',
  'พยาบาลศาสตรดุษฎีบัณฑิต'
];

const PRACTICAL_COURSES = [
  'หลักสูตรประกาศนียบัตรผู้ช่วยพยาบาล (1 ปี)',
  'หลักสูตรผู้ช่วยพยาบาล (6 เดือน)'
];
