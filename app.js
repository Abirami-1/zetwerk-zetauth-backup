require('dotenv').config();
const mongoose = require('mongoose');
const { initializeZetAuditPlugin } = require('@zetwerk/zet-audit');
const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const app = express();
const helmet = require('helmet');
const config = require('config');
const glob = require('glob');
const path = require('path');
const bodyParser = require('body-parser');
const http = require('http').createServer(app);
//const rateLimit = require('express-rate-limit');
const logger = require('./lib/utils/logger');
const kafka = require('./lib/utils/kafka');
const db = require('./lib/utils/db');
const minimist = require('minimist');
const parsedArgs = minimist(process.argv.slice(2));
const confluentKafka = require('./lib/utils/confluent-kafka');
const ZetwerkAuthMiddleware = require('@zetwerk/zet-auth-middleware');
const MAX_POST_BODY_SIZE = '4096mb';
const cookieParser = require('cookie-parser');

const AbstractBaseController = require('@zetwerk/zetapp/controllers/AbstractBaseController');
const AbstractService = require('@zetwerk/zetapp/services/AbstractService');

const setupHelpers = require('@zetwerk/zetapp/utils/dbHelpers');
const responseMiddleware = require('@zetwerk/zetapp/middlewares/response');
const errorMiddleware = require('@zetwerk/zetapp/middlewares/error');
const { loadServices } = require('@zetwerk/zetapp/providers/services');
const gracefulShutdown = require('@zetwerk/zetapp/utils/graceFulShutdown');
const asyncHooks = require('@zetwerk/zetapp/middlewares/asyncHook');
const asyncStorageDataRetentionCheck = require('./middlewares/asyncStorageDataRetentionCheck');
const { proxyErrorHandler, proxyFilter, proxyReqPathResolver, userResDecorator } = require('./lib/utils/proxy');

/**
 * Capture all the proxy requests and send back
 * appropriate host names (internal server I/Ps) to proxy
 * based on the host mapping table.
 * If the mapping entry does not found,
 * it will fallback to requested host
 */
const handleProxyRedirection = req => {
    /** Replace hostname */
    const internalHostName = `${req.hostname.replace('zetwerk.com', 'intzetwerk.com')}${req.path}`;
    return internalHostName;
};

/**
 * List of paths (req.path) where proxy should not be applied,
 * In such cases pre-defined routes and actions will be executed
 * as per the routes definition below
 */

/* Allow reverse proxy such as NginX, AWS ELB */
app.enable('trust proxy');

/** Check is it multipart Request */
const isMultipartRequest = function(req) {
    let contentTypeHeader = req.headers['content-type'];
    return contentTypeHeader && contentTypeHeader.indexOf('multipart') > -1;
};
const isTextPlainHeader = function() {
    return function(req, res, next) {
        if (req.headers['content-type'] == 'text/plain; charset=UTF-8') {
            return express.json({
                type: [
                    'text/plain' // AWS sends this content-type for its messages/notifications
                ]
            })(req, res, next);
        }
        return next();
    };
};
app.use(isTextPlainHeader()); // Added for AWS SNS req where content-type is plain/text

/** By pass if it's multipart data(eg: file upload binary data) else encode body */
const bodyParserUrlEncodedMiddleware = function() {
    return function(req, res, next) {
        if (isMultipartRequest(req)) {
            return next();
        }
        return bodyParser.urlencoded({ extended: false, limit: MAX_POST_BODY_SIZE })(req, res, next);
    };
};

// parse application/x-www-form-urlencoded
app.use(bodyParserUrlEncodedMiddleware());

/** By pass if it's multipart data(eg: file upload binary data) else parse body into json */
const bodyParserJsonMiddleware = function() {
    return function(req, res, next) {
        if (isMultipartRequest(req)) {
            return next();
        }
        return bodyParser.json({ limit: MAX_POST_BODY_SIZE })(req, res, next);
    };
};

// parse application/json
app.use(bodyParserJsonMiddleware());

// Cookie Settings
app.use(cookieParser());

