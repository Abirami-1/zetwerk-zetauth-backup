/**
 * Controller for factory
 */
const logger = require('../lib/utils/logger');
const Factory = require('../models/factory');
const confluentKafka = require('../lib/utils/confluent-kafka');
const Types = require('mongoose').Types;
const { CREATE_FACTORY, UPDATE_FACTORY, DELETE_FACTORY } = require('../lib/constants/kafka-events');
const FIELDS_TO_POPULATE = ['companyDetails', 'createdByDetails', 'updatedByDetails', 'businessDetails'];
const AuditLogService = new (require('../services-v2/AuditLogService'))();
const { AUDIT_LOG_ACTIONS } = require('../lib/constants/audit-log');

/**
 * Create a new factory
 * @param {*} req request object
 * @param {*} res response
 */
async function _createFactory(req, res) {
    try {
        let payload = req.body;
        let data = await Factory.create(payload);

        confluentKafka.sendMessage('ZET-FACTORY', {
            event: CREATE_FACTORY,
            message: 'New factory created',
            data
        });
        logger.info({
            description: 'Factory created',
            data,
            user: req.user
        });

        return res.status(201).json({
            success: true,
            message: 'Factory has been created successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Create factory failed',
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
 * Get a list of all factories
 * @param {*} req request object
 * @param {*} res response
 */
async function _getAllFactories(req, res) {
    try {
        let conditions = {
            deleted: false
        };

        /** Add companyId parameter */
        const { companyId, companies } = req.query;
        if (companyId && Types.ObjectId.isValid(companyId)) {
            conditions['company.companyId'] = Types.ObjectId(companyId);
        }

        let companyIncluded = [];

        if (companies) {
            companyIncluded = companies.split(',').map(slug => slug.toLowerCase()) || [];
        }

        /** Add slug parameter */
        const { slug } = req.query;
        if (slug && slug !== '') {
            conditions['slug'] = slug;
        }

        if (companyIncluded && companyIncluded.length) {
            conditions['company.slug'] = { $in: companyIncluded };
        }

        /** IMPORTANT: DO NOT change this to custom findAll function - it will break in multiple places */
        let data = await Factory.find(conditions)
            .sort({ name: 1 })
            .populate(FIELDS_TO_POPULATE);

        return res.status(200).json({
            success: true,
            message: 'Factories fetched successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Fetch all factories failed',
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
 * Get a specific factory by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _getFactoryById(req, res) {
    try {
        let factoryId = req.params.factoryId;

        let data = await Factory.findById(factoryId, FIELDS_TO_POPULATE);

        if (data) {
            return res.status(200).json({
                success: true,
                message: 'Factory fetched successfully',
                data
            });
        } else {
            return res.status(200).json({
                success: false,
                message: 'Factory not found'
            });
        }
    } catch (error) {
        logger.error({
            description: 'Get factory by id failed',
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
 * Update a specific factory by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _updateFactoryById(req, res) {
    try {
        let payload = req.body;
        let factoryId = req.params.factoryId;

        const oldFactory = await Factory.findOne({ _id: factoryId });
        let data = await Factory.updateById(factoryId, payload);

        // Making audit log entry for Factory
        await AuditLogService.createAuditLog({
            newData: data,
            oldData: oldFactory,
            user: req.user,
            model: Factory,
            actionType: AUDIT_LOG_ACTIONS.UPDATE,
            action: AUDIT_LOG_ACTIONS.UPDATE
        });

        confluentKafka.sendMessage('ZET-FACTORY', {
            event: UPDATE_FACTORY,
            message: 'Factory updated',
            data
        });

        logger.info({
            description: 'Factory updated',
            data,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            message: 'Factory updated successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Update factory failed',
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
 * Delete a specific factory by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _deleteFactoryById(req, res) {
    try {
        let factoryId = req.params.factoryId;

        let data = await Factory.deleteById(factoryId);

        // Making audit log entry for Factory
        await AuditLogService.createAuditLog({
            newData: data,
            user: req.user,
            model: Factory,
            actionType: AUDIT_LOG_ACTIONS.DELETE,
            action: AUDIT_LOG_ACTIONS.DELETE
        });

        confluentKafka.sendMessage('ZET-FACTORY', {
            event: DELETE_FACTORY,
            message: 'Factory deleted',
            data: { _id: factoryId }
        });

        logger.info({
            description: 'Factory deleted',
            deleted: data,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            message: 'Factory deleted successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Delete factory by id failed',
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
 * Get a specific factory by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _getFactoryByBusinessUnitId(req, res) {
    try {
        let businessUnitId = req.query.businessUnitId;

        let data = await Factory.find({ businessUnitIds: { $in: [businessUnitId] } });

        if (data) {
            return res.status(200).json({
                success: true,
                message: 'Factory fetched successfully',
                data
            });
        } else {
            return res.status(200).json({
                success: false,
                message: 'Factory not found'
            });
        }
    } catch (error) {
        logger.error({
            description: 'Get factory by id failed',
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
    _createFactory,
    _getAllFactories,
    _getFactoryById,
    _updateFactoryById,
    _deleteFactoryById,
    _getFactoryByBusinessUnitId
};
