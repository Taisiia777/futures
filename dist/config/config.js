"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Загружаем переменные окружения из .env файла
dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '.env') });
// Основные параметры
exports.config = {
    // API биржи
    binance: {
        apiKey: process.env.BIN_KEY || '',
        apiSecret: process.env.BIN_SEC || '',
        testnet: process.env.TESTNET === 'true'
    },
    // Параметры капитала
    trading: {
        initialCapital: 100, // 100 USDT начальный капитал
        positionSizePercent: 0.08, // 8% от equity на каждую сделку (снижено для большего количества пар)
        maxLeverage: 100, // Увеличено плечо для агрессивности
        maxOpenPositions: 6, // Увеличено для большего количества пар
        dailyLossLimitUsdt: 25, // Увеличен дневной лимит убытка
        maxDrawdownPercent: 30, // Снижена максимальная просадка
        autoReinvest: true, // Автоматический реинвест прибыли
        testMode: process.env.TEST_MODE === 'true' // Тестовый режим на виртуальных деньгах
    },
    // Символы для торговли - МАКСИМАЛЬНЫЙ НАБОР для памп-хантинга
    symbols: [
        // 🥇 ТОП-Тير (высокая ликвидность + частые пампы)
        'BTCUSDT', // Bitcoin - основа рынка, сильные движения
        'ETHUSDT', // Ethereum - надежность + волатильность
        'SOLUSDT', // Solana - отличная волатильность, частые пампы
        'BNBUSDT', // Binance Coin - сильные движения
        // ⭐ АЛЬТКОИНЫ ПЕРВОГО ЭШЕЛОНА
        'ADAUSDT', // Cardano - популярен, часто пампит
        'DOTUSDT', // Polkadot - сильная волатильность
        'LINKUSDT', // Chainlink - резкие движения
        'AVAXUSDT', // Avalanche - отличные пампы
        'ATOMUSDT', // Cosmos - хорошие движения
        'MATICUSDT', // Polygon - популярный DeFi токен
        // 🚀 ВЫСОКОВОЛАТИЛЬНЫЕ АЛЬТКОИНЫ (частые пампы)
        'LTCUSDT', // Litecoin - классика, резкие движения
        'XRPUSDT', // Ripple - огромная волатильность
        'TRXUSDT', // Tron - частые пампы
        'EOSUSDT', // EOS - сильные движения
        'XLMUSDT', // Stellar - коррелирует с XRP
        'ADXUSDT', // AdEx - мелкие пампы
        'ALGOUSDT', // Algorand - технологический токен
        // 💎 DEFI ТОКЕНЫ (взрывной потенциал)
        'UNIUSDT', // Uniswap - лидер DeFi
        'AAVEUSDT', // Aave - кредитование DeFi
        'SUSHIUSDT', // SushiSwap - DEX токен
        'COMPUSDT', // Compound - DeFi протокол
        'MKRUSDT', // Maker - стейблкоин протокол
        'SNXUSDT', // Synthetix - синтетические активы
        '1INCHUSDT', // 1inch - агрегатор DEX
        'CRVUSDT', // Curve - стейблкоин DEX
        // 🔥 НОВЫЕ И ТРЕНДОВЫЕ (высокий потенциал роста)
        'NEARUSDT', // Near Protocol - слой 1
        'FTMUSDT', // Fantom - быстрый блокчейн
        'MANAUSDT', // Decentraland - метавселенная
        'SANDUSDT', // The Sandbox - игровой токен
        'AXSUSDT', // Axie Infinity - NFT игра
        'GALAUSDT', // Gala Games - игровая экосистема
        'CHZUSDT', // Chiliz - спортивные токены
        'ENJUSDT', // Enjin Coin - NFT платформа
        // ⚡ БЫСТРОРАСТУЩИЕ L1/L2 (технологический сектор)
        'RUNEUSDT', // THORChain - межсетевые свопы
        'LUNALUSDT', // Terra Luna Classic - стейблкоины
        'WAVESUSDT', // Waves - смарт-контракты
        'ZILUSDT', // Zilliqa - шардинг блокчейн
        'ICXUSDT', // ICON - блокчейн интероперабельность
        'ONTUSDT', // Ontology - энтерпрайз блокчейн
        'VETUSDT', // VeChain - supply chain
        'IOSTUSDT', // IOST - высокопроизводительный блокчейн
        // 🎯 МЕМКОИНЫ И СОЦИАЛЬНЫЕ (взрывной потенциал)
        'DOGEUSDT', // Dogecoin - мем король
        'SHIBUSDT', // Shiba Inu - мем токен
        'PEPEUSDT', // Pepe - новый мем хит
        'FLOKIUSDT', // Floki - мем с утилитой
        // 🏦 ЦЕНТРАЛИЗОВАННЫЕ БИРЖИ И ЭКОСИСТЕМЫ
        'FTMUSDT', // FTM - Fantom экосистема
        'CAKEUSDT', // PancakeSwap - BSC DEX
        'BAKEUSDT', // BakeryToken - BSC DeFi
        'BURGERUSDT', // Burger Swap - BSC
        // 📱 WEB3 И ИНФРАСТРУКТУРА
        'BATUSDT', // Basic Attention Token - браузер
        'STORJUSDT', // Storj - децентрализованное хранилище
        'SCUSDT', // Siacoin - cloud storage
        'RENUSDT', // Ren Protocol - межсетевая ликвидность
        'BANDUSDT', // Band Protocol - оракулы
        'KSMUSDT', // Kusama - Polkadot canary
        // 🎮 ИГРОВЫЕ И NFT ТОКЕНЫ
        'CHRUSDT', // Chromia - блокчейн для игр
        'ALICEUSDT', // My Neighbor Alice - игра
        'TLMUSDT', // Alien Worlds - NFT игра
        'ALPACAUSDT', // Alpaca Finance - leveraged yield farming
        // 💰 СТЕЙКИНГ И ВАЛИДАТОРЫ
        'ANKRUSDT', // Ankr - стейкинг инфраструктура
        'RLCUSDT', // iExec RLC - облачные вычисления
        'CTSIUSDT', // Cartesi - Linux на блокчейне
        'ARPAUSDT', // ARPA Chain - вычислительная сеть
        // 🌐 МЕЖСЕТЕВЫЕ И МОСТЫ
        'ANYUSDT', // Anyswap - кроссчейн протокол
        'SYNUSDT', // Synapse - кроссчейн мосты
        'MULTUSDT', // Multichain - межсетевая инфраструктура
        // 🔄 ДОПОЛНИТЕЛЬНЫЕ ВОЛАТИЛЬНЫЕ
        'HOTUSDT', // Holo - P2P приложения
        'WINUSDT', // WINk - игровая платформа
        'BTTUSDT', // BitTorrent Token - файлообмен
        'DENTUSDT', // Dent - мобильные данные
        'KEYUSDT', // SelfKey - цифровая идентичность
        'STMXUSDT', // StormX - кэшбэк в крипте
        'OGNUSDT', // Origin Protocol - NFT и DeFi
        'REQUSDT', // Request Network - платежи
        'AMBUSDT', // Ambrosus - supply chain
        'MDTUSDT', // Measurable Data Token - данные
        'FUNUSDT', // FunFair - онлайн казино
        'MFTUSDT', // Mainframe - приватные коммуникации
        'DNTUSDT', // district0x - децентрализованные рынки
        'BRDUSDT', // Bread Token - мобильный кошелек
        'PIVXUSDT', // PIVX - приватная криптовалюта
        'IOSTUSDT', // IOST - масштабируемый блокчейн
        'CHATUSDT', // OpenChat - Web3 мессенджер
        'CHESSUSDT', // Tranchess - структурированные фонды
        'EPSUSDT', // Ellipsis - стейблкоин DEX
        'AUTOUSDT', // Auto - yield farming
        'ALPINEUSDT', // Alpine F1 - фан токен
        'CITYUSDT', // Manchester City - фан токен
        'LZUUSDT', // LayerZero - омниchain протокол
        'GMTUSDT', // Green Metaverse Token - move-to-earn
        'KDAUSDT', // Kadena - PoW смарт-контракты
        'APEUSDT', // ApeCoin - метавселенная токен
        'GALUSDT', // Galatasaray - фан токен
        'JASMYUSDT', // JasmyCoin - IoT данные
        'DARUSDT', // Mines of Dalarnia - игра
        'OPUSDT', // Optimism - L2 решение
        'INJUSDT', // Injective Protocol - DEX
        'STGUSDT', // Stargate Finance - кроссчейн мосты
        'SPELLUSDT', // Spell Token - lending protocol
        'LDOUSDT', // Lido DAO - liquid staking
        'CVXUSDT', // Convex Finance - Curve boosting
        'IMXUSDT', // Immutable X - NFT scaling
        'GLMRUSDT', // Loopring - zkRollup DEX
        'LOKAUSDT', // League of Kingdoms - стратегическая игра
        'SCRTUSDT', // Secret Network - приватные смарт-контракты
        'API3USDT', // API3 - децентрализованные API
        'BNTUSDT', // Bancor Network - automated market maker
        'WAXPUSDT', // WAX - NFT блокчейн
        'TRIBEUSDT', // Tribe - алгоритмические стейблкоины
        'GNOUSDT', // Gnosis - предикативные рынки
        'XECUSDT', // eCash - Bitcoin Cash форк
        'ELFUSDT', // aelf - облачный блокчейн
        'DYDXUSDT', // dYdX - децентрализованная биржа
        'POLYUSDT', // Polymath - security tokens
        'IDEXUSDT', // IDEX - гибридная биржа
        'VIDTUSDT', // Videocoin - видео инфраструктура
        'UFTUSDT', // UniLend Finance - flash loans
        'ORNUSDT', // Orion Protocol - агрегатор ликвидности
        'PONDUSDT', // Marlin - сетевая инфраструктура
        'DEGOUSDT', // Dego Finance - NFT+DeFi
        'ALPUSDT', // Aleph.im - децентрализованная облачная сеть
        'TUSDT', // TrueUSD - стейблкоин (для волатильности)
        'CFXUSDT', // Conflux Network - Tree-Graph блокчейн
        'TRUUSDT', // TrueFi - uncollateralized lending
        'RADUSDT', // Radix - DeFi-оптимизированный блокчейн
        'FISUSDT', // StaFi - liquid staking
        'BAXUSDT', // BABB - банковские услуги
        'FIDAUSDT', // Boba Network - Optimistic Rollup
        'RAREUSDT', // SuperRare - NFT маркетплейс
        'LAZIOUSDT', // Lazio - фан токен
        'ADXUSDT', // Ambire AdEx - реклама
        'CEEKUSDT', // CEEK VR - виртуальная реальность
        'MASKUSDT', // Mask Network - Web3 социальные сети
        'LRCUSDT', // Loopring - zkRollup протокол
        'ATMUSDT', // Atletico Madrid - фан токен
        'PHAUSDT', // Phala Network - конфиденциальные вычисления
        'REIUSDT', // REI Network - блокчейн
        'ACAUSDT', // Acala Network - DeFi хаб Polkadot
        'KLAYUSDT', // Klaytn - enterprise блокчейн
        'MOVRUSDT', // Mover - save and earn
        'NKNUSDT', // NKN - новый интернет
        'ACHUSDT', // Achain - форк Ethereum
        'CTXCUSDT', // Cortex - AI блокчейн
        'BADGERUSDT', // Badger DAO - Bitcoin DeFi
        'FORTHUSDT', // Ampleforth Governance - elastic supply
        'NUUSDT', // NuCypher - шифрование данных
        'BICOUSDT', // Biconomy - метатранзакции
        'RAMPUSDT', // RAMP DEFI - cross-chain liquidity
        'YGGUSDT', // Yield Guild Games - игровая гильдия
        'TLMUSDT', // Alien Worlds - NFT игра
        'PUNDIXUSDT', // Pundi X - платежные решения
        'UTKUSDT', // Utrust - криптоплатежи
        'ASTRUSDT', // AstraProtocol - Web3 compliance
        'ERNUSDT', // Ethernity Chain - аутентифицированные NFT
        'KLAYUSDT', // Klaytn - блокчейн платформа
        'TORNUSDT', // Tornado Cash - миксер (если доступен)
        'FARMUSDT', // Harvest Finance - yield farming
        'RGTUSDT', // Rari Governance Token - lending pools
        'DFUSDT', // dForce - DeFi протокол
        'VOXELUSDT', // Voxels - метавселенная
        'HIGHUSDT', // Highstreet - метакоммерция
        'CVPUSDT', // PowerPool - meta-governance
        'EPXUSDT', // Ellipsis X - yield farming
        'IDUSDT', // SPACE ID - доменные имена Web3
        'ARBUSDT', // Arbitrum - L2 масштабирование
        'RDNTUSDT', // Radiant Capital - кроссчейн lending
        'JOESTMUSDT', // JoeHat - мем токен Avalanche
        'MAGICUSDT', // Magic - метавселенная экосистема
        'STXUSDT', // Stacks - Bitcoin смарт-контракты
        'GMXUSDT', // GMX - деривативы DEX
        'PENDLEUSDT', // Pendle - yield tokenization
        'ARKMUSDT', // Arkham - on-chain аналитика
        'AGIXUSDT', // SingularityNET - AI маркетплейс
        'WLDUSDT', // Worldcoin - глобальная идентичность
        'FXSUSDT', // Frax Share - алгоритмический стейблкоин
        'LQTYUSDT', // Liquity - децентрализованный lending
        'MAVUSDT', // Maverick Protocol - AMM
        'BLURUSDT', // Blur - NFT маркетплейс
        'EDUUSDT', // Open Campus - образование Web3
        'TIAUSDT', // Celestia - модульный блокчейн
        'LDOUSDT', // Lido DAO - liquid staking
        'SEIUSDT', // Sei Network - trading-focused блокчейн
        'CYBERUSDT', // CyberConnect - социальный Web3
        'ARKUSDT', // Ark - блокчейн интероперабельность
        // 🔥 ДОПОЛНИТЕЛЬНЫЕ ВЫСОКОПОТЕНЦИАЛЬНЫЕ ПАРЫ (2024)
        'FETUSDT', // Fetch.ai - AI агенты и машинное обучение
        'OCEANUSDT', // Ocean Protocol - монетизация данных
        'AGIXUSDT', // SingularityNET - AI маркетплейс
        'RENDERUSDT', // Render Token - GPU рендеринг
        'IOTAUSDT', // IOTA - IoT блокчейн
        'HBARUSDT', // Hedera - корпоративный хэшграф
        'FLOWUSDT', // Flow - блокчейн для NFT и игр
        'EGLDUSDT', // MultiversX (Elrond) - высокопроизводительный блокчейн
        'THETAUSDT', // Theta Network - видео стриминг
        'TFUELUSDT', // Theta Fuel - операционный токен
        'KNCUSDT', // Kyber Network Crystal - DeFi ликвидность
        'ZRXUSDT', // 0x - DEX протокол
        'OMGUSDT', // OMG Network - Ethereum L2
        'SKLUSDT', // SKALE Network - модульный блокчейн
        'POLYUSDT', // Polymath - security tokens
        'CELRUSDT', // Celer Network - кроссчейн интероперабельность
        'QTUMUSDT', // Qtum - гибридный блокчейн
        'ICPUSDT', // Internet Computer - интернет компьютер
        'MINAUSDT', // Mina Protocol - легкий блокчейн
        'ROSEUSDT', // Oasis Network - конфиденциальный блокчейн
        'KAVAUSDT', // Kava - DeFi для Cosmos
        'HARDUSDT', // HARD Protocol - кроссчейн монетарный рынок
        'SWPUSDT', // Kava Swap - DEX токен
        'USDPUSDT', // Pax Dollar - стейблкоин для волатильности
        'BNTUSDT', // Bancor - автоматический маркет мейкер
        'COTIUSDT', // COTI - платежная инфраструктура
        'STORJUSDT', // Storj - децентрализованное облачное хранилище
        'KMDUSDT', // Komodo - блокчейн платформа
        'NANOUSDT', // Nano - мгновенные платежи
        'RVNUSDT', // Ravencoin - передача активов
        'ZECUSDT', // Zcash - приватная криптовалюта
        'DASHUSDT', // Dash - цифровая наличность
        'XMRUSDT', // Monero - приватная валюта (если доступен)
        'ZENUSDT', // Horizen - приватный блокчейн
        'LSKUSDT', // Lisk - модульный блокчейн SDK
        'ARMUSDT', // Arweave - постоянное хранение данных
        'FILUSDT', // Filecoin - децентрализованное хранилище
        'NEOUSDT', // Neo - умная экономика
        'GASUSDT', // Gas - Neo utility токен
        'ONTUSDT', // Ontology - децентрализованная идентичность
        'WAVESUSDT', // Waves - блокчейн платформа
        'NULSUSDT', // NULS - модульный блокчейн
        'VENUSDT', // Venus - алгоритмический денежный рынок
        'XVSUSDT', // Venus - governance токен
        'SXPUSDT', // Swipe - криптокарты
        'BCDUSDT', // Bitcoin Diamond - Bitcoin форк
        'DGBUSDT', // DigiByte - безопасный блокчейн
        'SCUSDT', // Siacoin - децентрализованное хранилище
        'REPUSDT', // Augur - предикативные рынки
        'ZRXUSDT', // 0x Protocol - открытый протокол
        'MANAUSDT', // Decentraland - виртуальная недвижимость
        'ENSUSDT', // Ethereum Name Service - Web3 домены
        'LPTUSDT', // Livepeer - децентрализованный видео
        'UMAUSDT', // UMA - синтетические активы
        'BALUSDT', // Balancer - программируемая ликвидность
        'AMPLUSDT', // Ampleforth - адаптивная валюта
        'YFIUSDT', // Yearn.finance - yield optimization
        'CRVUSDT', // Curve DAO Token - стейблкоин DEX
        'RENUSDT', // Ren - межблокчейн ликвидность
        'KNCUSDT', // Kyber Network - DeFi ликвидность
        'LENDUSDT', // Aave (старый токен)
        'MLNUSDT', // Enzyme - управление активами
        'ANTUSDT', // Aragon - DAO управление
        'POWRUSDT', // Power Ledger - энергетическая торговля
        'DOCKUSDT', // Dock - верифицируемые данные
        'POLYUSDT', // Polymath - токенизация ценных бумаг
        'GOLUSDT', // Golem - децентрализованные вычисления
        'GRTUSDT', // The Graph - индексирование блокчейна
        'NUUSDT', // NuCypher - пороговая криптография
        'KEEPUSDT', // Keep Network - приватность для публичных блокчейнов
        'AUDIOUSDT', // Audius - децентрализованная музыка
        'SOLARUSDT', // SolarCoin - солнечная энергия
        'ADXUSDT', // Ambire AdEx - децентрализованная реклама
        'VITEUSDT', // Vite - асинхронный блокчейн
        'WANUSDT', // Wanchain - кроссчейн инфраструктура
        'FUNUSDT', // FunFair - блокчейн казино
        'DNTUSDT', // district0x - децентрализованные рынки
        'SALTUSDT', // Salt - блокчейн кредитование
        'AEUSDT', // Aeternity - оракулы и состояние каналы
        'NEBLOUSDT', // Neblio - энтерпрайз блокчейн
        'VIAUSDT', // Via - блокчейн платформа
        'NXTUSDT', // Nxt - блокчейн 2.0
        'ARDRУСDT', // Ardor - блокчейн-как-сервис
        'XEMУСDT', // NEM - Proof of Importance
        'STRATUSDT', // Stratis - блокчейн для бизнеса
        'SYSUSDT', // Syscoin - блокчейн е-коммерс
        'BLOCKUSDT', // Blocknet - межблокчейн протокол
        'KMDUSDT', // Komodo - приватность и безопасность
        'GAMEUSDT', // GameCredits - игровая валюта
        'EXPUSDT', // Expanse - Ethereum форк
        'WAVESUSDT', // Waves - кастомные токены
        'RISEUSDТ', // Rise - распределенные приложения
        'LBCUSDT', // LBRY Credits - контент блокчейн
        'VRCUSDT', // VeriCoin - цифровая валюта
        'XBYUSDT', // XTRABYTES - блокчейн 3.0
        'BTSUSDT', // BitShares - децентрализованная биржа
        'STEEMUSUSDT', // Steem - контент блокчейн
        'PPYUSDT', // Peerplays - игровая платформа
        'DCRUSDT', // Decred - гибридный консенсус
        'FAIRUSDT', // FairCoin - справедливая экономика
        'MUSICUSDT', // Musicoin - музыкальный блокчейн
        'SPANKUSDT', // SpankChain - взрослый контент
        'DNTTUSDT', // Datum - данные marketplace
        'CFOUSDT', // CFO - бизнес блокчейн
        'TIMEUSDT', // Chrono.tech - HR блокчейн
        'XTOUSDT', // Xtock - блокчейн платформа
        // 🎯 СПЕЦИАЛЬНЫЕ ПАМП-ПОТЕНЦИАЛЬНЫЕ ПАРЫ
        'BONKUSDT', // Bonk - Solana мемкоин
        'WIFUSDT', // dogwifhat - Solana мем
        'BOMEUSDT', // BOOK OF MEME - новый мемкоин
        'MYROUSUSDT', // Myro - Solana мемкоин
        'JUPUSDT', // Jupiter - Solana DEX агрегатор
        'PYTHONUSDT', // Pyth Network - финансовые данные
        'JITOUSDT', // Jito - Solana MEV
        'RAYUSDT', // Raydium - Solana AMM
        'SAMOUSDT', // Samoyed Coin - Solana мемкоин
        'COPEUSDT', // Cope - Solana социальный токен
        'SRMUSDT', // Serum - Solana DEX
        'KINUSDT', // Kin - социальная валюта
        'MAPUSDT', // Maps.me - карты и навигация
        'ORDIUSUSDT', // ORDI - Bitcoin Ordinals
        'SATSUSDT', // 1000SATS - Bitcoin Ordinals
        'RATSUSDT', // RATS - Bitcoin Ordinals мемкоин
        '1000SATSUSDT', // 1000SATS - Bitcoin Ordinals
        'INSCUSUSDT', // INSC - Inscriptions токен
        'MULTUSDT', // MultiversX EGLD
        'SUPERUSDT', // SuperVerse - Web3 творчество
        'WORLDUSDT', // World Token - глобальная экономика
        'DYMUSUSDT', // Dymension - модульный блокчейн
        'PIXELSUSDT', // Pixels - Web3 игра
        'PORTALUSUSDT', // Portal - игровая инфраструктура
        'RONINUSUSDT', // Ronin - игровой блокчейн
        'XAIUSUSDT', // Xai - игровой L3 блокчейн
        'MANTAUSUSDT', // Manta Network - ZK блокчейн
        'ALTUSUSDT', // Altlayer - restaked rollups
        'ACEUSUSDT', // Ace - Web3 игра
        'NFPUSUSDT', // NFPrompt - AI + NFT
        'AIUSUSDT', // ArbitrumAI - AI токен
        'XAIUSUSDT', // XAI - GameFi токен
        'MANTLEUSUSDT', // Mantle - модульный L2
        'STRKEUSUSDT', // StarkNet Token - ZK rollup
        'MAVIAUSSDT', // Heroes of Mavia - игра
        'DYORUSUSDT', // DYOR - исследовательский токен
        'JTOUSUSUSDT', // Jito SOL - Solana стейкинг
        'PYTHUSUSDT', // Pyth Network - оракулы
        'WIFUSUSDT', // dogwifhat - премиум мемкоин
        'TURBOTUSUSDT', // Turbo - AI мемкоин
        'MAGAUUSUSDT', // MAGA - политический мемкоин
        'TRUMPUSUSDT', // TRUMP - политический токен
        'WOJUSUSDT' // Wojak - мемкоин культура
    ],
    // Параметры логирования
    logging: {
        logLevel: process.env.LOG_LEVEL || 'info',
        logToConsole: true,
        logToFile: true,
        logDir: path_1.default.resolve(process.cwd(), 'logs')
    },
    // Параметры метрик
    metrics: {
        enabled: true,
        port: process.env.METRICS_PORT ? parseInt(process.env.METRICS_PORT) : 9090
    }
};
exports.default = exports.config;
