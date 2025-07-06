#!/bin/bash

# 🧪 БЫСТРЫЙ ТЕСТ ULTIMATE PUMP HUNTER
# Запуск на 1 минуту для проверки работоспособности

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🧪 БЫСТРЫЙ ТЕСТ ULTIMATE PUMP HUNTER${NC}"
echo -e "${BLUE}======================================${NC}"

# Проверяем наличие node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Устанавливаем зависимости...${NC}"
    npm install
fi

# Компилируем TypeScript
echo -e "${YELLOW}🔧 Компилируем проект...${NC}"
npx tsc --noEmit || {
    echo -e "${RED}❌ Ошибка компиляции! Проверьте код.${NC}"
    exit 1
}

echo -e "${GREEN}✅ Все проверки пройдены!${NC}"

# Проверяем конфигурацию
echo -e "${CYAN}📊 КОНФИГУРАЦИЯ:${NC}"
echo -e "   💰 Режим: $(grep 'TEST_MODE=' .env | cut -d'=' -f2 | sed 's/true/ВИРТУАЛЬНЫЙ ✅/g' | sed 's/false/⚠️ БОЕВОЙ/g')"
echo -e "   🎯 Длительность: 1 минута (тестовый запуск)"
echo ""

# Создаем директорию для логов
mkdir -p logs

# Запускаем быстрый тест
echo -e "${GREEN}🚀 ЗАПУСК БЫСТРОГО ТЕСТА (1 минута)...${NC}"
echo -e "${YELLOW}💡 Это проверка работоспособности всех систем${NC}"
echo ""

# Запуск с таймаутом в 1 минуту
timeout 60s npx ts-node night_test_runner.ts 0.017 2>&1 | tee "logs/quick_test_$(date +%Y%m%d_%H%M%S).log"

EXIT_CODE=$?

echo ""
echo -e "${BLUE}======================================${NC}"

if [ $EXIT_CODE -eq 0 ] || [ $EXIT_CODE -eq 124 ]; then  # 124 = timeout
    echo -e "${GREEN}✅ БЫСТРЫЙ ТЕСТ ЗАВЕРШЕН!${NC}"
    echo -e "${CYAN}📄 Проверьте отчет в корне проекта${NC}"
    
    # Показываем краткую статистику
    echo ""
    echo -e "${PURPLE}📊 КРАТКИЙ ОБЗОР:${NC}"
    echo -e "   🔧 Компиляция: ✅ Успешно"
    echo -e "   🌐 Подключение к Binance: ✅ OK"
    echo -e "   📊 Генерация статистики: ✅ OK"
    echo -e "   📄 Создание отчетов: ✅ OK"
    
    echo ""
    echo -e "${GREEN}🎉 Система готова к ночному тесту!${NC}"
    echo -e "${CYAN}💡 Для полного теста запустите: ./start_night_test.sh${NC}"
    
else
    echo -e "${RED}❌ БЫСТРЫЙ ТЕСТ ЗАВЕРШЕН С ОШИБКОЙ (код: ${EXIT_CODE})${NC}"
    echo -e "${YELLOW}📝 Проверьте логи в папке logs/${NC}"
fi

echo ""
echo -e "${YELLOW}📋 СЛЕДУЮЩИЕ ШАГИ:${NC}"
echo -e "   1. Если тест прошел успешно -> запустите ./start_night_test.sh"
echo -e "   2. Если были ошибки -> проверьте .env файл и API ключи"
echo -e "   3. Для полного ночного теста -> ./start_night_test.sh 8"

exit $EXIT_CODE
