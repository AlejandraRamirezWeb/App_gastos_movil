import { useState, useEffect } from 'react';
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
import { FundsManager } from './components/FundsManager';
import { ReceiptText, History, Users, LogOut, Wallet, Bell, Settings as SettingsIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { useSettings } from './contexts/SettingsContext';
import { supabase } from './lib/supabase';
import { useAdMob } from './hooks/useAdMob';
import { useNotifications } from './hooks/useNotifications';
import { NotificationsModal } from './components/NotificationsModal';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { contacts, searchContactByCode, requestContact, updateContactName, deleteContact, addContact } = useContacts(user?.id);
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses(user?.id);
  const { totalFunds, addFunds } = useFunds(user?.id);
  const { unreadCount, refresh: refreshNotifications } = useNotifications(user?.id);

  const { showInterstitial } = useAdMob();
  const [expenseAdCounter, setExpenseAdCounter] = useState(0);

  const [activeTab, setActiveTab] = useState<'add' | 'history' | 'contacts' | 'funds'>('add');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [myProfile, setMyProfile] = useState<any>(null);
  const { currency, setCurrency, convertFromBase } = useSettings();

  useEffect(() => {
    if (user) {
      supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => { if (data) setMyProfile(data); });
    }
  }, [user]);

  const totalExpenses = convertFromBase(expenses.reduce((acc, curr) => acc + curr.amount, 0));
  const totalIncome = convertFromBase(totalFunds);
  const currentBalance = totalIncome - totalExpenses;

  const transactions = [
    ...expenses.map(e => ({ ...e, type: 'expense' as const })),
    ...(([] as any[]).concat(totalFunds > 0 ? [{ id: 'total-income', amount: totalFunds, category: 'Ingreso', date: new Date().toISOString(), description: 'Fondos Disponibles', type: 'income' }] : []))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const convertedTransactions = transactions.map(t => ({ ...t, amount: convertFromBase(t.amount) })) as Expense[];

  // --- WRAPPERS ---
  const handleAddExpenseWithAd = async (expense: any) => {
    await addExpense(expense);
    const newCount = expenseAdCounter + 1;
    setExpenseAdCounter(newCount);
    if (newCount % 2 === 0) showInterstitial();
  };

  const handleAddFundsWithAd = async (amount: number, description?: string) => {
    await addFunds(amount, description);
    showInterstitial();
  };

  const handleRequestContactWithAd = async (friendId: string, name: string) => {
    const success = await requestContact(friendId, name);
    if (success) showInterstitial();
    return success;
  };

  const handleDeleteTransactionWithAd = async (id: string) => {
    await deleteExpense(id);
    showInterstitial();
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!user) return <Auth />;

  return (
    <MobileLayout className="flex flex-col">
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div><h1 className="text-2xl font-bold text-slate-950">Mis gastos</h1></div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowNotifications(true); refreshNotifications(); }} className="relative p-2 text-slate-400">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
            </button>
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className="p-2 text-slate-400">
                <SettingsIcon className="w-6 h-6" />
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <button onClick={() => { setCurrency('COP'); setShowSettings(false); }} className={cn("w-full px-4 py-3 text-left text-sm", currency === 'COP' && "text-primary-600 font-bold")}>Peso (COP)</button>
                  <button onClick={() => { setCurrency('AUD'); setShowSettings(false); }} className={cn("w-full px-4 py-3 text-left text-sm", currency === 'AUD' && "text-primary-600 font-bold")}>Dólar (AUD)</button>
                </div>
              )}
            </div>
            <button onClick={signOut} className="p-2 text-slate-400"><LogOut className="w-6 h-6" /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'add' && <ExpenseForm onAdd={handleAddExpenseWithAd} contacts={contacts} />}

        {activeTab === 'funds' && (
          <FundsManager totalFunds={totalIncome} currentBalance={currentBalance} totalExpenses={totalExpenses} onAddFunds={handleAddFundsWithAd} />
        )}

        {activeTab === 'history' && (
          <>
            <div className="px-6">
              <ExpenseChart
                expenses={convertedTransactions.filter(t => selectedCategory === 'all' ? true : selectedCategory === 'income' ? t.type === 'income' : t.category === selectedCategory)}
                selectedDate={selectedDate}
                onSelectDate={(date) => setSelectedDate(selectedDate === date ? null : date)}
                viewMode={viewMode}
              />
            </div>
            <HistoryList
              expenses={convertedTransactions}
              contacts={contacts}
              userId={user.id}
              selectedDate={selectedDate} // Re-añadido
              onDelete={handleDeleteTransactionWithAd}
              onUpdate={updateExpense}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
            />
          </>
        )}

        {activeTab === 'contacts' && (
          <ContactsList
            contacts={contacts}
            expenses={expenses}
            onAddContact={addContact} // Re-añadido
            onDeleteContact={deleteContact}
            onSearchCode={searchContactByCode}
            onRequestContact={handleRequestContactWithAd}
            onUpdateContactName={updateContactName}
            myFriendCode={myProfile?.friend_code}
          />
        )}
      </main>

      {showNotifications && <NotificationsModal userId={user.id} onClose={() => setShowNotifications(false)} />}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around">
        <button onClick={() => setActiveTab('add')} className={cn("flex flex-col items-center", activeTab === 'add' ? "text-primary-600" : "text-slate-400")}><ReceiptText className="w-6 h-6" /><span className="text-[10px]">Gastos</span></button>
        <button onClick={() => setActiveTab('funds')} className={cn("flex flex-col items-center", activeTab === 'funds' ? "text-primary-600" : "text-slate-400")}><Wallet className="w-6 h-6" /><span className="text-[10px]">Fondos</span></button>
        <button onClick={() => setActiveTab('history')} className={cn("flex flex-col items-center", activeTab === 'history' ? "text-primary-600" : "text-slate-400")}><History className="w-6 h-6" /><span className="text-[10px]">Historial</span></button>
        <button onClick={() => setActiveTab('contacts')} className={cn("flex flex-col items-center", activeTab === 'contacts' ? "text-primary-600" : "text-slate-400")}><Users className="w-6 h-6" /><span className="text-[10px]">Contactos</span></button>
      </nav>
    </MobileLayout>
  );
}

export default App;