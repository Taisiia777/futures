import WebSocket from 'ws';
import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger';

export class ExchangeService {
  private apiKey: string;
  private apiSecret: string;
  private baseUrl: string = 'https://fapi.binance.com';
  private wsBaseUrl: string = 'wss://fstream.binance.com/ws';
  
  private sockets: Map<string, WebSocket> = new Map();
  private symbolInfo: Map<string, any> = new Map();
  private localOrderBooks: Map<string, {
    bids: Map<string, number>;
    asks: Map<string, number>;
    lastUpdateId: number;
  }> = new Map();
  
  constructor(apiKey: string, apiSecret: string) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    
    // Кэшируем информацию о символах при запуске
    this.loadExchangeInfo();
    
    logger.info('Exchange service initialized');
  }
  
  // Загрузка информации о торговых парах
  private async loadExchangeInfo(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/fapi/v1/exchangeInfo`);
      const symbols = response.data.symbols;
      
      for (const symbol of symbols) {
        this.symbolInfo.set(symbol.symbol, symbol);
      }
      
      logger.info(`Loaded info for ${symbols.length} trading pairs`);
    } catch (error: any) {
      logger.error(`Failed to load exchange info: ${error.message}`);
      // Повторная попытка через 5 секунд
      setTimeout(() => this.loadExchangeInfo(), 5000);
    }
  }
  
  // Получение информации об аккаунте
  async getAccountInfo(): Promise<any> {
    return this.sendSignedRequest('/fapi/v2/account', {});
  }
  
  // WebSocket-подписка на комбинированные потоки
  subscribeToMultipleStreams(symbol: string, callback: {
    onAggTrade?: (data: any) => void,
    onKline?: (data: any) => void,
    onDepth?: (data: any) => void,
    onOpenInterest?: (data: any) => void,
    onLiquidation?: (data: any) => void
  }): void {
    if (callback.onAggTrade) {
      this.subscribeToAggTrades(symbol, callback.onAggTrade);
    }
    if (callback.onKline) {
      this.subscribeToKlines(symbol, '1s', callback.onKline);
    }
    if (callback.onDepth) {
      this.subscribeToDepth(symbol, 20, 100, callback.onDepth);
    }
    if (callback.onOpenInterest) {
      this.subscribeToOpenInterest(symbol, callback.onOpenInterest);
    }
    if (callback.onLiquidation) {
      this.subscribeToLiquidations(symbol, callback.onLiquidation);
    }
  }
  
  // WebSocket-подписка на агрегированные торги
  private subscribeToAggTrades(symbol: string, callback: (data: any) => void): void {
    const streamName = `${symbol.toLowerCase()}@aggTrade`;
    this.subscribeToStream(streamName, (data: any) => {
      if (data && data.p && data.q) {
        callback({
          price: parseFloat(data.p),
          quantity: parseFloat(data.q),
          side: data.m ? 'sell' : 'buy',
          timestamp: data.T
        });
      }
    });
  }
  
  // WebSocket-подписка на свечи
  private subscribeToKlines(symbol: string, interval: string, callback: (data: any) => void): void {
    const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
    
    logger.debug(`Создаю подписку на kline для ${symbol} с интервалом ${interval}`);
    
    this.subscribeToStream(streamName, (data: any) => {
      logger.debug(`[KLINE DEBUG] Получены данные от WebSocket ${streamName}: ${JSON.stringify(data).substring(0, 200)}`);
      
      // Проверяем два возможных формата данных
      let klineData = null;
      if (data && data.k) {
        // Прямое подключение к стриму
        klineData = data;
      } else if (data && data.data && data.data.k) {
        // Combined stream формат
        klineData = data.data;
      }
      
      if (klineData && klineData.k) {
        logger.debug(`[KLINE DEBUG] Формат корректный, отправляю в callback: k.t=${klineData.k.t}, k.o=${klineData.k.o}, k.c=${klineData.k.c}`);
        callback(klineData);
      } else {
        logger.debug(`[KLINE DEBUG] Kline данных нет в сообщении: ${JSON.stringify(data).substring(0, 100)}`);
      }
    });
  }
  
  // Получение начального снимка стакана через REST API
  private async getOrderBookSnapshot(symbol: string, limit: number = 1000): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/fapi/v1/depth`, {
        params: { symbol, limit }
      });
      
      return response.data;
    } catch (error: any) {
      logger.error(`Ошибка получения снимка стакана: ${error.message}`);
      throw error;
    }
  }

  // WebSocket-подписка на стакан
  private async subscribeToDepth(symbol: string, depth: number, updateSpeed: number, callback: (data: any) => void): Promise<void> {
    const streamName = `${symbol.toLowerCase()}@depth${depth}@${updateSpeed}ms`;
    
    try {
      // Получаем первоначальный снимок стакана
      const snapshot = await this.getOrderBookSnapshot(symbol);
      
      // Инициализируем локальную копию стакана
      const localOrderBook = {
        bids: new Map<string, number>(),
        asks: new Map<string, number>(),
        lastUpdateId: snapshot.lastUpdateId
      };
      
      // Заполняем начальные данные
      snapshot.bids.forEach((bid: string[]) => {
        localOrderBook.bids.set(bid[0], parseFloat(bid[1]));
      });
      
      snapshot.asks.forEach((ask: string[]) => {
        localOrderBook.asks.set(ask[0], parseFloat(ask[1]));
      });
      
      // Сохраняем локальный стакан
      this.localOrderBooks.set(symbol, localOrderBook);
      
      // Отправляем начальный снимок
      callback({
        bids: Array.from(localOrderBook.bids.entries()).map(([price, qty]) => ({
          price: parseFloat(price),
          quantity: qty
        })).sort((a, b) => b.price - a.price),
        asks: Array.from(localOrderBook.asks.entries()).map(([price, qty]) => ({
          price: parseFloat(price),
          quantity: qty
        })).sort((a, b) => a.price - b.price),
        timestamp: Date.now()
      });
      
      // Подписываемся на обновления
      this.subscribeToStream(streamName, (data: any) => {
        if (data && data.e === "depthUpdate") {
          const localOB = this.localOrderBooks.get(symbol);
          if (!localOB) return;
          
          // Проверка последовательности обновлений
          if (data.u <= localOB.lastUpdateId) {
            return; // Пропускаем устаревшие обновления
          }
          
          // Обновляем bid levels
          if (data.b && Array.isArray(data.b)) {
            data.b.forEach((b: string[]) => {
              const price = b[0];
              const qty = parseFloat(b[1]);
              
              if (qty === 0) {
                localOB.bids.delete(price);
              } else {
                localOB.bids.set(price, qty);
              }
            });
          }
          
          // Обновляем ask levels
          if (data.a && Array.isArray(data.a)) {
            data.a.forEach((a: string[]) => {
              const price = a[0];
              const qty = parseFloat(a[1]);
              
              if (qty === 0) {
                localOB.asks.delete(price);
              } else {
                localOB.asks.set(price, qty);
              }
            });
          }
          
          // Обновляем lastUpdateId
          localOB.lastUpdateId = data.u;
          
          // Преобразуем в формат для стратегии
          callback({
            bids: Array.from(localOB.bids.entries())
              .map(([price, qty]) => ({
                price: parseFloat(price),
                quantity: qty
              }))
              .sort((a, b) => b.price - a.price)
              .slice(0, depth),
            asks: Array.from(localOB.asks.entries())
              .map(([price, qty]) => ({
                price: parseFloat(price),
                quantity: qty
              }))
              .sort((a, b) => a.price - b.price)
              .slice(0, depth),
            timestamp: data.E
          });
        } else {
          logger.warn(`Получены неожиданные данные стакана: ${JSON.stringify(data).substring(0, 100)}...`);
        }
      });
      
    } catch (error: any) {
      logger.error(`Ошибка подписки на стакан ${symbol}: ${error.message}`);
      // Через 5 секунд повторяем попытку
      setTimeout(() => this.subscribeToDepth(symbol, depth, updateSpeed, callback), 5000);
    }
  }
  
  // WebSocket-подписка на открытый интерес
  private subscribeToOpenInterest(symbol: string, callback: (data: any) => void): void {
    const streamName = `${symbol.toLowerCase()}@openInterest@1s`;
    this.subscribeToStream(streamName, (data: any) => {
      callback({
        value: parseFloat(data.o),
        timestamp: data.E
      });
    });
  }
  
  // WebSocket-подписка на ликвидации
  private subscribeToLiquidations(symbol: string, callback: (data: any) => void): void {
    const streamName = `${symbol.toLowerCase()}@forceOrder`;
    this.subscribeToStream(streamName, (data: any) => {
      callback({
        side: data.o.S.toLowerCase(),
        price: parseFloat(data.o.p),
        quantity: parseFloat(data.o.q),
        timestamp: data.E
      });
    });
  }
  
  // Общий метод для подписки на WebSocket-стрим
  private subscribeToStream(streamName: string, callback: (data: any) => void): void {
    // Если уже подписаны, не создаем новое подключение
    if (this.sockets.has(streamName)) {
      return;
    }
    
    // Создаем соединение
    const ws = new WebSocket(`${this.wsBaseUrl}/${streamName}`);
    
    ws.on('open', () => {
      logger.info(`WebSocket connected: ${streamName}`);
    });
    
    ws.on('message', (data: WebSocket.Data) => {
      try {
        const parsedData = JSON.parse(data.toString());
        
        // Проверка на сервисные сообщения от Binance
        if (parsedData.result === undefined) {
          callback(parsedData);
        } else {
          logger.info(`Получено сервисное сообщение: ${JSON.stringify(parsedData).substring(0, 100)}...`);
        }
      } catch (error: any) {
        logger.error(`Error parsing WebSocket data: ${error.message}`);
      }
    });
    
    ws.on('error', (error: Error) => {
      logger.error(`WebSocket error on ${streamName}: ${error.message}`);
      // Пытаемся переподключиться при ошибке
      setTimeout(() => {
        this.sockets.delete(streamName);
        this.subscribeToStream(streamName, callback);
      }, 5000);
    });
    
    ws.on('close', () => {
      logger.error(`WebSocket closed: ${streamName}`);
      this.sockets.delete(streamName);
      // Пытаемся переподключиться при закрытии
      setTimeout(() => {
        this.subscribeToStream(streamName, callback);
      }, 5000);
    });
    
    // Сохраняем соединение
    this.sockets.set(streamName, ws);
  }

  // Установка уровня плеча
  async setLeverage(symbol: string, leverage: number): Promise<any> {
    return this.sendSignedRequest('/fapi/v1/leverage', {
      symbol,
      leverage
    }, 'POST');
  }
  
  // Получение максимально доступного плеча для символа
  async getMaxLeverage(symbol: string): Promise<number> {
    const symbolData = this.symbolInfo.get(symbol);
    if (!symbolData) {
      await this.loadExchangeInfo();
      const reloadedData = this.symbolInfo.get(symbol);
      if (!reloadedData) {
        logger.error(`No symbol info for ${symbol}, using default max leverage`);
        return 50; // Максимальное плечо по умолчанию для альткоинов
      }
      return reloadedData.leverageBracket?.[0]?.maxLeverage || 50;
    }
    return symbolData.leverageBracket?.[0]?.maxLeverage || 50;
  }
  
  // Получение текущей цены маркировки
  async getMarkPrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/fapi/v1/premiumIndex`, {
        params: { symbol }
      });
      return parseFloat(response.data.markPrice);
    } catch (error: any) {
      logger.error(`Failed to get mark price for ${symbol}: ${error.message}`);
      throw error;
    }
  }

  // Получение открытых позиций
  async getOpenPositions(): Promise<any[]> {
    const account = await this.getAccountInfo();
    return account.positions.filter((p: any) => Math.abs(parseFloat(p.positionAmt)) > 0);
  }

  // Получение точности для количества
  async getQuantityPrecision(symbol: string): Promise<number> {
    const info = this.symbolInfo.get(symbol);
    if (!info) {
      await this.loadExchangeInfo();
      return this.symbolInfo.get(symbol)?.quantityPrecision || 3;
    }
    return info.quantityPrecision || 3;
  }

  // Метод для подписи запросов
  private sign(queryString: string): string {
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(queryString)
      .digest('hex');
  }
  
  // Отправка подписанного запроса в API
  private async sendSignedRequest(endpoint: string, params: any = {}, method: string = 'GET'): Promise<any> {
    // Добавляем timestamp к каждому запросу
    params.timestamp = Date.now();
    
    // Сортируем параметры и создаем строку запроса
    const queryString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // Подписываем запрос
    const signature = this.sign(queryString);
    const signedQueryString = `${queryString}&signature=${signature}`;
    
    try {
      let response;
      
      if (method === 'GET') {
        response = await axios.get(`${this.baseUrl}${endpoint}?${signedQueryString}`, {
          headers: { 'X-MBX-APIKEY': this.apiKey }
        });
      } else if (method === 'POST') {
        response = await axios.post(
          `${this.baseUrl}${endpoint}?${signedQueryString}`, 
          {}, // пустое тело запроса
          { headers: { 'X-MBX-APIKEY': this.apiKey } }
        );
      } else if (method === 'DELETE') {
        response = await axios.delete(`${this.baseUrl}${endpoint}?${signedQueryString}`, {
          headers: { 'X-MBX-APIKEY': this.apiKey }
        });
      }
      
      return response?.data;
    } catch (error: any) {
      if (error.response) {
        logger.error(`API error ${method} ${endpoint}: ${JSON.stringify(error.response.data)}`);
      } else {
        logger.error(`Network error ${method} ${endpoint}: ${error.message}`);
      }
      throw error;
    }
  }

  // Закрытие всех соединений
  closeAllConnections(): void {
    for (const [name, socket] of this.sockets.entries()) {
      socket.close();
      logger.info(`Closed WebSocket: ${name}`);
    }
    this.sockets.clear();
  }

  // Реализация минимально необходимых методов из старого интерфейса
  async placeMarketOrder(params: any): Promise<any> {
    return this.sendSignedRequest('/fapi/v1/order', {
      symbol: params.symbol,
      side: params.side.toUpperCase(),
      type: 'MARKET',
      quantity: params.quantity,
      reduceOnly: params.reduceOnly ? 'true' : undefined
    }, 'POST');
  }

  async getPosition(symbol: string): Promise<any> {
    const positions = await this.getOpenPositions();
    return positions.find((p: any) => p.symbol === symbol);
  }

  async cancelAllOrders(symbol: string): Promise<any> {
    return this.sendSignedRequest('/fapi/v1/allOpenOrders', { symbol }, 'DELETE');
  }

  async getPricePrecision(symbol: string): Promise<number> {
    const info = this.symbolInfo.get(symbol);
    return info?.pricePrecision || 2;
  }

  async placeStopOrder(params: any): Promise<any> {
    return this.sendSignedRequest('/fapi/v1/order', {
      symbol: params.symbol,
      side: params.side.toUpperCase(),
      type: 'STOP_MARKET',
      quantity: params.quantity,
      stopPrice: params.stopPrice,
      workingType: params.workingType,
      reduceOnly: params.reduceOnly ? 'true' : undefined
    }, 'POST');
  }

  async placeLimitOrder(params: any): Promise<any> {
    return this.sendSignedRequest('/fapi/v1/order', {
      symbol: params.symbol,
      side: params.side.toUpperCase(),
      type: 'LIMIT',
      timeInForce: 'GTC',
      quantity: params.quantity,
      price: params.price,
      reduceOnly: params.reduceOnly ? 'true' : undefined
    }, 'POST');
  }

  async cancelOrder(symbol: string, orderId: string): Promise<any> {
    return this.sendSignedRequest('/fapi/v1/order', { symbol, orderId }, 'DELETE');
  }

  async cancelOrderType(symbol: string, orderType: string): Promise<any> {
    const orders = await this.getOpenOrders(symbol);
    const typeOrders = orders.filter((o: any) => o.type === orderType);
    
    const promises = typeOrders.map((o: any) => this.cancelOrder(symbol, o.orderId));
    await Promise.all(promises);
    return { success: true, count: typeOrders.length };
  }

  async getOpenOrders(symbol?: string): Promise<any[]> {
    const params: any = {};
    if (symbol) params.symbol = symbol;
    return this.sendSignedRequest('/fapi/v1/openOrders', params);
  }

  // Получение свечей (klines) с retry механизмом
  async getKlines(symbol: string, interval: string, limit: number = 500): Promise<any[]> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 секунда
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.get(`${this.baseUrl}/fapi/v1/klines`, {
          params: { symbol, interval, limit },
          timeout: 10000 // 10 секунд таймаут
        });
        
        return response.data.map((kline: any[]) => ({
          openTime: kline[0],
          open: kline[1],
          high: kline[2],
          low: kline[3],
          close: kline[4],
          volume: kline[5],
          closeTime: kline[6],
          quoteAssetVolume: kline[7],
          numberOfTrades: kline[8],
          takerBuyBaseAssetVolume: kline[9],
          takerBuyQuoteAssetVolume: kline[10]
        }));
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        const isNetworkError = error.code === 'ECONNRESET' || 
                               error.code === 'ETIMEDOUT' || 
                               error.code === 'EHOSTUNREACH' ||
                               error.code === 'ENOTFOUND';
        
        if (isNetworkError && !isLastAttempt) {
          logger.warn(`Попытка ${attempt}/${maxRetries} для ${symbol} неудачна, повтор через ${retryDelay}мс`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
        
        if (isLastAttempt) {
          logger.error(`Ошибка получения свечей для ${symbol} после ${maxRetries} попыток: ${error.message}`);
        }
        throw error;
      }
    }
    
    return []; // Fallback, не должно достигаться
  }

  // Получение текущей цены
  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(`${this.baseUrl}/fapi/v1/ticker/price`, {
        params: { symbol }
      });
      
      return parseFloat(response.data.price);
    } catch (error: any) {
      logger.error(`Ошибка получения цены для ${symbol}: ${error.message}`);
      throw error;
    }
  }

  // Получение 24h статистики
  async getTicker24hr(symbol: string): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/fapi/v1/ticker/24hr`, {
        params: { symbol }
      });
      
      return response.data;
    } catch (error: any) {
      logger.error(`Ошибка получения 24h статистики для ${symbol}: ${error.message}`);
      throw error;
    }
  }
}