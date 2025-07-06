import { format } from 'date-fns';

export const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
};

export const formatDate = (date: Date): string => {
    return format(date, 'yyyy-MM-dd HH:mm:ss');
};

export const calculatePositionSize = (bankroll: number, riskPercentage: number): number => {
    return bankroll * (riskPercentage / 100);
};

export const calculateRiskRewardRatio = (risk: number, reward: number): number => {
    return reward / risk;
};