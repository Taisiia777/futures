// 🎯 ULTIMATE PUMP HUNTER - МАКСИМАЛЬНЫЙ ВИНРЕЙТ И ПРОФИТ
import { ExchangeService } from '../services/exchangeService';    for (const symbol of symbols) {
      try {
        // Проверяем кулдаун для конкретного символа
        const lastSymbolTrade = this.symbolLastTrade.get(symbol) || 0;
        if (Date.now() - lastSymbolTrade < this.MIN_TIME_BETWEEN_SAME_SYMBOL) {
          continue;
        }
        
        const signal = await this.analyzeUltimateSignal(symbol);
        
        if (signal.confidence > maxConfidence && signal.confidence >= this.MIN_CONFIDENCE) {
          maxConfidence = signal.confidence;
          bestSignal = { symbol, signal };
        }
      } catch (error: any) {
        // Различаем типы ошибок
        const isNetworkError = error.message.includes('ETIMEDOUT') || 
                               error.message.includes('ECONNRESET') || 
                               error.message.includes('EHOSTUNREACH');
        
        if (isNetworkError) {
          // Сетевые ошибки логируем как предупреждения и продолжаем
          logger.warn(`🌐 Сетевая ошибка для ${symbol}, пропускаем: ${error.message}`);
        } else {
          // Другие ошибки логируем как ошибки
          logger.error(`❌ Ошибка анализа сигнала для ${symbol}: ${error.message}`);
        }
        // В любом случае продолжаем со следующим символом
        continue;
      }
    }m '../utils/logger';

interface PumpSignal {
  strength: number;
  confidence: number;
  direction: 'long' | 'short';
  expectedMove: number;
  timeframe: number;
}

interface Position {
  symbol: string;
  side: 'long' | 'short';
  entryPrice: number;
  quantity: number;
  entryTime: number;
  targetProfit: number;
  stopLoss: number;
  positionValue: number;
}

export class UltimatePumpHunter {
  // БОЕВЫЕ ПАРАМЕТРЫ - МАКСИМАЛЬНАЯ СЕЛЕКТИВНОСТЬ
  private readonly LEVERAGE = 100;                     // Максимальное плечо
  private readonly POSITION_SIZE = 0.08;               // 8% капитала на сделку
  private readonly MIN_CONFIDENCE = 0.88;              // 88% минимальная уверенность (ПОВЫШЕНО!)
  private readonly TARGET_PROFIT = 0.055;              // 5.5% тейк-профит (550% ROI)
  private readonly STOP_LOSS = 0.012;                  // 1.2% стоп-лосс (120% потеря)
  private readonly MAX_POSITION_TIME = 3 * 60 * 1000;  // 3 минуты максимум
  private readonly MIN_PUMP_SIZE = 0.028;              // 2.8% минимальный памп (ПОВЫШЕНО!)
  private readonly COOLDOWN_TIME = 45 * 60 * 1000;     // 45 минут между сделками
  
  // НОВЫЕ ФИЛЬТРЫ ДЛЯ МАКСИМАЛЬНОГО КАЧЕСТВА
  private readonly MIN_VOLUME_SPIKE = 6.0;             // Минимум 6x объем
  private readonly MIN_CONSECUTIVE_MOVES = 4;          // Минимум 4 движения подряд
  private readonly MAX_DAILY_TRADES = 6;               // Максимум 6 сделок в день
  private readonly MIN_TIME_BETWEEN_SAME_SYMBOL = 2 * 60 * 60 * 1000; // 2 часа на тот же символ
  
  // СЛОЖНЫЙ ПРОЦЕНТ И МАСШТАБИРОВАНИЕ
  private readonly COMPOUND_THRESHOLD = 1.5;           // При 150% роста увеличиваем позиции
  private readonly MAX_POSITION_SCALE = 0.15;          // Максимум 15% при больших депозитах
  private readonly PROFIT_REINVEST_RATIO = 0.8;        // 80% прибыли реинвестируем
  private readonly CONSERVATIVE_MODE_TRIGGER = 0.3;    // При просадке 30% включаем консервативный режим
  
  // ДИНАМИЧЕСКИЕ ПАРАМЕТРЫ
  private readonly HOT_STREAK_BONUS = 1.3;             // +30% размер при серии побед
  private readonly COLD_STREAK_PENALTY = 0.7;          // -30% размер при серии поражений
  
