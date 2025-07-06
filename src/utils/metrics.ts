import client from 'prom-client';
import http from 'http';
import { config } from '../config/config';

export class Metrics {
  private register: client.Registry;
  private server: http.Server | null = null;
  
  // Метрики
  public openPositions: client.Gauge<string>;
  public equityTotal: client.Gauge<string>;
  public pnlDaily: client.Gauge<string>;
  public triggerLatency: client.Histogram<string>;
  
  constructor() {
    // Создаем новый реестр
    this.register = new client.Registry();
    
    // Добавляем дефолтные метрики
    this.register.setDefaultLabels({
      app: 'alpha-hunt-v4'
    });
    client.collectDefaultMetrics({ register: this.register });
    
    // Инициализируем метрики
    this.openPositions = new client.Gauge({
      name: 'alpha_open_positions',
      help: 'Number of currently open positions',
      labelNames: ['symbol']
    });
    
    this.equityTotal = new client.Gauge({
      name: 'alpha_equity_total',
      help: 'Total equity in USDT'
    });
    
    this.pnlDaily = new client.Gauge({
      name: 'alpha_pnl_daily',
      help: 'Daily P&L in USDT'
    });
    
    this.triggerLatency = new client.Histogram({
      name: 'alpha_trigger_latency_ms',
      help: 'Latency between signal detection and order execution in ms',
      buckets: [10, 50, 100, 250, 500, 1000, 2500, 5000]
    });
    
    // Регистрируем метрики
    this.register.registerMetric(this.openPositions);
    this.register.registerMetric(this.equityTotal);
    this.register.registerMetric(this.pnlDaily);
    this.register.registerMetric(this.triggerLatency);
  }
  
  public startServer(): void {
    if (config.metrics.enabled) {
      const port = config.metrics.port;
      
      this.server = http.createServer(async (req, res) => {
        if (req.url === '/metrics') {
          res.setHeader('Content-Type', this.register.contentType);
          res.end(await this.register.metrics());
        } else {
          res.statusCode = 404;
          res.end('Not found');
        }
      });
      
      this.server.listen(port, () => {
        console.log(`Metrics server started on port ${port}`);
      });
    }
  }
  
  public stopServer(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }
}

export const metrics = new Metrics();