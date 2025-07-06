"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderManager = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
class OrderManager {
    constructor(exchangeService) {
        this.activeOrders = new Map();
        this.positionTrackers = new Map();
        this.exchangeService = exchangeService;
    }
    // Размещение рыночного ордера
    async placeMarketOrder(params) {
        try {
            logger_1.default.debug(`Размещение рыночного ордера: ${JSON.stringify(params)}`);
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
            logger_1.default.trade(`Рыночный ордер выполнен: ${params.symbol} ${params.side} ${quantity} по цене ${order.price}, плечо: ${params.leverage || 1}`);
            return order;
        }
        catch (error) {
            logger_1.default.error(`Ошибка размещения ордера: ${error.message}`);
            throw error;
        }
    }
    // Установка стоп-лосса
    async setStopLoss(symbol, orderId, price) {
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
            logger_1.default.info(`Установлен стоп-лосс для ${symbol}: ${roundedPrice}`);
            return stopOrder;
        }
        catch (error) {
            logger_1.default.error(`Ошибка установки стоп-лосса: ${error.message}`);
            throw error;
        }
    }
    // Установка тейк-профита (может быть несколько уровней)
    async setTakeProfit(symbol, orderId, levels) {
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
                logger_1.default.info(`Установлен тейк-профит для ${symbol}: ${roundedPrice}, количество: ${roundedQty}`);
            }
            return tpOrders;
        }
        catch (error) {
            logger_1.default.error(`Ошибка установки тейк-профита: ${error.message}`);
            throw error;
        }
    }
    // Закрытие позиции
    async closePosition(symbol, side) {
        try {
            // Получаем информацию о позиции
            const position = await this.exchangeService.getPosition(symbol);
            if (!position || position.quantity === 0) {
                logger_1.default.info(`Нет открытой позиции по ${symbol} для закрытия`);
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
            logger_1.default.info(`Закрыта позиция по ${symbol}: количество=${position.quantity}, примерная цена=${closeOrder.price}`);
            // Удаляем трекер позиции
            this.positionTrackers.delete(symbol);
            return closeOrder;
        }
        catch (error) {
            logger_1.default.error(`Ошибка закрытия позиции ${symbol}: ${error.message}`);
            throw error;
        }
    }
    // Обновление трейлинг-стопа
    async updateTrailingStop(symbol) {
        try {
            const tracker = this.positionTrackers.get(symbol);
            if (!tracker) {
                logger_1.default.debug(`updateTrailingStop: Нет трекера для ${symbol}`);
                return;
            }
            // Получаем текущую цену
            const currentPrice = await this.exchangeService.getMarkPrice(symbol);
            logger_1.default.debug(`updateTrailingStop: ${symbol} текущая цена: ${currentPrice}, highPrice: ${tracker.highPrice}, lowPrice: ${tracker.lowPrice}`);
            // Обновляем максимумы и минимумы
            const oldHigh = tracker.highPrice;
            const oldLow = tracker.lowPrice;
            if (currentPrice > tracker.highPrice) {
                tracker.highPrice = currentPrice;
                logger_1.default.debug(`updateTrailingStop: Обновлен максимум для ${symbol}: ${oldHigh} -> ${currentPrice}`);
            }
            if (currentPrice < tracker.lowPrice) {
                tracker.lowPrice = currentPrice;
                logger_1.default.debug(`updateTrailingStop: Обновлен минимум для ${symbol}: ${oldLow} -> ${currentPrice}`);
            }
            // Если у нас лонг и активирован трейлинг-стоп
            if (tracker.side === 'buy' && tracker.trailingStopActive) {
                const newStopPrice = tracker.highPrice * 0.995; // 0.5% от пика
                logger_1.default.debug(`updateTrailingStop: Вычислен новый трейлинг-стоп для LONG ${symbol}: ${newStopPrice} (0.5% от пика ${tracker.highPrice})`);
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
                logger_1.default.info(`Обновлен трейлинг-стоп для ${symbol} LONG: ${newStopPrice}`);
            }
            // Если у нас шорт и активирован трейлинг-стоп
            else if (tracker.side === 'sell' && tracker.trailingStopActive) {
                const newStopPrice = tracker.lowPrice * 1.005; // 0.5% от минимума
                logger_1.default.debug(`updateTrailingStop: Вычислен новый трейлинг-стоп для SHORT ${symbol}: ${newStopPrice} (0.5% от минимума ${tracker.lowPrice})`);
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
                logger_1.default.info(`Обновлен трейлинг-стоп для ${symbol} SHORT: ${newStopPrice}`);
            }
        }
        catch (error) {
            logger_1.default.error(`Ошибка обновления трейлинг-стопа: ${error.message}`);
        }
    }
    // Активация трейлинг-стопа (после достижения TP1)
    activateTrailingStop(symbol) {
        const tracker = this.positionTrackers.get(symbol);
        if (tracker) {
            tracker.trailingStopActive = true;
            logger_1.default.info(`Активирован трейлинг-стоп для ${symbol}`);
        }
    }
    // Проверка "спайка" - резкого движения против позиции
    async checkSpikeProtection(symbol) {
        try {
            const tracker = this.positionTrackers.get(symbol);
            if (!tracker)
                return false;
            const currentPrice = await this.exchangeService.getMarkPrice(symbol);
            // Для лонгов: если цена упала на 0.8% или больше за короткий период
            if (tracker.side === 'buy' &&
                (tracker.highPrice - currentPrice) / tracker.highPrice >= 0.008) {
                await this.closePosition(symbol, tracker.side);
                logger_1.default.warn(`Сработала защита от спайка для ${symbol}: резкое падение цены`);
                return true;
            }
            // Для шортов: если цена выросла на 0.8% или больше за короткий период
            if (tracker.side === 'sell' &&
                (currentPrice - tracker.lowPrice) / tracker.lowPrice >= 0.008) {
                await this.closePosition(symbol, tracker.side);
                logger_1.default.warn(`Сработала защита от спайка для ${symbol}: резкий рост цены`);
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.default.error(`Ошибка при проверке защиты от спайка: ${error.message}`);
            return false;
        }
    }
    // Вспомогательная функция для округления до шага
    roundToStep(value, precision) {
        const step = Math.pow(10, -precision);
        return Math.round(value / step) * step;
    }
    // Округление количества в соответствии с требованиями биржи
    async roundQuantity(symbol, quantity) {
        const precision = await this.exchangeService.getQuantityPrecision(symbol);
        return this.roundToStep(quantity, precision);
    }
}
exports.OrderManager = OrderManager;
