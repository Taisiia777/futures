import { ExchangeService } from '../services/exchangeService';
import logger from '../utils/logger';

interface OrderParams {
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  leverage: number;
}

interface TakeProfitLevel {
  price: number;
  quantity: number;
}

export class OrderManager {
  private exchangeService: ExchangeService;
  private activeOrders: Map<string, any> = new Map();
  private positionTrackers: Map<string, {
    entryPrice: number,
    quantity: number,
    side: 'buy' | 'sell',
    highPrice: number,
    lowPrice: number,
    trailingStopActive: boolean
  }> = new Map();

  constructor(exchangeService: ExchangeService) {
    this.exchangeService = exchangeService;
  }

  // Размещение рыночного ордера
  public async placeMarketOrder(params: OrderParams): Promise<any> {
    try {
      logger.debug(`Размещение рыночного ордера: ${JSON.stringify(params)}`);
      
      // Округляем количество для соответствия требованиям биржи
      const quantity = await this.roundQuantity(params.symbol, params.quantity);
      
      // Размещаем рыночный ордер
      const order = await this.exchangeService.placeMarketOrder({
        ...params,
        quantity
      });
      
      // Добавляем ордер в список активных
      this.activeOrders.set(order.id, {
        id: order.id,
        symbol: params.symbol,
        side: params.side,
        quantity,
        price: order.price,
        type: 'MARKET',
        status: 'FILLED',
        timestamp: Date.now()
      });
      
      // Создаем трекер для отслеживания позиции
      this.positionTrackers.set(params.symbol, {
        side: params.side,
        quantity,
        entryPrice: order.price,
        highPrice: order.price,
        lowPrice: order.price,
        trailingStopActive: false
      });
      
      logger.trade(`Рыночный ордер выполнен: ${params.symbol} ${params.side} ${quantity} по цене ${order.price}, плечо: ${params.leverage || 1}`);
      
      return order;
      
    } catch (error: any) {
      logger.error(`Ошибка размещения ордера: ${error.message}`);
      throw error;
    }
  }

  // Установка стоп-лосса
  public async setStopLoss(symbol: string, orderId: string, price: number): Promise<any> {
    try {
      const precision = await this.exchangeService.getPricePrecision(symbol);
      const roundedPrice = this.roundToStep(price, precision);
      
      const order = this.activeOrders.get(orderId);
      if (!order) {
        throw new Error(`Ордер ${orderId} не найден`);
      }
      
      const stopOrder = await this.exchangeService.placeStopOrder({
        symbol: symbol,
        side: order.side === 'buy' ? 'sell' : 'buy',
        quantity: order.quantity,
        stopPrice: roundedPrice,
        reduceOnly: true,
        workingType: 'MARK_PRICE'
      });
      
      logger.info(`Установлен стоп-лосс для ${symbol}: ${roundedPrice}`);
      return stopOrder;
      
    } catch (error: any) {
      logger.error(`Ошибка установки стоп-лосса: ${error.message}`);
      throw error;
    }
  }

  // Установка тейк-профита (может быть несколько уровней)
  public async setTakeProfit(
    symbol: string, 
    orderId: string, 
    levels: TakeProfitLevel[]
  ): Promise<any[]> {
    try {
      const order = this.activeOrders.get(orderId);
      if (!order) {
        throw new Error(`Ордер ${orderId} не найден`);
      }
      
      const precision = await this.exchangeService.getPricePrecision(symbol);
      const tpOrders = [];
      
      for (const level of levels) {
        const roundedPrice = this.roundToStep(level.price, precision);
        const roundedQty = this.roundToStep(level.quantity, await this.exchangeService.getQuantityPrecision(symbol));
        
        const tpOrder = await this.exchangeService.placeLimitOrder({
          symbol: symbol,
          side: order.side === 'buy' ? 'sell' : 'buy',
          quantity: roundedQty,
          price: roundedPrice,
          reduceOnly: true
        });
        
        tpOrders.push(tpOrder);
        logger.info(`Установлен тейк-профит для ${symbol}: ${roundedPrice}, количество: ${roundedQty}`);
      }
      
      return tpOrders;
      
    } catch (error: any) {
      logger.error(`Ошибка установки тейк-профита: ${error.message}`);
      throw error;
    }
  }

  // Закрытие позиции
  public async closePosition(symbol: string, side: 'buy' | 'sell'): Promise<any> {
    try {
      // Получаем информацию о позиции
      const position = await this.exchangeService.getPosition(symbol);
      if (!position || position.quantity === 0) {
        logger.info(`Нет открытой позиции по ${symbol} для закрытия`);
        return null;
      }
      
      // Отменяем все ордера по символу
      await this.exchangeService.cancelAllOrders(symbol);
      
      // Размещаем рыночный ордер для закрытия
      const closeOrder = await this.exchangeService.placeMarketOrder({
        symbol: symbol,
        side: side === 'buy' ? 'sell' : 'buy',
        quantity: position.quantity,
        reduceOnly: true
      });
      
      logger.info(`Закрыта позиция по ${symbol}: количество=${position.quantity}, примерная цена=${closeOrder.price}`);
      
      // Удаляем трекер позиции
      this.positionTrackers.delete(symbol);
      
      return closeOrder;
      
    } catch (error: any) {
      logger.error(`Ошибка закрытия позиции ${symbol}: ${error.message}`);
      throw error;
    }
  }

