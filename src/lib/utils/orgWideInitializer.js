const orgUnitsJson = require('../../../seeders/orgUnit.json');
const mongoose = require('mongoose');

const createDefaultOrgWide = async (app2) => { const defaultUser = await app2.locals.zetModules.CommonModule.UserService.getSystemUser();
    const orgWideDoc = await app2.locals.zetModules.OrgUnitsModule.OrgUnitsService.findOne(
        { user: defaultUser },
        { unitType: 'orgWide' }
    );
    if (!orgWideDoc) {
        orgUnitsJson.unitId = new mongoose.Types.ObjectId();
        await app2.locals.zetModules.OrgUnitsModule.OrgUnitsService.create({ user: defaultUser }, orgUnitsJson);
    }
};

module.exports = { createDefaultOrgWide };
