const DefaultRoutes = require('@zetwerk/zetapp/routes/DefaultRoutes');
const SubBusinessUnitController = new (require('../../../controllers/sub-business-unit'))();
const asyncHandler = require('express-async-handler');

class SubBusinessUnitRoute extends DefaultRoutes {
    constructor() {
        // Need to pass resource name
        super('sub-business-unit');
        this.prefixes = 'sub-bu';
        this.loadRoutes();
    }
    loadRoutes() {
        /**
         * Loaded default routes at end because otherwise,
         * custom routes might clash with the default routes
         */
        this.router.get(
            '/getSubBuByBuId/:buId',
            asyncHandler(SubBusinessUnitController.getSubBusinessUnitByBuId.bind(SubBusinessUnitController))
        );
        this.router.post(
            '/',
            asyncHandler(SubBusinessUnitController.createSubBusinessUnit.bind(SubBusinessUnitController))
        );
        this.router.get(
            '/',
            asyncHandler(SubBusinessUnitController.getSubBusinessUnits.bind(SubBusinessUnitController))
        );
        this.router.get(
            '/get-all-filter',
            asyncHandler(SubBusinessUnitController.getAllValuesOfFilter.bind(SubBusinessUnitController))
        );
        this.router.put(
            '/toggle-visibility',
            asyncHandler(SubBusinessUnitController.toggleSubBusinessUnitVisibility.bind(SubBusinessUnitController))
        );
        this.router.get(
            '/getSubBuBySubBuId/:subBuId',
            asyncHandler(SubBusinessUnitController.getSubBusinessUnitBySubBuId.bind(SubBusinessUnitController))
        );
        this.router.put(
            '/updateSubBuDraft/:subBuId',
            asyncHandler(SubBusinessUnitController.updateSubBuDraft.bind(SubBusinessUnitController))
        );
        this.router.post(
            '/excel-download',
            asyncHandler(SubBusinessUnitController.excelDownload.bind(SubBusinessUnitController))
        );
        super.loadDefaultRoutes();
    }
}

module.exports = SubBusinessUnitRoute;
