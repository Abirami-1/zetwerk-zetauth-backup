const DefaultRoutes = require('@zetwerk/zetapp/routes/DefaultRoutes');
const BusinessUnitController = new (require('../../../controllers/business-unit'))();
const asyncHandler = require('express-async-handler');

class BusinessUnitRoute extends DefaultRoutes {
    constructor() {
        // Need to pass resource name
        super('business-unit');
        this.prefixes = 'business-unitV2';
        this.loadRoutes();
    }
    loadRoutes() {
        /**
         * Loaded default routes at end because otherwise,
         * custom routes might clash with the default routes
         */
        this.router.get(
            '/',
            asyncHandler(BusinessUnitController.getPaginatedBusinessUnits.bind(BusinessUnitController))
        );
        this.router.post('/', asyncHandler(BusinessUnitController.createBusinessUnit.bind(BusinessUnitController)));
        this.router.put(
            '/:businessUnitId',
            asyncHandler(BusinessUnitController._updateBusinessUnitById.bind(BusinessUnitController))
        );
        this.router.get(
            '/get-all-filter',
            asyncHandler(BusinessUnitController.getAllValuesOfFilter.bind(BusinessUnitController))
        );
        this.router.patch(
            '/:buId/toggle-visibility',
            asyncHandler(BusinessUnitController.toggleBusinessUnitVisibility.bind(BusinessUnitController))
        );
        this.router.post(
            '/excel-download',
            asyncHandler(BusinessUnitController.excelDownload.bind(BusinessUnitController))
        );
        super.loadDefaultRoutes();
    }
}

module.exports = BusinessUnitRoute;
