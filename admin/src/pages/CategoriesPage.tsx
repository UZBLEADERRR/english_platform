import React, { useState, useEffect } from 'react';
import adminApi from '../api';
import { Save } from 'lucide-react';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const load = () => adminApi.getCategories().then(setCategories).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleUpdate = async (id: string, data: any) => {
    await adminApi.updateCategory(id, data); load();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-white">Kategoriyalar</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map(cat => (
          <div key={cat.id} className="card space-y-3">
            <div className="flex items-center gap-3">
              {cat.image_url && <img src={cat.image_url} alt="" className="w-16 h-12 rounded-lg object-cover" />}
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{cat.id}</p>
                <p className="text-slate-400 text-xs">{cat.custom_name}</p>
              </div>
            </div>
            <input defaultValue={cat.image_url || ''} placeholder="Rasm URL" className="input"
              onBlur={e => e.target.value !== cat.image_url && handleUpdate(cat.id, { image_url: e.target.value })} />
            <input defaultValue={cat.custom_name || ''} placeholder="Maxsus nom" className="input"
              onBlur={e => e.target.value !== cat.custom_name && handleUpdate(cat.id, { custom_name: e.target.value })} />
          </div>
        ))}
      </div>
    </div>
  );
}