  // Обновление трейлинг-стопа
  public async updateTrailingStop(symbol: string): Promise<void> {
    try {
      const tracker = this.positionTrackers.get(symbol);
      if (!tracker) {
        logger.debug(`updateTrailingStop: Нет трекера для ${symbol}`);
        return;
      }
      
      // Получаем текущую цену
      const currentPrice = await this.exchangeService.getMarkPrice(symbol);
      logger.debug(`updateTrailingStop: ${symbol} текущая цена: ${currentPrice}, highPrice: ${tracker.highPrice}, lowPrice: ${tracker.lowPrice}`);
      
      // Обновляем максимумы и минимумы
      const oldHigh = tracker.highPrice;
      const oldLow = tracker.lowPrice;
      
      if (currentPrice > tracker.highPrice) {
        tracker.highPrice = currentPrice;
        logger.debug(`updateTrailingStop: Обновлен максимум для ${symbol}: ${oldHigh} -> ${currentPrice}`);
      }
      if (currentPrice < tracker.lowPrice) {
        tracker.lowPrice = currentPrice;
        logger.debug(`updateTrailingStop: Обновлен минимум для ${symbol}: ${oldLow} -> ${currentPrice}`);
      }
      
      // Если у нас лонг и активирован трейлинг-стоп
      if (tracker.side === 'buy' && tracker.trailingStopActive) {
        const newStopPrice = tracker.highPrice * 0.995; // 0.5% от пика
        logger.debug(`updateTrailingStop: Вычислен новый трейлинг-стоп для LONG ${symbol}: ${newStopPrice} (0.5% от пика ${tracker.highPrice})`);
        
        // Отменяем старые стопы и устанавливаем новый
        await this.exchangeService.cancelOrderType(symbol, 'STOP_MARKET');
        await this.exchangeService.placeStopOrder({
          symbol: symbol,
          side: 'sell',
          quantity: tracker.quantity,
          stopPrice: newStopPrice,
          reduceOnly: true,
          workingType: 'MARK_PRICE'
        });
        
        logger.info(`Обновлен трейлинг-стоп для ${symbol} LONG: ${newStopPrice}`);
      } 
      // Если у нас шорт и активирован трейлинг-стоп
      else if (tracker.side === 'sell' && tracker.trailingStopActive) {
        const newStopPrice = tracker.lowPrice * 1.005; // 0.5% от минимума
        logger.debug(`updateTrailingStop: Вычислен новый трейлинг-стоп для SHORT ${symbol}: ${newStopPrice} (0.5% от минимума ${tracker.lowPrice})`);
        
        // Отменяем старые стопы и устанавливаем новый
        await this.exchangeService.cancelOrderType(symbol, 'STOP_MARKET');
        await this.exchangeService.placeStopOrder({
          symbol: symbol,
          side: 'buy',
          quantity: tracker.quantity,
          stopPrice: newStopPrice,
          reduceOnly: true,
          workingType: 'MARK_PRICE'
        });
        
        logger.info(`Обновлен трейлинг-стоп для ${symbol} SHORT: ${newStopPrice}`);
      }
    } catch (error: any) {
      logger.error(`Ошибка обновления трейлинг-стопа: ${error.message}`);
    }
  }

  // Активация трейлинг-стопа (после достижения TP1)
  public activateTrailingStop(symbol: string): void {
    const tracker = this.positionTrackers.get(symbol);
    if (tracker) {
      tracker.trailingStopActive = true;
      logger.info(`Активирован трейлинг-стоп для ${symbol}`);
    }
  }

  // Проверка "спайка" - резкого движения против позиции
  public async checkSpikeProtection(symbol: string): Promise<boolean> {
    try {
      const tracker = this.positionTrackers.get(symbol);
      if (!tracker) return false;
      
      const currentPrice = await this.exchangeService.getMarkPrice(symbol);
      
      // Для лонгов: если цена упала на 0.8% или больше за короткий период
      if (tracker.side === 'buy' && 
          (tracker.highPrice - currentPrice) / tracker.highPrice >= 0.008) {
        await this.closePosition(symbol, tracker.side);
        logger.warn(`Сработала защита от спайка для ${symbol}: резкое падение цены`);
        return true;
      }
      
      // Для шортов: если цена выросла на 0.8% или больше за короткий период
      if (tracker.side === 'sell' && 
          (currentPrice - tracker.lowPrice) / tracker.lowPrice >= 0.008) {
        await this.closePosition(symbol, tracker.side);
        logger.warn(`Сработала защита от спайка для ${symbol}: резкий рост цены`);
        return true;
      }
      
      return false;
      
    } catch (error: any) {
      logger.error(`Ошибка при проверке защиты от спайка: ${error.message}`);
      return false;
    }
  }

  // Вспомогательная функция для округления до шага
  private roundToStep(value: number, precision: number): number {
    const step = Math.pow(10, -precision);
    return Math.round(value / step) * step;
  }

  // Округление количества в соответствии с требованиями биржи
  private async roundQuantity(symbol: string, quantity: number): Promise<number> {
    const precision = await this.exchangeService.getQuantityPrecision(symbol);
    return this.roundToStep(quantity, precision);
  }
}