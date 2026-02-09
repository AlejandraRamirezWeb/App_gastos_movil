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
import { ReceiptText, History, Users, LogOut, Settings, Wallet, Bell } from 'lucide-react';
import { cn } from './lib/utils';
import { useSettings } from './contexts/SettingsContext';
import { supabase } from './lib/supabase';
import { useAdMob } from './hooks/useAdMob';
import { useNotifications } from './hooks/useNotifications';
import { NotificationsModal } from './components/NotificationsModal';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { contacts, searchContactByCode, requestContact, updateContactName, deleteContact } = useContacts(user?.id);
  const { expenses, addExpense, updateExpense, deleteExpense } = useExpenses(user?.id);
  const { totalFunds, addFunds, deleteFund, updateFund } = useFunds(user?.id);
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
    ...(([] as any[]).concat(totalFunds > 0 ? [{ id: 'total', amount: totalFunds, category: 'Ingreso', date: new Date().toISOString(), description: 'Fondos', type: 'income' }] : []))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const convertedTransactions = transactions.map(t => ({ ...t, amount: convertFromBase(t.amount) })) as Expense[];

  // --- FUNCIONES CON PUBLICIDAD (WRAPPERS) ---

  const handleAddExpenseWithAd = async (expense: any) => {
    await addExpense(expense);
    const newCount = expenseAdCounter + 1;
    setExpenseAdCounter(newCount);
    if (newCount % 2 === 0) showInterstitial();
  };

  const handleAddFundsWithAd = async (amount: number, description?: string) => {
    await addFunds(amount, description);
    showInterstitial(); // Anuncio en Fondos
  };

  const handleRequestContactWithAd = async (friendId: string, name: string) => {
    const success = await requestContact(friendId, name);
    if (success) showInterstitial(); // Anuncio en Contactos
    return success;
  };

  const handleDeleteTransactionWithAd = async (id: string) => {
    // Aquí puedes diferenciar si es un gasto o fondo para borrar
    await deleteExpense(id);
    showInterstitial(); // Anuncio al Borrar
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  if (!user) return <Auth />;

  return (
    <MobileLayout className="flex flex-col">
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div><h1 className="text-2xl font-bold text-slate-950">Mis gastos</h1></div>
          <button onClick={() => { setShowNotifications(true); refreshNotifications(); }} className="relative p-2 text-slate-400">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />}
          </button>
          <button onClick={signOut} className="p-2 text-slate-400"><LogOut className="w-6 h-6" /></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {activeTab === 'add' && <ExpenseForm onAdd={handleAddExpenseWithAd} contacts={contacts} />}

        {activeTab === 'funds' && (
          <FundsManager
            totalFunds={totalIncome}
            currentBalance={currentBalance}
            totalExpenses={totalExpenses}
            onAddFunds={handleAddFundsWithAd} // <--- PUBLICIDAD CONECTADA
          />
        )}

        {activeTab === 'history' && (
          <HistoryList
            expenses={convertedTransactions}
            contacts={contacts}
            userId={user?.id}
            onDelete={handleDeleteTransactionWithAd} // <--- PUBLICIDAD CONECTADA
            onUpdate={updateExpense}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactsList
            contacts={contacts}
            expenses={expenses}
            onDeleteContact={deleteContact}
            onSearchCode={searchContactByCode}
            onRequestContact={handleRequestContactWithAd} // <--- PUBLICIDAD CONECTADA
            onUpdateContactName={updateContactName}
            myFriendCode={myProfile?.friend_code}
          />
        )}
      </main>

      {showNotifications && <NotificationsModal userId={user.id} onClose={() => setShowNotifications(false)} />}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around">
        <button onClick={() => setActiveTab('add')} className={cn(activeTab === 'add' ? "text-primary-600" : "text-slate-400")}><ReceiptText /></button>
        <button onClick={() => setActiveTab('funds')} className={cn(activeTab === 'funds' ? "text-primary-600" : "text-slate-400")}><Wallet /></button>
        <button onClick={() => setActiveTab('history')} className={cn(activeTab === 'history' ? "text-primary-600" : "text-slate-400")}><History /></button>
        <button onClick={() => setActiveTab('contacts')} className={cn(activeTab === 'contacts' ? "text-primary-600" : "text-slate-400")}><Users /></button>
      </nav>
    </MobileLayout>
  );
}

export default App;