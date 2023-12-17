const DefaultRoutes = require('@zetwerk/zetapp/routes/DefaultRoutes');
const SegmentController = new (require('../../../controllers/segment'))();
const asyncHandler = require('express-async-handler');

class SegmentRoute extends DefaultRoutes {
    constructor() {
        // Need to pass resource name
        super('segment');
        this.prefixes = 'segment';
        this.loadRoutes();
    }
    loadRoutes() {
        /**
         * Loaded default routes at end because otherwise,
         * custom routes might clash with the default routes
         */
        this.router.get(
            '/getSegmentByQuery',
            asyncHandler(SegmentController.getSegmentByQuery.bind(SegmentController))
        );
        this.router.post('/', asyncHandler(SegmentController.createSegment.bind(SegmentController)));
        this.router.get('/', asyncHandler(SegmentController.getSegments.bind(SegmentController)));
        this.router.put('/:segmentId', asyncHandler(SegmentController.addCompanyToSegment.bind(SegmentController)));
        this.router.get(
            '/get-all-filter',
            asyncHandler(SegmentController.getAllValuesOfFilter.bind(SegmentController))
        );
        super.loadDefaultRoutes();
    }
}

module.exports = SegmentRoute;
