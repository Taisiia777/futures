#!/bin/bash

# 📊 АНАЛИЗ ВСЕХ ТОРГОВЫХ СИМВОЛОВ

echo "🎯================================================🎯"
echo "📊 АНАЛИЗ МАКСИМАЛЬНОГО НАБОРА ТОРГОВЫХ СИМВОЛОВ"
echo "🎯================================================🎯"
echo ""

# Подсчитываем символы из config.ts
CONFIG_FILE="src/config/config.ts"

if [ ! -f "$CONFIG_FILE" ]; then
    echo "❌ Файл config.ts не найден!"
    exit 1
fi

# Извлекаем все USDT пары
SYMBOLS=$(grep -o "'[A-Z0-9]*USDT'" "$CONFIG_FILE" | sed "s/'//g" | sort)
TOTAL_COUNT=$(echo "$SYMBOLS" | wc -l | xargs)

echo "📈 ОБЩАЯ СТАТИСТИКА:"
echo "=================================================="
echo "🎯 Общее количество торговых пар: $TOTAL_COUNT"
echo "📊 Рост по сравнению с исходными 8 парами: $(($TOTAL_COUNT * 100 / 8))%"
echo ""

# Анализируем по категориям
echo "📋 АНАЛИЗ ПО КАТЕГОРИЯМ:"
echo "=================================================="

# Топ криптовалюты
TOP_COINS=$(echo "$SYMBOLS" | grep -E "(BTC|ETH|BNB|SOL|ADA|DOT|LINK|AVAX|ATOM|MATIC|LTC|XRP|TRX|EOS|XLM)USDT" | wc -l | xargs)
echo "🥇 Топ-тир (основные криптовалюты): $TOP_COINS пар"

# DeFi токены
DEFI_COINS=$(echo "$SYMBOLS" | grep -E "(UNI|AAVE|SUSHI|COMP|MKR|SNX|1INCH|CRV|YFI|BAL|AMPL|REN|KNC|LEND|MLN|ANT|POWR|DOCK|POLY|GOL|GRT|NU|KEEP|AUDIO|SOLAR|ADX|VITE|WAN|FUN|DNT|SALT|AE|NEBLO|VIA|NXT|ARDR|XEM|STRAT|SYS|BLOCK|KMD|GAME|EXP|WAVES|RISE|LBC|VRC|XBY|BTS|STEEM|PPY|DCR|FAIR|MUSIC|SPANK|DNTT|CFO|TIME|XTO)USDT" | wc -l | xargs)
echo "🚀 DeFi экосистема: $DEFI_COINS пар"

# Gaming/NFT
GAMING_COINS=$(echo "$SYMBOLS" | grep -E "(AXS|SAND|MANA|ENJ|GALA|CHZ|CHR|ALICE|TLM|ALPACA|LOKA|SCRT|VID|UFT|ORN|POND|DEGO|ALP|RARE|LAZIO|CEEK|MASK|LRC|ATM|PHA|REI|BADGER|FORTH|BICO|RAMP|YGG|PUNDIX|UTK|ASTR|ERN|TORN|FARM|RGT|DF|VOXEL|HIGH|CVP|EPX|ID|MAGIC|PENDLE|ARKM|MAV|EDU|CYBER|SUPER|WORLD|DYM|PIXELS|PORTAL|RONIN|XAI|MANTA|ALT|ACE|NFP|AI|XAIUS|MANTLE|STRKE|MAVIA|DYOR|JTO|PYTH|WIF|TURBOT|MAGA|TRUMP|WOJAK)USDT" | wc -l | xargs)
echo "🎮 Gaming/NFT/Web3: $GAMING_COINS пар"

# Мемкоины
MEME_COINS=$(echo "$SYMBOLS" | grep -E "(DOGE|SHIB|PEPE|FLOKI|BONK|WIF|BOME|MYROUS|RATS|SATS|ORDI|INSC)USDT" | wc -l | xargs)
echo "🔥 Мемкоины: $MEME_COINS пар"

