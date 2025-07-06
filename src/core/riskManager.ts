import { ExchangeService } from '../services/exchangeService';
import logger from '../utils/logger';

export class RiskManager {
  private dailyLossLimit: number; // в USDT
  private maxDrawdownPercent: number; // в процентах
  private maxOpenPositions: number;
  
  private initialEquity: number;
  private currentEquity: number;
  private highWaterMark: number;
  private dailyPnL: number = 0;
  
  private tradingPaused: boolean = false;
  private pauseUntil: Date | null = null;
  
  private exchangeService: ExchangeService;
  
  constructor(
    initialEquity: number = 100, 
    dailyLossLimit: number = 20, 
    maxDrawdownPercent: number = 35,
    maxOpenPositions: number = 4,
    exchangeService: ExchangeService
  ) {
    this.initialEquity = initialEquity;
    this.currentEquity = initialEquity;
    this.highWaterMark = initialEquity;
    this.dailyLossLimit = dailyLossLimit;
    this.maxDrawdownPercent = maxDrawdownPercent;
    this.maxOpenPositions = maxOpenPositions;
    this.exchangeService = exchangeService;
    
    logger.info(`Риск-менеджер инициализирован: банк=${initialEquity} USDT, макс.дневной убыток=${dailyLossLimit} USDT, макс.просадка=${maxDrawdownPercent}%`);
  }
  
  // Обновление equity и PnL
  public updateEquity(newEquity: number): void {
    this.currentEquity = newEquity;
    
    // Обновляем значение дневного P&L
    this.dailyPnL = newEquity - this.initialEquity;
    
    // Обновляем high-water mark при новом максимуме
    if (newEquity > this.highWaterMark) {
      this.highWaterMark = newEquity;
    }
    
    // Проверяем условия риска
    this.checkRiskConditions();
  }
  
  // Расчет текущей просадки в процентах
  public getCurrentDrawdown(): number {
    return ((this.highWaterMark - this.currentEquity) / this.highWaterMark) * 100;
  }
  
  // Проверка условий риска
  private checkRiskConditions(): void {
    const drawdownPercent = this.getCurrentDrawdown();
    
    // Проверка на превышение дневного лимита убытка
    if (this.dailyPnL <= -this.dailyLossLimit) {
      this.pauseTradingUntilUTC00();
      logger.warn(`Торговля приостановлена до 00:00 UTC: превышен дневной лимит убытка (${this.dailyPnL.toFixed(2)} USDT)`);
    }
    
    // Проверка на превышение максимальной просадки
    if (drawdownPercent >= this.maxDrawdownPercent) {
      this.tradingPaused = true;
      logger.error(`Торговля остановлена: превышен лимит просадки (${drawdownPercent.toFixed(2)}%)`);
    }
  }
  
  // Можно ли открывать новую позицию
  public async canOpenPosition(): Promise<boolean> {
    // Если торговля на паузе, проверяем не истек ли срок
    if (this.tradingPaused) {
      if (this.pauseUntil && new Date() >= this.pauseUntil) {
        this.tradingPaused = false;
        this.pauseUntil = null;
      } else {
        return false;
      }
    }
    
    // Проверяем количество открытых позиций
    const openPositions = await this.exchangeService.getOpenPositions();
    if (openPositions.length >= this.maxOpenPositions) {
      logger.info(`Достигнут лимит открытых позиций: ${openPositions.length}/${this.maxOpenPositions}`);
      return false;
    }
    
    return true;
  }
  
  // Сброс дневной статистики
  public resetDailyStats(): void {
    this.initialEquity = this.currentEquity;
    this.dailyPnL = 0;
    logger.info(`Сброс дневной статистики: новый начальный банк = ${this.initialEquity} USDT`);
  }
  
  // Приостановка торговли до 00:00 UTC
  private pauseTradingUntilUTC00(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(now.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    
    this.pauseUntil = tomorrow;
    this.tradingPaused = true;
    
    logger.warn(`Торговля приостановлена до ${tomorrow.toISOString()}`);
  }
  
  // Принудительное возобновление торговли
  public resumeTrading(): void {
    this.tradingPaused = false;
    this.pauseUntil = null;
    logger.info('Торговля возобновлена вручную');
  }
}