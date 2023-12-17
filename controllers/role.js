const logger = require('../lib/utils/logger');
const roleService = require('../services/role');

const {
    ROLE_CREATE_SUCCESS,
    ROLE_CREATE_FAILED,
    ROLE_UPDATE_SUCCESS,
    ROLE_UPDATE_FAILED,
    FETCH_ROLE_FAILED,
    FETCH_ROLE_SUCCESS,
    ROLE_DELETE_FAILED,
    ROLE_DELETE_SUCCESS
} = require('../lib/constants/response-codes');


async function _createRole(req, res) {
    try {

        let roleData = req.body;
        let role = await roleService.createRole(roleData, req.user);
        roleData._id = role._id;
        logger.info({description: 'Role created',
            role,
            user: req.user
        });

        return res.status(201).json({
            success: true,
            statusCode: ROLE_CREATE_SUCCESS,
            message: 'Role is created successfully',
            data: role
        });

    } catch (error) {
        logger.error({description: 'Create Role failed',
            error,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            statusCode: ROLE_CREATE_FAILED,
            message: error.errmsg || error.errors
        });
    }

}

async function _updateRoleById (req, res) {
    try {

        let roleData = req.body;

        let role = await roleService.updateRoleById(req.params.roleId, roleData, req.user);

        logger.info({description: 'Role updated',
            role,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            statusCode: ROLE_UPDATE_SUCCESS,
            message: 'Role is updated successfully',
            data: role
        });

    } catch (error) {
        logger.error({description: 'Update Role failed',
            error,
            user: req.user
        });

        return res.status(500).json({
            success: false,
            statusCode: ROLE_UPDATE_FAILED,
            message: error.errmsg || error.errors
        });
    }

}

async function _getRoleById (req, res) {
    try {
        let role = await roleService.findRoleById(req.params.roleId);

        logger.info({description: 'Role is fetched successfully', role, user: req.user });

        if (!role) {
            return res.status(500).json({
                success: false,
                statusCode: FETCH_ROLE_FAILED,
                message: 'Role not found'
            });
        }
        return res.status(200).json({
            success: true,
            statusCode: FETCH_ROLE_SUCCESS,
            message: 'Role is fetched successfully',
            data: role
        });
    } catch (error) {

        logger.error({description: 'Fetch role failed', error, user: req.user });

        return res.status(500).json({
            success: false,
            statusCode: FETCH_ROLE_FAILED,
            message: error.errors
        });
    }
}

async function _getRoleByName(req, res) {
    try {
        let role = await roleService.findRoleByName(req.params.roleName);

        if (!role) {
            return res.status(500).json({
                success: false,
                statusCode: FETCH_ROLE_FAILED,
                message: 'Document not found'
            });
        }
        logger.info({description: 'Role is fetched successfully', role, user: req.user });
        return res.status(200).json({
            success: true,
            statusCode: FETCH_ROLE_SUCCESS,
            message: 'Role is fetched successfully',
            data: role
        });
    } catch (error) {

        logger.error({description: 'Fetch role failed', error, user: req.user });

        return res.status(500).json({
            success: false,
            statusCode: FETCH_ROLE_FAILED,
            message: error.errors
        });
    }
}

async function _getAllRoles(req, res) {
    try {
        let allDocuments = await roleService.getAllRoles();
        logger.info({
            description: 'Roles fetched successfully',
            users: allDocuments,
            user: req.user
        });
        res.status(200).json({
            success: true,
            statusCode: FETCH_ROLE_SUCCESS,
            message: 'Role is fetched successfully',
            data: allDocuments
        });
    } catch (error) {
        logger.error({
            description: 'Fetch roles failed',
            error,
            user: req.user
        });

        return res.status(500).json({
            success: false,
            statusCode: FETCH_ROLE_FAILED,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _deleteRoleById(req, res) {
    try {
        let role = await roleService.deleteRoleById(req.params.roleId, req.user);

        logger.info({description: 'Role is deleted successfully', role, user: req.user });

        return res.status(200).json({
            success: true,
            statusCode: ROLE_DELETE_SUCCESS,
            message: 'Role is deleted successfully'
        });
    } catch (error) {

        logger.error({description: 'Delete role failed', error, user: req.user });

        return res.status(500).json({
            success: false,
            statusCode: ROLE_DELETE_FAILED,
            message: error.errors
        });
    }
}

module.exports = {
    _deleteRoleById,
    _getRoleById,
    _getAllRoles,
    _updateRoleById,
    _createRole,
    _getRoleByName
};