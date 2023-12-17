const DefaultRoutes = require('@zetwerk/zetapp/routes/DefaultRoutes');
const WarehouseErpController = new (require('../../../controllers/warehouse-erp'))();
const asyncHandler = require('express-async-handler');

class WarehouseErpRoute extends DefaultRoutes {
    constructor() {
        // Need to pass resource name
        super('warehouse-erp');
        this.prefixes = 'warehouse-erp';
        this.loadRoutes();
    }
    loadRoutes() {
        this.router.get('/', asyncHandler(WarehouseErpController.getWareHousesErpByQuery.bind(WarehouseErpController)));
        this.router.post('/excel-upload', asyncHandler(WarehouseErpController.excelUpload.bind(WarehouseErpController)));
        this.router.post('/excel-download', asyncHandler(WarehouseErpController.excelDownload.bind(WarehouseErpController)));
        /**
         * Loaded default routes at end because otherwise,
         * custom routes might clash with the default routes
         */
        super.loadDefaultRoutes();
    }
}

module.exports = WarehouseErpRoute;
