"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeService = void 0;
const ws_1 = __importDefault(require("ws"));
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = __importDefault(require("../utils/logger"));
class ExchangeService {
    constructor(apiKey, apiSecret) {
        this.baseUrl = 'https://fapi.binance.com';
        this.wsBaseUrl = 'wss://fstream.binance.com/ws';
        this.sockets = new Map();
        this.symbolInfo = new Map();
        this.localOrderBooks = new Map();
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        // Кэшируем информацию о символах при запуске
        this.loadExchangeInfo();
        logger_1.default.info('Exchange service initialized');
    }
    // Загрузка информации о торговых парах
    async loadExchangeInfo() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/fapi/v1/exchangeInfo`);
            const symbols = response.data.symbols;
            for (const symbol of symbols) {
                this.symbolInfo.set(symbol.symbol, symbol);
            }
            logger_1.default.info(`Loaded info for ${symbols.length} trading pairs`);
        }
        catch (error) {
            logger_1.default.error(`Failed to load exchange info: ${error.message}`);
            // Повторная попытка через 5 секунд
            setTimeout(() => this.loadExchangeInfo(), 5000);
        }
    }
    // Получение информации об аккаунте
    async getAccountInfo() {
        return this.sendSignedRequest('/fapi/v2/account', {});
    }
    // WebSocket-подписка на комбинированные потоки
    subscribeToMultipleStreams(symbol, callback) {
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
    subscribeToAggTrades(symbol, callback) {
        const streamName = `${symbol.toLowerCase()}@aggTrade`;
        this.subscribeToStream(streamName, (data) => {
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
    subscribeToKlines(symbol, interval, callback) {
        const streamName = `${symbol.toLowerCase()}@kline_${interval}`;
        logger_1.default.debug(`Создаю подписку на kline для ${symbol} с интервалом ${interval}`);
        this.subscribeToStream(streamName, (data) => {
            logger_1.default.debug(`[KLINE DEBUG] Получены данные от WebSocket ${streamName}: ${JSON.stringify(data).substring(0, 200)}`);
            // Проверяем два возможных формата данных
            let klineData = null;
            if (data && data.k) {
                // Прямое подключение к стриму
                klineData = data;
            }
            else if (data && data.data && data.data.k) {
                // Combined stream формат
                klineData = data.data;
            }
            if (klineData && klineData.k) {
                logger_1.default.debug(`[KLINE DEBUG] Формат корректный, отправляю в callback: k.t=${klineData.k.t}, k.o=${klineData.k.o}, k.c=${klineData.k.c}`);
                callback(klineData);
            }
            else {
                logger_1.default.debug(`[KLINE DEBUG] Kline данных нет в сообщении: ${JSON.stringify(data).substring(0, 100)}`);
            }
        });
    }
    // Получение начального снимка стакана через REST API
    async getOrderBookSnapshot(symbol, limit = 1000) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/fapi/v1/depth`, {
                params: { symbol, limit }
            });
            return response.data;
        }
        catch (error) {
            logger_1.default.error(`Ошибка получения снимка стакана: ${error.message}`);
            throw error;
        }
    }
    // WebSocket-подписка на стакан
    async subscribeToDepth(symbol, depth, updateSpeed, callback) {
        const streamName = `${symbol.toLowerCase()}@depth${depth}@${updateSpeed}ms`;
        try {
            // Получаем первоначальный снимок стакана
            const snapshot = await this.getOrderBookSnapshot(symbol);
            // Инициализируем локальную копию стакана
            const localOrderBook = {
                bids: new Map(),
                asks: new Map(),
                lastUpdateId: snapshot.lastUpdateId
            };
            // Заполняем начальные данные
            snapshot.bids.forEach((bid) => {
                localOrderBook.bids.set(bid[0], parseFloat(bid[1]));
            });
            snapshot.asks.forEach((ask) => {
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
            this.subscribeToStream(streamName, (data) => {
                if (data && data.e === "depthUpdate") {
                    const localOB = this.localOrderBooks.get(symbol);
                    if (!localOB)
                        return;
                    // Проверка последовательности обновлений
                    if (data.u <= localOB.lastUpdateId) {
                        return; // Пропускаем устаревшие обновления
                    }
                    // Обновляем bid levels
                    if (data.b && Array.isArray(data.b)) {
                        data.b.forEach((b) => {
                            const price = b[0];
                            const qty = parseFloat(b[1]);
                            if (qty === 0) {
                                localOB.bids.delete(price);
                            }
                            else {
                                localOB.bids.set(price, qty);
                            }
                        });
                    }
                    // Обновляем ask levels
                    if (data.a && Array.isArray(data.a)) {
                        data.a.forEach((a) => {
                            const price = a[0];
                            const qty = parseFloat(a[1]);
                            if (qty === 0) {
                                localOB.asks.delete(price);
                            }
                            else {
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
                }
                else {
                    logger_1.default.warn(`Получены неожиданные данные стакана: ${JSON.stringify(data).substring(0, 100)}...`);
                }
            });
        }
        catch (error) {
            logger_1.default.error(`Ошибка подписки на стакан ${symbol}: ${error.message}`);
            // Через 5 секунд повторяем попытку
            setTimeout(() => this.subscribeToDepth(symbol, depth, updateSpeed, callback), 5000);
        }
    }
    // WebSocket-подписка на открытый интерес
    subscribeToOpenInterest(symbol, callback) {
        const streamName = `${symbol.toLowerCase()}@openInterest@1s`;
        this.subscribeToStream(streamName, (data) => {
            callback({
                value: parseFloat(data.o),
                timestamp: data.E
            });
        });
    }
    // WebSocket-подписка на ликвидации
    subscribeToLiquidations(symbol, callback) {
        const streamName = `${symbol.toLowerCase()}@forceOrder`;
        this.subscribeToStream(streamName, (data) => {
            callback({
                side: data.o.S.toLowerCase(),
                price: parseFloat(data.o.p),
                quantity: parseFloat(data.o.q),
                timestamp: data.E
            });
        });
    }
    // Общий метод для подписки на WebSocket-стрим
    subscribeToStream(streamName, callback) {
        // Если уже подписаны, не создаем новое подключение
        if (this.sockets.has(streamName)) {
            return;
        }
        // Создаем соединение
        const ws = new ws_1.default(`${this.wsBaseUrl}/${streamName}`);
        ws.on('open', () => {
            logger_1.default.info(`WebSocket connected: ${streamName}`);
        });
        ws.on('message', (data) => {
            try {
                const parsedData = JSON.parse(data.toString());
                // Проверка на сервисные сообщения от Binance
                if (parsedData.result === undefined) {
                    callback(parsedData);
                }
                else {
                    logger_1.default.info(`Получено сервисное сообщение: ${JSON.stringify(parsedData).substring(0, 100)}...`);
                }
            }
            catch (error) {
                logger_1.default.error(`Error parsing WebSocket data: ${error.message}`);
            }
        });
        ws.on('error', (error) => {
            logger_1.default.error(`WebSocket error on ${streamName}: ${error.message}`);
            // Пытаемся переподключиться при ошибке
            setTimeout(() => {
                this.sockets.delete(streamName);
                this.subscribeToStream(streamName, callback);
            }, 5000);
        });
        ws.on('close', () => {
            logger_1.default.error(`WebSocket closed: ${streamName}`);
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
    async setLeverage(symbol, leverage) {
        return this.sendSignedRequest('/fapi/v1/leverage', {
            symbol,
            leverage
        }, 'POST');
    }
    // Получение максимально доступного плеча для символа
    async getMaxLeverage(symbol) {
        const symbolData = this.symbolInfo.get(symbol);
        if (!symbolData) {
            await this.loadExchangeInfo();
            const reloadedData = this.symbolInfo.get(symbol);
            if (!reloadedData) {
                logger_1.default.error(`No symbol info for ${symbol}, using default max leverage`);
                return 50; // Максимальное плечо по умолчанию для альткоинов
            }
            return reloadedData.leverageBracket?.[0]?.maxLeverage || 50;
        }
        return symbolData.leverageBracket?.[0]?.maxLeverage || 50;
    }
    // Получение текущей цены маркировки
    async getMarkPrice(symbol) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/fapi/v1/premiumIndex`, {
                params: { symbol }
            });
            return parseFloat(response.data.markPrice);
        }
        catch (error) {
            logger_1.default.error(`Failed to get mark price for ${symbol}: ${error.message}`);
            throw error;
        }
    }
    // Получение открытых позиций
    async getOpenPositions() {
        const account = await this.getAccountInfo();
        return account.positions.filter((p) => Math.abs(parseFloat(p.positionAmt)) > 0);
    }
    // Получение точности для количества
    async getQuantityPrecision(symbol) {
        const info = this.symbolInfo.get(symbol);
        if (!info) {
            await this.loadExchangeInfo();
            return this.symbolInfo.get(symbol)?.quantityPrecision || 3;
        }
        return info.quantityPrecision || 3;
    }
    // Метод для подписи запросов
    sign(queryString) {
        return crypto_1.default
            .createHmac('sha256', this.apiSecret)
            .update(queryString)
            .digest('hex');
    }
    // Отправка подписанного запроса в API
    async sendSignedRequest(endpoint, params = {}, method = 'GET') {
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
                response = await axios_1.default.get(`${this.baseUrl}${endpoint}?${signedQueryString}`, {
                    headers: { 'X-MBX-APIKEY': this.apiKey }
                });
            }
            else if (method === 'POST') {
                response = await axios_1.default.post(`${this.baseUrl}${endpoint}?${signedQueryString}`, {}, // пустое тело запроса
                { headers: { 'X-MBX-APIKEY': this.apiKey } });
            }
            else if (method === 'DELETE') {
                response = await axios_1.default.delete(`${this.baseUrl}${endpoint}?${signedQueryString}`, {
                    headers: { 'X-MBX-APIKEY': this.apiKey }
                });
            }
            return response?.data;
        }
        catch (error) {
            if (error.response) {
                logger_1.default.error(`API error ${method} ${endpoint}: ${JSON.stringify(error.response.data)}`);
            }
            else {
                logger_1.default.error(`Network error ${method} ${endpoint}: ${error.message}`);
            }
            throw error;
        }
    }
    // Закрытие всех соединений
    closeAllConnections() {
        for (const [name, socket] of this.sockets.entries()) {
            socket.close();
            logger_1.default.info(`Closed WebSocket: ${name}`);
        }
        this.sockets.clear();
    }
    // Реализация минимально необходимых методов из старого интерфейса
    async placeMarketOrder(params) {
        return this.sendSignedRequest('/fapi/v1/order', {
            symbol: params.symbol,
            side: params.side.toUpperCase(),
            type: 'MARKET',
            quantity: params.quantity,
            reduceOnly: params.reduceOnly ? 'true' : undefined
        }, 'POST');
    }
    async getPosition(symbol) {
        const positions = await this.getOpenPositions();
        return positions.find((p) => p.symbol === symbol);
    }
    async cancelAllOrders(symbol) {
        return this.sendSignedRequest('/fapi/v1/allOpenOrders', { symbol }, 'DELETE');
    }
    async getPricePrecision(symbol) {
        const info = this.symbolInfo.get(symbol);
        return info?.pricePrecision || 2;
    }
    async placeStopOrder(params) {
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
    async placeLimitOrder(params) {
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
    async cancelOrder(symbol, orderId) {
        return this.sendSignedRequest('/fapi/v1/order', { symbol, orderId }, 'DELETE');
    }
    async cancelOrderType(symbol, orderType) {
        const orders = await this.getOpenOrders(symbol);
        const typeOrders = orders.filter((o) => o.type === orderType);
        const promises = typeOrders.map((o) => this.cancelOrder(symbol, o.orderId));
        await Promise.all(promises);
        return { success: true, count: typeOrders.length };
    }
    async getOpenOrders(symbol) {
        const params = {};
        if (symbol)
            params.symbol = symbol;
        return this.sendSignedRequest('/fapi/v1/openOrders', params);
    }
    // Получение свечей (klines) с улучшенным retry механизмом
    async getKlines(symbol, interval, limit = 500) {
        const maxRetries = 5; // Увеличено до 5 попыток
        const baseRetryDelay = 500; // Базовая задержка 0.5 секунды
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios_1.default.get(`${this.baseUrl}/fapi/v1/klines`, {
                    params: { symbol, interval, limit },
                    timeout: 15000 // Увеличен таймаут до 15 секунд
                });
                // Если успешно получили данные - логируем только для первой попытки после ошибок
                if (attempt > 1) {
                    logger_1.default.info(`✅ Восстановлено соединение с Binance для ${symbol} (попытка ${attempt})`);
                }
                return response.data.map((kline) => ({
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
            }
            catch (error) {
                const isLastAttempt = attempt === maxRetries;
                const isNetworkError = error.code === 'ECONNRESET' ||
                    error.code === 'ETIMEDOUT' ||
                    error.code === 'EHOSTUNREACH' ||
                    error.code === 'ENOTFOUND' ||
                    error.message?.includes('timeout');
                if (isNetworkError && !isLastAttempt) {
                    // Экспоненциальная задержка: 0.5s, 1s, 2s, 4s, 8s
                    const delay = baseRetryDelay * Math.pow(2, attempt - 1);
                    logger_1.default.warn(`🔄 Попытка ${attempt}/${maxRetries} для ${symbol} неудачна, повтор через ${delay}мс`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                if (isLastAttempt) {
                    logger_1.default.error(`❌ Критическая ошибка получения данных для ${symbol} после ${maxRetries} попыток: ${error.message}`);
                }
                throw error;
            }
        }
        return []; // Fallback, не должно достигаться
    }
    // Получение текущей цены с retry механизмом
    async getCurrentPrice(symbol) {
        const maxRetries = 3;
        const baseRetryDelay = 500;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios_1.default.get(`${this.baseUrl}/fapi/v1/ticker/price`, {
                    params: { symbol },
                    timeout: 10000
                });
                return parseFloat(response.data.price);
            }
            catch (error) {
                const isLastAttempt = attempt === maxRetries;
                const isNetworkError = error.code === 'ECONNRESET' ||
                    error.code === 'ETIMEDOUT' ||
                    error.code === 'EHOSTUNREACH' ||
                    error.message?.includes('timeout');
                if (isNetworkError && !isLastAttempt) {
                    const delay = baseRetryDelay * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                if (isLastAttempt) {
                    logger_1.default.error(`❌ Ошибка получения цены для ${symbol} после ${maxRetries} попыток: ${error.message}`);
                }
                throw error;
            }
        }
        throw new Error('Unreachable code');
    }
    // Получение 24h статистики с retry механизмом
    async getTicker24hr(symbol) {
        const maxRetries = 3;
        const baseRetryDelay = 500;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await axios_1.default.get(`${this.baseUrl}/fapi/v1/ticker/24hr`, {
                    params: { symbol },
                    timeout: 10000
                });
                return response.data;
            }
            catch (error) {
                const isLastAttempt = attempt === maxRetries;
                const isNetworkError = error.code === 'ECONNRESET' ||
                    error.code === 'ETIMEDOUT' ||
                    error.code === 'EHOSTUNREACH' ||
                    error.message?.includes('timeout');
                if (isNetworkError && !isLastAttempt) {
                    const delay = baseRetryDelay * Math.pow(2, attempt - 1);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                }
                if (isLastAttempt) {
                    logger_1.default.error(`❌ Ошибка получения 24h статистики для ${symbol} после ${maxRetries} попыток: ${error.message}`);
                }
                throw error;
            }
        }
        throw new Error('Unreachable code');
    }
}
exports.ExchangeService = ExchangeService;
