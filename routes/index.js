var express = require("express");
var router = express.Router();
const Book = require("../models/book");
const Order = require("../models/order");
const Prometheus = require("prom-client");

const { createLogger, format, transports } = require("winston");
const { combine, splat, timestamp, printf } = format;

const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { registerInstrumentations } = require("@opentelemetry/instrumentation");
const { HttpInstrumentation } = require("@opentelemetry/instrumentation-http");
const {
    ExpressInstrumentation,
} = require("@opentelemetry/instrumentation-express");

const provider = new NodeTracerProvider();
provider.register();

registerInstrumentations({
    instrumentations: [
        // Express instrumentation expects HTTP layer to be instrumented
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
    ],
});

register = new Prometheus.Registry();

const metricsInterval = Prometheus.collectDefaultMetrics({ register });

/*const consoleTransport = new winston.transports.Console();
const myWinstonOptions = {
    transports: [consoleTransport],
};

const logger = createLogger({
    defaultMeta: { mainLabel: "default label" },
    level: "info",
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
        printf(({ message, timestamp, level, mainLabel, childLabel }) => {
            return `${timestamp} (${
        childLabel || mainLabel
      }) [${level}] -> ${message}`;
        })
    ),
    transports: [new transports.Console()],
});*/
const logger = createLogger({
    level: "info",
    format: format.json(),
    formatter: (options) =>
        `${options.meta.Client_IP}-${options.meta.timestamp}-${options.meta.REQ_ID}- ${options.level}: ${options.message}`,
    transports: [new transports.Console()],
});

const childLogger = logger.child({
    Label: "Request_Information",
    timestamp: new Date().toISOString(),
});

//const logger = new winston.createLogger(myWinstonOptions);
const RequestsTotal = new Prometheus.Counter({
    name: "Http_request_Total",
    help: "Total number of requests",
    labelNames: ["status", "route", "order_per_item"],
});
register.registerMetric(RequestsTotal);

router.get("/", async(req, res) => {
    try {
        const products = await Book.find();
        childLogger.info("getting books", {
            REQ_ID: req.rid,
            Client_IP: req.connection.remoteAddress, 
        });

        res.status(200).send(products);
        RequestsTotal.inc({
            status: 200,
            route: "get/",
        });
    } catch (error) {
        res.status(500).send({ "error message": e });
        RequestsTotal.inc({
            status: 500,
            route: "get/",
        });
    }
});

router.get("/orders", async(req, res) => {
    try {
        childLogger.info("getting orders", {
            REQ_ID: req.rid,
            Client_IP: req.connection.remoteAddress,
        });
        const orders = await Order.find();

        res.status(200).send(orders);
        RequestsTotal.inc({
            status: 200,
            route: "get/orders",
        });
    } catch (error) {
        res.status(500).send({ "error message": e });
        RequestsTotal.inc({
            status: 500,
            route: "get/orders",
        });
    }
});
router.post("/order", async(req, res) => {
    try {
        childLogger.info("creating an order", {
            REQ_ID: req.rid,
            Client_IP: req.connection.remoteAddress,
        });
        const order = req.body;

        const newOrder = new Order({
            quantity: order.quantity,
            productId: order.productId,
            address: order.address,
        });
        const id = order.productId;
        const result = await newOrder.save();
        res.status(200).send(result);
        RequestsTotal.inc({
            status: 200,
            route: "post /order",
            order_per_item: id,
        });
    } catch (e) {
        res.status(500).send({ "error message": e });
        RequestsTotal.inc({
            status: 500,
            route: "post /order",
        });
    }
});
router.post("/", async(req, res) => {
    try {
        childLogger.info("create a new book", {
            REQ_ID: req.rid,
            Client_IP: req.connection.remoteAddress,
        });

        const newProduct = new Book({
            name: product.name,
            description: product.description,
        });
        const result = await newProduct.save();
        res.status(200).send(result);
        RequestsTotal.inc({
            status: 200,
            route: "post /",
        });
    } catch (e) {
        res.status(500).send({ "error message": e });
        RequestsTotal.inc({
            status: 500,
            route: "post /",
        });
    }
});

router.get("/metrics", async(req, res) => {
    try {
        childLogger.info("metrics", {
            REQ_ID: req.rid,
            Client_IP: req.connection.remoteAddress,
        });
        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
    } catch (ex) {
        res.status(500).end(ex);
    }
});

module.exports = router;