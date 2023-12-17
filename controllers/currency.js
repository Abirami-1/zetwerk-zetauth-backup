/**
 * Controller for currency
 */
const logger = require('../lib/utils/logger');
const Currency = require('../models/currency');
const confluentKafka = require('../lib/utils/confluent-kafka');
const {
    CREATE_CURRENCY,
    UPDATE_CURRENCY,
    DELETE_CURRENCY
} = require('../lib/constants/kafka-events');
const FIELDS_TO_POPULATE = [
    'exchangeRateDetails',
];

/**
 * Create a new currency
 * @param {*} req request object
 * @param {*} res response
 */
async function _createCurrency(req, res) {
    try {
        let payload = req.body;
        let data = await Currency.create(payload);
        confluentKafka.sendMessage('ZET-USER', {
            event: CREATE_CURRENCY,
            message: 'New currency created',
            data
        });
        logger.info({
            description: 'Currency created',
            data,
            user: req.user
        });

        return res.status(201).json({
            success: true,
            message: 'Currency has been created successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Create currency failed',
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
async function _getAllCurrencies(req, res) {
    try {

        let conditions = {
            deleted: false 
        };

        let data = await Currency.find(conditions).sort({ name: 1 }).populate(FIELDS_TO_POPULATE);

        return res.status(200).json({
            success: true,
            message: 'Currencies fetched successfully',
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
 * Get a specific currency by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _getCurrencyById(req, res) {
    try {
        let currencyId = req.params.currencyId;

        let data = await Currency.findById(currencyId, FIELDS_TO_POPULATE);

        if (data) {
            return res.status(200).json({
                success: true,
                message: 'Currency fetched successfully',
                data
            });
        } else {
            return res.status(200).json({
                success: false,
                message: 'Currency not found'
            });
        }
    } catch (error) {
        logger.error({
            description: 'Get currency by id failed',
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
 * Update a specific currency by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _updateCurrencyById(req, res) {
    try {
        let payload = req.body;
        let currencyId = req.params.currencyId;

        let data = await Currency.updateById(currencyId, payload);

        confluentKafka.sendMessage('ZET-USER', {
            event: UPDATE_CURRENCY,
            message: 'Currency updated',
            data
        });

        logger.info({
            description: 'Currency updated',
            data,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            message: 'Currency updated successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Update currency failed',
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
 * Delete a specific currency by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _deleteCurrencyById(req, res) {
    try {
        let currencyId = req.params.currencyId;

        let data = await Currency.deleteById(currencyId);
        confluentKafka.sendMessage('ZET-USER', {
            event: DELETE_CURRENCY,
            message: 'Currency deleted',
            data: { _id: currencyId }
        });

        logger.info({
            description: 'Currency deleted',
            deleted: data,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            message: 'Currency deleted successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Delete currency by id failed',
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
    _createCurrency,
    _getAllCurrencies,
    _getCurrencyById,
    _updateCurrencyById,
    _deleteCurrencyById
};
