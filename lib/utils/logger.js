const pino = require('pino');
const config = require('config');

const logger = pino({
    useLevelLabels: true,
    app: config.name,
    serializers: {
        err: pino.stdSerializers.err,
        error: pino.stdSerializers.err,
        exception: pino.stdSerializers.err
    },
    name: 'zetAuth',
    level: config.get('logLevel'),
    enabled: config.get('logEnabled')
});

logger.info({ description: 'Logger initialized' });
module.exports = logger;
