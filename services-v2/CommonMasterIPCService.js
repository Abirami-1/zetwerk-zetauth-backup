const AbstractIPCService = require('@zetwerk/zetapp/services/AbstractIPCService');
const config = require('config');

class CommonMasterIPCService extends AbstractIPCService {
    constructor() {
        const ipcUrl = config.has('commonMasters') && config.get('commonMasters.ipcUrl');
        super('commonMaster-ipc', ipcUrl);
    }

    async getMasterConfig() {
        const path = '/master-config';
        const response = await this.httpClient.get(path);
        return response?.data?.data;
    }
}

module.exports = CommonMasterIPCService;