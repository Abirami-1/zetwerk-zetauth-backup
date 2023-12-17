const DefaultRoutes = require('@zetwerk/zetapp/routes/DefaultRoutes');
const RegionController = new (require('../../../controllers/region'))();
const asyncHandler = require('express-async-handler');

class RegionRoute extends DefaultRoutes {
    constructor() {
    // Need to pass resource name
        super('region');
        this.prefixes = 'region';
        this.loadRoutes();
    }
    loadRoutes() {
    /**
     * Loaded default routes at end because otherwise,
     * custom routes might clash with the default routes
     */
        this.router.get('/getRegionBySubBuId/:businessUnitId', asyncHandler(RegionController.getRegionByBuId.bind(RegionController)));
        this.router.get('/', asyncHandler(RegionController.getRegions.bind(RegionController)));
        this.router.post('/', asyncHandler(RegionController.createRegion.bind(RegionController)));
        this.router.get('/get-all-filter', asyncHandler(RegionController.getAllValuesOfFilter.bind(RegionController)));
        super.loadDefaultRoutes();
    }
}

module.exports = RegionRoute;
