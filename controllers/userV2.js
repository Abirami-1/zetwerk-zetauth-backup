const DefaultController = require('@zetwerk/zetapp/controllers/DefaultController');
class UserController extends DefaultController {
    constructor() {
        super('user');
    }

    async logoutUsersByUserId(req, res) {
        const userIds = req.body.userIds;
        const loggedOutUsersCount = await this.services.UserService.logoutUsersByUserId(userIds);
        res.success({
            message: 'Users have been logged out',
            data: loggedOutUsersCount
        });
    }

    async logoutAllUsers(req, res) {
        const loggedOutUsersCount = await this.services.UserService.logoutAllUsers(req?.body?.userType);
        res.success({
            message: 'All users have been logged out',
            data: loggedOutUsersCount
        });
    }

    async updateUsersByUserId(req, res) {
        const userIds = req?.body?.userIds;
        const updateObj = req?.body?.updateObj;
        if (!userIds || !updateObj) {
            throw new Error('userIds and updateObj is required!');
        }
        const updatedUsers = await this.services.UserService.updateUsersByUserId({ userIds, updateObj });
        res.success({
            message: 'Users have been logged out',
            data: updatedUsers
        });
    }
}

module.exports = UserController;
