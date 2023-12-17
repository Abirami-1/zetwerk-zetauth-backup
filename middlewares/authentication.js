/* eslint-disable require-atomic-updates */
/**
 * New authentication middleware to validate incoming requests
 * 1. Accept incoming request
 * 2. Check authorizationtoken (existing header name) exists or not
 * 3. Validate token with secret if found
 * 4. Append additional items in the header
 */
const _authService = require('../services/auth');
const _userService = require('../services/user');
const _customerUserService = require('../services/customer-user');
const logger = require('../lib/utils/logger');
const _ = require('lodash');

const config = require('config');
const { matchPattern } = require('url-matcher');
const RoleV2Service = require('../src/modules/common/roleV2/roleV2.service');

/**
 * List of routes with hostname where authentication should not be applied,
 * This has to be in following format {req.hostname}/{req.path}
 */
const authBypassPathList = config.get('authBypassPathList');

/**
 * The authentication middleware
 * @param {*} req request object
 * @param {*} res response object
 * @param {*} next next()
 */
async function authentication(req, res, next) {
    /** Get the absolute request path */
    const absoluteRequestPath = `${req.hostname}${req.path}`;

    /** Function to match pattern */
    const hasMatchingPatternFound = (authBypassPathList, absoluteRequestPath) => {
        let matchFound = false;
        authBypassPathList.forEach(path => {
            if (matchPattern(path, absoluteRequestPath)) {
                matchFound = true;
            }
        });
        return matchFound;
    };

    /**
     * Skip authentication if matched either one of
     * 1. Full path is listed in authBypassPathList
     * 2. Its an internal route
     */
    if (
        authBypassPathList.includes(absoluteRequestPath) ||
        hasMatchingPatternFound(authBypassPathList, absoluteRequestPath)
    ) {
        return next();
    }

    /** Parse the auth token from header of request */
    const token =
        req.headers['authorizationtoken'] ||
        req.cookies.authorizationtoken || //for backward compatibility, can be removed after token expiry days
        req.cookies[`authorizationtoken${process.env.NODE_ENV}`];
    /** Do not proceed further, if token is not present */
    if (!token) {
        logger.error({
            description: 'Unauthorized access request! No Auth token is provided',
            errorCode: 401,
            request: {
                url: req.url,
                headers: _authService.stripSensitiveHeaders(req.headers)
            }
        });
        return res.status(401).json({
            success: false,
            message: 'No Auth token is provided'
        });
    }

    try {
        /** Continue existing functionality, check user in database after validation */
        let user = await _authService.verifyCentralAuthToken(token, req.cookies, res);
        let authorisedUser = true;
        let existingUser = await _userService.findUserById(user._id);
        if (!existingUser) {
            existingUser = await _customerUserService.findUserById(user._id);
            if (!(req.path.split('/')[4] === 'customer-users' || req.path.split('/')[1] === 'zetquote')) {
                authorisedUser = false;
            }
        }
        let userDomain = existingUser && existingUser.email ? existingUser.email.split('@')[1] : null;
        let definedDomains = config.get('refererRestrictionForDomain') && config.get('refererRestrictionForDomain')[userDomain] || null;
        if (userDomain && definedDomains && definedDomains.indexOf(req.headers.referer) === -1) {
            authorisedUser = false;
        }
        if (!existingUser || existingUser.deleted) {
            authorisedUser = false;
        }
        if (user?.passPhrase !== existingUser?.passPhrase) {
            authorisedUser = false;
        }
        //If user has allowedIPs set, then only ip check is done.
        if (existingUser.allowedIPs?.length && existingUser?.ipRestrictionStatus === 'ENABLED') {
            const clientIP = req.headers['x-forwarded-for'];
            if (!existingUser.allowedIPs.includes(clientIP)) {
                authorisedUser = false;
            }
        }

        if (!authorisedUser) {
            logger.error({
                description: 'Unauthorized access request!',
                errorCode: 403,
                request: {
                    url: req.url,
                    headers: _authService.stripSensitiveHeaders(req.headers)
                }
            });
            return res.status(403).json({
                success: false,
                statusCode: 'AUTH_TOKEN_INVALID',
                message: 'Auth middleware - You are not authorized. Please contact the administrator.'
            });
        }

        /** Inject custom headers in request */
        req.headers['X-ZETAUTH-USER-ID'] = existingUser._id || '';
        req.headers['X-ZETAUTH-USER-EMAIL'] = existingUser.email || '';
        req.headers['X-ZETAUTH-USER-FIRST-NAME'] = existingUser.firstName || '';
        req.headers['X-ZETAUTH-USER-LAST-NAME'] = existingUser.lastName || '';
        req.headers['X-ZETAUTH-USER-PHONE'] = existingUser.phoneNumber || '';
        req.headers['X-ZETAUTH-ROLE-IDS'] = existingUser.roleId.join(',') || '';
        req.headers['X-ZETAUTH-USER-TYPE'] = existingUser.userType || '';
        req.headers['X-ZETAUTH-USER-SUB-TYPE'] = existingUser.userSubType || '';
        req.headers['X-ZETAUTH-ROLE-NAMES'] =
            (existingUser.roleDetails && existingUser.roleDetails.map(x => x.name).join(',')) || '';
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
            description: 'Error occured at authentication function',
            error
        });
        /** Common error  */
        return res.status(401).json({
            success: false,
            message: 'Auth Token is Invalid'
        });
    }
}

module.exports = {
    authentication
};
