import { useState } from 'react';
import { Plus, Coffee, Car, Music, Receipt, ShoppingBag, CircleDollarSign, Users } from 'lucide-react';
import type { Expense } from '../hooks/useExpenses';
import type { Contact } from '../hooks/useContacts';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { useSettings } from '../contexts/SettingsContext';

interface ExpenseFormProps {
    onAdd: (expense: Omit<Expense, 'id' | 'user_id'>) => void;
    contacts: Contact[];
}

const CATEGORIES = [
    { id: 'food', label: 'Comida', icon: Coffee },
    { id: 'transport', label: 'Transporte', icon: Car },
    { id: 'entertainment', label: 'Diversión', icon: Music },
    { id: 'bills', label: 'Servicios', icon: Receipt },
    { id: 'shopping', label: 'Compras', icon: ShoppingBag },
    { id: 'other', label: 'Otro', icon: CircleDollarSign },
];

export function ExpenseForm({ onAdd, contacts }: ExpenseFormProps) {
    const { currency, convertToBase } = useSettings();
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0].id);
    const [description, setDescription] = useState('');
    const [isGroup, setIsGroup] = useState(false);
    const [selectedContactId, setSelectedContactId] = useState<string>('');
    const [splitPercentage, setSplitPercentage] = useState(50);

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Remove non-numeric chars
        const rawValue = e.target.value.replace(/\D/g, '');

        if (rawValue === '') {
            setAmount('');
            return;
        }

        // Convert to number and then format
        const numberValue = parseInt(rawValue, 10);
        const locale = currency === 'COP' ? 'es-CO' : 'en-AU';
        setAmount(new Intl.NumberFormat(locale).format(numberValue));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('ExpenseForm: handleSubmit called');

        // Parse the formatted string back to number
        // We remove everything that is not a digit to be safe across different separators
        const cleanedAmount = amount.replace(/\D/g, '');
        const numericAmount = parseInt(cleanedAmount, 10);

        console.log('ExpenseForm: amount raw:', amount, 'cleaned:', cleanedAmount, 'numeric:', numericAmount);

        if (!numericAmount || numericAmount <= 0) {
            console.warn('ExpenseForm: Invalid amount, returning');
            return;
        }

        // Calculate split description and adjusted amount
        let finalDescription = description;
        let finalAmount = numericAmount;

        if (isGroup && selectedContactId) {
            const mySharePercent = splitPercentage;
            const theirSharePercent = 100 - splitPercentage;

            // Calculate my share in currency
            finalAmount = Math.round(numericAmount * (mySharePercent / 100));

            const splitNote = `(Total: ${amount} | División: ${mySharePercent}%/${theirSharePercent}%)`;
            finalDescription = description ? `${description} ${splitNote}` : splitNote;
        }

        const expenseData = {
            date,
            amount: convertToBase(finalAmount),
            category,
            description: finalDescription,
            ...(isGroup && selectedContactId && {
                isGroup: true,
                contactId: selectedContactId
            })
        };

        console.log('ExpenseForm: Calling onAdd with', expenseData);
        onAdd(expenseData);

        setAmount('');
        setDescription('');
        setIsGroup(false);
        setSelectedContactId('');
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 px-6 pt-6 pb-24">

            {/* Amount Input */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Monto</label>
                <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-light text-slate-400 group-focus-within:text-slate-900 transition-colors">
                        $
                    </span>
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

            {/* Group Expense Toggle */}
            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => {
                        setIsGroup(!isGroup);
                        if (isGroup) setSelectedContactId('');
                    }}
                    className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all shadow-sm",
                        isGroup
                            ? "bg-purple-50 border-purple-500 text-purple-700"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                >
                    <div className="flex items-center gap-3">
                        <Users className={cn("w-5 h-5", isGroup ? "text-purple-600" : "text-slate-400")} />
                        <div className="text-left">
                            <p className="font-medium text-sm">Gasto grupal</p>
                            <p className="text-xs opacity-75">Compartir con un contacto</p>
                        </div>
                    </div>
                    <div className={cn(
                        "w-12 h-7 rounded-full transition-all relative",
                        isGroup ? "bg-purple-600" : "bg-slate-300"
                    )}>
                        <div className={cn(
                            "absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm",
                            isGroup ? "right-1" : "left-1"
                        )} />
                    </div>
                </button>

                {/* Contact Selector & Split Slider */}
                {isGroup && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200 bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-purple-700 uppercase tracking-wider block">
                                ¿Con quién compartes?
                            </label>
                            {contacts.length === 0 ? (
                                <div className="bg-white/50 border border-purple-100 rounded-xl p-3 text-center">
                                    <p className="text-xs text-purple-600">
                                        No hay contactos. Ve a la pestaña de Contactos para añadir uno.
                                    </p>
                                </div>
                            ) : (
                                <select
                                    value={selectedContactId}
                                    onChange={e => setSelectedContactId(e.target.value)}
                                    className="w-full bg-white border border-purple-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-sm appearance-none font-medium"
                                    required={isGroup}
                                >
                                    <option value="">Selecciona un contacto</option>
                                    {contacts.map(contact => (
                                        <option key={contact.id} value={contact.id}>
                                            {contact.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {selectedContactId && (
                            <div className="space-y-4 pt-2 border-t border-purple-100">
                                <div className="flex justify-between items-end">
                                    <label className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                                        División del gasto
                                    </label>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-purple-700">{splitPercentage}%</span>
                                        <span className="text-[10px] text-purple-400 mx-1">/</span>
                                        <span className="text-sm font-bold text-slate-500">{100 - splitPercentage}%</span>
                                    </div>
                                </div>

                                <div className="relative pt-1">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={splitPercentage}
                                        onChange={(e) => setSplitPercentage(parseInt(e.target.value))}
                                        className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                    />
                                    <div className="flex justify-between mt-2 text-[10px] font-medium text-purple-400">
                                        <span>Yo pago todo</span>
                                        <span>Mitad y mitad</span>
                                        <span>Paga todo {contacts.find(c => c.id === selectedContactId)?.name.split(' ')[0]}</span>
                                    </div>
                                </div>

                                <div className="bg-purple-600/5 rounded-xl p-3 flex justify-between items-center">
                                    <div className="text-center flex-1">
                                        <p className="text-[10px] text-purple-500 uppercase">Mi parte</p>
                                        <p className="text-sm font-bold text-purple-700">
                                            {amount ? `$${new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'en-AU').format(Math.round(parseInt(amount.replace(/\D/g, '')) * (splitPercentage / 100)))}` : '$0'}
                                        </p>
                                    </div>
                                    <div className="w-px h-8 bg-purple-200" />
                                    <div className="text-center flex-1">
                                        <p className="text-[10px] text-slate-500 uppercase">Su parte</p>
                                        <p className="text-sm font-bold text-slate-700">
                                            {amount ? `$${new Intl.NumberFormat(currency === 'COP' ? 'es-CO' : 'en-AU').format(Math.round(parseInt(amount.replace(/\D/g, '')) * ((100 - splitPercentage) / 100)))}` : '$0'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={isGroup && !selectedContactId}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary-900/20 disabled:shadow-none"
            >
                <Plus className="w-5 h-5" />
                Agregar gasto
            </button>
        </form>
    );
}
