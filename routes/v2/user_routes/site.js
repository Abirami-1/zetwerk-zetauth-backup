const DefaultRoutes = require('@zetwerk/zetapp/routes/DefaultRoutes');
const SiteController = new (require('../../../controllers/site'))();
const asyncHandler = require('express-async-handler');

class SiteRoute extends DefaultRoutes {
    constructor() {
        super('site');
        this.prefixes = 'site';
        this.loadRoutes();
    }

    loadRoutes() {
        this.router.get('/', asyncHandler(SiteController.getSitesByQuery.bind(SiteController)));
        this.router.post('/excel-upload', asyncHandler(SiteController.excelUpload.bind(SiteController)));
        this.router.post('/excel-download', asyncHandler(SiteController.excelDownload.bind(SiteController)));
        super.loadDefaultRoutes();
    }
}

module.exports = SiteRoute;
