const logger = require('./logger');
const config = require('config');
let { matchPattern } = require('url-matcher');
const Aggregation = require('./aggregation');
const proxyBypassList = config.get('proxyBypassList');
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
/** Define the proxy gateway timeout in milliseconds */
// timeout: 300000, // 5 Minutes - No proxy timeout for now
/** Handle errors thrown by the proxy gateway */
const proxyErrorHandler = (err, res, next) => {
    logger.error({
        description: 'Proxy Error',
        errorCode: err.code,
        error: err
    });
    switch (err && err.code) {
        /** Gateway timeout has been happened */
        case 'ECONNRESET': {
            return res.status(504).json({ success: false, message: 'Gateway Timeout' });
        }
        /** The target system refused incoming connection */
        case 'ECONNREFUSED': {
            return res.status(200).send({ success: false, message: 'Connection Refused' });
        }
        /** Skip Unhandled error */
        default: {
            next(err);
        }
    }
};
const proxyReqPathResolver = req => {
    const authService = require('../../services/auth');
    /** Append /external/ in the path */
    logger.info({
        description: 'express-http-proxy processing request',
        url: req.url,
        headers: authService.stripSensitiveHeaders(req.headers)
    });
    const system = req.url.split('/')[1];
    const newPath = req.url.replace(`${system}`, `${system}/external`);
    return newPath;
};
const proxyFilter = req => {
    return new Promise(function(resolve) {
        /**
         * Whether to resolve proxy or not, If returned
         * true - Continue executing proxy
         * false - Skip proxy, control will be passed to the routes below
         * */
        //Skip proxy if path is in proxyBypassList or path is reset-password
        resolve(
            !proxyBypassList.includes(req.path) && !matchPattern('/v1/reset-password/:resetId', req.path) //if not in proxyBassList //if not reset password request
        );
    });
};

/**
 * Decorate proxy response data by resolving external references.
 *
 * @param {object} proxyRes - The proxy response object.
 * @param {object} proxyResData - The proxy response data object.
 * @returns {Promise<object>} The decorated proxy response data.
 */
async function userResDecorator(proxyRes, proxyResData) {
    try {
        proxyResData = JSON.parse(proxyResData.toString());
    } catch (error) {
        logger.error(proxyResData);
    }
    if (proxyResData?.lcConfig?.fields && proxyResData?.data) {
        // Find virtual fields in the lcConfig fields
        const virtuals = Aggregation.findVirtuals(proxyResData?.lcConfig?.fields);

        // Aggregate data for virtual fields
        await Aggregation.aggregateData(proxyResData?.data, virtuals);
    }

    return proxyResData;
}

module.exports = { handleProxyRedirection, proxyErrorHandler, proxyReqPathResolver, proxyFilter, userResDecorator };