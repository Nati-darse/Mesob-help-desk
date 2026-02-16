import { useEffect, useState } from 'react';
import axios from 'axios';
import { COMPANIES, setRuntimeCompanies } from '../utils/companies';

export const useCompanyOptions = () => {
    const [companyOptions, setCompanyOptions] = useState(COMPANIES);

    useEffect(() => {
        let active = true;

        const loadCompanyOptions = async () => {
            try {
                const response = await axios.get('/api/companies');
                const merged = setRuntimeCompanies(response.data || []);
                if (active) {
                    setCompanyOptions(merged);
                }
            } catch {
                if (active) {
                    setCompanyOptions(COMPANIES);
                }
            }
        };

        loadCompanyOptions();

        return () => {
            active = false;
        };
    }, []);

    return companyOptions;
};
