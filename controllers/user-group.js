const DefaultController = require('@zetwerk/zetapp/controllers/DefaultController');
const logger = require('../lib/utils/logger');
const ObjectId = require('mongoose').Types.ObjectId;

class UserGroupController extends DefaultController {
    constructor() {
        super('user-group');
    }

    /**
     * Create a new  User Group
     * @param {*} req request object
     * @param {*} res response
     */
    async _createGroup(req, res) {
        try {
            let payload = req.body;

            if (req.user && req.user._id && ObjectId.isValid(req.user._id)) {
                payload.createdBy = req.user._id;
                payload.updatedBy = req.user._id;
            }

            const userGroup = await this.services.UserGroupService.createUserGroup(payload, req.user);

            logger.info({
                description: 'User Group created',
                userGroup,
                user: req.user
            });

            return res.status(201).json({
                success: true,
                message: 'User Group has been created successfully',
                data: userGroup
            });
        } catch (error) {
            logger.error({
                description: 'Creation of User Group failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }

    /**
     * Get all the User Groups
     * @param {*} req request object
     * @param {*} res response
     */
    async _getUserGroups(req, res) {
        try {
            let data = await this.services.UserGroupService.getUserGroups();

            return res.status(200).json({
                success: true,
                message: 'User Groups fetched successfully',
                data
            });
        } catch (error) {
            logger.error({
                description: 'Fetching all User Groups failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }

    /**
     * Get User Group by _id
     * @param {*} req request object
     * @param {*} res response
     */
    async _getUserGroupById(req, res) {
        try {
            let data = await this.services.UserGroupService.getUserGroupById(req.params.userGroupId);

            return res.status(200).json({
                success: true,
                message: 'User Group fetched successfully',
                data
            });
        } catch (error) {
            logger.error({
                description: `Fetching User Group ${req.params.userGroupId} failed`,
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }

    /**
     * delete a User Group
     * @param {*} req request object
     * @param {*} res response
     */
    async _deleteUserGroup(req, res) {
        try {
            let data = await this.services.UserGroupService.deleteUserGroup(req.params.userGroupId, req.user);

            logger.info({
                description: 'User Group deleted',
                data: data._id,
                user: req.user
            });

            return res.status(200).json({
                success: true,
                message: 'User Group deleted successfully',
                data
            });
        } catch (error) {
            logger.error({
                description: 'Deleting User Group failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }

    /**
     * Update a User Group
     * @param {*} req request object
     * @param {*} res response
     */
    async _updateUserGroup(req, res) {
        try {
            let payload = req.body;
            let userGroupId = req.params.userGroupId;

            if (req.user && req.user._id && ObjectId.isValid(req.user._id)) {
                payload.updatedBy = req.user._id;
            }

            let data = await this.services.UserGroupService.updateUserGroup({
                userGroupId,
                userIds: payload.userIds,
                user: req.user
            });

            logger.info({
                description: 'User Group updated',
                data,
                user: req.user
            });

            return res.status(200).json({
                success: true,
                message: 'User Group updated successfully',
                data
            });
        } catch (error) {
            logger.error({
                description: 'Updating User Group failed',
                error,
                user: req.user
            });

            return res.status(400).json({
                success: false,
                message: error.errmsg || error.errors
            });
        }
    }
}

module.exports = UserGroupController;
