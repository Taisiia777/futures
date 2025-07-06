"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockExchangeService = void 0;
const exchangeService_1 = require("./exchangeService");
const logger_1 = __importDefault(require("../utils/logger"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const date_fns_1 = require("date-fns");
/**
 * Сервис для эмуляции биржи в тестовом режиме
 * Наследует интерфейс основного биржевого сервиса, но имитирует торговлю
 */
class MockExchangeService extends exchangeService_1.ExchangeService {
    constructor(apiKey, apiSecret) {
        super(apiKey, apiSecret);
        this.balance = 100; // Начальные 100$
        this.positions = new Map();
        this.openOrders = new Map();
        this.orderIdCounter = 1;
        this.lastPrices = new Map();
        // Создаем директорию для логов тестовых сделок
        this.logDir = path_1.default.resolve(process.cwd(), 'logs');
        if (!fs_1.default.existsSync(this.logDir)) {
            fs_1.default.mkdirSync(this.logDir, { recursive: true });
        }
        // Создаем файл для логов сделок
        const date = (0, date_fns_1.format)(new Date(), 'yyyyMMdd');
        this.tradesLogFile = path_1.default.join(this.logDir, `test_trades_${date}.csv`);
        // Создаем файл с заголовками если не существует
        if (!fs_1.default.existsSync(this.tradesLogFile)) {
            fs_1.default.writeFileSync(this.tradesLogFile, 'timestamp,symbol,side,quantity,price,leverage,pnl,balance\n');
        }
        logger_1.default.info('🧪 ТЕСТОВЫЙ РЕЖИМ: Торговый бот запущен с виртуальным балансом $100');
    }
    // Переопределяем методы из основного класса
    async getAccountInfo() {
        // Эмуляция информации об аккаунте
        return {
            totalWalletBalance: this.balance.toString(),
            totalUnrealizedProfit: Array.from(this.positions.values())
                .reduce((total, pos) => total + pos.unrealizedPnl, 0).toString(),
            positions: Array.from(this.positions.values())
        };
    }
    async getMarkPrice(symbol) {
        // Используем реальные рыночные данные через WebSocket
        // но не отправляем реальные ордера
        const price = await super.getMarkPrice(symbol);
        this.lastPrices.set(symbol, price);
        // Обновляем нереализованную прибыль/убыток для позиций
        this.updatePositionPnL(symbol, price);
        return price;
    }
    updatePositionPnL(symbol, currentPrice) {
        const position = this.positions.get(symbol);
        if (!position)
            return;
        if (position.side === 'buy') { // Long position
            position.unrealizedPnl = (currentPrice - position.entryPrice) * position.amount * position.leverage;
        }
        else { // Short position
            position.unrealizedPnl = (position.entryPrice - currentPrice) * position.amount * position.leverage;
        }
    }
    async placeMarketOrder(params) {
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
                logger_1.default.warn(`ТЕСТ: Попытка закрыть несуществующую позицию ${params.symbol}`);
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
            logger_1.default.info(`ТЕСТ: Закрыта позиция ${params.symbol} ${position.side}, PnL: ${pnl.toFixed(2)}$, новый баланс: ${this.balance.toFixed(2)}$`);
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
                logger_1.default.warn(`ТЕСТ: Уже есть открытая позиция по ${params.symbol}, новая позиция не открыта`);
                return { id: orderId, price, quantity: params.quantity, side: params.side, status: 'REJECTED' };
            }
            // Проверяем хватает ли средств (с учетом плеча)
            if (positionValue > this.balance) {
                logger_1.default.warn(`ТЕСТ: Недостаточно средств для открытия позиции. Нужно: ${positionValue.toFixed(2)}$, доступно: ${this.balance.toFixed(2)}$`);
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
            logger_1.default.info(`ТЕСТ: Открыта позиция ${params.symbol} ${params.side} x${params.leverage || 1}, цена: ${price}, количество: ${params.quantity}`);
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
    async getOpenPositions() {
        return Array.from(this.positions.values());
    }
    async getPosition(symbol) {
        const position = this.positions.get(symbol);
        if (!position)
            return null;
        // Обновляем PnL перед возвратом
        const currentPrice = this.lastPrices.get(symbol);
        if (currentPrice) {
            this.updatePositionPnL(symbol, currentPrice);
        }
        return position;
    }
    async cancelAllOrders(symbol) {
        // Отменяем все активные ордера для символа
        const orders = Array.from(this.openOrders.values())
            .filter(order => order.symbol === symbol);
        orders.forEach(order => this.openOrders.delete(order.id));
        logger_1.default.info(`ТЕСТ: Отменены все ордера для ${symbol}`);
        return { status: 'success', message: `Отменено ${orders.length} ордеров` };
    }
    async setLeverage(symbol, leverage) {
        logger_1.default.info(`ТЕСТ: Установлено плечо ${leverage}x для ${symbol}`);
        return { leverage, symbol };
    }
    async placeStopOrder(params) {
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
        logger_1.default.info(`ТЕСТ: Размещен стоп-ордер для ${params.symbol}, цена стопа: ${params.stopPrice}`);
        return order;
    }
    async placeLimitOrder(params) {
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
        logger_1.default.info(`ТЕСТ: Размещен лимитный ордер для ${params.symbol}, цена: ${params.price}`);
        return order;
    }
    async cancelOrder(symbol, orderId) {
        if (this.openOrders.has(orderId)) {
            this.openOrders.delete(orderId);
            logger_1.default.info(`ТЕСТ: Отменен ордер ${orderId} для ${symbol}`);
            return { status: 'success' };
        }
        return { status: 'error', message: 'Ордер не найден' };
    }
    async cancelOrderType(symbol, orderType) {
        const orders = Array.from(this.openOrders.values())
            .filter(order => order.symbol === symbol && order.type === orderType);
        orders.forEach(order => this.openOrders.delete(order.id));
        logger_1.default.info(`ТЕСТ: Отменены все ордера типа ${orderType} для ${symbol}`);
        return { success: true, count: orders.length };
    }
    async getOpenOrders(symbol) {
        let orders = Array.from(this.openOrders.values());
        if (symbol) {
            orders = orders.filter(order => order.symbol === symbol);
        }
        return orders;
    }
    logTrade(trade) {
        const date = (0, date_fns_1.format)(new Date(trade.timestamp), 'yyyy-MM-dd HH:mm:ss');
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
        fs_1.default.appendFileSync(this.tradesLogFile, line + '\n');
    }
}
exports.MockExchangeService = MockExchangeService;
