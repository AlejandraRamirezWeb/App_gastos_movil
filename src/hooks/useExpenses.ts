import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface Expense {
    id: string;
    amount: number;
    category: string;
    description: string;
    date: string; // ISO string
    contactId?: string;
    isGroup?: boolean;
    user_id: string;
}

export function useExpenses(userId: string | undefined) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchExpenses = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        console.log('useExpenses: Fetching for', userId);
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .or(`user_id.eq.${userId},contactId.eq.${userId}`)
            .order('date', { ascending: false });

        if (error) {
            console.error('useExpenses: Fetch error:', error);
        } else {
            console.log('useExpenses: Fetched', data?.length || 0, 'expenses');
            setExpenses(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchExpenses();
    }, [userId]);

    const addExpense = async (expense: Omit<Expense, 'id' | 'user_id'>) => {
        if (!userId) return;

        console.log('useExpenses: Adding expense to Supabase...', expense);

        const { error } = await supabase
            .from('expenses')
            .insert([{ ...expense, user_id: userId }]);

        if (error) {
            console.error('useExpenses: Insert error:', error);
            alert('❌ ERROR de Supabase:\n' + error.message);
        } else {
            console.log('useExpenses: Insert success');
            alert('✅ Gasto guardado correctamente');
            await fetchExpenses(); // Recargar la lista inmediatamente
        }
    };

    const updateExpense = async (id: string, updates: Partial<Omit<Expense, 'id' | 'user_id'>>) => {
        const { error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id);

        if (error) {
            console.error('useExpenses: Update error:', error);
        } else {
            fetchExpenses();
        }
    };

    const deleteExpense = async (id: string) => {
        console.log('useExpenses: deleteExpense called for', id);

        // Optimistic Update: Remove from local state immediately
        setExpenses(prev => prev.filter(e => e.id !== id));

        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('useExpenses: Delete error:', error);
            alert('❌ No se pudo eliminar de la nube:\n' + error.message);
            // Re-fetch to restore state if deletion failed
            fetchExpenses();
        } else {
            console.log('useExpenses: Delete success');
        }
    };

    return {
        expenses,
        loading,
        addExpense,
        updateExpense,
        deleteExpense
    };
}
