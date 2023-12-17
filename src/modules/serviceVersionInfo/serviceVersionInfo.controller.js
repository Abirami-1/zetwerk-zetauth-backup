const EntityController = require('@zetwerk/zetapp-v2/controllers/EntityController');
const serviceEntityActionValidator = require('./serviceVersionInfo.validator');

class ServiceEntityActionController extends EntityController {
    constructor() {
        super({ serviceName: 'ServiceVersionInfoService' });
        this.routePrefix = 'service-version-info';
        this.validator = serviceEntityActionValidator;
        this.loadRoutes();
    }
}

module.exports = ServiceEntityActionController;
