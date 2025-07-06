#!/bin/bash

# 🔧 ТЕСТ УСТОЙЧИВОСТИ К СЕТЕВЫМ ОШИБКАМ
# Проверяет как бот справляется с проблемами подключения к Binance

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🔧 ТЕСТ УСТОЙЧИВОСТИ К СЕТЕВЫМ ОШИБКАМ${NC}"
echo -e "${BLUE}===========================================${NC}"

# Компилируем проект
echo -e "${YELLOW}🔧 Компилируем проект...${NC}"
npx tsc --noEmit || {
    echo -e "${RED}❌ Ошибка компиляции!${NC}"
    exit 1
}

echo -e "${GREEN}✅ Компиляция успешна${NC}"
echo ""

# Создаем директорию для логов
mkdir -p logs

# Запускаем тест на 2 минуты
echo -e "${CYAN}📊 ТЕСТИРОВАНИЕ:${NC}"
echo -e "   🔄 Будет тестировать retry-механизмы"
echo -e "   🌐 Проверит устойчивость к сетевым ошибкам"
echo -e "   ⏱️ Длительность: 2 минуты"
echo ""

LOG_FILE="logs/network_resilience_test_$(date +%Y%m%d_%H%M%S).log"

echo -e "${GREEN}🚀 ЗАПУСК ТЕСТА...${NC}"

# Запускаем тест на 2 минуты (используем gtimeout для macOS или альтернативный способ)
if command -v gtimeout &> /dev/null; then
    # Если установлен gtimeout (brew install coreutils)
    gtimeout 120s npx ts-node night_test_runner.ts 0.033 2>&1 | tee "$LOG_FILE"
    EXIT_CODE=$?
elif command -v timeout &> /dev/null; then
    # Если есть timeout (Linux)
    timeout 120s npx ts-node night_test_runner.ts 0.033 2>&1 | tee "$LOG_FILE"
    EXIT_CODE=$?
else
    # Альтернативный способ для macOS без coreutils
    echo -e "${YELLOW}⚠️ timeout не найден, запуск без ограничения времени...${NC}"
    echo -e "${CYAN}💡 Остановите тест через 2 минуты нажав Ctrl+C${NC}"
    npx ts-node night_test_runner.ts 0.033 2>&1 | tee "$LOG_FILE" &
    TEST_PID=$!
    
    # Ждем 120 секунд
    sleep 120
    
    # Останавливаем процесс
    kill -TERM $TEST_PID 2>/dev/null
    wait $TEST_PID 2>/dev/null
    EXIT_CODE=$?
fi

echo ""
echo -e "${BLUE}===========================================${NC}"

if [ $EXIT_CODE -eq 0 ] || [ $EXIT_CODE -eq 124 ]; then  # 124 = timeout
    echo -e "${GREEN}✅ ТЕСТ УСТОЙЧИВОСТИ ЗАВЕРШЕН${NC}"
    
    # Анализируем результаты
    echo ""
    echo -e "${PURPLE}📊 АНАЛИЗ РЕЗУЛЬТАТОВ:${NC}"
    
    # Подсчитываем сетевые ошибки
    NETWORK_ERRORS=$(grep -c "Временная сетевая ошибка\|🌐 Сетевая ошибка\|🔄 Попытка" "$LOG_FILE" 2>/dev/null | tr -d '\n' || echo "0")
    RECOVERED_CONNECTIONS=$(grep -c "✅ Восстановлено соединение" "$LOG_FILE" 2>/dev/null | tr -d '\n' || echo "0")
    CRITICAL_ERRORS=$(grep -c "❌ Критическая ошибка" "$LOG_FILE" 2>/dev/null | tr -d '\n' || echo "0")
    
    echo -e "   🌐 Сетевые ошибки: ${NETWORK_ERRORS}"
    echo -e "   ✅ Восстановленные соединения: ${RECOVERED_CONNECTIONS}"  
    echo -e "   ❌ Критические ошибки: ${CRITICAL_ERRORS}"
    
    if [ "$CRITICAL_ERRORS" -eq 0 ]; then
        echo -e "${GREEN}✨ УСТОЙЧИВОСТЬ К СЕТЕВЫМ ОШИБКАМ: ОТЛИЧНО${NC}"
        echo -e "   Бот корректно обрабатывает временные проблемы"
    elif [ "$CRITICAL_ERRORS" -lt 5 ]; then
        echo -e "${YELLOW}⚠️ УСТОЙЧИВОСТЬ: ХОРОШО${NC}"
        echo -e "   Есть незначительные проблемы с обработкой ошибок"
    else
        echo -e "${RED}❌ УСТОЙЧИВОСТЬ: ТРЕБУЕТ ДОРАБОТКИ${NC}"
        echo -e "   Много критических ошибок"
    fi
    
    # Проверяем работу бота
    BOT_ACTIVITY=$(grep -c "⚡ \[" "$LOG_FILE" 2>/dev/null | tr -d '\n' || echo "0")
    if [ "$BOT_ACTIVITY" -gt 5 ]; then
        echo -e "${GREEN}✅ АКТИВНОСТЬ БОТА: Работает стабильно${NC}"
    else
        echo -e "${YELLOW}⚠️ АКТИВНОСТЬ БОТА: Низкая активность${NC}"
    fi
    
else
    echo -e "${RED}❌ ТЕСТ ЗАВЕРШЕН С ОШИБКОЙ (код: ${EXIT_CODE})${NC}"
fi

echo ""
echo -e "${CYAN}📝 Детальные логи: ${LOG_FILE}${NC}"
echo -e "${YELLOW}💡 Для запуска полного ночного теста: ./start_night_test.sh${NC}"

exit $EXIT_CODE
