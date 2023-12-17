const appRegistry = require('@zetwerk/zet-service-registry/app-registry.json');
const ApplicationService = require('../../modules/common/application/application.service');
const UserService = require('../../modules/common/user/user.service');
const syncApplication = async () => {
    const apps = Object.keys(appRegistry);
    const user = await UserService.getSystemUser();
    const reqContext = { user };
    apps?.forEach(async app=> {
        await ApplicationService.findOneAndUpdate(reqContext, { name: app }, { name: app }, { upsert: true });
    });
};

module.exports = syncApplication;