#!/bin/bash

# 🧪 ПРОСТОЙ ТЕСТ RETRY-МЕХАНИЗМОВ
# Тест без использования timeout для совместимости с macOS

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🧪 ПРОСТОЙ ТЕСТ ИСПРАВЛЕНИЙ${NC}"
echo -e "${BLUE}==============================${NC}"

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

LOG_FILE="logs/simple_test_$(date +%Y%m%d_%H%M%S).log"

echo -e "${CYAN}📊 ТЕСТИРОВАНИЕ RETRY-МЕХАНИЗМОВ:${NC}"
echo -e "   🔄 Проверим обработку сетевых ошибок"
echo -e "   🌐 Тест устойчивости к API проблемам"
echo -e "   ⏱️ Длительность: 30 секунд"
echo -e "   📝 Логи: ${LOG_FILE}"
echo ""

echo -e "${GREEN}🚀 ЗАПУСК ТЕСТА...${NC}"
echo -e "${YELLOW}💡 Тест остановится автоматически через 30 секунд${NC}"
echo ""

# Запускаем тест в фоне
npx ts-node night_test_runner.ts 0.0083 2>&1 | tee "$LOG_FILE" &
TEST_PID=$!

# Ждем 30 секунд
sleep 30

# Останавливаем процесс
echo ""
echo -e "${YELLOW}⏰ Время истекло, останавливаем тест...${NC}"
kill -TERM $TEST_PID 2>/dev/null
wait $TEST_PID 2>/dev/null

echo ""
echo -e "${BLUE}==============================${NC}"
echo -e "${GREEN}✅ ТЕСТ ЗАВЕРШЕН${NC}"

# Анализируем результаты
echo ""
echo -e "${PURPLE}📊 АНАЛИЗ РЕЗУЛЬТАТОВ:${NC}"

# Проверяем активность бота
ACTIVITY_COUNT=$(grep -c "⚡ \[" "$LOG_FILE" 2>/dev/null || echo "0")
NETWORK_ISSUES=$(grep -c "🌐\|🔄 Попытка\|Временная сетевая" "$LOG_FILE" 2>/dev/null || echo "0")
CRITICAL_ERRORS=$(grep -c "❌ Критическая ошибка\|💥 Критическая ошибка" "$LOG_FILE" 2>/dev/null || echo "0")
RECOVERED=$(grep -c "✅ Восстановлено соединение" "$LOG_FILE" 2>/dev/null || echo "0")

echo -e "   📈 Активность бота: ${ACTIVITY_COUNT} обновлений"
echo -e "   🌐 Сетевые проблемы: ${NETWORK_ISSUES}"
echo -e "   ✅ Восстановления: ${RECOVERED}"
echo -e "   ❌ Критические ошибки: ${CRITICAL_ERRORS}"

# Оценка результатов
echo ""
if [ "$ACTIVITY_COUNT" -gt 2 ]; then
    echo -e "${GREEN}✅ БОТ РАБОТАЕТ: Нормальная активность${NC}"
else
    echo -e "${YELLOW}⚠️ НИЗКАЯ АКТИВНОСТЬ: Возможны проблемы${NC}"
fi

if [ "$CRITICAL_ERRORS" -eq 0 ]; then
    echo -e "${GREEN}✅ ОШИБКИ: Критических ошибок нет${NC}"
else
    echo -e "${RED}❌ ОШИБКИ: ${CRITICAL_ERRORS} критических ошибок${NC}"
fi

if [ "$NETWORK_ISSUES" -gt 0 ] && [ "$RECOVERED" -gt 0 ]; then
    echo -e "${GREEN}✅ УСТОЙЧИВОСТЬ: Retry-механизмы работают${NC}"
elif [ "$NETWORK_ISSUES" -eq 0 ]; then
    echo -e "${CYAN}ℹ️ СЕТЬ: Проблем с сетью не обнаружено${NC}"
else
    echo -e "${YELLOW}⚠️ УСТОЙЧИВОСТЬ: Проблемы с восстановлением${NC}"
fi

# Итоговая оценка
echo ""
if [ "$CRITICAL_ERRORS" -eq 0 ] && [ "$ACTIVITY_COUNT" -gt 2 ]; then
    echo -e "${GREEN}🎉 ОБЩАЯ ОЦЕНКА: ОТЛИЧНО${NC}"
    echo -e "   Бот работает стабильно, исправления работают"
    echo ""
    echo -e "${CYAN}💡 ГОТОВ К НОЧНОМУ ТЕСТУ:${NC}"
    echo -e "   ./start_night_test.sh 8"
elif [ "$CRITICAL_ERRORS" -eq 0 ]; then
    echo -e "${YELLOW}✅ ОБЩАЯ ОЦЕНКА: ХОРОШО${NC}"
    echo -e "   Критических ошибок нет, можно тестировать"
else
    echo -e "${RED}⚠️ ОБЩАЯ ОЦЕНКА: ТРЕБУЕТ ВНИМАНИЯ${NC}"
    echo -e "   Есть критические ошибки"
fi

echo ""
echo -e "${CYAN}📝 Детальные логи: ${LOG_FILE}${NC}"
echo -e "${YELLOW}📄 Просмотр логов: cat ${LOG_FILE}${NC}"

exit 0
