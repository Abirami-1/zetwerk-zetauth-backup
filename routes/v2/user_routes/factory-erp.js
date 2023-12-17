const DefaultRoutes = require('@zetwerk/zetapp/routes/DefaultRoutes');
const asyncHandler = require('express-async-handler');
const FactoryErpController = new (require('../../../controllers/factory-erp'))();

class FactoryErpRoute extends DefaultRoutes {
    constructor() {
        // Need to pass resource name
        super('factory-erp');
        this.prefixes = 'factory-erp';
        this.loadRoutes();
    }
    loadRoutes() {
        /**
         * Loaded default routes at end because otherwise,
         * custom routes might clash with the default routes
         */
        this.router.get('/V2', asyncHandler(FactoryErpController.fetchAllResources.bind(FactoryErpController)));
        this.router.post('/V2', asyncHandler(FactoryErpController.createFactory.bind(FactoryErpController)));
        this.router.get(
            '/getFactoryErpByQuery',
            asyncHandler(FactoryErpController.getFactoryErpByQuery.bind(FactoryErpController))
        );
        this.router.get(
            '/:factoryId',
            asyncHandler(FactoryErpController.getFactoryErpById.bind(FactoryErpController))
        );
        this.router.get(
            '/V2/get-all-filter',
            asyncHandler(FactoryErpController.getAllValuesOfFilter.bind(FactoryErpController))
        );

        super.loadDefaultRoutes();
    }
}

module.exports = FactoryErpRoute;
