/**
 * Routes for the factory
 */
const express = require('express');
const router = express.Router();

const FactoryController = require('../../../controllers/factory');

router.post('/factory', FactoryController._createFactory);

router.get('/factory', FactoryController._getAllFactories);

router.get('/factory/getFactoryByBusinessId', FactoryController._getFactoryByBusinessUnitId);

router.get('/factory/:factoryId', FactoryController._getFactoryById);

router.put('/factory/:factoryId', FactoryController._updateFactoryById);

router.delete('/factory/:factoryId', FactoryController._deleteFactoryById);

module.exports = router;
