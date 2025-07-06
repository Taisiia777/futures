#!/usr/bin/env npx ts-node

/**
 * ОПРЕДЕЛЕНИЕ РАЗРЕШЕННЫХ ДЛЯ ТОРГОВЛИ ВАЛЮТНЫХ ПАР
 */

import { ExchangeService } from './src/services/exchangeService';
import { config } from './src/config/config';

async function findTradingPairs() {
    console.log('🔍 ПОИСК РАЗРЕШЕННЫХ ДЛЯ ТОРГОВЛИ ПАР');
    console.log('=====================================');
    
    const exchangeService = new ExchangeService(config.binance.apiKey, config.binance.apiSecret);
    
    // Список популярных USDT пар для тестирования
    const testSymbols = [
        'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'ADAUSDT', 
        'DOTUSDT', 'LINKUSDT', 'LTCUSDT', 'AVAXUSDT', 'MATICUSDT',
        'UNIUSDT', 'ATOMUSDT', 'FTMUSDT', 'AAVEUSDT', 'SUSHIUSDT'
    ];
    
    console.log('🧪 Тестируем торговлю небольшими суммами...\n');
    
    const allowedPairs: string[] = [];
    const blockedPairs: string[] = [];
    
    for (const symbol of testSymbols) {
        try {
            // Пытаемся получить минимальный размер ордера
            const accountInfo = await exchangeService.getAccountInfo();
            const position = accountInfo.positions.find((p: any) => p.symbol === symbol);
            
            if (position) {
                console.log(`✅ ${symbol}: Доступен для торговли`);
                allowedPairs.push(symbol);
            } else {
                console.log(`❓ ${symbol}: Позиция не найдена`);
            }
            
            // Небольшая задержка чтобы не превысить rate limit
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error: any) {
            if (error.message.includes('not authorized') || 
                error.message.includes('not allowed') ||
                error.message.includes('permission')) {
                console.log(`❌ ${symbol}: Торговля запрещена`);
                blockedPairs.push(symbol);
            } else {
                console.log(`⚠️ ${symbol}: Ошибка - ${error.message}`);
            }
        }
    }
    
    console.log('\n📊 РЕЗУЛЬТАТЫ:');
    console.log(`✅ Разрешенных пар: ${allowedPairs.length}`);
    console.log(`❌ Заблокированных пар: ${blockedPairs.length}`);
    
    if (allowedPairs.length > 0) {
        console.log('\n🎯 РАЗРЕШЕННЫЕ ПАРЫ:');
        allowedPairs.forEach(pair => console.log(`   • ${pair}`));
        
        console.log('\n💡 РЕКОМЕНДАЦИЯ ДЛЯ БОТА:');
        console.log('Настройте бота на эти пары в config.ts:');
        console.log(`symbols: [${allowedPairs.map(p => `'${p}'`).join(', ')}]`);
    }
    
    if (blockedPairs.length > 0) {
        console.log('\n🚫 ЗАБЛОКИРОВАННЫЕ ПАРЫ:');
        blockedPairs.forEach(pair => console.log(`   • ${pair}`));
    }
}

findTradingPairs().catch(console.error);
