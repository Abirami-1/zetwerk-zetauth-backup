const EntityService = require('@zetwerk/zetapp-v2/services/EntityService');

class ServiceVersionInfoService extends EntityService {
    constructor() {
        super({ modelName: 'serviceVersionInfo' });
        if (ServiceVersionInfoService.instance) {
            return ServiceVersionInfoService.instance;
        }
        ServiceVersionInfoService.instance = this;
    }

    async fetchServiceVersionInfo(reqContext, service) {
        return await this.findOne(reqContext, { service });
    }

    async upsertServiceVersionInfo(reqContext, service, version) {
        return await this.findOneAndUpdate(reqContext, { service }, { service, version }, { upsert: true });
    }
}

module.exports = new ServiceVersionInfoService();