  // СОСТОЯНИЕ БОТА
  private isConservativeMode = false;
  private consecutiveWins = 0;
  private consecutiveLosses = 0;
  private dailyPeakEquity = 0;
  private initialEquity = 0;
  
  private equity: number;
  private openPosition: Position | null = null;
  private lastTradeTime = 0;
  private dailyStats = { trades: 0, wins: 0, totalPnL: 0 };
  private symbolLastTrade: Map<string, number> = new Map(); // Отслеживание по символам
  
  private exchangeService: ExchangeService;

  constructor(
    initialEquity: number,
    exchangeService: ExchangeService
  ) {
    this.equity = initialEquity;
    this.initialEquity = initialEquity;
    this.dailyPeakEquity = initialEquity;
    this.exchangeService = exchangeService;
    
    logger.info(`🎯 ULTIMATE PUMP HUNTER ЗАПУЩЕН:`);
    logger.info(`💰 Стартовый капитал: ${initialEquity} USDT`);
    logger.info(`⚡ Плечо: ${this.LEVERAGE}x | Базовая позиция: ${this.POSITION_SIZE * 100}%`);
    logger.info(`🎯 Target: ${this.TARGET_PROFIT * 100}% | Stop: ${this.STOP_LOSS * 100}%`);
    logger.info(`📈 СЛОЖНЫЙ ПРОЦЕНТ: Активен с автомасштабированием`);
    logger.info(`⏱️ Кулдаун: ${this.COOLDOWN_TIME / 60000} минут между сделками`);
    logger.info(`⚡ Плечо: ${this.LEVERAGE}x | Позиция: ${this.POSITION_SIZE * 100}%`);
    logger.info(`🎯 Target: ${this.TARGET_PROFIT * 100}% | Stop: ${this.STOP_LOSS * 100}%`);
    logger.info(`⏱️ Кулдаун: ${this.COOLDOWN_TIME / 60000} минут между сделками`);
  }
  
  // ГЛАВНЫЙ ТОРГОВЫЙ ЦИКЛ - РАБОТА С РЕАЛЬНЫМИ ДАННЫМИ
  public async executeUltimateHunt(): Promise<void> {
    try {
      // Управляем открытой позицией
      if (this.openPosition) {
        await this.manageElitePosition();
        return;
      }
      
      // Проверяем дневной лимит сделок
      if (this.dailyStats.trades >= this.MAX_DAILY_TRADES) {
        return;
      }
      
      // Проверяем кулдаун
      if (Date.now() - this.lastTradeTime < this.COOLDOWN_TIME) {
        return;
      }
      
      // Получаем топ криптовалют в порядке приоритета (волатильные первыми)
      const topSymbols = ['SOLUSDT', 'ETHUSDT', 'BNBUSDT', 'BTCUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT', 'LTCUSDT'];
      const bestSignal = await this.findUltimateSignal(topSymbols);
      
      if (bestSignal && bestSignal.signal.confidence >= this.MIN_CONFIDENCE) {
        await this.executeEliteTrade(bestSignal);
      }
      
    } catch (error: any) {
      logger.error(`❌ Ошибка в ULTIMATE HUNT: ${error.message}`);
    }
  }
  
  private async findUltimateSignal(symbols: string[]): Promise<{ symbol: string; signal: PumpSignal } | null> {
    let bestSignal: { symbol: string; signal: PumpSignal } | null = null;
    let maxConfidence = 0;
    
    for (const symbol of symbols) {
      try {
        // Проверяем кулдаун для конкретного символа
        const lastSymbolTrade = this.symbolLastTrade.get(symbol) || 0;
        if (Date.now() - lastSymbolTrade < this.MIN_TIME_BETWEEN_SAME_SYMBOL) {
          continue;
        }
        
        const signal = await this.analyzeUltimateSignal(symbol);
        
        if (signal.confidence > maxConfidence && signal.confidence >= this.MIN_CONFIDENCE) {
          maxConfidence = signal.confidence;
          bestSignal = { symbol, signal };
        }
      } catch (error: any) {
        logger.error(`⚠️ Ошибка анализа ${symbol}: ${error.message}`);
      }
    }
    
    return bestSignal;
  }
  
