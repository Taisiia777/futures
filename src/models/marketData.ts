export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
  
  // Метрики для Alpha-Hunt стратегии
  z_DP30s?: number;
  z_Vol30s?: number;
  z_OI30s?: number;
  vai?: number;
  cvi?: number;
  depthImbalance?: number;
  shh?: number;
  lca?: number;
  fundingDelta?: number;
  wfr?: number;
  metaScore?: number;
}