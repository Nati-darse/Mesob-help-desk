import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchTickets = async () => {
    const { data } = await axios.get('/api/tickets');
    return data;
};

export const useTickets = () => {
    return useQuery({
        queryKey: ['tickets'],
        queryFn: fetchTickets,
    });
};
