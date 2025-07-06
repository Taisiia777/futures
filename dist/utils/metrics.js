"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = exports.Metrics = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
const http_1 = __importDefault(require("http"));
const config_1 = require("../config/config");
class Metrics {
    constructor() {
        this.server = null;
        // Создаем новый реестр
        this.register = new prom_client_1.default.Registry();
        // Добавляем дефолтные метрики
        this.register.setDefaultLabels({
            app: 'alpha-hunt-v4'
        });
        prom_client_1.default.collectDefaultMetrics({ register: this.register });
        // Инициализируем метрики
        this.openPositions = new prom_client_1.default.Gauge({
            name: 'alpha_open_positions',
            help: 'Number of currently open positions',
            labelNames: ['symbol']
        });
        this.equityTotal = new prom_client_1.default.Gauge({
            name: 'alpha_equity_total',
            help: 'Total equity in USDT'
        });
        this.pnlDaily = new prom_client_1.default.Gauge({
            name: 'alpha_pnl_daily',
            help: 'Daily P&L in USDT'
        });
        this.triggerLatency = new prom_client_1.default.Histogram({
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
    startServer() {
        if (config_1.config.metrics.enabled) {
            const port = config_1.config.metrics.port;
            this.server = http_1.default.createServer(async (req, res) => {
                if (req.url === '/metrics') {
                    res.setHeader('Content-Type', this.register.contentType);
                    res.end(await this.register.metrics());
                }
                else {
                    res.statusCode = 404;
                    res.end('Not found');
                }
            });
            this.server.listen(port, () => {
                console.log(`Metrics server started on port ${port}`);
            });
        }
    }
    stopServer() {
        if (this.server) {
            this.server.close();
            this.server = null;
        }
    }
}
exports.Metrics = Metrics;
exports.metrics = new Metrics();
