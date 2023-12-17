const DefaultRoutes = require('@zetwerk/zetapp/routes/DefaultRoutes');
const UserGroupController = new (require('../../../controllers/user-group'))();
const asyncHandler = require('express-async-handler');

class UserGroupRoute extends DefaultRoutes {
    constructor() {
        super('user-group');
        this.prefixes = 'user-group';
        this.loadRoutes();
    }

    loadRoutes() {
        this.router.get('/', asyncHandler(UserGroupController._getUserGroups.bind(UserGroupController)));
        this.router.get('/:userGroupId', asyncHandler(UserGroupController._getUserGroupById.bind(UserGroupController)));
        this.router.post('/create', asyncHandler(UserGroupController._createGroup.bind(UserGroupController)));
        this.router.delete(
            '/delete/:userGroupId',
            asyncHandler(UserGroupController._deleteUserGroup.bind(UserGroupController))
        );
        this.router.put(
            '/update/:userGroupId',
            asyncHandler(UserGroupController._updateUserGroup.bind(UserGroupController))
        );
        super.loadDefaultRoutes();
    }
}

module.exports = UserGroupRoute;
