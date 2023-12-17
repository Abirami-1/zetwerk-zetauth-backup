const logger = require('../lib/utils/logger');
const Application = require('../models/application');
const confluentKafka = require('../lib/utils/confluent-kafka');
const { CREATE_APP, UPDATE_APP, DELETE_APP } = require('../lib/constants/kafka-events');

async function _createApp(req, res) {
    try {

        let appData = req.body;
        let app = await Application.create(appData);
        confluentKafka.sendMessage('ZET-USER', {
            event: CREATE_APP, 
            message: 'New App created', 
            data: app
        });
        logger.info({
            description: 'Application created',
            app,
            user: req.user
        });

        return res.status(201).json({
            success: true,
            message: 'Application is created successfully',
            data: app
        });

    } catch (error) {
        logger.error({
            description: 'Create application failed',
            error,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            message: error.errmsg || error.errors
        });
    }

}

async function _updateAppById(req, res) {
    try {

        let appData = req.body;
        let appId = req.params.appId;

        let app = await Application.updateById(appId, appData);

        confluentKafka.sendMessage('ZET-USER', {
            event: UPDATE_APP, 
            message: 'App details Updated', 
            data: app
        });

        logger.info({
            description: 'Application updated',
            app,
            user: req.user
        });

        return res.status(201).json({
            success: true,
            message: 'Application is updated successfully',
            data: app
        });

    } catch (error) {
        logger.error({
            description: 'Update application failed',
            error,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            message: error.errmsg || error.errors
        });
    }

}

async function _getAppById(req, res) {
    try {

        let appId = req.params.appId;

        let app = await Application.findById(appId);

        return res.status(201).json({
            success: true,
            message: 'Application is fetched successfully',
            data: app
        });

    } catch (error) {
        logger.error({
            description: 'Get application failed',
            error,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            message: error.errmsg || error.errors
        });
    }

}

async function _deleteAppById(req, res) {
    try {

        let appId = req.params.appId;

        let app = await Application.findOneAndDelete({
            _id: appId
        });
        confluentKafka.sendMessage('ZET-USER', {
            event: DELETE_APP, 
            message: 'App deleted', 
            data: {_id: appId}
        });

        logger.info({
            description: 'Application deleted',
            app,
            user: req.user
        });

        return res.status(201).json({
            success: true,
            message: 'Application is deleted successfully',
            data: app
        });

    } catch (error) {
        logger.error({
            description: 'Delete application failed',
            error,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            message: error.errmsg || error.errors
        });
    }

}

async function _getAllApps(req, res) {
    try {

        let apps = await Application.find().sort({name: 1});

        return res.status(201).json({
            success: true,
            message: 'Applications are fetched successfully',
            data: apps
        });

    } catch (error) {
        logger.error({
            description: 'Fetch applications failed',
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
    _createApp,
    _updateAppById,
    _getAppById,
    _deleteAppById,
    _getAllApps
};