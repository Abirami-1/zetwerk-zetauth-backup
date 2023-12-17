const asyncLocalStorage = require('@zetwerk/zetapp/utils/asyncLocalStorage');
const logger = require('../lib/utils/logger');

async function asyncStorageDataRetentionCheck (req, res, next) {
    next();
    res.on('finish', () => {
        const context = asyncLocalStorage.getDataFromStore('loggerMeta');
        logger.info({ description: 'Request context', Context: context, reqPath: req.originalUrl });
        if (!context || !context?.user || !context?.user?._id) {
            logger.info({ description: 'User context lost', reqPath: req.originalUrl });
        }
    });
}
module.exports = asyncStorageDataRetentionCheck;
