#!/bin/bash

# 🚀 ULTIMATE PUMP HUNTER - МАКСИМАЛЬНЫЙ ОХВАТ РЫНКА
# Скрипт для запуска бота с максимальным количеством торговых пар

echo "🎯====================================🎯"
echo "🔥 ULTIMATE PUMP HUNTER - MAXIMUM MODE 🔥"
echo "🎯====================================🎯"
echo ""

# Проверяем зависимости
echo "📦 Проверяем зависимости..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен!"
    exit 1
fi

if ! npm list typescript &> /dev/null; then
    echo "📦 Устанавливаем TypeScript..."
    npm install -g typescript
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Устанавливаем зависимости проекта..."
    npm install
fi

# Компилируем TypeScript
echo "🔨 Компилируем проект..."
npx tsc

if [ $? -ne 0 ]; then
    echo "❌ Ошибка компиляции!"
    exit 1
fi

# Показываем статистику символов
echo ""
echo "📊 СТАТИСТИКА ТОРГОВЫХ СИМВОЛОВ:"
echo "================================================"

# Подсчитываем количество символов из config.ts
SYMBOLS_COUNT=$(grep -o "'[A-Z]*USDT'" src/config/config.ts | wc -l | xargs)

echo "🎯 Общее количество торговых пар: $SYMBOLS_COUNT"
echo "📈 Ожидаемая нагрузка на API: $(($SYMBOLS_COUNT * 2)) запросов/минуту"
echo "⚡ Максимальное плечо: 100x"
echo "💰 Размер позиции: 8% от equity"
echo "🎯 Target Profit: 5.5% (550% ROI)"
echo "🛡️ Stop Loss: 1.2% (120% loss)"
echo "🚀 БЕЗ КУЛДАУНА: Максимальная агрессивность!"
echo "🔒 Минимальная уверенность: 88%"
echo "📊 Минимальный памп: 2.8%"
echo "🚀 Минимальный объемный всплеск: 6x"
echo "🎯 Максимум сделок в день: 12 (удвоено!)"
echo ""

# Показываем некоторые символы
echo "📋 ПРИМЕРЫ ТОРГОВЫХ ПАР:"
echo "================================================"
echo "🥇 Топ-тир: BTCUSDT, ETHUSDT, SOLUSDT, BNBUSDT"
echo "⭐ Альткоины: ADAUSDT, DOTUSDT, LINKUSDT, AVAXUSDT"
echo "🚀 DeFi: UNIUSDT, AAVEUSDT, SUSHIUSDT, COMPUSDT"
echo "🎮 Gaming/NFT: MANAUSDT, SANDUSDT, AXSUSDT, ENJUSDT"
echo "🔥 Мемкоины: DOGEUSDT, SHIBUSDT, PEPEUSDT, BONKUSDT"
echo "💎 Новые проекты: ARBUSDT, OPUSDT, APTUSDТ, TIAUSDT"
echo "🤖 AI токены: FETUSDT, AGIXUSDT, RENDERUSDT, OCEANUSDT"
echo "🌐 L1/L2: NEARUSDT, FTMUSDT, KAVAUSDT, MATICUSDT"
echo "📊 Ordinals: ORDIUSDT, SATSUSDT, RATSUSDT"
echo "🎯 Solana мемы: WIFUSDT, BOMEUSDT, MYROUSUSDT"
echo ""

# Проверяем настройки .env
if [ ! -f ".env" ]; then
    echo "⚠️ Файл .env не найден! Создайте его с настройками Binance API"
    echo "Пример:"
    echo "BIN_KEY=your_api_key"
    echo "BIN_SEC=your_secret_key"
    echo "TESTNET=true"
    echo "TEST_MODE=true"
    exit 1
fi

# Проверяем тестовый режим
if grep -q "TESTNET=true" .env && grep -q "TEST_MODE=true" .env; then
    echo "✅ ТЕСТОВЫЙ РЕЖИМ: Включен (безопасно для тестирования)"
    echo "💡 Бот будет работать на виртуальных деньгах"
else
    echo "⚠️ БОЕВОЙ РЕЖИМ: Внимание! Бот будет работать с реальными деньгами!"
    echo "🔥 Убедитесь, что все настройки корректны!"
    read -p "Продолжить? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Запуск отменен пользователем"
        exit 0
    fi
fi

echo ""
echo "🎯 ОЦЕНКА ПОТЕНЦИАЛЬНОЙ ПРИБЫЛЬНОСТИ (БЕЗ КУЛДАУНА):"
echo "================================================"
echo "📊 При винрейте 65% и средней прибыли 5.5%:"
echo "💰 Ожидаемая дневная прибыль: ~20-35% (УДВОЕНО!)"
echo "📈 Потенциальная месячная прибыль: ~800-1500%"
echo "🚀 С учетом сложного процента: СУПЕР-экспоненциальный рост"
echo "⚡ Ожидается до 12 сделок в день вместо 6!"
echo ""

echo "⚡ ЗАПУСК ЧЕРЕЗ 3 СЕКУНДЫ..."
sleep 1
echo "⚡ 2..."
sleep 1
echo "⚡ 1..."
sleep 1

echo ""
echo "🎯 MAXIMUM PUMP HUNTER ACTIVATED! 🎯"
echo "💎 Охота за экспоненциальной прибылью началась!"
echo ""

# Запускаем бота
node dist/app.js

echo ""
echo "🏁 Ultimate Pump Hunter завершил работу"
echo "📊 Проверьте логи для анализа результатов"
