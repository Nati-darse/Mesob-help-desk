export const COMPANIES = [
    {
        id: 1,
        name: "Ethiopian Electric Utility Services",
        amharicName: "የኢትዮጰያ ኤሌክትሪክ አገልግሎት",
        initials: "EEU",
        logo: "/company-logos/EEU.png"
    },
    {
        id: 2,
        name: "Addis Ababa City Administration Land Development and Administration Bureau",
        amharicName: "መሬት ልማትና አስተዳደር ቢሮ",
        initials: "AALB",
        logo: "/company-logos/AALB.png"
    },
    {
        id: 3,
        name: "Addis Ababa Housing Development Corporation",
        amharicName: "ቤቶች ልማት ኮርፖሬሽን",
        initials: "AAHDC",
        logo: "/company-logos/AAHDC.png"
    },
    {
        id: 4,
        name: "Vital Events Registration, Certification and Verification Service Agency",
        amharicName: "የወሳኝ ኩነት ምዝገባ ማስረጃ ማረጋገጥ አገልግሎት ኤጀንሲ",
        initials: "KUN",
        logo: "/company-logos/CRRSA.png"
    },
    {
        id: 5,
        name: "Addis Ababa City Administration Housing Development and Administration Bureau",
        amharicName: "ቤቶች ልማትና አስተዳደር ቢሮ",
        initials: "AAHDB",
        logo: "/company-logos/AAHDB.png"
    },
    {
        id: 6,
        name: "Addis Ababa City Administration Revenues Bureau",
        amharicName: "ገቢዎች ቢሮ",
        initials: "AARB",
        logo: "/company-logos/AARB.png"
    },
    {
        id: 7,
        name: "Addis Ababa City Administration Building Permit and Control Authority",
        amharicName: "ግንባታ ፍቃድና ቁጥጥር ባለስልጠን",
        initials: "AABPCA",
        logo: "/company-logos/AABPCA.png"
    },
    {
        id: 8,
        name: "Addis Ababa City Administration Investment Commission",
        amharicName: "የኢንቨስትመንት ኮሚሽን",
        initials: "AAIC",
        logo: "/company-logos/AAIC.png"
    },
    {
        id: 9,
        name: "Addis Ababa City Administration Landholding Registration and Information Agency",
        amharicName: "የመሬት ይዞታና ምዝገባ መረጃ ኤጀንሲ",
        initials: "LRIA",
        logo: "/company-logos/LRIA.png"
    },
    {
        id: 10,
        name: "Addis Ababa City Administration Trade Bureau",
        amharicName: "ንግድ ቢሮ",
        initials: "AMINFO",
        logo: "/company-logos/AMINFO.png"
    },
    {
        id: 11,
        name: "Addis Ababa City Administration Labor and Skills Bureau",
        amharicName: "የሥራና ክህሎት ቢሮ",
        initials: "AALSB",
        logo: "/company-logos/AALSB.png"
    },
    {
        id: 12,
        name: "Driver and Vehicle Licensing and Control Authority",
        amharicName: "አሽ ተሽ ባለስልጣን",
        initials: "DAVA",
        logo: "/company-logos/DAVA.png"
    },
    {
        id: 13,
        name: "Documents Authentication and Registration Service",
        amharicName: "የሰነዶች ማረጋገጫና ምዝገባ አገልግሎት",
        initials: "DARS",
        logo: "/company-logos/DARS.png"
    },
    {
        id: 14,
        name: "Universal Service",
        amharicName: "ሁሉን አቀፍ አገልግሎት",
        initials: "UNIV",
        logo: "/company-logos/UNIV.png"
    },
    {
        id: 15,
        name: "Addis Ababa Civil Registration and Residency Service Agency",
        amharicName: "የሲቪል ምዝገባና ነዋሪዎች አገልግሎት ኤጀንሲ",
        initials: "CRRSA",
        logo: "/company-logos/CRRSA.png"
    },
    {
        id: 16,
        name: "Siket Bank",
        amharicName: "ስኬት ባንክ",
        initials: "SB",
        logo: "/company-logos/SB.png"
    },
    {
        id: 17,
        name: "Commercial Bank of Ethiopia",
        amharicName: "የኢትዮጵያ ንግድ ባንክ",
        initials: "CBE",
        logo: "/company-logos/CBE.png"
    },
    {
        id: 18,
        name: "Ethio Post",
        amharicName: "የኢትዮጵያ ፖስታ",
        initials: "EP",
        logo: "/company-logos/EP.png"
    },
    {
        id: 19,
        name: "Ethio Telecom",
        amharicName: "ኢቲዮ ቴሌኮም",
        initials: "ET",
        logo: "/company-logos/ET.png"
    },
    {
        id: 20,
        name: "Digitalization Bureau",
        amharicName: "ዲጂታላይዜሽን ቢሮ",
        initials: "DB",
        logo: "/company-logos/DB.png"
    },
];

export const getCompanyById = (id) => COMPANIES.find(c => c.id === parseInt(id, 10)) || COMPANIES[0];
export const getCompanyDisplayName = (company) => company?.amharicName || company?.name || '';
export const formatCompanyLabel = (company) => {
    if (!company) return '';
    const display = getCompanyDisplayName(company);
    return `${company.initials} - ${display}`;
};