  private async analyzeUltimateSignal(symbol: string): Promise<PumpSignal> {
    try {
      // Получаем данные свечей за последние 30 минут (1m интервал)
      const klines = await this.exchangeService.getKlines(symbol, '1m', 30);
      
      if (klines.length < 20) {
        return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
      }
      
      // Анализируем последние 6 свечей vs предыдущие 6
      const recent = klines.slice(-6);
      const baseline = klines.slice(-12, -6);
      
      // Цена и объем
      const recentAvgPrice = recent.reduce((sum, k) => sum + parseFloat(k.close), 0) / recent.length;
      const baselineAvgPrice = baseline.reduce((sum, k) => sum + parseFloat(k.close), 0) / baseline.length;
      const priceMove = (recentAvgPrice - baselineAvgPrice) / baselineAvgPrice;
      
      const recentAvgVolume = recent.reduce((sum, k) => sum + parseFloat(k.volume), 0) / recent.length;
      const baselineAvgVolume = baseline.reduce((sum, k) => sum + parseFloat(k.volume), 0) / baseline.length;
      const volumeSpike = recentAvgVolume / baselineAvgVolume;
      
      // Проверяем последовательность движения
      let consecutiveMoves = 0;
      const direction = priceMove > 0 ? 1 : -1;
      for (let i = 1; i < recent.length; i++) {
        const move = (parseFloat(recent[i].close) - parseFloat(recent[i-1].close)) / parseFloat(recent[i-1].close);
        if ((move > 0 && direction > 0) || (move < 0 && direction < 0)) {
          consecutiveMoves++;
        }
      }
      
      // Расчет импульса (momentum)
      const recentMomentum = recent.slice(-3).reduce((sum, k, i) => {
        if (i === 0) return sum;
        return sum + Math.abs((parseFloat(k.close) - parseFloat(recent[i-1].close)) / parseFloat(recent[i-1].close));
      }, 0);
      
      // РАСЧЕТ CONFIDENCE - МАКСИМАЛЬНО ЖЕСТКИЕ КРИТЕРИИ
      let confidence = 0;
      const strength = Math.abs(priceMove);
      
      // Условие 1: Очень сильное движение (повышенные требования)
      if (strength >= this.MIN_PUMP_SIZE) confidence += 0.3;
      else return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
      
      // Условие 2: Мощный объемный всплеск (ужесточено)
      if (volumeSpike >= this.MIN_VOLUME_SPIKE) confidence += 0.3;
      else if (volumeSpike >= 4.0) confidence += 0.2;
      else return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
      
      // Условие 3: Идеальная последовательность (обязательно)
      if (consecutiveMoves >= this.MIN_CONSECUTIVE_MOVES) confidence += 0.25;
      else return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
      
      // Условие 4: Нарастающий импульс (обязательно для высокого confidence)
      if (recentMomentum > 0.02) confidence += 0.15;
      else if (recentMomentum > 0.015) confidence += 0.1;
      else confidence += 0.05;
      
      // СУПЕР-БОНУСЫ за исключительные условия
      if (strength >= 0.04 && volumeSpike >= 10) confidence += 0.1; // Мега-памп
      if (consecutiveMoves === 5 && volumeSpike >= 8) confidence += 0.05; // Идеальная волна
      if (strength >= 0.035 && recentMomentum > 0.025) confidence += 0.05; // Ускорение
      
      return {
        strength,
        confidence: Math.min(confidence, 1.0),
        direction: priceMove > 0 ? 'long' : 'short',
        expectedMove: strength * 1.5,
        timeframe: 180 // 3 минуты
      };
      
    } catch (error: any) {
      logger.error(`❌ Ошибка анализа сигнала для ${symbol}: ${error.message}`);
      return { strength: 0, confidence: 0, direction: 'long', expectedMove: 0, timeframe: 0 };
    }
  }
  