/* Check CORS before proceeding further */
app.use(
    cors({
        credentials: true,
        origin: function(origin, callback) {
            if (config.get('cors.whitelist').indexOf(origin) !== -1 || config.get('cors.allowLocal')) {
                // error - null, allowOrigin - true
                callback(null, true);
            } else {
                logger.error({
                    success: false,
                    statusCode: 'NOT_ALLOWED_BY_CORS',
                    description: 'You are not allowed to access this resource'
                });

                app.use(function(err, req, res) {
                    res.status(403).json({
                        success: false,
                        statusCode: 'NOT_ALLOWED_BY_CORS',
                        message: 'You are not allowed to access this resource',
                        data: {}
                    });
                });
                // error - true, allowOrigin - false
                callback(true, false);
            }
        }
    })
);

/* Add additional http flags in response header for security */
app.use(helmet());

app.get('/user/health', (req, res) => {
    res.status(200).json({
        status: 'up'
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'up'
    });
});

/* Apply rate limit to all requests - 429 code will be sent */
// const limiter = rateLimit({
//     windowMs: config.get('rateLimit.minutes') * 60 * 1000, // duration in minutes
//     max: config.get('rateLimit.maxRequests'), // limit each IP to n (config.maxRequests) requests per windowMs
//     message: {
//         success: false,
//         statusCode: 'TOO_MANY_REQUESTS',
//         message: 'Too many requests, please try again later',
//         data: {}
//     }
// });
// app.use(limiter);

/* Recursively include all routes inside ./routes */
function setupAndloadAuthRoutes() {
    /* Add authentication middleware */
    const authenticationMiddleware = require('./middlewares/authentication');
    const authorizationMiddleware = require('./middlewares/authorization');
    app.use(authenticationMiddleware.authentication);
    app.use(authorizationMiddleware.authorization);
    /**
     * Use the express middleware to proxy request to another host
     * and pass response back to original caller
     */
    app.use(
        proxy(handleProxyRedirection, {
            limit: '2048mb',
            filter: proxyFilter,
            proxyReqPathResolver,
            proxyErrorHandler,
            userResDecorator,
        })
    );

    glob.sync('./routes/**/auth_routes/*.js').forEach(function(file) {
        app.use('/' + config.get('api.version') + '/', require(path.resolve(file)));
    });

    handle404Error();
}

function setupAndloadUserRoutes() {
    // DO a fake auth in local development to set req.user
    if (config.has('api.environment') && config.get('api.environment') === 'localDevelopment') {
        const fakeAuthMiddleWare = require('./middlewares/fakeAuth');
        const authorizationMiddleware = require('./middlewares/authorization');
        app.use(fakeAuthMiddleWare._fakeAuth);
        app.use(authorizationMiddleware.authorization);
    } else {
        //Adding auth interceptor library for user mode
        app.use(ZetwerkAuthMiddleware.decodeHeader);
    }

    /**
     * Adds res.success - Used by controllers in new boilerplate structure
     */
    app.use(responseMiddleware);
    app.use(asyncHooks);
    app.use(asyncStorageDataRetentionCheck);

    glob.sync('./routes/v1/user_routes/*.js').forEach(function(file) {
        /** To support the public calls - old routes */
        app.use(`/${config.get('api.version')}`, require(path.resolve(file)));
        /** To support the internal calls - new routes */
        app.use(`/user/internal/${config.get('api.version')}`, require(path.resolve(file)));
        /** To support the external calls - new routes */
        app.use(`/user/external/${config.get('api.version')}`, require(path.resolve(file)));
    });

    /**
     * Load routes from v2 dir. New routes using the boilerplate structure goes inside routes/v2
     */
    glob.sync('./routes/v2/user_routes/*.js').forEach(function(file) {
        const { prefixes = '', router } = new (require(path.resolve(file)))();
        /** To support the public calls - old routes */
        app.use(`/${config.get('api.version')}/${prefixes}`, router);
        /** To support the internal calls - new routes */
        app.use(`/user/internal/${config.get('api.version')}/${prefixes}`, router);
        /** To support the external calls - new routes */
        app.use(`/user/external/${config.get('api.version')}/${prefixes}`, router);
    });

    /**
     * Handles errors originating from route handlers, thereby eliminating the need for
     * every controller function to be wrapped in try catch block
     */
    app.use(errorMiddleware);

    handle404Error();
}

