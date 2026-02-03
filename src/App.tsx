import { useState } from 'react';
import { MobileLayout } from './components/layout/MobileLayout';
import { ExpenseForm } from './components/ExpenseForm';
import { HistoryList } from './components/HistoryList';
import { ExpenseChart } from './components/ExpenseChart';
import { ContactsList } from './components/ContactsList';
import { Auth } from './components/Auth';
import { useExpenses } from './hooks/useExpenses';
import type { Expense } from './hooks/useExpenses';
import { useContacts } from './hooks/useContacts';
import { useAuth } from './hooks/useAuth';
import { useFunds } from './hooks/useFunds';
import { ReceiptText, History, Users, LogOut, Settings, Wallet } from 'lucide-react';
import { cn } from './lib/utils';
import { useSettings } from './contexts/SettingsContext';
import { FundsManager } from './components/FundsManager';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { expenses, loading: expensesLoading, addExpense, updateExpense, deleteExpense } = useExpenses(user?.id);
  const { contacts, loading: contactsLoading, addContact, deleteContact } = useContacts(user?.id);
  const { totalFunds, addFunds, funds, updateFund, deleteFund } = useFunds(user?.id);
  const [activeTab, setActiveTab] = useState<'add' | 'history' | 'contacts' | 'funds'>('add');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const { currency, setCurrency, convertFromBase } = useSettings();
  const [showSettings, setShowSettings] = useState(false);

  // Math Conversion
  const totalExpenses = convertFromBase(expenses.reduce((acc, curr) => acc + curr.amount, 0));
  const totalIncome = convertFromBase(totalFunds);
  const currentBalance = totalIncome - totalExpenses;

  // Merge transactions
  const transactions = [
    ...expenses.map(e => ({ ...e, type: 'expense' as const })),
    ...(funds || []).map(f => ({
      id: f.id,
      amount: f.amount,
      category: 'Ingreso',
      date: f.created_at,
      description: f.description || 'Ingreso de fondos',
      type: 'income' as const,
      user_id: f.user_id
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Convert transactions for UI
  const convertedTransactions = transactions.map(t => ({
    ...t,
    amount: convertFromBase(t.amount)
  })) as Expense[];

  const handleUpdateTransaction = async (id: string, updates: any) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    if (transaction.type === 'income') {
      await updateFund(id, updates);
    } else {
      await updateExpense(id, updates);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;

    if (transaction.type === 'income') {
      await deleteFund(id);
    } else {
      await deleteExpense(id);
    }
  };

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
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all",
                  showSettings && "text-primary-600 bg-primary-50"
                )}
                title="Configuración"
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettings && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moneda</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrency('COP');
                      setShowSettings(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between",
                      currency === 'COP' ? "text-primary-600 font-semibold bg-primary-50/50" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span>Peso Colombiano (COP)</span>
                    {currency === 'COP' && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                  </button>
                  <button
                    onClick={() => {
                      setCurrency('AUD');
                      setShowSettings(false);
                    }}
                    className={cn(
                      "w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between",
                      currency === 'AUD' ? "text-primary-600 font-semibold bg-primary-50/50" : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <span>Dólar Australiano (AUD)</span>
                    {currency === 'AUD' && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
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
                  expenses={convertedTransactions}
                  selectedDate={selectedDate}
                  onSelectDate={(date) => setSelectedDate(selectedDate === date ? null : date)}
                  viewMode={viewMode}
                />
              </div>
              <HistoryList
                expenses={convertedTransactions}
                contacts={contacts}
                userId={user?.id}
                selectedDate={selectedDate}
                onDelete={handleDeleteTransaction}
                onUpdate={handleUpdateTransaction}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
          ) : activeTab === 'funds' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <FundsManager
                totalFunds={totalIncome}
                currentBalance={currentBalance}
                totalExpenses={totalExpenses}
                onAddFunds={addFunds}
              />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ContactsList
                contacts={contacts}
                expenses={convertedTransactions.filter(t => t.type === 'expense')}
                onAddContact={addContact}
                onDeleteContact={deleteContact}
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t border-slate-200 bg-background/90 backdrop-blur-lg pb-safe">
        <div className="grid grid-cols-4 p-2 gap-2">
          <button
            onClick={() => setActiveTab('add')}
            className={cn(
              "flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95",
              activeTab === 'add'
                ? "bg-primary-50 text-primary-600"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            )}
          >
            <ReceiptText className={cn("w-6 h-6 mb-1", activeTab === 'add' && "fill-current text-primary-600/20")} />
            <span className="text-[10px] font-medium">Gastos</span>
          </button>
          <button
            onClick={() => setActiveTab('funds')}
            className={cn(
              "flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95",
              activeTab === 'funds'
                ? "bg-primary-50 text-primary-600"
                : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            )}
          >
            <Wallet className={cn("w-6 h-6 mb-1", activeTab === 'funds' && "fill-current")} />
            <span className="text-[10px] font-medium">Fondos</span>
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