  private async executeEliteTrade(best: { symbol: string; signal: PumpSignal }): Promise<void> {
    try {
      const { symbol, signal } = best;
      
      // Получаем текущую цену
      const currentPrice = await this.exchangeService.getCurrentPrice(symbol);
      
      // АДАПТИВНЫЙ РАЗМЕР ПОЗИЦИИ с учетом качества сигнала И СЛОЖНОГО ПРОЦЕНТА
      let adaptivePositionSize = this.calculateOptimalPositionSize(signal.confidence);
      
      // СУПЕР-АГРЕССИВНЫЙ РЕЖИМ для исключительных сигналов
      if (this.shouldUseAggressiveMode(signal)) {
        adaptivePositionSize *= 1.8; // +80% к размеру позиции
        logger.info(`⚡⚡ СУПЕР-АГРЕССИВНЫЙ РЕЖИМ: Увеличиваем позицию на 80% для исключительного сигнала!`);
      }
      
      const positionValue = this.equity * adaptivePositionSize;
      const leveragedValue = positionValue * this.LEVERAGE;
      const quantity = leveragedValue / currentPrice;
      
      // ДИНАМИЧЕСКИЕ TP/SL на основе силы сигнала
      const dynamicTP = this.TARGET_PROFIT * (1 + signal.strength * 2); // Больше сила = больше цель
      const dynamicSL = this.STOP_LOSS * (2 - signal.confidence); // Больше уверенности = меньше стоп
      
      this.openPosition = {
        symbol,
        side: signal.direction,
        entryPrice: currentPrice,
        quantity,
        entryTime: Date.now(),
        targetProfit: dynamicTP,
        stopLoss: dynamicSL,
        positionValue
      };
      
      this.lastTradeTime = Date.now();
      this.symbolLastTrade.set(symbol, Date.now()); // Отмечаем время торговли по символу
      this.dailyStats.trades++;
      
      logger.info(`🚀🚀 ЭЛИТНАЯ СДЕЛКА ОТКРЫТА:`);
      logger.info(`   ${symbol} ${signal.direction.toUpperCase()}`);
      logger.info(`   Цена: ${currentPrice.toFixed(2)}`);
      logger.info(`   Размер: ${positionValue.toFixed(2)} USDT (${this.LEVERAGE}x)`);
      logger.info(`   Покрытие: ${leveragedValue.toFixed(2)} USDT`);
      logger.info(`   Confidence: ${(signal.confidence * 100).toFixed(1)}%`);
      logger.info(`   Target: ${(dynamicTP * 100).toFixed(2)}% | Stop: ${(dynamicSL * 100).toFixed(2)}%`);
      logger.info(`   📊 Сделка ${this.dailyStats.trades}/${this.MAX_DAILY_TRADES} за сегодня`);
      
    } catch (error: any) {
      logger.error(`❌ Ошибка открытия элитной сделки: ${error.message}`);
    }
  }
  
  private async manageElitePosition(): Promise<void> {
    if (!this.openPosition) return;
    
    const pos = this.openPosition;
    const currentPrice = await this.exchangeService.getCurrentPrice(pos.symbol);
    const elapsedTime = Date.now() - pos.entryTime;
    
    // Расчет PnL
    let pnl = 0;
    if (pos.side === 'long') {
      pnl = (currentPrice - pos.entryPrice) / pos.entryPrice;
    } else {
      pnl = (pos.entryPrice - currentPrice) / pos.entryPrice;
    }
    
    const leveragedPnL = pnl * this.LEVERAGE;
    const pnlUSDT = leveragedPnL * pos.positionValue;
    
    // ПРОВЕРЯЕМ ЧАСТИЧНУЮ ФИКСАЦИЮ ПРИБЫЛИ
    if (pnl > 0) {
      const partialClosed = await this.checkPartialProfits(pos, pnl, currentPrice);
      if (partialClosed) return; // Если частично закрыли, выходим
    }
    
    // УМНЫЕ УСЛОВИЯ ЗАКРЫТИЯ
    let shouldClose = false;
    let reason = '';
    
    // 1. Достигнута цель
    if (pnl >= pos.targetProfit) {
      shouldClose = true;
      reason = `🎯 TARGET HIT: ${(pnl * 100).toFixed(2)}%`;
    }
    
    // 2. Стоп-лосс
    else if (pnl <= -pos.stopLoss) {
      shouldClose = true;
      reason = `🛑 STOP LOSS: ${(pnl * 100).toFixed(2)}%`;
    }
    
    // 3. Таймаут
    else if (elapsedTime > this.MAX_POSITION_TIME) {
      shouldClose = true;
      reason = `⏰ TIMEOUT: ${Math.round(elapsedTime/60000)}мин`;
    }
    
    // 4. УМНЫЙ ТРЕЙЛИНГ для максимизации прибыли
    else if (pnl >= pos.targetProfit * 0.6) {
      // Анализируем разворот и объем
      const currentSignal = await this.analyzeUltimateSignal(pos.symbol);
      const ticker24hr = await this.exchangeService.getTicker24hr(pos.symbol);
      const currentVolume = parseFloat(ticker24hr.volume);
      
      // Закрываем если объем падает И есть признаки разворота
      if (currentSignal.direction !== pos.side && 
          currentSignal.confidence > 0.25 && 
          currentVolume < parseFloat(ticker24hr.volume) * 0.7) {
        shouldClose = true;
        reason = `📉 SMART TRAILING: Разворот + падение объема`;
      }
    }
    
    // 5. ЗАЩИТА ОТ РЕЗКИХ ДВИЖЕНИЙ ПРОТИВ НАС
    else if (pnl <= -pos.stopLoss * 0.7) {
      // Быстрое закрытие если движение против нас ускоряется
      const recentSignal = await this.analyzeUltimateSignal(pos.symbol);
      if (recentSignal.direction !== pos.side && recentSignal.confidence > 0.5) {
        shouldClose = true;
        reason = `⚡ FAST EXIT: Сильное движение против`;
      }
    }
    
    if (shouldClose) {
      await this.closeElitePosition(pnl > 0 ? 'win' : 'loss', leveragedPnL, reason);
    } else {
      // Логируем прогресс каждые 30 секунд
      if (elapsedTime % 30000 < 3000) {
        logger.info(`📊 ${pos.symbol}: ${(leveragedPnL * 100).toFixed(2)}% (${pnlUSDT.toFixed(2)}$) - ${Math.round(elapsedTime/1000)}с`);
      }
    }
    
    // ПРОДВИНУТАЯ СИСТЕМА PARTIAL PROFITS
    await this.checkPartialProfits(pos, pnl, currentPrice);
  }
  
