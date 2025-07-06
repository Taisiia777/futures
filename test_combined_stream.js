const WebSocket = require('ws');

// Тестируем WebSocket подключение к Binance через Combined Stream
const wsUrl = 'wss://fstream.binance.com/stream?streams=btcusdt@kline_1s/btcusdt@aggTrade';
console.log('Подключаемся к combined stream:', wsUrl);

const ws = new WebSocket(wsUrl);

ws.on('open', () => {
  console.log('✅ Combined Stream WebSocket соединение установлено');
});

ws.on('message', (data) => {
  try {
    const parsedData = JSON.parse(data.toString());
    console.log('📊 Получены данные:');
    
    if (parsedData.stream && parsedData.data) {
      console.log('- Stream:', parsedData.stream);
      if (parsedData.stream.includes('kline')) {
        console.log('- KLINE данные:', {
          symbol: parsedData.data.s,
          open: parsedData.data.k?.o,
          close: parsedData.data.k?.c,
          timestamp: parsedData.data.k?.t
        });
      } else if (parsedData.stream.includes('aggTrade')) {
        console.log('- AGG TRADE данные:', {
          symbol: parsedData.data.s,
          price: parsedData.data.p,
          quantity: parsedData.data.q,
          timestamp: parsedData.data.T
        });
      }
    } else {
      console.log('- Прямые данные:', JSON.stringify(parsedData).substring(0, 100));
    }
    console.log('---');
  } catch (error) {
    console.error('❌ Ошибка парсинга данных:', error.message);
    console.log('Raw data:', data.toString().substring(0, 200));
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket ошибка:', error.message);
});

ws.on('close', () => {
  console.log('❌ WebSocket соединение закрыто');
});

// Автоматически закрываем через 15 секунд
setTimeout(() => {
  console.log('🔚 Закрываем тест...');
  ws.close();
  process.exit(0);
}, 15000);
