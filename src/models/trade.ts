export interface Trade {
    tradeId: string;
    side: 'buy' | 'sell';
    quantity: number;
    entryPrice: number;
    exitPrice?: number;
    realizedPnL?: number;
    timestamp: Date;
}