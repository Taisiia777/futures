import { ExchangeService } from './exchangeService';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { format } from 'date-fns';

/**
 * Сервис для эмуляции биржи в тестовом режиме
 * Наследует интерфейс основного биржевого сервиса, но имитирует торговлю
 */
export class MockExchangeService extends ExchangeService {
  private balance: number = 100; // Начальные 100$
  private positions: Map<string, {
    symbol: string,
    side: 'buy' | 'sell',
    amount: number,
    entryPrice: number,
    leverage: number,
    timestamp: number,
    positionAmt: number,
    unrealizedPnl: number
  }> = new Map();
  
  private openOrders: Map<string, any> = new Map();
  private orderIdCounter: number = 1;
  private lastPrices: Map<string, number> = new Map();
  private logDir: string;
  private tradesLogFile: string;
  
  constructor(apiKey: string, apiSecret: string) {
    super(apiKey, apiSecret);
    
    // Создаем директорию для логов тестовых сделок
    this.logDir = path.resolve(process.cwd(), 'logs');
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    
    // Создаем файл для логов сделок
    const date = format(new Date(), 'yyyyMMdd');
    this.tradesLogFile = path.join(this.logDir, `test_trades_${date}.csv`);
    
    // Создаем файл с заголовками если не существует
    if (!fs.existsSync(this.tradesLogFile)) {
      fs.writeFileSync(this.tradesLogFile, 'timestamp,symbol,side,quantity,price,leverage,pnl,balance\n');
    }
    
    logger.info('🧪 ТЕСТОВЫЙ РЕЖИМ: Торговый бот запущен с виртуальным балансом $100');
  }
  
  // Переопределяем методы из основного класса
  
  async getAccountInfo(): Promise<any> {
    // Эмуляция информации об аккаунте
    return {
      totalWalletBalance: this.balance.toString(),
      totalUnrealizedProfit: Array.from(this.positions.values())
        .reduce((total, pos) => total + pos.unrealizedPnl, 0).toString(),
      positions: Array.from(this.positions.values())
    };
  }
  
  async getMarkPrice(symbol: string): Promise<number> {
    // Используем реальные рыночные данные через WebSocket
    // но не отправляем реальные ордера
    const price = await super.getMarkPrice(symbol);
    this.lastPrices.set(symbol, price);
    
    // Обновляем нереализованную прибыль/убыток для позиций
    this.updatePositionPnL(symbol, price);
    
    return price;
  }
  
  private updatePositionPnL(symbol: string, currentPrice: number): void {
    const position = this.positions.get(symbol);
    if (!position) return;
    
    if (position.side === 'buy') { // Long position
      position.unrealizedPnl = (currentPrice - position.entryPrice) * position.amount * position.leverage;
    } else { // Short position
      position.unrealizedPnl = (position.entryPrice - currentPrice) * position.amount * position.leverage;
    }
  }
  
  async placeMarketOrder(params: any): Promise<any> {
    // Получаем текущую цену
    const price = this.lastPrices.get(params.symbol) || await this.getMarkPrice(params.symbol);
    const timestamp = Date.now();
    
    // Создаем уникальный ID для ордера
    const orderId = `test_${this.orderIdCounter++}`;
    
    // Рассчитываем стоимость позиции
    const leveragedValue = params.quantity * price;
    const positionValue = leveragedValue / params.leverage;
    
    // Для закрытия позиции
    if (params.reduceOnly) {
      const position = this.positions.get(params.symbol);
      if (!position) {
        logger.warn(`ТЕСТ: Попытка закрыть несуществующую позицию ${params.symbol}`);
        return { id: orderId, price, quantity: params.quantity, side: params.side, status: 'REJECTED' };
      }
      
      // Закрываем позицию и фиксируем прибыль/убыток
      const pnl = position.unrealizedPnl;
      this.balance += pnl;
      
      // Логируем закрытие позиции
      this.logTrade({
        timestamp,
        symbol: params.symbol,
        side: params.side,
        quantity: params.quantity,
        price,
        leverage: position.leverage,
        pnl,
        balance: this.balance
      });
      
      logger.info(`ТЕСТ: Закрыта позиция ${params.symbol} ${position.side}, PnL: ${pnl.toFixed(2)}$, новый баланс: ${this.balance.toFixed(2)}$`);
      
      // Удаляем позицию
      this.positions.delete(params.symbol);
      
      return {
        id: orderId,
        price,
        quantity: params.quantity,
        side: params.side,
        status: 'FILLED'
      };
    } 
    // Для открытия новой позиции
    else {
      // Проверяем, есть ли уже открытая позиция по этому символу
      if (this.positions.has(params.symbol)) {
        logger.warn(`ТЕСТ: Уже есть открытая позиция по ${params.symbol}, новая позиция не открыта`);
        return { id: orderId, price, quantity: params.quantity, side: params.side, status: 'REJECTED' };
      }
      
      // Проверяем хватает ли средств (с учетом плеча)
      if (positionValue > this.balance) {
        logger.warn(`ТЕСТ: Недостаточно средств для открытия позиции. Нужно: ${positionValue.toFixed(2)}$, доступно: ${this.balance.toFixed(2)}$`);
        return { id: orderId, price, quantity: params.quantity, side: params.side, status: 'REJECTED' };
      }
      
      // Открываем позицию
      this.positions.set(params.symbol, {
        symbol: params.symbol,
        side: params.side,
        amount: params.quantity,
        entryPrice: price,
        leverage: params.leverage || 1,
        timestamp,
        positionAmt: params.quantity,
        unrealizedPnl: 0
      });
      
      // Логируем открытие позиции
      this.logTrade({
        timestamp,
        symbol: params.symbol,
        side: params.side,
        quantity: params.quantity,
        price,
        leverage: params.leverage || 1,
        pnl: 0,
        balance: this.balance
      });
      
      logger.info(`ТЕСТ: Открыта позиция ${params.symbol} ${params.side} x${params.leverage || 1}, цена: ${price}, количество: ${params.quantity}`);
      
      return {
        id: orderId,
        price,
        quantity: params.quantity,
        side: params.side,
        status: 'FILLED',
        leverage: params.leverage
      };
    }
  }
  
