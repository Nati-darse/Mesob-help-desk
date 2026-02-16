const FALLBACK_COMPANIES = [
    {
        id: 1,
        name: 'Ethiopian Electric Utility Services',
        amharicName: 'የኢትዮጰያ ኤሌክትሪክ አገልግሎት',
        initials: 'EEU',
        logo: '/company-logos/EEU.png'
    },
    {
        id: 2,
        name: 'Addis Ababa City Administration Land Development and Administration Bureau',
        amharicName: 'መሬት ልማትና አስተዳደር ቢሮ',
        initials: 'AALB',
        logo: '/company-logos/AALB.png'
    },
    {
        id: 3,
        name: 'Addis Ababa Housing Development Corporation',
        amharicName: 'ቤቶች ልማት ኮርፖሬሽን',
        initials: 'AAHDC',
        logo: '/company-logos/AAHDC.png'
    },
    {
        id: 4,
        name: 'Vital Events Registration, Certification and Verification Service Agency',
        amharicName: 'የወሳኝ ኩነት ምዝገባ ማስረጃ ማረጋገጥ አገልግሎት ኤጀንሲ',
        initials: 'KUN',
        logo: '/company-logos/KUN.png'
    },
    {
        id: 5,
        name: 'Addis Ababa City Administration Housing Development and Administration Bureau',
        amharicName: 'ቤቶች ልማትና አስተዳደር ቢሮ',
        initials: 'AAHDB',
        logo: '/company-logos/AAHDB.png'
    },
    {
        id: 6,
        name: 'Addis Ababa City Administration Revenues Bureau',
        amharicName: 'ገቢዎች ቢሮ',
        initials: 'AARB',
        logo: '/company-logos/AARB.png'
    },
    {
        id: 7,
        name: 'Addis Ababa City Administration Building Permit and Control Authority',
        amharicName: 'ግንባታ ፍቃድና ቁጥጥር ባለስልጠን',
        initials: 'AABPCA',
        logo: '/company-logos/AABPCA.png'
    },
    {
        id: 8,
        name: 'Addis Ababa City Administration Investment Commission',
        amharicName: 'የኢንቨስትመንት ኮሚሽን',
        initials: 'AAIC',
        logo: '/company-logos/AAIC.png'
    },
    {
        id: 9,
        name: 'Addis Ababa City Administration Landholding Registration and Information Agency',
        amharicName: 'የመሬት ይዞታና ምዝገባ መረጃ ኤጀንሲ',
        initials: 'LRIA',
        logo: '/company-logos/LRIA.png'
    },
    {
        id: 10,
        name: 'Addis Ababa City Administration Trade Bureau',
        amharicName: 'ንግድ ቢሮ',
        initials: 'AMINFO',
        logo: '/company-logos/AMINFO.png'
    },
    {
        id: 11,
        name: 'Addis Ababa City Administration Labor and Skills Bureau',
        amharicName: 'የሥራና ክህሎት ቢሮ',
        initials: 'AALSB',
        logo: '/company-logos/AALSB.png'
    },
    {
        id: 12,
        name: 'Driver and Vehicle Licensing and Control Authority',
        amharicName: 'አሽ ተሽ ባለስልጣን',
        initials: 'DAVA',
        logo: '/company-logos/DAVA.png'
    },
    {
        id: 13,
        name: 'Documents Authentication and Registration Service',
        amharicName: 'የሰነዶች ማረጋገጫና ምዝገባ አገልግሎት',
        initials: 'DARS',
        logo: '/company-logos/DARS.png'
    },
    {
        id: 14,
        name: 'Universal Service',
        amharicName: 'ሁሉን አቀፍ አገልግሎት',
        initials: 'UNIV',
        logo: '/company-logos/UNIV.png'
    },
    {
        id: 15,
        name: 'Addis Ababa Civil Registration and Residency Service Agency',
        amharicName: 'የሲቪል ምዝገባና ነዋሪዎች አገልግሎት ኤጀንሲ',
        initials: 'CRRSA',
        logo: '/company-logos/CRRSA.png'
    },
    {
        id: 16,
        name: 'Siket Bank',
        amharicName: 'ስኬት ባንክ',
        initials: 'SB',
        logo: '/company-logos/SB.png'
    },
    {
        id: 17,
        name: 'Commercial Bank of Ethiopia',
        amharicName: 'የኢትዮጵያ ንግድ ባንክ',
        initials: 'CBE',
        logo: '/company-logos/CBE.png'
    },
    {
        id: 18,
        name: 'Ethio Post',
        amharicName: 'የኢትዮጵያ ፖስታ',
        initials: 'EP',
        logo: '/company-logos/EP.png'
    },
    {
        id: 19,
        name: 'Ethio Telecom',
        amharicName: 'ኢቲዮ ቴሌኮም',
        initials: 'ET',
        logo: '/company-logos/ET.png'
    },
    {
        id: 20,
        name: 'Digitalization Bureau',
        amharicName: 'ዲጂታላይዜሽን ቢሮ',
        initials: 'DB',
        logo: '/company-logos/DB.png'
    },
    {
        id: 21,
        name: 'HR',
        amharicName: 'የሰው ሀብት አስተዳደር',
        initials: 'HR',
        logo: ''
    },
    {
        id: 22,
        name: 'Finance',
        amharicName: 'ፋይናንስ',
        initials: 'FIN',
        logo: ''
    },
    {
        id: 23,
        name: 'Administration',
        amharicName: 'አስተዳደር',
        initials: 'ADM',
        logo: ''
    },
    {
        id: 24,
        name: 'Security',
        amharicName: 'ሴኩሪቲ',
        initials: 'SEC',
        logo: ''
    }
];

