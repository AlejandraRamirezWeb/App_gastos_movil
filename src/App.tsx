import { useState } from 'react';
import { MobileLayout } from './components/layout/MobileLayout';
import { ExpenseForm } from './components/ExpenseForm';
import { HistoryList } from './components/HistoryList';
import { ExpenseChart } from './components/ExpenseChart';
import { useExpenses } from './hooks/useExpenses';
import { PlusCircle, History } from 'lucide-react';
import { cn, formatCurrency } from './lib/utils';

function App() {
  const { expenses, addExpense, deleteExpense } = useExpenses();
  const [activeTab, setActiveTab] = useState<'add' | 'history'>('add');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');

  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <MobileLayout className="flex flex-col">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex justify-between items-center bg-background/80 backdrop-blur-md sticky top-0 z-20 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">
            Mis gastos
          </h1>
          <p className="text-sm text-slate-900">Controla tu dinero</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-900 uppercase tracking-wider">Total</p>
          <p className="text-xl font-mono font-medium text-slate-950">{formatCurrency(totalExpenses)}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide bg-slate-50">
        <div className="min-h-full">
          {activeTab === 'add' ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <ExpenseForm onAdd={
                (expense) => {
                  addExpense(expense);
                  // setActiveTab('history'); // Removed per user request
                  // Actually, user might want to add multiple. I'll just add it.
                  // Wait, "addExpense" is from hook.
                }
              } />
            </div>
          ) : (
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
                selectedDate={selectedDate}
                onDelete={deleteExpense}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
              />
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="border-t border-slate-200 bg-background/90 backdrop-blur-lg pb-safe">
        <div className="grid grid-cols-2 p-2 gap-2">
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
        </div>
      </nav>
    </MobileLayout>
  );
}

export default App;
