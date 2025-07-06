export interface Order {
    id: string;
    side: 'buy' | 'sell';
    quantity: number;
    entryPrice: number;
    status: 'pending' | 'filled' | 'canceled';
    createdAt: Date;
    updatedAt: Date;
}