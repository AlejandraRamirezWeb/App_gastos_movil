import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';


export function useFunds(userId: string | undefined) {
    const [totalFunds, setTotalFunds] = useState<number>(0);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFunds = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('funds')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                // If table doesn't exist or other error, fallback to localStorage
                console.warn('useFunds: Supabase error, falling back to localStorage:', error.message);
                const saved = localStorage.getItem(`funds_${userId}`);
                setTotalFunds(saved ? parseFloat(saved) : 0);
            } else {
                const total = data.reduce((acc, curr) => acc + curr.amount, 0);
                setTotalFunds(total);
                setRecords(data);
                // Also sync to localStorage for offline/backup
                localStorage.setItem(`funds_${userId}`, total.toString());
                localStorage.setItem(`funds_records_${userId}`, JSON.stringify(data));
            }
        } catch (e) {
            console.error('useFunds: Unexpected error:', e);
            const saved = localStorage.getItem(`funds_${userId}`);
            const savedRecords = localStorage.getItem(`funds_records_${userId}`);
            setTotalFunds(saved ? parseFloat(saved) : 0);
            setRecords(savedRecords ? JSON.parse(savedRecords) : []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchFunds();
    }, [userId]);

    const addFunds = async (amount: number, description?: string) => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from('funds')
                .insert([{ user_id: userId, amount, description: description || 'Ingreso de fondos' }]);

            if (error) {
                console.warn('useFunds: Could not save to Supabase, saving to localStorage only:', error.message);
                const newTotal = totalFunds + amount;
                setTotalFunds(newTotal);
                localStorage.setItem(`funds_${userId}`, newTotal.toString());
            } else {
                await fetchFunds();
            }
        } catch (e) {
            console.error('useFunds: Error adding funds:', e);
            const newTotal = totalFunds + amount;
            setTotalFunds(newTotal);
            localStorage.setItem(`funds_${userId}`, newTotal.toString());
        }
    };

    const updateFund = async (id: string, updates: any) => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from('funds')
                .update(updates)
                .eq('id', id)
                .eq('user_id', userId);

            if (error) {
                console.error('useFunds: Error updating fund:', error.message);
            } else {
                await fetchFunds();
            }
        } catch (e) {
            console.error('useFunds: Unexpected error updating fund:', e);
        }
    };

    const deleteFund = async (id: string) => {
        if (!userId) return;

        try {
            const { error } = await supabase
                .from('funds')
                .delete()
                .eq('id', id)
                .eq('user_id', userId);

            if (error) {
                console.error('useFunds: Error deleting fund:', error.message);
            } else {
                await fetchFunds();
            }
        } catch (e) {
            console.error('useFunds: Unexpected error deleting fund:', e);
        }
    };

    const setInitialFunds = async (amount: number) => {
        if (!userId) return;

        try {
            // For simplicity in this implementation, we'll just delete old records and insert a new one
            // or just add the difference if we want to be more precise.
            // But usually "set" means overwrite the visual total.

            const { error: deleteError } = await supabase
                .from('funds')
                .delete()
                .eq('user_id', userId);

            const { error: insertError } = await supabase
                .from('funds')
                .insert([{ user_id: userId, amount }]);

            if (deleteError || insertError) {
                console.warn('useFunds: Supabase set failed, using localStorage');
                setTotalFunds(amount);
                localStorage.setItem(`funds_${userId}`, amount.toString());
            } else {
                await fetchFunds();
            }
        } catch (e) {
            setTotalFunds(amount);
            localStorage.setItem(`funds_${userId}`, amount.toString());
        }
    };

    return {
        totalFunds,
        funds: records,
        loading,
        addFunds,
        updateFund,
        deleteFund,
        setInitialFunds,
        refreshFunds: fetchFunds
    };
}
