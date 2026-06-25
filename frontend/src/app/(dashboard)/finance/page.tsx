"use client";
import { useEffect, useState } from "react";
import { financeAPI } from "@/lib/api";
import { Transaction, SavingsGoal } from "@/types";
import { formatCurrency, formatDateShort, INCOME_CATEGORIES, EXPENSE_CATEGORIES, todayStr } from "@/lib/utils";
import toast from "react-hot-toast";
import { Plus, ArrowUp, ArrowDown, Trash2, X, Loader2, Check, Target, Wallet, TrendingUp, PiggyBank } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { getMonthName } from "@/lib/utils";

const COLORS_PIE = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#14b8a6", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316"];

function TransactionModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [form, setForm] = useState({ type: "expense" as "income" | "expense", category: "food", amount: "", description: "", date: todayStr() });
  const [loading, setLoading] = useState(false);

  const cats = form.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const save = async () => {
    if (!form.amount || Number(form.amount) <= 0) { toast.error("Введите сумму"); return; }
    setLoading(true);
    try {
      await financeAPI.createTransaction({ ...form, amount: Number(form.amount) });
      toast.success("Транзакция добавлена!");
      onSave(); onClose();
    } catch { toast.error("Ошибка"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="font-semibold text-lg">Новая транзакция</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Type toggle */}
          <div className="flex gap-2 bg-secondary rounded-xl p-1">
            {[{ v: "expense", l: "Расход", icon: ArrowDown }, { v: "income", l: "Доход", icon: ArrowUp }].map(opt => (
              <button key={opt.v} onClick={() => setForm(f => ({ ...f, type: opt.v as any, category: opt.v === "income" ? "salary" : "food" }))} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${form.type === opt.v ? (opt.v === "income" ? "bg-emerald-500 text-white" : "bg-red-500 text-white") : "text-muted-foreground hover:text-foreground"}`}>
                <opt.icon className="w-3.5 h-3.5" /> {opt.l}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="0.00" className="w-full pl-8 pr-4 py-3 bg-secondary border border-border rounded-xl text-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary">
            {cats.map(c => <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>)}
          </select>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Описание (необязательно)" className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-secondary transition-colors">Отмена</button>
          <button onClick={save} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [monthlyChart, setMonthlyChart] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense">("all");

  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const load = async () => {
    setLoading(true);
    const [txRes, sumRes, chartRes, sgRes] = await Promise.all([
      financeAPI.listTransactions({ month, year, limit: 100 }),
      financeAPI.getSummary({ month, year }),
      financeAPI.getMonthlyChart(year),
      financeAPI.listSavingsGoals(),
    ]);
    setTransactions(txRes.data);
    setSummary(sumRes.data);
    setMonthlyChart(chartRes.data.map((d: any) => ({ ...d, name: getMonthName(d.month) })));
    setSavingsGoals(sgRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDeleteTx = async (id: string) => {
    await financeAPI.deleteTransaction(id);
    toast.success("Удалено");
    load();
  };

  const filteredTx = transactions.filter(t => activeTab === "all" || t.type === activeTab);

  const expenseByCategory = Object.entries(
    transactions.filter(t => t.type === "expense").reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const allCats = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  const getCatInfo = (val: string) => allCats.find(c => c.value === val);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Финансы</h1>
          <p className="text-muted-foreground text-sm mt-1">{getMonthName(month)} {year}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25">
          <Plus className="w-4 h-4" /> Добавить
        </button>
      </div>

      {/* Stats */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/15"><ArrowUp className="w-5 h-5 text-emerald-400" /></div>
              <span className="text-sm text-muted-foreground">Доходы</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">{formatCurrency(summary.total_income)}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-red-500/15"><ArrowDown className="w-5 h-5 text-red-400" /></div>
              <span className="text-sm text-muted-foreground">Расходы</span>
            </div>
            <p className="text-3xl font-bold text-red-400">{formatCurrency(summary.total_expenses)}</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/15"><PiggyBank className="w-5 h-5 text-indigo-400" /></div>
              <span className="text-sm text-muted-foreground">Сэкономлено</span>
            </div>
            <p className={`text-3xl font-bold ${summary.savings >= 0 ? "text-emerald-400" : "text-red-400"}`}>{formatCurrency(summary.savings)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Доходы и расходы по месяцам</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 5.9% 14%)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(240 5% 55%)" }} />
              <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} />
              <Bar dataKey="income" name="Доходы" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Расходы" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Расходы по категориям</h3>
          {expenseByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={expenseByCategory} cx="40%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS_PIE[i % COLORS_PIE.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(240 10% 7%)", border: "1px solid hsl(240 5.9% 14%)", borderRadius: "0.75rem", fontSize: 12 }} formatter={(v: any) => [formatCurrency(v)]} />
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "hsl(240 5% 55%)" }}>{getCatInfo(v)?.label || v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">Нет расходов</div>}
        </div>
      </div>

      {/* Savings Goals */}
      {savingsGoals.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold mb-4">Цели накоплений</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savingsGoals.map(g => (
              <div key={g.id} className="bg-secondary rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{g.emoji || "🎯"}</span>
                  <div>
                    <p className="font-medium text-sm">{g.title}</p>
                    {g.deadline && <p className="text-[10px] text-muted-foreground">{formatDateShort(g.deadline)}</p>}
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">{formatCurrency(g.current_amount)}</span>
                  <span className="font-bold">{formatCurrency(g.target_amount)}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${g.progress_percent}%`, backgroundColor: g.color }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1 text-right">{g.progress_percent}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Транзакции</h3>
          <div className="flex gap-1 bg-secondary rounded-xl p-1">
            {[{ v: "all", l: "Все" }, { v: "income", l: "Доходы" }, { v: "expense", l: "Расходы" }].map(tab => (
              <button key={tab.v} onClick={() => setActiveTab(tab.v as any)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeTab === tab.v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
                {tab.l}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : filteredTx.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Нет транзакций</div>
        ) : (
          <div className="space-y-2">
            {filteredTx.slice(0, 30).map(tx => {
              const catInfo = getCatInfo(tx.category);
              return (
                <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${tx.type === "income" ? "bg-emerald-500/15" : "bg-red-500/15"}`}>
                    {catInfo?.emoji || (tx.type === "income" ? "💰" : "💸")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description || catInfo?.label || tx.category}</p>
                    <p className="text-[10px] text-muted-foreground">{formatDateShort(tx.date)} • {catInfo?.label || tx.category}</p>
                  </div>
                  <span className={`text-sm font-bold flex-shrink-0 ${tx.type === "income" ? "text-emerald-400" : "text-red-400"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>
                  <button onClick={() => handleDeleteTx(tx.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && <TransactionModal onClose={() => setShowModal(false)} onSave={load} />}
    </div>
  );
}
