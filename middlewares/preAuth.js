
const { matchPattern } = require('url-matcher');
const config = require('config');
const authService = require('../services/auth');
const userService = require('../services/user');
const logger = require('../lib/utils/logger');
const RoleV2Service = require('../src/modules/common/roleV2/roleV2.service');
const _ = require('lodash');

/* _preAuth is deprecated,
hence auth mechanism is not changed here */
async function _preAuth(req, res, next) {

    if (req.path === `/${config.get('api.version')}/authenticate` ||
        req.path === `/${config.get('api.version')}/request-otp` ||
        req.path === `/${config.get('api.version')}/authenticateByUsernamePassword` ||
        req.path === `/${config.get('api.version')}/authenticateByPhone` ||
        req.path === `/${config.get('api.version')}/request-password-reset` ||
        matchPattern(`/${config.get('api.version')}/reset-password/:resetId`, req.path) ||
        matchPattern(`/${config.get('api.version')}/users/exists/`, req.path) ||
        matchPattern(`/${config.get('api.version')}/users/supplier-exists/`, req.path) ||
        req.path === `/${config.get('api.version')}/supplier-authenticate/google` ||
        req.path === `/${config.get('api.version')}/request-email-otp` ||
        req.path === `/${config.get('api.version')}/authenticate-by-otp` ||
        req.path === `/${config.get('api.version')}/authenticate-customer-user/otp` ||
        req.path === `/${config.get('api.version')}/request-customer-user/otp`
  
    ) {
        return next();
    }
    const token = req.headers['authorizationtoken'];
  
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'No Auth token is provided'
        });
    }
  
    try {
        let user = await authService.verifyCentralAuthToken(token);
        let existingUser = await userService.findUserByEmail(user.email);
  
        if (!existingUser || existingUser.deleted) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized. Please contact the administrator.'
            });
        }
  
        let allPermisions = {};
        for (const role of existingUser.roleIdsV2) {
            const rolesV2 = await RoleV2Service.findById({user},role);
            if(rolesV2) _.merge(allPermisions, rolesV2.permissions);
        }

        existingUser.permissions = allPermisions;
        // This will change, add necessary fields to header 
        req.user = existingUser;

        next();
    } catch (error) {
  
        logger.error({
            description: 'Error in preauthentication',
            error,
            user: req.user
        });
  
        return res.status(401).json({
            success: false,
            message: 'Auth Token is Invalid'
        });
  
    }
}

module.exports = {
    _preAuth
};