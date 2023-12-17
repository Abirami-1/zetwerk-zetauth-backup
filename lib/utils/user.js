const _ = require('lodash');

function isUserRolesEqual(role1, role2) {
    return (
        Array.isArray(role1) &&
        Array.isArray(role2) &&
        role1.length === role2.length &&
        role1.every((val, index) => val.toString() === role2[index].toString())
    );
}

function getNewUserRoles(role1, role2) {
    return _.differenceWith(
        role1.map(id => id.toString()),
        role2.map(id => id.toString()),
        _.isEqual
    );
}

function generateUserPassPhrase() {
    const USER_PASSPHRASE_LENGTH = 8;
    return makeid(USER_PASSPHRASE_LENGTH);
}

function makeid(length, chars=null) {
    const RANDOM_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const characters = chars || RANDOM_CHARS;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

module.exports = {
    isUserRolesEqual,
    generateUserPassPhrase,
    getNewUserRoles
};