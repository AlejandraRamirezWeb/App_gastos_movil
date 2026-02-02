import { useMemo, useState } from 'react';
import { format, parseISO, isToday, isYesterday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Expense } from '../hooks/useExpenses';
import type { Contact } from '../hooks/useContacts';
import { formatCurrency, cn } from '../lib/utils';
import { ShoppingBag, Coffee, Car, Receipt, Music, CircleDollarSign, CalendarDays, Calendar, Edit2, Trash2 } from 'lucide-react';
import { ExpenseEditModal } from './ExpenseEditModal';
import { ConfirmModal } from './ConfirmModal';

interface HistoryListProps {
    expenses: Expense[];
    contacts: Contact[];
    userId?: string;
    selectedDate: string | null;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<Omit<Expense, 'id'>>) => void;
    viewMode: 'daily' | 'monthly';
    onViewModeChange: (mode: 'daily' | 'monthly') => void;
}

const ICONS: Record<string, React.ReactNode> = {
    food: <Coffee className="w-4 h-4" />,
    transport: <Car className="w-4 h-4" />,
    entertainment: <Music className="w-4 h-4" />,
    bills: <Receipt className="w-4 h-4" />,
    shopping: <ShoppingBag className="w-4 h-4" />,
    other: <CircleDollarSign className="w-4 h-4" />,
};

const COLORS: Record<string, string> = {
    food: 'bg-orange-500',
    transport: 'bg-blue-500',
    entertainment: 'bg-purple-500',
    bills: 'bg-red-500',
    shopping: 'bg-pink-500',
    other: 'bg-stone-500',
};

const CATEGORY_LABELS: Record<string, string> = {
    food: 'Comida',
    transport: 'Transporte',
    entertainment: 'Diversión',
    bills: 'Servicios',
    shopping: 'Compras',
    other: 'Otro',
};

export function HistoryList({
    expenses,
    contacts,
    userId,
    selectedDate,
    onDelete,
    onUpdate,
    viewMode,
    onViewModeChange
}: HistoryListProps) {
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getContactName = (contactId?: string) => {
        if (!contactId) return null;
        const contact = contacts.find(c => c.id === contactId);
        return contact?.name;
    };

    const canEdit = (expense: Expense) => {
        return expense.user_id === userId || expense.contactId === userId;
    };

    const filteredExpenses = useMemo(() => {
        if (!selectedDate) return expenses;
        // If monthly view and selectedDate is YYYY-MM, filter by prefix
        if (viewMode === 'monthly') {
            return expenses.filter(e => e.date.startsWith(selectedDate));
        }
        return expenses.filter(e => isSameDay(parseISO(e.date), parseISO(selectedDate)));
    }, [expenses, selectedDate, viewMode]);

    const groupedExpenses = useMemo(() => {
        const groups: Record<string, Expense[]> = {};

        filteredExpenses.forEach(expense => {
            const dateObj = parseISO(expense.date);
            const key = viewMode === 'daily'
                ? expense.date
                : format(dateObj, 'yyyy-MM');

            if (!groups[key]) groups[key] = [];
            groups[key].push(expense);
        });

        return Object.keys(groups)
            .sort((a, b) => b.localeCompare(a))
            .map(dateKey => ({
                date: dateKey,
                items: groups[dateKey]
            }));
    }, [filteredExpenses, viewMode]);

    if (filteredExpenses.length === 0) {
        return (
            <div className="space-y-6">
                <div className="px-6 pt-2">
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                        <button onClick={() => onViewModeChange('daily')} className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2", viewMode === 'daily' ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                            <CalendarDays className="w-3 h-3" /> Por dia
                        </button>
                        <button onClick={() => onViewModeChange('monthly')} className={cn("flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2", viewMode === 'monthly' ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                            <Calendar className="w-3 h-3" /> Por mes
                        </button>
                    </div>
                </div>
                <div className="p-8 text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Receipt className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm">Aún no hay gastos</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* View Toggle */}
            <div className="px-6">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => onViewModeChange('daily')}
                        className={cn(
                            "flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
                            viewMode === 'daily' ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <CalendarDays className="w-3 h-3" />
                        Por dia
                    </button>
                    <button
                        onClick={() => onViewModeChange('monthly')}
                        className={cn(
                            "flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
                            viewMode === 'monthly' ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Calendar className="w-3 h-3" />
                        Por mes
                    </button>
                </div>
            </div>

            <div className="pb-24 px-6 space-y-6">
                {groupedExpenses.map(group => (
                    <div key={group.date} className="space-y-3">
                        <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-widest pl-1 sticky top-0 bg-background/95 backdrop-blur-md py-2 z-10 w-full flex justify-between items-center">
                            <span>
                                {viewMode === 'daily' ? (
                                    isToday(parseISO(group.date))
                                        ? 'Hoy'
                                        : isYesterday(parseISO(group.date))
                                            ? 'Ayer'
                                            : format(parseISO(group.date), "d 'de' MMMM", { locale: es })
                                ) : (
                                    format(parseISO(group.date + '-01'), 'MMMM yyyy', { locale: es })
                                )}
                            </span>
                            <span className="font-mono text-slate-500 font-normal">
                                {formatCurrency(group.items.reduce((acc, curr) => acc + curr.amount, 0))}
                            </span>
                        </h3>
                        <div className="space-y-3">
                            {group.items.map(expense => {
                                const isSelected = selectedExpenseId === expense.id;
                                return (
                                    <div
                                        key={expense.id}
                                        onClick={() => setSelectedExpenseId(isSelected ? null : expense.id)}
                                        className={cn(
                                            "group flex items-center justify-between p-4 bg-white border rounded-2xl transition-all shadow-sm cursor-pointer",
                                            isSelected
                                                ? "border-primary-500 bg-primary-50/30 shadow-md"
                                                : "border-slate-200/60 hover:bg-slate-50 hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full ${COLORS[expense.category] || COLORS['other']} bg-opacity-10 flex items-center justify-center text-${COLORS[expense.category]?.replace('bg-', '') || 'slate-400'}`}>
                                                {ICONS[expense.category] || ICONS['other']}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{CATEGORY_LABELS[expense.category] || expense.category}</p>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    {viewMode === 'monthly' && (
                                                        <span className="font-medium text-slate-600">{format(parseISO(expense.date), "d 'de' MMM", { locale: es })}: </span>
                                                    )}
                                                    <span>{expense.description}</span>
                                                    {expense.isGroup && expense.contactId && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                                            👥 {getContactName(expense.contactId)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right flex items-center gap-3">
                                            <p className="font-semibold text-slate-900">-{formatCurrency(expense.amount)}</p>
                                            {isSelected && canEdit(expense) && (
                                                <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingExpense(expense);
                                                        }}
                                                        className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors active:scale-95"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setExpenseToDelete(expense.id);
                                                        }}
                                                        className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors active:scale-95"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <ConfirmModal
                isOpen={!!expenseToDelete}
                onClose={() => setExpenseToDelete(null)}
                onConfirm={() => {
                    if (expenseToDelete) {
                        onDelete(expenseToDelete);
                        setSelectedExpenseId(null); // Deselect the expense after deletion
                    }
                    setExpenseToDelete(null);
                }}
                title="¿Eliminar gasto?"
                message="Este registro se borrará permanentemente de tu historial."
            />

            {editingExpense && (
                <ExpenseEditModal
                    expense={editingExpense}
                    onSave={onUpdate}
                    onClose={() => setEditingExpense(null)}
                />
            )}
        </div>
    );
}
