const DefaultRoutes = require('@zetwerk/zetapp/routes/DefaultRoutes');
const UserController = new (require('../../../controllers/userV2'))();
const asyncHandler = require('express-async-handler');

class UserRoute extends DefaultRoutes {
    constructor() {
        super('user');
        this.prefixes = 'user';
        this.loadRoutes();
    }
    loadRoutes() {
        this.router.post('/logoutUsersById', asyncHandler(UserController.logoutUsersByUserId.bind(UserController)));
        this.router.post('/updateUsersById', asyncHandler(UserController.updateUsersByUserId.bind(UserController)));
        this.router.post('/logoutAllUsers', asyncHandler(UserController.logoutAllUsers.bind(UserController)));

        super.loadDefaultRoutes();
    }
}

module.exports = UserRoute;
