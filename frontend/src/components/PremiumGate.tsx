import React from 'react';
import { cn } from '../Layout';

export default function PremiumGate({ children, requiredPlan = 'premium', userPlan = 'free', onUpgrade }: {
  children: React.ReactNode;
  requiredPlan?: 'premium' | 'ultra';
  userPlan?: string;
  onUpgrade?: () => void;
}) {
  const planOrder = { free: 0, premium: 1, ultra: 2 };
  const hasAccess = (planOrder[userPlan as keyof typeof planOrder] || 0) >= (planOrder[requiredPlan] || 1);

  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none opacity-50">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-2xl">
        <div className="text-center p-6">
          <div className="w-16 h-16 mx-auto mb-3 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <span className="text-3xl">🔒</span>
          </div>
          <p className="text-white font-bold text-lg mb-1">
            {requiredPlan === 'ultra' ? 'Ultra' : 'Premium'} Content
          </p>
          <p className="text-white/70 text-sm mb-4">Bu kontent uchun {requiredPlan} kerak</p>
          <button
            onClick={onUpgrade}
            className="px-6 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-full hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
          >
            {requiredPlan === 'ultra' ? 'Ultra' : 'Premium'} olish ✨
          </button>
        </div>
      </div>
    </div>
  );
}
