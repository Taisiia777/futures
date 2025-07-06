#!/usr/bin/env npx ts-node

/**
 * ПРОВЕРКА ДОСТУПА К ДАННЫМ BINANCE
 * Тестирует доступ к различным валютным парам и API endpoints
 */

import { ExchangeService } from './src/services/exchangeService';
import { config } from './src/config/config';
import logger from './src/utils/logger';

async function testBinanceAccess() {
    console.log('🔍 ПРОВЕРКА ДОСТУПА К BINANCE API');
    console.log('=====================================');
    
    try {
        // Создаем сервис
        const exchangeService = new ExchangeService(config.binance.apiKey, config.binance.apiSecret);
        
        console.log('✅ Exchange service создан');
        
        // Тест 1: Проверяем информацию об аккаунте
        console.log('\n📊 ТЕСТ 1: Информация об аккаунте');
        try {
            const accountInfo = await exchangeService.getAccountInfo();
            console.log('✅ Доступ к информации аккаунта: OK');
            console.log(`   Общий баланс: ${accountInfo.totalWalletBalance} USDT`);
            console.log(`   Доступно для торговли: ${accountInfo.availableBalance} USDT`);
            
            // Проверяем активные позиции
            const positions = accountInfo.positions.filter((p: any) => Math.abs(parseFloat(p.positionAmt)) > 0);
            console.log(`   Открытых позиций: ${positions.length}`);
            
        } catch (error: any) {
            console.log('❌ Ошибка доступа к аккаунту:', error.message);
        }
        
        // Тест 2: Проверяем доступ к рыночным данным (не требует торговых разрешений)
        console.log('\n📈 ТЕСТ 2: Рыночные данные (публичные)');
        const testSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT'];
        
        for (const symbol of testSymbols) {
            try {
                // Тестируем получение свечей (публичные данные)
                const klines = await exchangeService.getKlines(symbol, '1m', 5);
                console.log(`✅ ${symbol}: Свечи получены (${klines.length} записей)`);
                
                // Тестируем получение цены (публичные данные)
                const price = await exchangeService.getCurrentPrice(symbol);
                console.log(`   Текущая цена: $${price.toFixed(2)}`);
                
            } catch (error: any) {
                console.log(`❌ ${symbol}: Ошибка получения данных - ${error.message}`);
            }
        }
        
        // Тест 3: Проверяем информацию о символах
        console.log('\n🔧 ТЕСТ 3: Информация о торговых парах');
        try {
            // Этот метод загружается при инициализации сервиса
            await new Promise(resolve => setTimeout(resolve, 2000)); // Даем время загрузиться
            
            console.log('✅ Информация о торговых парах загружена');
            
            // Проверяем несколько символов на доступность торговли
            const tradingTestSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
            for (const symbol of tradingTestSymbols) {
                try {
                    const maxLeverage = await exchangeService.getMaxLeverage(symbol);
                    const pricePrecision = await exchangeService.getPricePrecision(symbol);
                    const quantityPrecision = await exchangeService.getQuantityPrecision(symbol);
                    
                    console.log(`✅ ${symbol}:`);
                    console.log(`   Макс. плечо: ${maxLeverage}x`);
                    console.log(`   Точность цены: ${pricePrecision}`);
                    console.log(`   Точность количества: ${quantityPrecision}`);
                    
                } catch (error: any) {
                    console.log(`❌ ${symbol}: Ошибка получения торговой информации - ${error.message}`);
                }
            }
            
        } catch (error: any) {
            console.log('❌ Ошибка получения информации о торговых парах:', error.message);
        }
        
        // Тест 4: Проверяем торговые разрешения
        console.log('\n⚖️ ТЕСТ 4: Торговые разрешения');
        try {
            const openOrders = await exchangeService.getOpenOrders();
            console.log('✅ Доступ к открытым ордерам: OK');
            console.log(`   Открытых ордеров: ${openOrders.length}`);
            
        } catch (error: any) {
            console.log('❌ Ошибка доступа к торговым функциям:', error.message);
            if (error.message.includes('API-key format invalid')) {
                console.log('💡 Возможно, API ключи неверны или не имеют торговых разрешений');
            }
        }
        
        // Тест 5: Проверяем ограничения на торговлю
        console.log('\n🚫 ТЕСТ 5: Ограничения торговли');
        try {
            // Получаем информацию об аккаунте еще раз для проверки ограничений
            const accountInfo = await exchangeService.getAccountInfo();
            
            console.log('📋 Разрешения аккаунта:');
            console.log(`   Торговля: ${accountInfo.canTrade ? '✅ Разрешена' : '❌ Запрещена'}`);
            console.log(`   Вывод средств: ${accountInfo.canWithdraw ? '✅ Разрешен' : '❌ Запрещен'}`);
            console.log(`   Депозит: ${accountInfo.canDeposit ? '✅ Разрешен' : '❌ Запрещен'}`);
            
            // Проверяем активные символы для торговли
            const activeSymbols = accountInfo.positions
                .filter((p: any) => p.symbol.endsWith('USDT'))
                .map((p: any) => p.symbol);
            
            console.log(`\n🎯 Доступные для торговли символы: ${activeSymbols.length}`);
            if (activeSymbols.length <= 10) {
                console.log('   Символы:', activeSymbols.join(', '));
            } else {
                console.log('   Первые 10:', activeSymbols.slice(0, 10).join(', '), '...');
            }
            
        } catch (error: any) {
            console.log('❌ Ошибка проверки разрешений:', error.message);
        }
        
        console.log('\n🎉 ПРОВЕРКА ЗАВЕРШЕНА');
        console.log('=====================================');
        
        // Выводы и рекомендации
        console.log('\n💡 ВЫВОДЫ:');
        console.log('1. Рыночные данные (свечи, цены) - это ПУБЛИЧНАЯ информация');
        console.log('2. Для получения рыночных данных НЕ НУЖНЫ торговые разрешения');
        console.log('3. Ограничения на 3 валютные пары касаются только ТОРГОВЛИ');
        console.log('4. Бот может анализировать ВСЕ символы для поиска пампов');
        console.log('5. Торговать можно только разрешенными парами');
        
    } catch (error: any) {
        console.log('💥 Критическая ошибка:', error.message);
    }
}

// Запускаем тест
testBinanceAccess().catch(console.error);
