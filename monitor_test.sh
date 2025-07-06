#!/bin/bash

# 📊 МОНИТОРИНГ НОЧНОГО ТЕСТА ULTIMATE PUMP HUNTER
# Показывает текущее состояние теста в реальном времени

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${PURPLE}📊 МОНИТОРИНГ ULTIMATE PUMP HUNTER${NC}"
echo -e "${BLUE}=====================================${NC}"

# Проверяем запущен ли тест
if ! pgrep -f "night_test_runner.ts" > /dev/null; then
    echo -e "${RED}❌ Ночной тест не запущен${NC}"
    echo -e "${YELLOW}💡 Запустите тест командой: ./start_night_test.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ночной тест активен${NC}"
echo ""

# Функция для отображения статистики из логов
show_current_stats() {
    # Находим последний лог файл
    LATEST_LOG=$(ls -t logs/night_test_*.log 2>/dev/null | head -1)
    
    if [ -z "$LATEST_LOG" ]; then
        echo -e "${RED}❌ Лог файлы не найдены${NC}"
        return
    fi
    
    echo -e "${CYAN}📄 Текущий лог: ${LATEST_LOG}${NC}"
    echo ""
    
    # Показываем последнюю краткую статистику
    echo -e "${YELLOW}⚡ ПОСЛЕДНИЕ ОБНОВЛЕНИЯ:${NC}"
    tail -50 "$LATEST_LOG" | grep -E "⚡ \[" | tail -3
    echo ""
    
    # Показываем последнюю расширенную статистику
    echo -e "${BLUE}📊 ДЕТАЛЬНАЯ СТАТИСТИКА:${NC}"
    tail -200 "$LATEST_LOG" | grep -A 10 "РАСШИРЕННАЯ СТАТИСТИКА" | tail -11
    echo ""
    
    # Показываем важные события
    echo -e "${GREEN}🎯 ПОСЛЕДНИЕ СДЕЛКИ:${NC}"
    tail -100 "$LATEST_LOG" | grep -E "(ОТКРЫВАЕМ ПОЗИЦИЮ|ЗАКРЫВАЕМ ПОЗИЦИЮ|PROFIT|LOSS)" | tail -5
    echo ""
    
    # Показываем активные режимы
    echo -e "${PURPLE}⚙️ АКТИВНЫЕ РЕЖИМЫ:${NC}"
    tail -50 "$LATEST_LOG" | grep -E "(СЛОЖНЫЙ ПРОЦЕНТ|КОНСЕРВАТИВНЫЙ РЕЖИМ|АКТИВНАЯ ПОЗИЦИЯ)" | tail -3
    echo ""
}

# Основной цикл мониторинга
monitor_test() {
    while true; do
        clear
        echo -e "${PURPLE}📊 МОНИТОРИНГ ULTIMATE PUMP HUNTER${NC}"
        echo -e "${BLUE}=====================================${NC}"
        echo -e "${CYAN}🕐 Обновлено: $(date '+%H:%M:%S')${NC}"
        echo ""
        
        # Проверяем что тест все еще запущен
        if ! pgrep -f "night_test_runner.ts" > /dev/null; then
            echo -e "${RED}❌ Тест завершен или остановлен${NC}"
            echo ""
            echo -e "${YELLOW}📄 Проверьте отчеты:${NC}"
            ls -la night_test_report_*.md 2>/dev/null || echo "   Отчеты пока не созданы"
            break
        fi
        
        show_current_stats
        
        echo -e "${CYAN}────────────────────────────────────${NC}"
        echo -e "${YELLOW}Обновление через 30 секунд... (Ctrl+C для выхода)${NC}"
        
        sleep 30
    done
}

# Проверяем аргументы
case "${1}" in
    "stats"|"s")
        # Показать статистику один раз и выйти
        show_current_stats
        ;;
    "logs"|"l")
        # Показать хвост логов
        LATEST_LOG=$(ls -t logs/night_test_*.log 2>/dev/null | head -1)
        if [ -n "$LATEST_LOG" ]; then
            echo -e "${CYAN}📄 Просмотр логов: ${LATEST_LOG}${NC}"
            echo -e "${YELLOW}(Ctrl+C для выхода)${NC}"
            echo ""
            tail -f "$LATEST_LOG"
        else
            echo -e "${RED}❌ Лог файлы не найдены${NC}"
        fi
        ;;
    "help"|"h"|"-h"|"--help")
        echo -e "${CYAN}Использование:${NC}"
        echo "  ./monitor_test.sh        - Автообновляемый мониторинг"
        echo "  ./monitor_test.sh stats  - Показать статистику один раз"
        echo "  ./monitor_test.sh logs   - Следить за логами в реальном времени"
        echo "  ./monitor_test.sh help   - Показать эту справку"
        ;;
    *)
        # По умолчанию - запускаем мониторинг
        monitor_test
        ;;
esac
