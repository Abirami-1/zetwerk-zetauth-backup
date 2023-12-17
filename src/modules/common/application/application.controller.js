const EntityController = require('@zetwerk/zetapp-v2/controllers/EntityController');
const applicationValidator = require('./application.validator');

class ApplicationController extends EntityController {
    constructor() {
        super({ serviceName: 'ApplicationService' });
        this.routePrefix = 'application';
        this.validator = applicationValidator;
    }
}

module.exports = ApplicationController;
