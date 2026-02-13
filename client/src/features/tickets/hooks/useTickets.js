import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchTickets = async ({ queryKey }) => {
    const [, params] = queryKey;
    const { data } = await axios.get('/api/tickets', {
        params: params || undefined,
    });
    return data;
};

export const useTickets = (params, options = {}) => {
    const hasParams = Boolean(params && Object.keys(params).length > 0);
    return useQuery({
        queryKey: hasParams ? ['tickets', params] : ['tickets'],
        queryFn: fetchTickets,
        refetchInterval: 10000, // Poll for updates every 10 seconds
        ...options,
    });
};
