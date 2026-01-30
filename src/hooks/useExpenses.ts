import { useState, useEffect } from 'react';

export interface Expense {
    id: string;
    amount: number;
    category: string;
    description: string;
    date: string; // ISO string
}

const STORAGE_KEY = 'expenses_data';

export function useExpenses() {
    const [expenses, setExpenses] = useState<Expense[]>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }, [expenses]);

    const addExpense = (expense: Omit<Expense, 'id'>) => {
        const newExpense = {
            ...expense,
            id: crypto.randomUUID(),
        };
        setExpenses(prev => [newExpense, ...prev]);
    };

    const deleteExpense = (id: string) => {
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    return {
        expenses,
        addExpense,
        deleteExpense
    };
}
