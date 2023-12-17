/**
 * Controller for currency exchange rate
 */
const logger = require('../lib/utils/logger');
const CurrencyExchangeRate = require('../models/currency-exchange-rate');
const confluentKafka = require('../lib/utils/confluent-kafka');
const {
    CREATE_CURRENCY_EXCHANGE_RATE,
    UPDATE_CURRENCY_EXCHANGE_RATE,
    DELETE_CURRENCY_EXCHANGE_RATE
} = require('../lib/constants/kafka-events');
const FIELDS_TO_POPULATE = [
    'fromCurrencyDetails',
    'toCurrencyDetails',
];

/**
 * Create a new currency-exchange-rate
 * @param {*} req request object
 * @param {*} res response
 */
async function _createCurrencyExchangeRate(req, res) {
    try {
        let payload = req.body;
        let data = await CurrencyExchangeRate.create(payload);
        confluentKafka.sendMessage('ZET-USER', {
            event: CREATE_CURRENCY_EXCHANGE_RATE,
            message: 'New currency exchange rate created',
            data
        });
        logger.info({
            description: 'Currency Exchange Rate created',
            data,
            user: req.user
        });

        return res.status(201).json({
            success: true,
            message: 'Currency Exchange Rate has been created successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Create currency exchange rate failed',
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
async function _getAllCurrencyExchangeRates(req, res) {
    try {

        let conditions = {
            deleted: false 
        };

        let data = await CurrencyExchangeRate.find(conditions).sort({ name: 1 }).populate(FIELDS_TO_POPULATE);

        return res.status(200).json({
            success: true,
            message: 'Currency Exchange Rates fetched successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Fetch all currency exchange rates failed',
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
 * Get a specific currency exchange rate by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _getCurrencyExchangeRateById(req, res) {
    try {
        let currencyExchangeRateId = req.params.currencyExchangeRateId;

        let data = await CurrencyExchangeRate.findById(currencyExchangeRateId, FIELDS_TO_POPULATE);

        if (data) {
            return res.status(200).json({
                success: true,
                message: 'Currency Exchange Rate fetched successfully',
                data
            });
        } else {
            return res.status(200).json({
                success: false,
                message: 'Currency Exchange Rate not found'
            });
        }
    } catch (error) {
        logger.error({
            description: 'Get currency exchange rate by id failed',
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
 * Update a specific currency exchange rate by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _updateCurrencyExchangeRateById(req, res) {
    try {
        let payload = req.body;
        let currencyExchangeRateId = req.params.currencyExchangeRateId;

        let data = await CurrencyExchangeRate.updateById(currencyExchangeRateId, payload);

        confluentKafka.sendMessage('ZET-USER', {
            event: UPDATE_CURRENCY_EXCHANGE_RATE,
            message: 'Currency Exchange Rate updated',
            data
        });

        logger.info({
            description: 'Currency Exchange Rate updated',
            data,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            message: 'Currency Exchange Rate updated successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Update currency exchange rate failed',
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
 * Delete a specific currency exchange rate by id
 * @param {*} req request object
 * @param {*} res response
 */
async function _deleteCurrencyExchangeRateById(req, res) {
    try {
        let currencyExchangeRateId = req.params.currencyExchangeRateId;

        let data = await CurrencyExchangeRate.deleteById(currencyExchangeRateId);
        confluentKafka.sendMessage('ZET-USER', {
            event: DELETE_CURRENCY_EXCHANGE_RATE,
            message: 'CurrencyExchangeRate deleted',
            data: { _id: currencyExchangeRateId }
        });

        logger.info({
            description: 'Currency Exchange Rate deleted',
            deleted: data,
            user: req.user
        });

        return res.status(200).json({
            success: true,
            message: 'Currency Exchange Rate deleted successfully',
            data
        });
    } catch (error) {
        logger.error({
            description: 'Delete currency exchange rate by id failed',
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
    _createCurrencyExchangeRate,
    _getAllCurrencyExchangeRates,
    _getCurrencyExchangeRateById,
    _updateCurrencyExchangeRateById,
    _deleteCurrencyExchangeRateById
};
