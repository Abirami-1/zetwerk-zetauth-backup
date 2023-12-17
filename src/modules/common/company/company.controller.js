const EntityController = require('@zetwerk/zetapp-v2/controllers/EntityController');
const companyValidator = require('./company.validator');

class CompanyController extends EntityController {
    constructor() {
        super({ serviceName: 'CompanyService' });
        this.routePrefix = 'company';
        this.validator = companyValidator;
    }
}

module.exports = CompanyController;
