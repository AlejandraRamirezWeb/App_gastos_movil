import { useState } from 'react';
import { MobileLayout } from './components/layout/MobileLayout';
import { ExpenseForm } from './components/ExpenseForm';
import { HistoryList } from './components/HistoryList';
import { ExpenseChart } from './components/ExpenseChart';
import { ContactsList } from './components/ContactsList';
import { Auth } from './components/Auth';
import { useExpenses } from './hooks/useExpenses';
import { useContacts } from './hooks/useContacts';
import { useAuth } from './hooks/useAuth';
import { PlusCircle, History, Users, LogOut } from 'lucide-react';
import { cn } from './lib/utils';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { expenses, loading: expensesLoading, addExpense, updateExpense, deleteExpense } = useExpenses(user?.id);
  const { contacts, loading: contactsLoading, addContact, deleteContact } = useContacts(user?.id);
  const [activeTab, setActiveTab] = useState<'add' | 'history' | 'contacts'>('add');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  if (authLoading || (user && (expensesLoading || contactsLoading))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <MobileLayout className="flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              Mis gastos
            </h1>
            <p className="text-sm text-slate-900">Controla tu dinero</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50">
        <div className="min-h-full">
          {activeTab === 'add' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ExpenseForm
                onAdd={addExpense}
                contacts={contacts}
              />
            </div>
          ) : activeTab === 'history' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="px-6">
                <ExpenseChart
                  expenses={expenses}
                  selectedDate={selectedDate}
                  onSelectDate={(date) => setSelectedDate(selectedDate === date ? null : date)}
                  viewMode={viewMode}
                />
              </div>
              <HistoryList
                expenses={expenses}
                contacts={contacts}
                userId={user?.id}
                selectedDate={selectedDate}
                onDelete={deleteExpense}
                onUpdate={updateExpense}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ContactsList
                contacts={contacts}
                expenses={expenses}
                onAddContact={addContact}
                onDeleteContact={deleteContact}
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t border-slate-200 bg-background/90 backdrop-blur-lg pb-safe">
        <div className="grid grid-cols-3 p-2 gap-2">
          <button
            onClick={() => setActiveTab('add')}
            className={cn(
              "flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95",
              activeTab === 'add'
                ? "bg-primary-50 text-primary-600"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            )}
          >
            <PlusCircle className={cn("w-6 h-6 mb-1", activeTab === 'add' && "fill-current")} />
            <span className="text-[10px] font-medium">Agregar</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95",
              activeTab === 'history'
                ? "bg-primary-50 text-primary-600"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            )}
          >
            <History className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Historial</span>
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={cn(
              "flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95",
              activeTab === 'contacts'
                ? "bg-primary-50 text-primary-600"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            )}
          >
            <Users className={cn("w-6 h-6 mb-1", activeTab === 'contacts' && "fill-current")} />
            <span className="text-[10px] font-medium">Contactos</span>
          </button>
        </div>
      </nav>
    </MobileLayout>
  );
}

export default App;
