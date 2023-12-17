const EntityController = require('@zetwerk/zetapp-v2/controllers/EntityController');
const roleV2Validator = require('./roleV2.validator');

class RoleV2Controller extends EntityController {
    constructor() {
        super({ serviceName: 'RoleV2Service' });
        this.routePrefix = 'role-v2';
        this.validator = roleV2Validator;
    }
}

module.exports = RoleV2Controller;
