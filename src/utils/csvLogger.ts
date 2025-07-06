import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';
import { config } from '../config/config';

export class CsvLogger {
  private logDir: string;

  constructor() {
    this.logDir = path.resolve(config.logging.logDir);
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  public logTrade(symbol: string, trade: {
    timestamp: number;
    side: 'buy' | 'sell';
    quantity: number;
    entryPrice: number;
    takeProfitPrice?: number;
    stopLossPrice?: number;
    exitPrice?: number;
    pnl?: number;
  }): void {
    const date = new Date(trade.timestamp);
    const fileName = `${symbol}_${format(date, 'yyyyMMdd')}.csv`;
    const filePath = path.join(this.logDir, fileName);
    
    // Создаем файл с заголовками если не существует
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, 'timestamp,side,qty,entry,tp/sl,exit,pnl$\n');
    }
    
    // Форматируем данные и записываем строку
    const line = [
      format(date, 'yyyy-MM-dd HH:mm:ss'),
      trade.side,
      trade.quantity.toFixed(4),
      trade.entryPrice.toFixed(2),
      `${trade.takeProfitPrice?.toFixed(2) || '-'}/${trade.stopLossPrice?.toFixed(2) || '-'}`,
      trade.exitPrice?.toFixed(2) || '-',
      trade.pnl?.toFixed(2) || '-'
    ].join(',');
    
    fs.appendFileSync(filePath, line + '\n');
  }
}

export const csvLogger = new CsvLogger();