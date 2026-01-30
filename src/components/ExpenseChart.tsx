import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Expense } from '../hooks/useExpenses';
import { format, subDays, eachDayOfInterval, subWeeks, isSameDay, subMonths, eachMonthOfInterval, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCurrency } from '../lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ExpenseChartProps {
    expenses: Expense[];
    selectedDate: string | null;
    onSelectDate: (date: string) => void;
    viewMode?: 'daily' | 'monthly'; // Optional to avoid breaking if not passed yet
}

const CATEGORY_LABELS: Record<string, string> = {
    food: 'Comida',
    transport: 'Transporte',
    entertainment: 'Diversión',
    bills: 'Servicios',
    shopping: 'Compras',
    other: 'Otro',
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const categories = data.categories as Record<string, number>;

        return (
            <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl min-w-[200px]">
                <p className="text-slate-900 text-xs mb-2 font-medium uppercase tracking-wider">{label}</p>
                <div className="space-y-1">
                    {Object.entries(categories).map(([cat, amount]) => (
                        <div key={cat} className="flex justify-between text-xs">
                            <span className="capitalize text-slate-700">{CATEGORY_LABELS[cat] || cat}</span>
                            <span className="font-mono text-primary-600">{formatCurrency(amount)}</span>
                        </div>
                    ))}
                    <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between text-xs font-bold text-slate-950">
                        <span>Total</span>
                        <span>{formatCurrency(payload[0].value)}</span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export function ExpenseChart({ expenses, selectedDate, onSelectDate, viewMode = 'daily' }: ExpenseChartProps) {
    const [offset, setOffset] = useState(0); // Weeks or Months offset

    const { data, dateRangeLabel } = useMemo(() => {
        const today = new Date();
        const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

        if (viewMode === 'daily') {
            const end = subWeeks(today, offset);
            const start = subDays(end, 6);
            const interval = eachDayOfInterval({ start, end });

            const startStr = format(start, 'd MMM', { locale: es });
            const endStr = format(end, 'd MMM', { locale: es });

            return {
                dateRangeLabel: `${cap(startStr)} - ${cap(endStr)}`,
                data: interval.map(date => {
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const dayExpenses = expenses.filter(e => isSameDay(parseISO(e.date), date));
                    const total = dayExpenses.reduce((acc, curr) => acc + curr.amount, 0);
                    const categories = dayExpenses.reduce((acc, curr) => {
                        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                        return acc;
                    }, {} as Record<string, number>);

                    // Capitalize day name (lun -> Lun)
                    const dayName = format(date, 'EEE', { locale: es });
                    const capitalizedDay = cap(dayName);

                    return {
                        date: dateStr,
                        day: capitalizedDay,
                        fullDate: format(date, 'd \'de\' MMMM', { locale: es }),
                        amount: total,
                        categories
                    };
                })
            };
        } else {
            // Monthly Mode (Show last 6 months window)
            const end = subMonths(today, offset * 6);
            const start = subMonths(end, 5);
            const interval = eachMonthOfInterval({ start, end });

            const startStr = format(start, 'MMM yyyy', { locale: es });
            const endStr = format(end, 'MMM yyyy', { locale: es });

            return {
                dateRangeLabel: `${cap(startStr)} - ${cap(endStr)}`,
                data: interval.map(date => {
                    const monthKey = format(date, 'yyyy-MM');
                    // Filter expenses in this month
                    const monthExpenses = expenses.filter(e => e.date.startsWith(monthKey));
                    const total = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
                    const categories = monthExpenses.reduce((acc, curr) => {
                        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
                        return acc;
                    }, {} as Record<string, number>);

                    const monthName = format(date, 'MMM', { locale: es });
                    const capitalizedMonth = cap(monthName);

                    return {
                        date: monthKey, // "2024-01"
                        day: capitalizedMonth, // "Ene"
                        fullDate: format(date, 'MMMM yyyy', { locale: es }),
                        amount: total,
                        categories
                    };
                })
            };
        }
    }, [expenses, offset, viewMode]);

    return (
        <div className="w-full mt-4 mb-6 space-y-4">
            <div className="flex items-center justify-between px-2">
                <button
                    onClick={() => setOffset(prev => prev + 1)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-800 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-widest">
                    {offset === 0 ? (viewMode === 'daily' ? 'Últimos 7 días' : 'Últimos 6 meses') : dateRangeLabel}
                </span>
                <button
                    onClick={() => setOffset(prev => Math.max(0, prev - 1))}
                    disabled={offset === 0}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-800 disabled:opacity-20 transition-colors"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                        onClick={(state: any) => {
                            if (state && state.activePayload && state.activePayload[0]) {
                                onSelectDate(state.activePayload[0].payload.date);
                            }
                        }}
                    >
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#78350f', fontSize: 10 }}
                            dy={10}
                        />
                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: 'rgba(251, 195, 138, 0.2)' }}
                        />
                        <Bar dataKey="amount" radius={[6, 6, 6, 6]} maxBarSize={40}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.date === selectedDate ? '#FBC38A' : '#fed7aa'}
                                    className="transition-all duration-300 hover:opacity-100 cursor-pointer"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
