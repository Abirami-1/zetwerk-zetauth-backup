const EntityService = require('@zetwerk/zetapp-v2/services/EntityService');

class ApplicationService extends EntityService {
    constructor() {
        super({ modelName: 'application' });
        if (ApplicationService.instance) {
            return ApplicationService.instance;
        }

        ApplicationService.instance = this;
    }
}

module.exports = new ApplicationService();
