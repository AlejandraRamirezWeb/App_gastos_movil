import { useState } from 'react';
import { Plus, Coffee, Car, Music, Receipt, ShoppingBag, CircleDollarSign } from 'lucide-react';
import type { Expense } from '../hooks/useExpenses';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface ExpenseFormProps {
    onAdd: (expense: Omit<Expense, 'id'>) => void;
}

const CATEGORIES = [
    { id: 'food', label: 'Comida', icon: Coffee },
    { id: 'transport', label: 'Transporte', icon: Car },
    { id: 'entertainment', label: 'Diversión', icon: Music },
    { id: 'bills', label: 'Servicios', icon: Receipt },
    { id: 'shopping', label: 'Compras', icon: ShoppingBag },
    { id: 'other', label: 'Otro', icon: CircleDollarSign },
];

export function ExpenseForm({ onAdd }: ExpenseFormProps) {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0].id);
    const [description, setDescription] = useState('');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-numeric chars
        const rawValue = e.target.value.replace(/\D/g, '');

        if (rawValue === '') {
            setAmount('');
            return;
        }

        // Convert to number and then format with dots
        const numberValue = parseInt(rawValue, 10);
        setAmount(new Intl.NumberFormat('es-CO').format(numberValue));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Parse the dotted string back to number
        const numericAmount = parseInt(amount.replace(/\./g, ''), 10);

        if (!numericAmount || numericAmount <= 0) return;

        onAdd({
            date,
            amount: numericAmount,
            category,
            description
        });

        setAmount('');
        setDescription('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 px-6 pt-6 pb-24">

            {/* Amount Input */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monto</label>
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-light text-slate-400 group-focus-within:text-slate-900 transition-colors">$</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-10 pr-4 text-3xl font-bold text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all font-sans shadow-sm"
                        autoFocus
                    />
                </div>
            </div>

            {/* Date Input */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</label>
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all min-h-[56px] appearance-none shadow-sm"
                />
            </div>

            {/* Category Grid */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Categoría</label>
                <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 shadow-sm",
                                category === cat.id
                                    ? "bg-primary-50 border-primary-500 text-primary-600 shadow-md"
                                    : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300"
                            )}
                        >
                            <cat.icon className={cn("w-6 h-6 mb-2", category === cat.id ? "text-primary-600" : "text-slate-400")} />
                            <span className="text-[10px] font-medium">{cat.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Note Input */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Nota (Opcional)</label>
                <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="¿En qué gastaste?"
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 px-4 text-slate-900 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all shadow-sm"
                />
            </div>

            <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary-900/20"
            >
                <Plus className="w-5 h-5" />
                Agregar gasto
            </button>
        </form>
    );
}