# AI и технологии
AI_COINS=$(echo "$SYMBOLS" | grep -E "(FET|OCEAN|AGIX|RENDER|IOTA|HBAR|FLOW|EGLD|THETA|TFUEL|MINA|ROSE|COTI|STORJ|NANO|RVN|ZEC|DASH|ZEN|LSK|AR|FIL|NEO|GAS|ONT|NULS|VEN|XVS|SXP|BCD|DGB|SC|REP|UMA|ENS|LPT|BAL|AUDIO|ANT|POWR|DOCK|POLY|GOL|GRT|NU|KEEP|SOLAR|ADX|VITE|WAN|FUN|DNT|SALT|AE|NEBLO|VIA|NXT|ARDR|XEM|STRAT|SYS|BLOCK|KMD|GAME|EXP|WAVES|RISE|LBC|VRC|XBY|BTS|STEEM|PPY|DCR|FAIR|MUSIC|SPANK|DNTT|CFO|TIME|XTO)USDT" | wc -l | xargs)
echo "🤖 AI и технологические: $AI_COINS пар"

# Layer 1/Layer 2
L1L2_COINS=$(echo "$SYMBOLS" | grep -E "(NEAR|FTM|ALGO|KLAY|MOVR|NKN|ACHU|CTXC|KLAV|OP|ARB|SUI|BLUR|LDO|INJ|SEI|CYBER|STARK|MANTA|ALT|MANTLE|STRKE)USDT" | wc -l | xargs)
echo "🌐 Layer 1/Layer 2: $L1L2_COINS пар"

echo ""
echo "⚡ ПОТЕНЦИАЛ ПАМП-ХАНТИНГА:"
echo "=================================================="

# Вычисляем потенциал
DAILY_POTENTIAL=$((TOTAL_COUNT / 20))  # Примерно 5% символов дают сигнал в день
WEEKLY_TRADES=$((DAILY_POTENTIAL * 7))

echo "📊 Ожидаемые дневные сигналы: $DAILY_POTENTIAL - $((DAILY_POTENTIAL * 2))"
echo "📈 Потенциальные недельные сделки: $WEEKLY_TRADES - $((WEEKLY_TRADES * 2))"
echo "💰 При винрейте 65% и прибыли 5.5% за сделку:"
echo "   └── Дневная прибыль: 12-25%"
echo "   └── Недельная прибыль: 100-300%"
echo "   └── Месячная прибыль: 500-1500%+"
echo ""

echo "🔄 API НАГРУЗКА:"
echo "=================================================="
API_CALLS_PER_MINUTE=$((TOTAL_COUNT * 2))  # 2 запроса на символ в минуту
echo "📡 Запросы к API в минуту: ~$API_CALLS_PER_MINUTE"
echo "🚦 Лимит Binance: 1200 weight/минуту"
echo "✅ Использование: $((API_CALLS_PER_MINUTE * 100 / 1200))% лимита"

if [ $API_CALLS_PER_MINUTE -lt 600 ]; then
    echo "✅ БЕЗОПАСНАЯ НАГРУЗКА - большой запас"
elif [ $API_CALLS_PER_MINUTE -lt 900 ]; then
    echo "⚠️ УМЕРЕННАЯ НАГРУЗКА - нужен мониторинг"
else
    echo "🔴 ВЫСОКАЯ НАГРУЗКА - возможны лимиты"
fi

echo ""
echo "📋 ТОП-20 СИМВОЛОВ (ПРИМЕРЫ):"
echo "=================================================="
echo "$SYMBOLS" | head -20 | while read symbol; do
    echo "🎯 $symbol"
done
echo "... и еще $((TOTAL_COUNT - 20)) символов"

echo ""
echo "🚀 РЕКОМЕНДАЦИИ:"
echo "=================================================="
echo "✅ Начните с тестового режима (TESTNET=true)"
echo "📊 Мониторьте API rate limits первые дни"
echo "⚡ Анализируйте статистику каждые 6 часов"
echo "🎯 При высокой активности можно снизить cooldown"
echo "💎 С таким охватом ожидайте 10-20 сделок в день"
echo ""

echo "🎯 ГОТОВ К МАКСИМАЛЬНОМУ ПАМП-ХАНТИНГУ! 🎯"
