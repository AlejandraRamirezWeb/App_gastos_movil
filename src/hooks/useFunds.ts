import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Fund {
    id: string;
    amount: number;
    description?: string;
    created_at: string;
    user_id: string;
}

export function useFunds(userId: string | undefined) {
    const [funds, setFunds] = useState<Fund[]>([]);
    const [totalFunds, setTotalFunds] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchFunds = async () => {
        if (!userId) return;

        // Obtenemos la LISTA completa de ingresos
        const { data, error } = await supabase
            .from('funds')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setFunds(data);
            // Calculamos el total sumando la lista
            const total = data.reduce((acc, curr) => acc + curr.amount, 0);
            setTotalFunds(total);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFunds();
        // Suscripción en tiempo real
        const channel = supabase.channel('funds_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'funds' }, fetchFunds)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [userId]);

    const addFunds = async (amount: number, description?: string) => {
        if (!userId) return;
        const { error } = await supabase.from('funds').insert([{
            user_id: userId,
            amount,
            description: description || 'Ingreso manual'
        }]);
        if (!error) fetchFunds();
    };

    // Función para BORRAR un ingreso específico
    const deleteFund = async (id: string) => {
        const { error } = await supabase.from('funds').delete().eq('id', id);
        if (!error) fetchFunds();
    };

    // Función para EDITAR un ingreso
    const updateFund = async (id: string, updates: Partial<Fund>) => {
        const { error } = await supabase.from('funds').update(updates).eq('id', id);
        if (!error) fetchFunds();
    };

    return { funds, totalFunds, loading, addFunds, deleteFund, updateFund };
}