  async getOpenPositions(): Promise<any[]> {
    return Array.from(this.positions.values());
  }
  
  async getPosition(symbol: string): Promise<any> {
    const position = this.positions.get(symbol);
    if (!position) return null;
    
    // Обновляем PnL перед возвратом
    const currentPrice = this.lastPrices.get(symbol);
    if (currentPrice) {
      this.updatePositionPnL(symbol, currentPrice);
    }
    
    return position;
  }
  
  async cancelAllOrders(symbol: string): Promise<any> {
    // Отменяем все активные ордера для символа
    const orders = Array.from(this.openOrders.values())
      .filter(order => order.symbol === symbol);
      
    orders.forEach(order => this.openOrders.delete(order.id));
    
    logger.info(`ТЕСТ: Отменены все ордера для ${symbol}`);
    return { status: 'success', message: `Отменено ${orders.length} ордеров` };
  }
  
  async setLeverage(symbol: string, leverage: number): Promise<any> {
    logger.info(`ТЕСТ: Установлено плечо ${leverage}x для ${symbol}`);
    return { leverage, symbol };
  }
  
  async placeStopOrder(params: any): Promise<any> {
    const orderId = `test_stop_${this.orderIdCounter++}`;
    
    // Сохраняем стоп-ордер
    const order = {
      id: orderId,
      symbol: params.symbol,
      side: params.side,
      quantity: params.quantity,
      stopPrice: params.stopPrice,
      type: 'STOP_MARKET',
      status: 'NEW',
      reduceOnly: params.reduceOnly
    };
    
    this.openOrders.set(orderId, order);
    logger.info(`ТЕСТ: Размещен стоп-ордер для ${params.symbol}, цена стопа: ${params.stopPrice}`);
    
    return order;
  }
  
  async placeLimitOrder(params: any): Promise<any> {
    const orderId = `test_limit_${this.orderIdCounter++}`;
    
    // Сохраняем лимитный ордер
    const order = {
      id: orderId,
      symbol: params.symbol,
      side: params.side,
      quantity: params.quantity,
      price: params.price,
      type: 'LIMIT',
      status: 'NEW',
      reduceOnly: params.reduceOnly
    };
    
    this.openOrders.set(orderId, order);
    logger.info(`ТЕСТ: Размещен лимитный ордер для ${params.symbol}, цена: ${params.price}`);
    
    return order;
  }
  
  async cancelOrder(symbol: string, orderId: string): Promise<any> {
    if (this.openOrders.has(orderId)) {
      this.openOrders.delete(orderId);
      logger.info(`ТЕСТ: Отменен ордер ${orderId} для ${symbol}`);
      return { status: 'success' };
    }
    return { status: 'error', message: 'Ордер не найден' };
  }
  
  async cancelOrderType(symbol: string, orderType: string): Promise<any> {
    const orders = Array.from(this.openOrders.values())
      .filter(order => order.symbol === symbol && order.type === orderType);
      
    orders.forEach(order => this.openOrders.delete(order.id));
    
    logger.info(`ТЕСТ: Отменены все ордера типа ${orderType} для ${symbol}`);
    return { success: true, count: orders.length };
  }
  
  async getOpenOrders(symbol?: string): Promise<any[]> {
    let orders = Array.from(this.openOrders.values());
    
    if (symbol) {
      orders = orders.filter(order => order.symbol === symbol);
    }
    
    return orders;
  }
  
  private logTrade(trade: {
    timestamp: number;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    leverage: number;
    pnl: number;
    balance: number;
  }): void {
    const date = format(new Date(trade.timestamp), 'yyyy-MM-dd HH:mm:ss');
    
    const line = [
      date,
      trade.symbol,
      trade.side,
      trade.quantity.toFixed(5),
      trade.price.toFixed(2),
      trade.leverage,
      trade.pnl.toFixed(2),
      trade.balance.toFixed(2)
    ].join(',');
    
    fs.appendFileSync(this.tradesLogFile, line + '\n');
  }
}