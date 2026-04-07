import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Users, CreditCard, TrendingUp, Clock, Zap, Crown } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [payStats, setPayStats] = useState<any>({});

  useEffect(() => {
    adminApi.getUserStats().then(setStats).catch(() => {});
    adminApi.getPaymentStats().then(setPayStats).catch(() => {});
  }, []);

  const cards = [
    { label: 'Jami foydalanuvchilar', value: stats.totalUsers || 0, icon: Users, color: 'text-blue-400 bg-blue-500/10' },
    { label: 'Premium', value: stats.premiumUsers || 0, icon: Crown, color: 'text-yellow-400 bg-yellow-500/10' },
    { label: 'Ultra', value: stats.ultraUsers || 0, icon: Zap, color: 'text-purple-400 bg-purple-500/10' },
    { label: 'Bugun yangi', value: stats.todayUsers || 0, icon: TrendingUp, color: 'text-green-400 bg-green-500/10' },
    { label: "To'lovlar (tasdiqlangan)", value: payStats.totalPayments || 0, icon: CreditCard, color: 'text-emerald-400 bg-emerald-500/10' },
    { label: "Kutilayotgan to'lovlar", value: payStats.pendingPayments || 0, icon: Clock, color: 'text-orange-400 bg-orange-500/10' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="card flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{c.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card">
        <h3 className="font-bold text-white mb-2">Jami AI kredit sarfi</h3>
        <p className="text-3xl font-bold text-indigo-400">{stats.totalAiCredits || 0} <span className="text-sm text-slate-400">token</span></p>
      </div>
    </div>
  );
}