function loadModels() {
    const models = [];
    glob.sync('./models/**/*.js').forEach(async function(file) {
        const model = require(path.resolve(file));
        models[model.modelName] = model;
        await db.setupHelpers(model);
    });
    logger.info({ description: 'Setup database helpers' });
    return models;
}

/**
 * Perform operations needed for new boilerplate structure to work
 * 1. Initialize all services defined in services-v2 dir
 * 2. Inject services into controllers
 * 3. setup db helpers
 */
async function setupServicesV2({ models }) {
    const services = await loadServices(models, {
        dirPath: 'services-v2',
        initCommonServices: false
    });
    AbstractBaseController.injectServices(services);
    setupHelpers(mongoose);

    return services;
}
/* Default response for 404 errors */
function handle404Error() {
    app.use(function(req, res) {
        res.status(404).json({
            success: false,
            message: 'The requested end point does not exist'
        });
    });
}
/* Start API server on the specified port */
// function startServer() {
//     http.listen(config.get('api.port'));
//     logger.info({ description: `Server started on ${config.get('api.port')}` });
// }

async function setupKafka() {
    try {
        await kafka._initializeProducer();
    } catch (error) {
        logger.error({
            description: 'Kafka initialization failed',
            error
        });
        throw error;
    }
}

async function initialize() {
    if (app.isAppInitialized) {
        return;
    }
    await db.connect();
    const dbConnection = db.get();
    initializeZetAuditPlugin(dbConnection); //do not change this order of initialisation
    logger.info({ description: 'Connected to database.' });

    const models = await loadModels();
    logger.info({ description: 'All models loaded' });

    
    if (parsedArgs.mode === 'auth') {
        await setupAndloadAuthRoutes();
        logger.info({ description: 'All Authentication Service routes loaded' });
        // await startServer();
        await setupKafka();
        // eslint-disable-next-line require-atomic-updates
        app.isAppInitialized = true;
        logger.info({
            description: ' 🚀 Authentication Service started successfully! 🔥'
        });
    } else {
        // Add New auth middleware --- IMP

        await setupServicesV2({ models });
        await confluentKafka.initializeConfluentKafka();
        await confluentKafka.initializeProducer();
        // await setupKafka();
        if (parsedArgs.mode === 'user') {
            await setupAndloadUserRoutes();
            logger.info({ description: 'All User Service routes loaded' });
            // await startServer();
            await AbstractService.services.AgendaService.initializeProducer({
                dbConnection: db.get(),
                dbCollection: 'tasks'
            });
        }
        if (parsedArgs.mode === 'agenda') {
            await AbstractService.services.AgendaService.initializeConsumer({
                dbURL: db.getUrl()
            });

            await AbstractService.services.AgendaService.registerJobDefinitions();
        }
        logger.info({
            description: 'Kafka initialized successfully'
        });
        logger.info({ description: ' 🚀 User Service started successfully! 🔥' });
        // eslint-disable-next-line require-atomic-updates
        app.isAppInitialized = true;
    }
    return app;
}

app.initialize = initialize;
async function shutdown() {
    try {
        const agenda = AbstractService?.services?.AgendaService?.agendaConsumer;
        const confluentKafkaInstance = await confluentKafka.getConfluentKafkaInstance();
        const kafkaInstance = await kafka._getKafkaInstance();
        const httpServer =  parsedArgs.mode === 'agenda' ? null : http;
        await gracefulShutdown({
            httpServer,
            confluentKafka: confluentKafkaInstance,
            kafka: kafkaInstance,
            agenda: agenda,
            mongoose: mongoose
        });
    } catch (err) {
        logger.error({description: 'Failed to shutdown', error: err });
    }
}
process.on('SIGTERM', async () => {
    console.log('*******SIGTERM RECEIVED********');
    await shutdown();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('*******SIGINT RECEIVED********');
    await shutdown();
    process.exit(0);
});
/**
 * From Node 15, unhandled Promise rejections will raise an uncaught exception and terminate the application.
 * This global handler of the unhandledRejection prevents from terminating the application
 */
process.on('unhandledRejection', err => {
    logger.error({ description: 'Unhandled rejection', err });
});
module.exports = app;