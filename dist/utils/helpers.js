"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateRiskRewardRatio = exports.calculatePositionSize = exports.formatDate = exports.formatCurrency = void 0;
const date_fns_1 = require("date-fns");
const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
};
exports.formatCurrency = formatCurrency;
const formatDate = (date) => {
    return (0, date_fns_1.format)(date, 'yyyy-MM-dd HH:mm:ss');
};
exports.formatDate = formatDate;
const calculatePositionSize = (bankroll, riskPercentage) => {
    return bankroll * (riskPercentage / 100);
};
exports.calculatePositionSize = calculatePositionSize;
const calculateRiskRewardRatio = (risk, reward) => {
    return reward / risk;
};
exports.calculateRiskRewardRatio = calculateRiskRewardRatio;
