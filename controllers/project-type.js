/**
 * Controller for project type
 */
const logger = require('../lib/utils/logger');
const ProjectType = require('../models/project-type');
const confluentKafka = require('../lib/utils/confluent-kafka');
const ObjectId = require('mongoose').Types.ObjectId;
const { CREATE_PROJECT_TYPE, UPDATE_PROJECT_TYPE, DELETE_PROJECT_TYPE } = require('../lib/constants/kafka-events');
const FIELDS_TO_POPULATE = ['createdByDetails', 'updatedByDetails'];
const { AUDIT_LOG_ACTIONS } = require('../lib/constants/audit-log');
const AuditLogService = new (require('../services-v2/AuditLogService'))();

/**
 * Create a new project type
 * @param {*} req request object
 * @param {*} res response
 */
async function _createProjectType(req, res) {
    try {
        let payload = req.body;
        if (req.user && req.user._id && ObjectId.isValid(req.user._id)) {
            payload.createdBy = req.user._id;
            payload.updatedBy = req.user._id;
        }
        let data = await ProjectType.create(payload);

        confluentKafka.sendMessage('ZET-PROJECT_TYPE', {
            event: CREATE_PROJECT_TYPE,
            message: 'New project type created',
            data: {
                _id: data._id
            }
        });
        logger.info({
            description: 'Project type created',
            data,
            user: req.user
        });

        return res.status(201).json({
            success: true,
            message: 'Project type has been created successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Create project type failed',
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
 * Get a list of all project types
 * @param {*} req request object
 * @param {*} res response
 */
async function _getAllProjectTypes(req, res) {
    try {
        let data = await ProjectType.findAll({ fieldsToPopulate: FIELDS_TO_POPULATE });

        return res.status(200).json({
            success: true,
            message: 'Project types fetched successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Fetch all project types failed',
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
 * Get a specific project type by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _getProjectTypeById(req, res) {
    try {
        let projectTypeId = req.params.projectTypeId;

        let data = await ProjectType.findById(projectTypeId, FIELDS_TO_POPULATE);

        if (data) {
            return res.status(200).json({
                success: true,
                message: 'Project type fetched successfully',
                data
            });
        } else {
            return res.status(200).json({
                success: false,
                message: 'Project type not found'
            });
        }
    } catch (error) {
        logger.error({
            description: 'Get project type by id failed',
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
 * Update a specific project type by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _updateProjectTypeById(req, res) {
    try {
        let payload = req.body;
        delete payload['slug']; // If slug is passed, remove it - don't allow user to update slug

        if (req.user && req.user._id && ObjectId.isValid(req.user._id)) {
            payload.updatedBy = req.user._id;
        }
        
        let projectTypeId = req.params.projectTypeId;

        const oldData = await ProjectType.findOne({ _id: projectTypeId });

        let data = await ProjectType.updateById(projectTypeId, payload);

        // Making audit log entry for project types
        await AuditLogService.createAuditLog({
            newData: data,
            oldData,
            user: req.user,
            model: ProjectType,
            actionType: AUDIT_LOG_ACTIONS.UPDATE,
            action: AUDIT_LOG_ACTIONS.UPDATE
        });

        confluentKafka.sendMessage('ZET-PROJECT_TYPE', {
            event: UPDATE_PROJECT_TYPE,
            message: 'Project type updated',
            data: {
                _id: data._id
            }
        });

        logger.info({
            description: 'Project type updated',
            data,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            message: 'Project type updated successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Update project type failed',
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
 * Delete a specific project type by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _deleteProjectTypeById(req, res) {
    try {
        let projectTypeId = req.params.projectTypeId;

        let data = await ProjectType.deleteById(projectTypeId);

        // Making audit log entry for project types
        await AuditLogService.createAuditLog({
            newData: data,
            user: req.user,
            model: ProjectType,
            actionType: AUDIT_LOG_ACTIONS.DELETE,
            action: AUDIT_LOG_ACTIONS.DELETE
        });

        confluentKafka.sendMessage('ZET-PROJECT_TYPE', {
            event: DELETE_PROJECT_TYPE,
            message: 'Project type deleted',
            data: { _id: projectTypeId }
        });

        logger.info({
            description: 'Project type deleted',
            deleted: data,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            message: 'Project type deleted successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Delete project type by id failed',
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
    _createProjectType,
    _getAllProjectTypes,
    _getProjectTypeById,
    _updateProjectTypeById,
    _deleteProjectTypeById
};
