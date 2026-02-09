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
  const { contacts, loading: contactsLoading, addContact, deleteContact, searchContactByCode, requestContact, updateContactName } = useContacts(user?.id);
  const { expenses, loading: expensesLoading, addExpense, updateExpense, deleteExpense } = useExpenses(user?.id);
  const { totalFunds, addFunds, funds, updateFund, deleteFund } = useFunds(user?.id);
  const { unreadCount, refresh: refreshNotifications } = useNotifications(user?.id);

  // Hook de Publicidad
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
    ...(funds || []).map(f => ({ ...f, amount: f.amount, category: 'Ingreso', date: f.created_at, description: f.description || 'Ingreso', type: 'income' as const, user_id: f.user_id }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const convertedTransactions = transactions.map(t => ({ ...t, amount: convertFromBase(t.amount) })) as Expense[];

  // --- WRAPPERS CON PUBLICIDAD REFORZADA ---

  const handleAddExpenseWithAd = async (expense: any) => {
    await addExpense(expense);
    const newCount = expenseAdCounter + 1;
    setExpenseAdCounter(newCount);

    // Mostramos anuncio cada 2 gastos
    if (newCount % 2 === 0) {
      showInterstitial();
    }
  };

  const handleAddFundsWithAd = async (amount: number, description?: string) => {
    await addFunds(amount, description);
    // En fondos siempre mostramos anuncio
    showInterstitial();
  };

  const handleAddContactWithAd = async (name: string) => {
    await addContact(name);
    showInterstitial();
  };

  const handleRequestContactWithAd = async (friendId: string, name: string) => {
    const success = await requestContact(friendId, name);
    if (success) showInterstitial();
    return success;
  };

  const handleDeleteTransactionWithAd = async (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    if (transaction.type === 'income') await deleteFund(id);
    else await deleteExpense(id);
    // Al eliminar siempre mostramos anuncio
    showInterstitial();
  };

  const handleUpdateTransaction = async (id: string, updates: any) => {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    if (transaction.type === 'income') await updateFund(id, updates);
    else await updateExpense(id, updates);
  };

  // --- RENDER ---

  if (authLoading || (user && (expensesLoading || contactsLoading))) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Auth />;

  return (
    <MobileLayout className="flex flex-col">
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <div><h1 className="text-2xl font-bold text-slate-950">Mis gastos</h1><p className="text-sm text-slate-900">Controla tu dinero</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setShowNotifications(true); refreshNotifications(); }} className="relative p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all">
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />}
            </button>
            <div className="relative">
              <button onClick={() => setShowSettings(!showSettings)} className={cn("p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all", showSettings && "text-primary-600 bg-primary-50")}>
                <Settings className="w-6 h-6" />
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-slate-100 mb-1"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Moneda</p></div>
                  <button onClick={() => { setCurrency('COP'); setShowSettings(false); }} className={cn("w-full px-4 py-3 text-left text-sm flex justify-between", currency === 'COP' ? "text-primary-600 font-bold bg-primary-50" : "text-slate-600")}><span>Peso (COP)</span>{currency === 'COP' && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}</button>
                  <button onClick={() => { setCurrency('AUD'); setShowSettings(false); }} className={cn("w-full px-4 py-3 text-left text-sm flex justify-between", currency === 'AUD' ? "text-primary-600 font-bold bg-primary-50" : "text-slate-600")}><span>Dólar (AUD)</span>{currency === 'AUD' && <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />}</button>
                </div>
              )}
            </div>
            <button onClick={signOut} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><LogOut className="w-6 h-6" /></button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50 pb-24">
        <div className="min-h-full">
          {activeTab === 'add' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ExpenseForm onAdd={handleAddExpenseWithAd} contacts={contacts} />
            </div>
          ) : activeTab === 'history' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                userId={user?.id}
                selectedDate={selectedDate}
                onDelete={handleDeleteTransactionWithAd}
                onUpdate={handleUpdateTransaction}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
            </div>
          ) : activeTab === 'funds' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <FundsManager totalFunds={totalIncome} currentBalance={currentBalance} totalExpenses={totalExpenses} onAddFunds={handleAddFundsWithAd} />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ContactsList
                contacts={contacts}
                expenses={convertedTransactions.filter(t => t.type === 'expense')}
                onAddContact={handleAddContactWithAd}
                onDeleteContact={deleteContact}
                onSearchCode={searchContactByCode}
                onRequestContact={handleRequestContactWithAd}
                onUpdateContactName={updateContactName}
                myFriendCode={myProfile?.friend_code}
              />
            </div>
          )}
        </div>
      </main>

      {showNotifications && user && <NotificationsModal userId={user.id} onClose={() => setShowNotifications(false)} />}

      <nav className="fixed bottom-0 left-0 right-0 mx-auto w-full max-w-md border-t border-slate-200 bg-background/95 backdrop-blur-lg pb-safe z-30">
        <div className="grid grid-cols-4 p-2 gap-2">
          <button onClick={() => setActiveTab('add')} className={cn("flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95", activeTab === 'add' ? "bg-primary-50 text-primary-600" : "text-slate-400 hover:bg-slate-100")}><ReceiptText className={cn("w-6 h-6 mb-1", activeTab === 'add' && "fill-current text-primary-600/20")} /><span className="text-[10px] font-medium">Gastos</span></button>
          <button onClick={() => setActiveTab('funds')} className={cn("flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95", activeTab === 'funds' ? "bg-primary-50 text-primary-600" : "text-slate-400 hover:bg-slate-100")}><Wallet className={cn("w-6 h-6 mb-1", activeTab === 'funds' && "fill-current")} /><span className="text-[10px] font-medium">Fondos</span></button>
          <button onClick={() => setActiveTab('history')} className={cn("flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95", activeTab === 'history' ? "bg-primary-50 text-primary-600" : "text-slate-400 hover:bg-slate-100")}><History className="w-6 h-6 mb-1" /><span className="text-[10px] font-medium">Historial</span></button>
          <button onClick={() => setActiveTab('contacts')} className={cn("flex flex-col items-center justify-center py-3 rounded-xl transition-all active:scale-95", activeTab === 'contacts' ? "bg-primary-50 text-primary-600" : "text-slate-400 hover:bg-slate-100")}><Users className={cn("w-6 h-6 mb-1", activeTab === 'contacts' && "fill-current")} /><span className="text-[10px] font-medium">Contactos</span></button>
        </div>
      </nav>
    </MobileLayout>
  );
}

export default App;