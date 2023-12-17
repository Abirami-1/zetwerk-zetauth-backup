const logger = require('../lib/utils/logger');
const RefreshToken = require('../models/refresh-token');
const ObjectId = require('mongoose').Types.ObjectId;

/**
 * Delete a specific project type by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _deleteRefreshTokenByToken(req, res) {
    try {
        let token = req.params.token;
        let document = await RefreshToken.findOneAndUpdate({
            token: token
        }, {
            deleted: true
        }, {
            new: true
        });
        //Need to add user access for deleting token

        logger.info({
            description: 'Refresh token deleted',
            deleted: document,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            message: 'Refresh token deleted with following stats',
            document
        });
    } catch (error) {
        logger.error({
            description: 'Delete refresh token failed',
            error,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            message: error.errmsg || error.errors
        });
    }
}

async function _deleteRefreshTokensByUserId(req, res) {
    try {
        let userId = req.params.userId;
        let document = await RefreshToken.updateMany({
            userId: ObjectId(userId)
        }, {
            deleted: true
        }, {
            new: true
        });
        //Need to add user access for deleting token

        logger.info({
            description: `All refresh token deleted for User ${userId}`,
            deleted: document,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            message: `All refresh token deleted for User ${userId}`,
            document
        });
    } catch (error) {
        logger.error({
            description: 'Delete refresh token failed',
            error,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            message: error.errmsg || error.errors
        });
    }
}

module.exports = {
    _deleteRefreshTokenByToken,
    _deleteRefreshTokensByUserId
};