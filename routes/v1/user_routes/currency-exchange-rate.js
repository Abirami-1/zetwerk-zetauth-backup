/**
 * Routes for the currency
 */
const express = require('express');
const router = express.Router();

const CurrencyExchangeRateController = require('../../../controllers/currency-exchange-rate');

router.post('/currency-exchange-rate', CurrencyExchangeRateController._createCurrencyExchangeRate);

router.get('/currency-exchange-rate', CurrencyExchangeRateController._getAllCurrencyExchangeRates);

router.get('/currency-exchange-rate/:currencyExchangeRateId', CurrencyExchangeRateController._getCurrencyExchangeRateById);

router.put('/currency-exchange-rate/:currencyExchangeRateId', CurrencyExchangeRateController._updateCurrencyExchangeRateById);

router.delete('/currency-exchange-rate/:currencyExchangeRateId', CurrencyExchangeRateController._deleteCurrencyExchangeRateById);

module.exports = router;