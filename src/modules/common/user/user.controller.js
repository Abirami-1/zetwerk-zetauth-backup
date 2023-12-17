const EntityController = require('@zetwerk/zetapp-v2/controllers/EntityController');
class UserController extends EntityController {
    constructor() {
        super({ serviceName: 'UserService' });
        this.routePrefix = 'user';
    }
}

module.exports = UserController;
