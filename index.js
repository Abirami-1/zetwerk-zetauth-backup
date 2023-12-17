if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
    require('newrelic');
}
require('module-alias/register');
const { start } = require('@zetwerk/zetapp-v2/bootstrap');
const { pluginScope } = require('@zetwerk/zetapp-v2/constants/pluginScope');
const logger = require('@zetwerk/zetapp-v2/logger');
const mongoose = require('mongoose');
const { config } = require('@zetwerk/zetapp-v2/utils/loadConfig');
const { shutdown } = require('@zetwerk/zetapp-v2/utils/shutdown');
const { getSubModesConfig } = require('@zetwerk/zetapp-v2/utils');
let { mode = 'api', subMode } = require('yargs').argv;
const ZetwerkAuthMiddleware = require('@zetwerk/zet-auth-middleware');
const Kafka = require('@zetwerk/zet-kafka');
const ZetMsgSDK = require('@zetwerk/zet-msg-sdk');
const ZetwerkAuthMiddlewareHelper = require('@zetwerk/zet-auth-middleware/utils/helper');
const ZetMongoOptimizer = require('@zetwerk/zet-mongo-optimizer');
const LowCodeModuleModule = require('@zetwerk/low-code-module');
const serviceRegistry = require('@zetwerk/zet-service-registry');
const ZetAuditPlugin = require('@zetwerk/zet-audit');
const LowCodeService = require('@zetwerk/low-code-module/src/modules/lowCode/lowCode.service');
const LowCodeLibrary = require('@zetwerk/low-code-library/utils/index');
const syncApplication = require('./src/lib/utils/syncApplication');
const customBasePath = 'user';
let app = require('./app');
const CommonIPCService = require('@zetwerk/zetapp-v2/services/CommonIPCService');
let rootApp = require('express')();
// mongoose.set('debug', true);
const packages = {
    ZetwerkAuthMiddleware,
    Kafka,
    ZetMsgSDK,
    ZetwerkAuthMiddlewareHelper,
    serviceRegistry,
    LowCodeService,
    LowCodeLibrary
};

(async () => {
    await app.initialize();

    if (!config.has('api.boilerplateVersion')) {
        throw new Error('api.boilerplateVersion should be there in config');
    }
    if (mode === 'auth') {
        await start({
            rootApp,
            mode,
            subMode,
            config,
            mongoose,
            middlewares: [],
            externalModules: [
                {
                    moduleClass: LowCodeModuleModule,
                    moduleNamespace: 'ZetLowCode'
                }
            ],
            packages,
            plugins: [
                {
                    plugin: ZetAuditPlugin,
                    scope: pluginScope.APPLICATION,
                    name: 'auditLog'
                },
                {
                    plugin: ZetMongoOptimizer,
                    scope: pluginScope.GLOBAL,
                    name: 'mongoOptimizer'
                }
            ],
            customBasePath
        });
        await CommonIPCService.init(packages, config);
        rootApp.use('/', app);
        const port = config.get('api').authPort;
        rootApp.listen(port, () => {
            logger.info({
                description: `🔥 App listening on port ${port}! 🚀`
            });
        });
    } else {
        if (mode === 'user') mode = 'api';
        await start({
            rootApp,
            mode,
            subMode,
            config,
            mongoose,
            middlewares: [],
            externalModules: [
                {
                    moduleClass: LowCodeModuleModule,
                    moduleNamespace: 'ZetLowCode'
                }
            ],
            packages,
            plugins: [
                {
                    plugin: ZetAuditPlugin,
                    scope: pluginScope.APPLICATION,
                    name: 'auditLog'
                },
                {
                    plugin: ZetMongoOptimizer,
                    scope: pluginScope.GLOBAL,
                    name: 'mongoOptimizer'
                }
            ],
            customBasePath
        });

        rootApp.use('/', app);
        if (mode === 'api') {
            let port = config.get('api').port;

            if (subMode) {
                const subModeConfig = getSubModesConfig({ mode, subMode, config });
                port = subModeConfig.port ? subModeConfig.port : port;
            }
            rootApp.listen(port, () => {
                logger.info({
                    description: `🔥 App listening on port ${port}! 🚀`
                });
            });
            await syncApplication();
        }
        process.on('SIGINT', async () => {
            console.log('*******SIGINT RECEIVED********');
            await shutdown(rootApp, mongoose);
            process.exit(0);
        });

        process.on('unhandledRejection', err => {
            logger.error({ description: 'Unhandled rejection', err });
        });
    }
})();

module.exports = app;