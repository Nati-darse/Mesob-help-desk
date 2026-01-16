export const COMPANIES = [
    { id: 1, name: "Ethiopian Electric Utility Services", initials: "EEU" },
    { id: 2, name: "Addis Ababa city Government Land Development and Administration Bureau Services", initials: "LDAB" },
    { id: 3, name: "Addis Ababa Housing Development Corporation Services", initials: "AAHDC" },
    { id: 4, name: "Addis Ababa City Administration Traffic Management Authority Services", initials: "TMAS" },
    { id: 5, name: "Addis Ababa Housing Development and Administration Bureau Services", initials: "HDAB" },
    { id: 6, name: "Addis Ababa City Administration Revenues Bureau Services", initials: "RBS" },
    { id: 7, name: "Addis Ababa City Administration Constriction Permit and Control Authority Services", initials: "CPCAS" },
    { id: 8, name: "Addis Ababa City Administration Investment Commission Services", initials: "ICS" },
    { id: 9, name: "Addis Ababa City Administration Landholding Registration and Information Agency Services", initials: "LRAS" },
    { id: 10, name: "Addis Ababa City Administration Trade Bureau Services", initials: "TBS" },
    { id: 11, name: "Addis Ababa City Administration Labor and Skills Bureau Services", initials: "LSBS" },
    { id: 12, name: "Driver and Vehicle Licensing and Control Authority Services", initials: "DVLS" },
    { id: 13, name: "Addis Ababa City Administration Landholding Registration and Information Agency Services", initials: "LRAS-2" },
    { id: 14, name: "Addis Ababa City Administration Plan and Development Bureau Services", initials: "PDBS" },
    { id: 15, name: "Addis Ababa Civil Registration and Residency Service Agency Services", initials: "CRRSA" },
    { id: 16, name: "siket bank", initials: "SIKET" },
    { id: 17, name: "comercial bank of ethiopia", initials: "CBE" },
    { id: 18, name: "ethio post", initials: "POST" },
    { id: 19, name: "ethio telecom", initials: "TELE" },
];

export const getCompanyById = (id) => COMPANIES.find(c => c.id === parseInt(id)) || COMPANIES[0];
