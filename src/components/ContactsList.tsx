import { useState } from 'react';
import { UserPlus, Users, Trash2 } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import type { Contact } from '../hooks/useContacts';
import type { Expense } from '../hooks/useExpenses';
import { formatCurrency, cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';

interface ContactsListProps {
    contacts: Contact[];
    expenses: Expense[];
    onAddContact: (name: string) => void;
    onDeleteContact: (id: string) => void;
}

export function ContactsList({ contacts, expenses, onAddContact, onDeleteContact }: ContactsListProps) {
    const { currency } = useSettings();
    const [newContactName, setNewContactName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (newContactName.trim()) {
            onAddContact(newContactName.trim());
            setNewContactName('');
            setIsAdding(false);
        }
    };

    const getContactExpenses = (contactId: string) => {
        return expenses.filter(e => e.contactId === contactId && e.isGroup);
    };

    const getContactTotal = (contactId: string) => {
        return getContactExpenses(contactId).reduce((acc, curr) => acc + curr.amount, 0);
    };

    return (
        <div className="space-y-6 px-6 pt-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-950">Contactos</h2>
                    <p className="text-sm text-slate-600">Gestiona tus gastos grupales</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={cn(
                        "p-3 rounded-xl transition-all active:scale-95",
                        isAdding
                            ? "bg-slate-200 text-slate-700"
                            : "bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-900/20"
                    )}
                >
                    <UserPlus className="w-5 h-5" />
                </button>
            </div>

            {/* Add Contact Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
                                Nombre del contacto
                            </label>
                            <input
                                type="text"
                                value={newContactName}
                                onChange={e => setNewContactName(e.target.value)}
                                placeholder="Ej: Juan Pérez"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all font-medium"
                                autoFocus
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-md shadow-primary-900/10"
                        >
                            Añadir Contacto
                        </button>
                    </div>
                </form>
            )}

            {/* Contacts List */}
            {contacts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="text-sm">Aún no hay contactos</p>
                    <p className="text-xs text-slate-400 mt-1">Añade contactos para llevar gastos grupales</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {contacts.map(contact => {
                        const total = getContactTotal(contact.id);
                        const expenseCount = getContactExpenses(contact.id).length;

                        return (
                            <div
                                key={contact.id}
                                className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                                            <span className="text-lg font-bold text-primary-600">
                                                {contact.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900">{contact.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {expenseCount} {expenseCount === 1 ? 'gasto' : 'gastos'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-slate-900">
                                                {formatCurrency(total, currency)}
                                            </p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Total</p>
                                        </div>
                                        <button
                                            onClick={() => setContactToDelete(contact.id)}
                                            className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors active:scale-95"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmModal
                isOpen={!!contactToDelete}
                onClose={() => setContactToDelete(null)}
                onConfirm={() => contactToDelete && onDeleteContact(contactToDelete)}
                title="¿Eliminar contacto?"
                message="Esta acción no se puede deshacer y podrías perder la referencia en tus gastos compartidos."
            />
        </div>
    );
}
