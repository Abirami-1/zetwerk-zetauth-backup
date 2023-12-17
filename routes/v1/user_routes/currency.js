/**
 * Routes for the currency
 */
const express = require('express');
const router = express.Router();

const CurrencyController = require('../../../controllers/currency');

router.post('/currency', CurrencyController._createCurrency);

router.get('/currency', CurrencyController._getAllCurrencies);

router.get('/currency/:currencyId', CurrencyController._getCurrencyById);

router.put('/currency/:currencyId', CurrencyController._updateCurrencyById);

router.delete('/currency/:currencyId', CurrencyController._deleteCurrencyById);

module.exports = router;