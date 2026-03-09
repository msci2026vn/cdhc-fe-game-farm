import React from 'react';
import type { VipPlan } from '@/shared/types/game-api.types';
import { VipPlanCard } from '../VipPlanCard';

interface Props {
    isLoading: boolean;
    plans: VipPlan[];
    isVip: boolean;
    tier: string | undefined;
    onSelectPlan: (planId: string) => void;
}

export function StepSelectPlan({ isLoading, plans, isVip, tier, onSelectPlan }: Props) {
    if (isLoading) {
        return (
            <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-3 border-green-200 border-t-green-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!plans || plans.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 text-sm">
                Không có gói VIP nào.
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {plans.map((plan) => (
                <VipPlanCard
                    key={plan.id}
                    plan={plan}
                    onSelect={onSelectPlan}
                    isCurrentPlan={isVip && tier === plan.tier}
                />
            ))}
        </div>
    );
}
