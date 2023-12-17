/**
 * Routes for the business units
 */
const express = require('express');
const router = express.Router();

const BusinessUnitController = new (require('../../../controllers/business-unit'))();

router.post('/business-unit', BusinessUnitController._createBusinessUnit);

router.get('/business-unit', BusinessUnitController._getAllBusinessUnits);

router.get('/business-unit/getBusinessUnitByQuery', BusinessUnitController._getBusinessUnitByQueryParams);

router.get('/business-unit/:businessUnitId', BusinessUnitController._getBusinessUnitById);

router.put('/business-unit/:businessUnitId', BusinessUnitController._updateBusinessUnitById);

router.delete('/business-unit/:businessUnitId', BusinessUnitController._deleteBusinessUnitById);

module.exports = router;
