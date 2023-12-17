const ObjectId = require('mongoose').Types.ObjectId;
const logger = require('../lib/utils/logger');
const Users = require('../models/user');
const Roles = require('../models/role');
const userService = require('../services/user');

const {
    USER_CREATE_SUCCESS,
    USER_CREATE_FAILED,
    USER_UPDATE_SUCCESS,
    USER_UPDATE_FAILED,
    FETCH_USER_FAILED,
    FETCH_USER_SUCCESS,
    USER_DELETE_FAILED,
    USER_DELETE_SUCCESS,
    USER_NOT_FOUND,
    USER_ACKNOWLEDGE_SUCCESS,
    USER_ACKNOWLEDGE_FAILED
} = require('../lib/constants/response-codes');

const FIELDS_TO_POPULATE = [
    'createdByDetails',
    'updatedByDetails',
    'roleDetails',
    'appsEnabledDetails'
];

async function _createUser(req, res) {
    try {
        let userData = req.body;
        userData.createdBy = req.user._id || userData.createdBy;
        userData.updatedBy = req.user._id || userData.updatedBy;

        let user = await userService.createUser(userData, req.user);

        logger.info({
            description: 'User created successfully',
            createdUser: user,
            user: req.user
        });

        return res.status(201).json({
            success: true,
            statusCode: USER_CREATE_SUCCESS,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        let user;
        if (error?.keyValue?.phoneNumber) {
            user = await userService.findUserByPhoneNumber(error?.keyValue?.phoneNumber, ['isActive']);
        } else if (error?.keyValue?.email) {
            user = await userService.findUserByEmail(error?.keyValue?.email, ['isActive']);
        }
        
        logger.error({
            description: 'Create user failed',
            error,
            user: req.user
        });
        
        return res.status(400).json({
            success: false,
            statusCode: USER_CREATE_FAILED,
            message: error?.errmsg || error?.errors || error?.message,
            isActive: user?.isActive
        });
    }
}

async function _updateUserByIdOrEmail(req, res) {
    try {
        let userData = req.body;
        userData.updatedBy = req.user._id || userData.updatedBy;
        let user = void 0;

        if (ObjectId.isValid(req.params.id) && new ObjectId(req.params.id).toString() === req.params.id) {
            user = await userService.updateUserById(req.params.id, userData);
        // eslint-disable-next-line no-useless-escape
        } else if (/^([\w-\.\+W]+@([\w-]+\.)+[\w-]{2,4})?$/.test(req.params.id)) {
            user = await userService.updateUserByEmail(req.params.id, userData);
        } else {
            throw new Error('Not A Valid User Id or Email');
        }

        if (!user) throw new Error('User Not Found!');

        logger.info({
            description: 'User updated',
            updatedUser: user,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            statusCode: USER_UPDATE_SUCCESS,
            message: 'User is updated successfully',
            data: user
        });
    } catch (error) {
        logger.error({
            description: 'Update User failed',
            error,
            user: req.user
        });

        return res.status(error.code || 500).json({
            success: false,
            statusCode: error.statusCode || USER_UPDATE_FAILED,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _updateUserPasswordById(req, res) {
    try {
        let rfqUserData = req.body;
        let newPassword = rfqUserData.password;
        let userData = await Users.findOne({ _id: req.params.userId });
        if (userData) {
            userData.updatedBy = req.user._id;
            userData.password = newPassword;
            let user = await userService.updateUserById(req.params.userId, userData);
            logger.info({
                description: 'User password updated',
                updatedUser: user,
                user: req.user
            });

            return res.status(200).json({
                success: true,
                statusCode: USER_UPDATE_SUCCESS,
                message: 'User password is updated successfully',
                data: user
            });
        } else {
            return res.status(200).json({
                success: true,
                statusCode: USER_UPDATE_SUCCESS,
                message: 'User does not exist in CA'
            });
        }
    } catch (error) {
        logger.error({
            description: 'Update User password failed',
            error,
            user: req.user
        });

        return res.status(500).json({
            success: false,
            statusCode: USER_UPDATE_FAILED,
            message: error.errmsg || error.errors
        });
    }
}

async function _deleteUserById(req, res) {
    try {
        let user = await userService.deleteUserById(req.params.userId, req.user);

        logger.info({
            description: 'User is deleted successfully',
            deletedUser: user,
            user: req.user
        });

        if (!user) {
            return res.status(500).json({
                success: false,
                statusCode: USER_DELETE_FAILED,
                message: 'Document not found'
            });
        }

        return res.status(200).json({
            success: true,
            statusCode: USER_DELETE_SUCCESS,
            message: 'User is deleted successfully'
        });
    } catch (error) {
        logger.error({
            description: 'Delete user failed',
            error,
            user: req.user
        });

        return res.status(500).json({
            success: false,
            statusCode: USER_DELETE_FAILED,
            message: error.errors
        });
    }
}

async function _getAllUsers(req, res) {
    try {
        let queryParams = {
            // appName: req.query.appName,
            recordsPerPage: req.query.recordsPerPage,
            pageNumber: req.query.pageNumber,
            sortBy: 'firstName',
            sortCriteria: 1,
            userType: req.query.userType,
            searchText: req.query.searchText,
            ipRestrictionStatus: req.query.ipRestrictionStatus
        };

        let allDocuments = await userService.getAllUsers({ queryParams });

        res.status(200).json({
            success: true,
            statusCode: FETCH_USER_SUCCESS,
            message: 'User is fetched successfully',

            data: allDocuments
        });
    } catch (error) {
        logger.error({
            description: 'Fetch users failed',
            error,
            user: req.user
        });

        return res.status(500).json({
            success: false,
            statusCode: FETCH_USER_FAILED,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _getUserById(req, res) {
    try {

        let user = await Users.findById(req.params.userId, FIELDS_TO_POPULATE);

        logger.info({
            description: 'User fetched successfully',
            users: user,
            user: req.user
        });
        res.status(200).json({
            success: true,
            statusCode: FETCH_USER_SUCCESS,
            message: 'User is fetched successfully',
            data: user
        });
    } catch (error) {
        logger.error({
            description: 'Fetch user failed',
            error,
            user: req.user
        });

        return res.status(500).json({
            success: false,
            statusCode: FETCH_USER_FAILED,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _getUsersByRole(req, res) {
    try {
        let queryParams = {
            // appName: req.query.appName,
            role: req.query.role,
            recordsPerPage: req.query.recordsPerPage,
            pageNumber: req.query.pageNumber
        };

        let allDocuments = await userService.getUsersByRole({ queryParams });

        logger.info({
            description: 'Users fetched successfully for a role',
            users: allDocuments,
            user: req.user
        });
        res.status(200).json({
            success: true,
            statusCode: FETCH_USER_SUCCESS,
            message: 'User is fetched successfully for a role',

            data: allDocuments
        });
    } catch (error) {
        logger.error({
            description: 'Fetch users for a role failed',
            error,
            user: req.user
        });

        return res.status(500).json({
            success: false,
            statusCode: FETCH_USER_FAILED,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _checkUserByEmail(req, res) {
    try {
        let user = await userService.findUserByEmail(req.params.email, {
            email: 1,
            firstName: 1,
            lastName: 1,
            userType: 1,
            userSubType: 1,
            phoneNumber: 1
        });
        logger.info({
            description: 'User fetched successfully',
            user: user
        });

        if (!user) {
            return res.status(200).json({
                success: false,
                statusCode: USER_NOT_FOUND,
                message: 'User does not exists',
                data: {}
            });
        }

        return res.status(200).json({
            success: true,
            statusCode: FETCH_USER_SUCCESS,
            message: 'User fetched successfully',
            data: { user }
        });
    } catch (error) {
        logger.error({
            description: 'Fetch user failed',
            error
        });
        return res.status(500).json({
            success: false,
            statusCode: FETCH_USER_FAILED,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _getUsersByNameAndRole(req, res) {
    try {
        // throwing error if role is empty
        if (!req.query.role && !req.query.excludeRoles) {
            throw new Error('Role is a required');
        }
        let queryParams = {
            searchText: '',
            role: ''
        };
        if (req.query.searchText && req.query.searchText.length > 0) {
            queryParams['searchText'] = req.query.searchText.replace(/"/g, '').replace(/\s/g, '+');
        }
        if (req.query.role) {
            queryParams['role'] = req.query.role.replace(/"/g, '');
        }
        if (req.query.excludeRoles) {
            queryParams['role'] = { $nin: req.query.excludeRoles.split(',') };
        }
        let match = {};
        if (queryParams.searchText.match(/@/)) {
            match['email'] = queryParams.searchText;
        } else {
            match['$or'] = [
                { firstName: { $regex: new RegExp(queryParams.searchText, 'i') } },
                { lastName: { $regex: new RegExp(queryParams.searchText, 'i') } }
            ];
        }

        /** Find all roleIds of the user requested roles */
        const roleList = await Roles.find({ name: queryParams.role });
        const roleIds = roleList.map(x => x._id);

        /** Add search condition only if available */
        if (queryParams.searchText.trim() === '') { match = {}; }

        /** Get user list using find and project only necessary fields */
        let userList = await Users.find(
            { roleId: { $in: roleIds }, ...match },
            { firstName: 1, lastName: 1, email: 1, phoneNumber: 1 }
        );

        logger.info({
            description: 'Users fetched successfully By Email or firstname and role',
            users: [],
            user: req.user
        });
        res.status(200).json({
            success: true,
            statusCode: FETCH_USER_SUCCESS,
            message: 'User is fetched successfully By Email or firstname and role',
            length: userList.length,
            data: userList
        });
    } catch (error) {
        logger.error({
            description: 'Fetch users by email or firstname and role failed',
            error,
            user: req.user
        });

        return res.status(500).json({
            success: false,
            statusCode: FETCH_USER_FAILED,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _getUsersByIds(req, res) {
    try {
        let query = {
            deleted: false,
            _id: { $in: req.body._ids }
        };
        let project = {};
        let users;

        if (req.body.include && req.body.include.length) {
            for (let field of req.body.include) {
                project[`${field}`] = 1;
            }
            users = await Users.find(query, project);
        } else {
            users = await Users.find(query);
        }

        logger.info({
            description: 'Users fetched successfully',
            user: req.user
        });
        res.status(200).json({
            success: true,
            statusCode: FETCH_USER_SUCCESS,
            message: 'Users fetched successfully',
            data: users
        });
    } catch (error) {
        logger.error({
            description: 'Fetch users failed',
            error,
            user: req.user
        });

        return res.status(500).json({
            success: false,
            statusCode: FETCH_USER_FAILED,
            message: error.errmsg || error.errors || error.message
        });
    }
}

/**
 * Create/Upsert temporary user with a
 * pending acknowledgment status
 */
async function _createUserV2(req, res) {
    try {
        let userData = req.body;
        userData.createdBy = req.user._id;
        userData.updatedBy = req.user._id;

        let user = await userService.createUserV2(userData);

        logger.info({
            description: 'User created successfully',
            createdUser: user,
            user: req.user
        });

        return res.status(201).json({
            success: true,
            statusCode: USER_CREATE_SUCCESS,
            message: 'User created successfully',
            data: user
        });
    } catch (error) {
        logger.error({
            description: 'Create user failed',
            error,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            statusCode: USER_CREATE_FAILED,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _acknowledgeUserAndSendOnboardingMail(req, res) {
    try {
        let userId = req.params.id;
        let user = await userService.acknowledgeUserCreation(userId, req.user);
        if (!user) {
            throw new Error(
                'User Not Found or User has already been acknowledged. Please check with the Administrator.'
            );
        }

        /** Send User Onboarding Mail with password */
        /*
        Supplier emails will no longer be triggered using internal kafka message.
        Will be moved to Messaging Service.
        try {
            user.password = req.body.unhashedPassword;
            await userService.sendUserPasswordMail(user);
        } catch (error) {
            throw new Error('Failed To Send User Onbaording Mail!');
        }
        */

        logger.info({
            description: 'User Acknowleged successfully',
            acknowledgedUser: user,
            user: req.user
        });

        return res.status(201).json({
            success: true,
            statusCode: USER_ACKNOWLEDGE_SUCCESS,
            message: 'User Acknowledged successfully',
            data: user
        });
    } catch (error) {
        logger.error({
            description: 'Acknowledge user failed',
            error,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            statusCode: USER_ACKNOWLEDGE_FAILED,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _updateNotificationTokens(req, res) {
    try {
        const user = req.user;

        const { appId, appName, token } = req.body;

        const result = await userService.updateNotificationTokens({ appName, appId, token, userId: req.params.userId });

        logger.info({
            description: 'Registration token has been updated sucessfully',
            result,
            user
        });
        return res.status(200).json({
            success: true,
            message: 'Registration token has been updated sucessfully',
            data: result
        });
    } catch (error) {
        logger.error({
            description: 'Registration Token update failed',
            error,
            user: req.user
        });

        return res.status(500).json({
            success: false,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _deleteNotificationTokens(req, res) {
    try {
        const user = req.user;

        const { appName, tokens } = req.body;

        const result = await userService.deleteNotificationTokens({
            appName,
            tokens,
            userId: req.params.userId
        });

        logger.info({
            description: 'Registration token has been updated sucessfully',
            result,
            user
        });
        return res.status(200).json({
            success: true,
            message: 'Registration token has been updated sucessfully',
            data: result
        });
    } catch (error) {
        logger.error({
            description: 'Registration Token delete failed',
            error,
            user: req.user
        });

        return res.status(500).json({
            success: false,
            messgae: error.errmsg || error.errors || error.message
        }); 
    }
}

async function _checkSupplierByEmail(req, res) {
    try {
        let user = await userService.findSupplierByEmail(req.params.email, {
            email: 1,
            firstName: 1,
            lastName: 1,
            userType: 1,
            userSubType: 1
        });
        logger.info({
            description: 'User fetched successfully',
            user: user
        });

        if (!user) {
            return res.status(200).json({
                success: false,
                statusCode: USER_NOT_FOUND,
                message: 'User does not exists',
                data: {}
            });
        }

        return res.status(200).json({
            success: true,
            statusCode: FETCH_USER_SUCCESS,
            message: 'User fetched successfully',
            data: { user }
        });
    } catch(error) {
        return res.status(400).json({
            success: false,
            message: error.errmsg || error.errors || error.message
        });
    }
}

module.exports = {
    _createUser,
    _getAllUsers,
    _updateUserByIdOrEmail,
    _updateUserPasswordById,
    _deleteUserById,
    _getUsersByRole,
    _getUserById,
    _checkUserByEmail,
    _checkSupplierByEmail,
    _getUsersByNameAndRole,
    _getUsersByIds,
    _createUserV2,
    _acknowledgeUserAndSendOnboardingMail,
    _updateNotificationTokens,
    _deleteNotificationTokens
};