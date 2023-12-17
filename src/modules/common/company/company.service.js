const EntityService = require('@zetwerk/zetapp-v2/services/EntityService');

class CompanyService extends EntityService {
    constructor() {
        super({ modelName: 'company' });
        if (CompanyService.instance) {
            return CompanyService.instance;
        }

        CompanyService.instance = this;
    }
}

module.exports = new CompanyService();