  private async closeElitePosition(outcome: 'win' | 'loss', leveragedPnL: number, reason: string): Promise<void> {
    if (!this.openPosition) return;
    
    const pos = this.openPosition;
    const pnlUSDT = leveragedPnL * pos.positionValue;
    
    // Обновляем капитал (СЛОЖНЫЙ ПРОЦЕНТ)
    this.equity += pnlUSDT;
    this.dailyStats.totalPnL += pnlUSDT;
    
    if (outcome === 'win') {
      this.dailyStats.wins++;
    }
    
    // Обновляем состояние бота для адаптивного управления
    this.updateBotState(pnlUSDT);
    
    const winRate = this.dailyStats.trades > 0 ? (this.dailyStats.wins / this.dailyStats.trades * 100) : 0;
    const totalReturn = ((this.equity - this.initialEquity) / this.initialEquity * 100);
    
    logger.info(`🏁 ЭЛИТНАЯ ПОЗИЦИЯ ЗАКРЫТА:`);
    logger.info(`   ${pos.symbol} ${pos.side.toUpperCase()}: ${outcome.toUpperCase()}`);
    logger.info(`   PnL: ${(leveragedPnL * 100).toFixed(2)}% (${pnlUSDT.toFixed(2)} USDT)`);
    logger.info(`   Причина: ${reason}`);
    logger.info(`   💰 Новый капитал: ${this.equity.toFixed(2)} USDT`);
    logger.info(`   📊 Сегодня: ${this.dailyStats.trades} сделок, WinRate: ${winRate.toFixed(1)}%`);
    logger.info(`   🚀 ОБЩИЙ РОСТ: ${totalReturn.toFixed(1)}% от стартового капитала`);
    
    if (outcome === 'win' && this.consecutiveWins >= 3) {
      logger.info(`   🔥 СЕРИЯ ПОБЕД: ${this.consecutiveWins} подряд!`);
    }
    
    this.openPosition = null;
  }
  
