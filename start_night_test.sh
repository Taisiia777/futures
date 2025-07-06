#!/bin/bash

# 🌙 СКРИПТ ЗАПУСКА НОЧНОГО ТЕСТА ULTIMATE PUMP HUNTER
# Использование: ./start_night_test.sh [часы]
# Пример: ./start_night_test.sh 8  (запуск на 8 часов)

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🌙 ULTIMATE PUMP HUNTER - НОЧНОЙ ТЕСТ${NC}"
echo -e "${BLUE}===============================================${NC}"

# Проверяем аргументы
HOURS=${1:-8}  # По умолчанию 8 часов
echo -e "${CYAN}⏱️  Длительность теста: ${HOURS} часов${NC}"

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

# Создаем директорию для логов
mkdir -p logs

# Получаем текущую дату и время для именования файлов
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="logs/night_test_${TIMESTAMP}.log"

echo -e "${GREEN}✅ Все проверки пройдены!${NC}"
echo -e "${CYAN}📝 Логи будут записаны в: ${LOG_FILE}${NC}"
echo -e "${YELLOW}🚀 Запускаем ночной тест...${NC}"
echo ""

# Показываем конфигурацию
echo -e "${BLUE}📊 КОНФИГУРАЦИЯ ТЕСТА:${NC}"
echo -e "   💰 Начальный капитал: 100 USDT"
echo -e "   🎯 Режим: $(grep 'TEST_MODE=' .env | cut -d'=' -f2 | sed 's/true/ВИРТУАЛЬНЫЙ/g' | sed 's/false/БОЕВОЙ/g')"
echo -e "   🕐 Продолжительность: ${HOURS} часов"
echo -e "   📁 Лог файл: ${LOG_FILE}"
echo ""

# Запускаем ночной тест с логированием
echo -e "${GREEN}🌙 ЗАПУСК НОЧНОГО ТЕСТА...${NC}"
npx ts-node night_test_runner.ts ${HOURS} 2>&1 | tee "${LOG_FILE}"

# Получаем код завершения
EXIT_CODE=$?

echo ""
echo -e "${BLUE}===============================================${NC}"

if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ НОЧНОЙ ТЕСТ ЗАВЕРШЕН УСПЕШНО!${NC}"
    echo -e "${CYAN}📄 Детальный отчет сгенерирован в корне проекта${NC}"
    echo -e "${YELLOW}📝 Полные логи сохранены в: ${LOG_FILE}${NC}"
    
    # Показываем последние строки лога для быстрого обзора
    echo ""
    echo -e "${PURPLE}📊 КРАТКИЙ ОБЗОР РЕЗУЛЬТАТОВ:${NC}"
    tail -20 "${LOG_FILE}" | grep -E "(Капитал|WinRate|рост|Финальный|ТЕСТ ЗАВЕРШЕН)"
    
else
    echo -e "${RED}❌ НОЧНОЙ ТЕСТ ЗАВЕРШЕН С ОШИБКОЙ (код: ${EXIT_CODE})${NC}"
    echo -e "${YELLOW}📝 Проверьте логи: ${LOG_FILE}${NC}"
fi

echo ""
echo -e "${CYAN}🔍 Для анализа результатов:${NC}"
echo -e "   📄 Откройте сгенерированный отчет night_test_report_*.md"
echo -e "   📝 Просмотрите полные логи: cat ${LOG_FILE}"
echo -e "   📊 Найдите файлы отчетов: ls -la night_test_report_*.md"

exit $EXIT_CODE