const STORAGE_KEY = 'mesob_companies_cache_v1';

const normalizeCompany = (company = {}) => {
    const id = Number(company.id ?? company.companyId);
    if (!Number.isFinite(id)) return null;

    return {
        ...company,
        id,
        companyId: id,
        name: company.name || '',
        amharicName: company.amharicName || '',
        initials: company.initials || `ORG${id}`,
        logo: company.logo || ''
    };
};

const getStoredCompanies = () => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalizeCompany).filter(Boolean);
    } catch {
        return [];
    }
};

const cacheCompanies = (companies) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
    } catch {
        // Ignore storage failures and keep runtime data only.
    }
};

export const mergeCompaniesWithFallback = (companies = []) => {
    const mapped = new Map(FALLBACK_COMPANIES.map((company) => [company.id, { ...company, companyId: company.id }]));
    for (const company of companies) {
        const normalized = normalizeCompany(company);
        if (!normalized) continue;

        const existing = mapped.get(normalized.id) || {};
        mapped.set(normalized.id, {
            ...existing,
            ...normalized,
            name: normalized.name || existing.name || '',
            amharicName: normalized.amharicName || existing.amharicName || '',
            initials: normalized.initials || existing.initials || `ORG${normalized.id}`,
            logo: normalized.logo || existing.logo || '',
            id: normalized.id,
            companyId: normalized.id
        });
    }

    return Array.from(mapped.values()).sort((a, b) => a.id - b.id);
};

const syncCompanies = (nextCompanies) => {
    COMPANIES.splice(0, COMPANIES.length, ...nextCompanies);
};

const initialCompanies = mergeCompaniesWithFallback(getStoredCompanies());

export const COMPANIES = [...initialCompanies];

export const setRuntimeCompanies = (companies = []) => {
    const merged = mergeCompaniesWithFallback(companies);
    syncCompanies(merged);
    cacheCompanies(merged);
    return merged;
};

export const getCompanyById = (id, companies = COMPANIES) => {
    const parsedId = Number(id);
    if (!Number.isFinite(parsedId)) return companies[0] || null;

    const company = companies.find((item) => Number(item.id ?? item.companyId) === parsedId);
    if (company) return company;

    return {
        id: parsedId,
        companyId: parsedId,
        name: `Organization ${parsedId}`,
        amharicName: '',
        initials: `ORG${parsedId}`,
        logo: ''
    };
};

export const getCompanyDisplayName = (company) => company?.amharicName || company?.name || '';

export const formatCompanyLabel = (company) => {
    if (!company) return '';
    const display = getCompanyDisplayName(company);
    return `${company.initials} - ${display}`;
};
