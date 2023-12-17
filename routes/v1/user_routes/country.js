const express = require('express');

const router = express.Router();

const countryController = require('../../../controllers/country');

router.get('/countries', countryController._getAllCountries);

router.post('/set-countries-active', countryController._setActiveCountries);

module.exports = router;