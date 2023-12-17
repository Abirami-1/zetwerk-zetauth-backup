const express = require('express');
const router = express.Router();

const WarehouseController = require('../../../controllers/warehouse');

const warehouseController = new WarehouseController();

router.post('/warehouse', warehouseController.createWarehouse);
router.get('/warehouse', warehouseController.getWarehouses);
router.get('/warehouse/:warehouseId', warehouseController.getWarehouseById);
router.put('/warehouse/:warehouseId', warehouseController.updateWarehouseById);
router.delete('/warehouse/:warehouseId', warehouseController._deleteWarehouseById);
router.put('/warehouse/:warehouseId/active', warehouseController._makeWarehouseActive);
router.put('/warehouse/:warehouseId/in-active', warehouseController._makeWarehouseInActive);


module.exports = router;
