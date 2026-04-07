import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Users, CreditCard, TrendingUp, Clock, Zap, Crown, DollarSign, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [payStats, setPayStats] = useState<any>({});
  const [tokenStats, setTokenStats] = useState<any>({});

  useEffect(() => {
    adminApi.getUserStats().then(setStats).catch(() => {});
    adminApi.getPaymentStats().then(setPayStats).catch(() => {});
    adminApi.getTokenStats().then(setTokenStats).catch(() => {});
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

      {/* AI Token Usage & Revenue */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-white">Gemini AI Token Sarfi & Xarajatlar</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Input Tokens</p>
            <p className="text-xl font-bold text-blue-400">{(tokenStats.totalInputTokens || 0).toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-1">$1 / 1M token</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Output Tokens</p>
            <p className="text-xl font-bold text-purple-400">{(tokenStats.totalOutputTokens || 0).toLocaleString()}</p>
            <p className="text-[10px] text-slate-500 mt-1">$5 / 1M token</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Input xarajat</p>
            <p className="text-xl font-bold text-green-400">${tokenStats.inputCostUSD || '0.0000'}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Output xarajat</p>
            <p className="text-xl font-bold text-orange-400">${tokenStats.outputCostUSD || '0.0000'}</p>
          </div>
        </div>
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-xl p-4 border border-indigo-500/30">
          <div className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-400" />
            <span className="text-white font-medium">Jami AI xarajat:</span>
          </div>
          <span className="text-2xl font-bold text-green-400">${tokenStats.totalCostUSD || '0.0000'}</span>
        </div>
      </div>

      {/* Subscription Limits Info */}
      <div className="card space-y-3">
        <h3 className="font-bold text-white">📋 Obuna Cheklovlari (hozirgi)</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-xl p-3 text-center border border-slate-700">
            <p className="text-sm font-bold text-slate-300">Free</p>
            <p className="text-xs text-slate-400 mt-2">AI Chat: <span className="text-white font-bold">3</span> / kun</p>
            <p className="text-xs text-slate-400">Grammar: <span className="text-white font-bold">1</span> / kun</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center border border-yellow-500/30">
            <p className="text-sm font-bold text-yellow-400">⭐ Premium</p>
            <p className="text-xs text-slate-400 mt-2">AI Chat: <span className="text-white font-bold">20</span> / kun</p>
            <p className="text-xs text-slate-400">Grammar: <span className="text-white font-bold">5</span> / kun</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-3 text-center border border-purple-500/30">
            <p className="text-sm font-bold text-purple-400">💎 Ultra</p>
            <p className="text-xs text-slate-400 mt-2">AI Chat: <span className="text-white font-bold">∞</span></p>
            <p className="text-xs text-slate-400">Grammar: <span className="text-white font-bold">∞</span></p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-white mb-2">Jami AI kredit sarfi</h3>
        <p className="text-3xl font-bold text-indigo-400">{stats.totalAiCredits || 0} <span className="text-sm text-slate-400">credit</span></p>
      </div>
    </div>
  );
}
