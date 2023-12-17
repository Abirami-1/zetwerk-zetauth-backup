const config = require('config');
const mongoose = require('mongoose');
const rbacEnabledBaseUrls = config.get('rbacEnabledBaseUrls');
const { METHOD_TO_PERMISSION_MAPPER } = require('../src/lib/constants/methodToPermissionMapper');
const _authService = require('../services/auth');
const logger = require('../lib/utils/logger');
const { checkUrlPattern } = require('../src/lib/utils/checkUrlPattern');

async function authorization(req, res, next) {
    // TODO: Need to revisit logic
    return next();

    const absoluteRequestPath = `${req.hostname}${req.path}`;
    /** Function to match pattern */
    if (checkUrlPattern(rbacEnabledBaseUrls, absoluteRequestPath)) {
        const source = req.originalUrl.split('/')[1];
        const entity = req.originalUrl.split('/')[3];
        const entityId = req.originalUrl.split('/')[4];
        let httpMethod;

        if (entityId && mongoose.isValidObjectId(entityId) && req.method === 'GET') {
            httpMethod = 'GET_WITH_ID';
        } else if (entityId && mongoose.isValidObjectId(entityId) && req.method === 'PUT') {
            httpMethod = 'PUT_WITH_ID';
        } else {
            httpMethod = req.method;
        }

        if (
            req.user.permissions[source] &&
            req.user.permissions[source][entity] &&
            Object.keys(req.user.permissions[source][entity]).includes(METHOD_TO_PERMISSION_MAPPER[httpMethod])
        ) {
            return next();
        } else {
            logger.error({
                description: 'Invalid permission request!',
                errorCode: 403,
                request: {
                    url: req.url,
                    headers: _authService.stripSensitiveHeaders(req.headers)
                }
            });
            return res.status(403).json({
                success: false,
                statusCode: 'INVALID_PERMISSION',
                message: 'You dont have permission to access this page. Please contact the administrator.'
            });
        }
    }
    return next();
}

module.exports = {
    authorization
};
