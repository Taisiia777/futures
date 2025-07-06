const WebSocket = require('ws');

// Тестируем WebSocket подключение к Binance
const wsUrl = 'wss://fstream.binance.com/ws/btcusdt@kline_1s';
console.log('Подключаемся к:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('✅ WebSocket соединение установлено');
});

ws.on('message', (data) => {
  try {
    const parsedData = JSON.parse(data.toString());
    console.log('📊 Получены данные kline:');
    console.log('- Symbol:', parsedData.s);
    console.log('- Event Type:', parsedData.e);
    console.log('- Kline data:', {
      open: parsedData.k?.o,
      close: parsedData.k?.c,
      high: parsedData.k?.h,
      low: parsedData.k?.l,
      volume: parsedData.k?.v,
      timestamp: parsedData.k?.t
    });
    console.log('---');
  } catch (error) {
    console.error('❌ Ошибка парсинга данных:', error.message);
    console.log('Raw data:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket ошибка:', error.message);
});

ws.on('close', () => {
  console.log('❌ WebSocket соединение закрыто');
});

// Автоматически закрываем через 10 секунд
setTimeout(() => {
  console.log('🔚 Закрываем тест...');
  ws.close();
  process.exit(0);
}, 10000);