  // ПРОДВИНУТЫЙ РАСЧЕТ ОПТИМАЛЬНОГО РАЗМЕРА ПОЗИЦИИ
  private calculateOptimalPositionSize(confidence: number): number {
    let baseSize = this.POSITION_SIZE;
    
    // 1. СЛОЖНЫЙ ПРОЦЕНТ - масштабирование с ростом капитала
    const growthMultiplier = this.equity / this.initialEquity;
    if (growthMultiplier >= this.COMPOUND_THRESHOLD) {
      // При росте капитала увеличиваем максимальный размер позиции
      const compoundBonus = Math.min(growthMultiplier * 0.1, 0.07); // Максимум +7%
      baseSize += compoundBonus;
      
      logger.info(`📈 СЛОЖНЫЙ ПРОЦЕНТ: Рост капитала ${(growthMultiplier * 100).toFixed(1)}%, бонус к позиции: +${(compoundBonus * 100).toFixed(1)}%`);
    }
    
    // 2. КАЧЕСТВО СИГНАЛА - увеличиваем для супер-сигналов
    if (confidence >= 0.95) {
      baseSize *= 1.5; // +50% для исключительных сигналов
    } else if (confidence >= 0.92) {
      baseSize *= 1.3; // +30% для отличных сигналов
    } else if (confidence >= 0.90) {
      baseSize *= 1.15; // +15% для хороших сигналов
    }
    
    // 3. СЕРИИ ПОБЕД/ПОРАЖЕНИЙ
    if (this.consecutiveWins >= 3) {
      baseSize *= this.HOT_STREAK_BONUS; // Увеличиваем при серии побед
      logger.info(`🔥 HOT STREAK: ${this.consecutiveWins} побед подряд, увеличиваем позицию на ${((this.HOT_STREAK_BONUS - 1) * 100).toFixed(0)}%`);
    } else if (this.consecutiveLosses >= 2) {
      baseSize *= this.COLD_STREAK_PENALTY; // Уменьшаем при серии потерь
      logger.info(`❄️ COLD STREAK: ${this.consecutiveLosses} потерь подряд, уменьшаем позицию на ${((1 - this.COLD_STREAK_PENALTY) * 100).toFixed(0)}%`);
    }
    
    // 4. КОНСЕРВАТИВНЫЙ РЕЖИМ при просадке
    if (this.isConservativeMode) {
      baseSize *= 0.6; // Уменьшаем позиции при просадке
      logger.info(`🛡️ КОНСЕРВАТИВНЫЙ РЕЖИМ: Уменьшаем позицию на 40%`);
    }
    
    // 5. ДНЕВНОЙ ВИНРЕЙТ
    const currentWinRate = this.dailyStats.trades > 0 ? this.dailyStats.wins / this.dailyStats.trades : 1;
    if (currentWinRate < 0.6) {
      baseSize *= 0.7; // Осторожнее при низком винрейте
    } else if (currentWinRate > 0.9) {
      baseSize *= 1.2; // Агрессивнее при высоком винрейте
    }
    
    // 6. ОГРАНИЧЕНИЯ
    const maxSize = this.equity > this.initialEquity * 3 ? this.MAX_POSITION_SCALE : 0.12;
    return Math.min(Math.max(baseSize, 0.04), maxSize); // Минимум 4%, максимум 12-15%
  }
  
  // УПРАВЛЕНИЕ СОСТОЯНИЕМ БОТА
  private updateBotState(pnlUSDT: number): void {
    // Обновляем пиковый капитал
    if (this.equity > this.dailyPeakEquity) {
      this.dailyPeakEquity = this.equity;
    }
    
    // Проверяем просадку для консервативного режима
    const drawdown = (this.dailyPeakEquity - this.equity) / this.dailyPeakEquity;
    this.isConservativeMode = drawdown >= this.CONSERVATIVE_MODE_TRIGGER;
    
    // Обновляем серии побед/поражений
    if (pnlUSDT > 0) {
      this.consecutiveWins++;
      this.consecutiveLosses = 0;
    } else {
      this.consecutiveLosses++;
      this.consecutiveWins = 0;
    }
    
    if (this.isConservativeMode) {
      logger.warn(`⚠️ КОНСЕРВАТИВНЫЙ РЕЖИМ АКТИВЕН: Просадка ${(drawdown * 100).toFixed(1)}%`);
    }
  }
  
