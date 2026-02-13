const Company = require('../models/Company');

const DEFAULT_COMPANIES = [
  { companyId: 1, name: 'Ethiopian Electric Utility Services', amharicName: 'የኢትዮጰያ ኤሌክትሪክ አገልግሎት', initials: 'EEU', logo: '/company-logos/EEU.png' },
  { companyId: 2, name: 'Addis Ababa City Administration Land Development and Administration Bureau', amharicName: 'መሬት ልማትና አስተዳደር ቢሮ', initials: 'AALB', logo: '/company-logos/AALB.png' },
  { companyId: 3, name: 'Addis Ababa Housing Development Corporation', amharicName: 'ቤቶች ልማት ኮርፖሬሽን', initials: 'AAHDC', logo: '/company-logos/AAHDC.png' },
  { companyId: 4, name: 'Vital Events Registration, Certification and Verification Service Agency', amharicName: 'የወሳኝ ኩነት ምዝገባ ማስረጃ ማረጋገጥ አገልግሎት ኤጀንሲ', initials: 'KUN', logo: '/company-logos/KUN.png' },
  { companyId: 5, name: 'Addis Ababa City Administration Housing Development and Administration Bureau', amharicName: 'ቤቶች ልማትና አስተዳደር ቢሮ', initials: 'AAHDB', logo: '/company-logos/AAHDB.png' },
  { companyId: 6, name: 'Addis Ababa City Administration Revenues Bureau', amharicName: 'ገቢዎች ቢሮ', initials: 'AARB', logo: '/company-logos/AARB.png' },
  { companyId: 7, name: 'Addis Ababa City Administration Building Permit and Control Authority', amharicName: 'ግንባታ ፍቃድና ቁጥጥር ባለስልጠን', initials: 'AABPCA', logo: '/company-logos/AABPCA.png' },
  { companyId: 8, name: 'Addis Ababa City Administration Investment Commission', amharicName: 'የኢንቨስትመንት ኮሚሽን', initials: 'AAIC', logo: '/company-logos/AAIC.png' },
  { companyId: 9, name: 'Addis Ababa City Administration Landholding Registration and Information Agency', amharicName: 'የመሬት ይዞታና ምዝገባ መረጃ ኤጀንሲ', initials: 'LRIA', logo: '/company-logos/LRIA.png' },
  { companyId: 10, name: 'Addis Ababa City Administration Trade Bureau', amharicName: 'ንግድ ቢሮ', initials: 'AMINFO', logo: '/company-logos/AMINFO.png' },
  { companyId: 11, name: 'Addis Ababa City Administration Labor and Skills Bureau', amharicName: 'የሥራና ክህሎት ቢሮ', initials: 'AALSB', logo: '/company-logos/AALSB.png' },
  { companyId: 12, name: 'Driver and Vehicle Licensing and Control Authority', amharicName: 'አሽ ተሽ ባለስልጣን', initials: 'DAVA', logo: '/company-logos/DAVA.png' },
  { companyId: 13, name: 'Documents Authentication and Registration Service', amharicName: 'የሰነዶች ማረጋገጫና ምዝገባ አገልግሎት', initials: 'DARS', logo: '/company-logos/DARS.png' },
  { companyId: 14, name: 'Universal Service', amharicName: 'ሁሉን አቀፍ አገልግሎት', initials: 'UNIV', logo: '/company-logos/UNIV.png' },
  { companyId: 15, name: 'Addis Ababa Civil Registration and Residency Service Agency', amharicName: 'የሲቪል ምዝገባና ነዋሪዎች አገልግሎት ኤጀንሲ', initials: 'CRRSA', logo: '/company-logos/CRRSA.png' },
  { companyId: 16, name: 'Siket Bank', amharicName: 'ስኬት ባንክ', initials: 'SB', logo: '/company-logos/SB.png' },
  { companyId: 17, name: 'Commercial Bank of Ethiopia', amharicName: 'የኢትዮጵያ ንግድ ባንክ', initials: 'CBE', logo: '/company-logos/CBE.png' },
  { companyId: 18, name: 'Ethio Post', amharicName: 'የኢትዮጵያ ፖስታ', initials: 'EP', logo: '/company-logos/EP.png' },
  { companyId: 19, name: 'Ethio Telecom', amharicName: 'ኢቲዮ ቴሌኮም', initials: 'ET', logo: '/company-logos/ET.png' },
  { companyId: 20, name: 'Digitalization Bureau', amharicName: 'ዲጂታላይዜሽን ቢሮ', initials: 'DB', logo: '/company-logos/DB.png' },
];

const seedCompanies = async () => {
  try {
    const count = await Company.countDocuments({});
    if (count === 0) {
      await Company.insertMany(DEFAULT_COMPANIES);
    }
  } catch (error) {
    console.error('[CompanySeed] Skipped:', error.message);
  }
};

module.exports = { seedCompanies, DEFAULT_COMPANIES };
