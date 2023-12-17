const userService = require('../services/user');

async function _fakeAuth(req, res, next) {
    let user = await userService.findUserByEmail('admin@zetwerk.com');
    req.user = user;
    next();
}
module.exports = {
    _fakeAuth
};