  // Расширенная статистика для мониторинга
  public getUltimateStats() {
    const winRate = this.dailyStats.trades > 0 ? (this.dailyStats.wins / this.dailyStats.trades) : 0;
    const totalReturn = ((this.equity - this.initialEquity) / this.initialEquity) * 100;
    const dailyReturn = ((this.equity - this.initialEquity) / this.initialEquity) * 100; // Можно сделать дневной расчет
    const growthMultiplier = this.equity / this.initialEquity;
    const drawdown = this.dailyPeakEquity > 0 ? ((this.dailyPeakEquity - this.equity) / this.dailyPeakEquity) * 100 : 0;
    
    return {
      equity: this.equity,
      initialEquity: this.initialEquity,
      totalReturn: totalReturn,
      dailyPnL: this.dailyStats.totalPnL,
      totalTrades: this.dailyStats.trades,
      winRate: winRate,
      dailyReturn: dailyReturn,
      openPosition: this.openPosition ? 1 : 0,
      leverage: this.LEVERAGE,
      nextTradeIn: Math.max(0, this.COOLDOWN_TIME - (Date.now() - this.lastTradeTime)),
      // Новые метрики для сложного процента
      growthMultiplier: growthMultiplier,
      isConservativeMode: this.isConservativeMode,
      consecutiveWins: this.consecutiveWins,
      consecutiveLosses: this.consecutiveLosses,
      currentDrawdown: drawdown,
      compoundActive: growthMultiplier >= this.COMPOUND_THRESHOLD
    };
  }
  
  public resetDaily(): void {
    this.dailyStats = { trades: 0, wins: 0, totalPnL: 0 };
    this.symbolLastTrade.clear(); // Сбрасываем ограничения по символам
    this.dailyPeakEquity = this.equity; // Обновляем пиковый капитал
    this.consecutiveWins = 0;
    this.consecutiveLosses = 0;
    
    // Сбрасываем консервативный режим если капитал восстановился
    if (this.equity >= this.dailyPeakEquity * 0.9) {
      this.isConservativeMode = false;
    }
    
    logger.info('📊 Ежедневная статистика сброшена');
    logger.info(`💰 Текущий капитал: ${this.equity.toFixed(2)} USDT`);
    logger.info(`🚀 Общий рост: ${(((this.equity - this.initialEquity) / this.initialEquity) * 100).toFixed(1)}%`);
  }
  
  // ПРОДВИНУТАЯ СИСТЕМА PARTIAL PROFITS
  private async checkPartialProfits(pos: Position, pnl: number, currentPrice: number): Promise<boolean> {
    if (pnl <= 0) return false;
    
    const targetReached = pnl / pos.targetProfit;
    
    // ЧАСТИЧНАЯ ФИКСАЦИЯ ПРИБЫЛИ для максимизации доходности
    if (targetReached >= 0.6 && targetReached < 0.8) {
      // При достижении 60% цели - фиксируем 30% позиции
      const partialProfit = pos.positionValue * 0.3 * pnl * this.LEVERAGE;
      this.equity += partialProfit;
      
      logger.info(`💎 PARTIAL PROFIT: Зафиксировали 30% позиции на ${(pnl * 100).toFixed(2)}%`);
      logger.info(`   💰 Прибыль: +${partialProfit.toFixed(2)} USDT`);
      
      // Подтягиваем стоп-лосс к безубытку
      pos.stopLoss = Math.min(pos.stopLoss, 0.005); // Максимум 0.5% риск
      
      return false; // Продолжаем держать оставшуюся позицию
    }
    
    if (targetReached >= 0.8 && targetReached < 1.2) {
      // При достижении 80% цели - фиксируем еще 40% позиции
      const partialProfit = pos.positionValue * 0.4 * pnl * this.LEVERAGE;
      this.equity += partialProfit;
      
      logger.info(`💎💎 SECOND PARTIAL: Зафиксировали еще 40% позиции`);
      logger.info(`   💰 Прибыль: +${partialProfit.toFixed(2)} USDT`);
      
      // Перемещаем стоп в прибыль
      pos.stopLoss = -0.01; // 1% прибыль гарантирован
      
      return false; // Держим последние 30% для максимума
    }
    
    return false;
  }
  
  // СУПЕР-АГРЕССИВНЫЙ РЕЖИМ для exceptional сигналов
  private shouldUseAggressiveMode(signal: PumpSignal): boolean {
    return (
      signal.confidence >= 0.95 &&
      signal.strength >= 0.04 &&
      this.consecutiveWins >= 2 &&
      !this.isConservativeMode &&
      this.dailyStats.trades < this.MAX_DAILY_TRADES - 2 // Остался запас сделок
    );
  }
}
