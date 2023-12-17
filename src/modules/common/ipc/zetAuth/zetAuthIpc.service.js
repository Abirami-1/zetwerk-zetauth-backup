const BaseIPCService = require('@zetwerk/zetapp-v2/services/BaseIPCService');

class ZetAuthIPCService extends BaseIPCService {
    constructor() {
        super('zetauth');
        if (ZetAuthIPCService.instance) {
            return ZetAuthIPCService.instance;
        }

        ZetAuthIPCService.instance = this;
    }

    // eslint-disable-next-line no-unused-vars
    async getCompanyBySlug(reqContext, slug) {
        const path = `/company-by-slug/${slug}`;
        const response = await this.httpClient.get(path);
        return response.data.data;
    }
}

module.exports = new ZetAuthIPCService();
