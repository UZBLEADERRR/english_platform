import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Search, Ban, CheckCircle, Crown, Zap, ShieldOff } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const load = () => adminApi.getUsers(page, search).then(d => { setUsers(d.users); setTotal(d.total); }).catch(() => {});
  useEffect(() => { load(); }, [page, search]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-white">Foydalanuvchilar ({total})</h1>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Qidirish..." className="input pl-10" />
      </div>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="card flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold overflow-hidden">
              {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : (u.first_name || 'U')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm">{u.first_name || u.username || 'User'}</p>
              <p className="text-slate-400 text-xs">TG:{u.telegram_id} • AI:{u.ai_credits_used}</p>
            </div>
            <span className={`text-xs font-medium ${u.subscription === 'ultra' ? 'text-purple-400' : u.subscription === 'premium' ? 'text-yellow-400' : 'text-slate-400'}`}>{u.subscription}</span>
            {u.is_blocked && <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs">Blocked</span>}
            <div className="flex gap-1">
              <button onClick={() => adminApi.setSubscription(u.id, 'premium').then(load)} title="Premium" className="p-1.5 hover:bg-yellow-500/10 rounded-lg text-yellow-400"><Crown className="w-4 h-4" /></button>
              <button onClick={() => adminApi.setSubscription(u.id, 'ultra').then(load)} title="Ultra" className="p-1.5 hover:bg-purple-500/10 rounded-lg text-purple-400"><Zap className="w-4 h-4" /></button>
              <button onClick={() => adminApi.setSubscription(u.id, 'free').then(load)} title="Free" className="p-1.5 hover:bg-slate-500/10 rounded-lg text-slate-400"><ShieldOff className="w-4 h-4" /></button>
              <button onClick={() => (u.is_blocked ? adminApi.unblockUser(u.id) : adminApi.blockUser(u.id)).then(load)} className={`p-1.5 rounded-lg ${u.is_blocked ? 'text-green-400 hover:bg-green-500/10' : 'text-red-400 hover:bg-red-500/10'}`}>
                {u.is_blocked ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
