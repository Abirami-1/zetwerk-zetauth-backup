const logger = require('./logger');
const bcrypt = require('bcrypt');

async function hashPassword({ password, userId }) {

    return new Promise((resolve, reject) => {

        bcrypt.hash(password, 10, function (error, hash) {

            if (error) {
                logger.error({ error, description: 'Hasing password failed: ' + userId });
                return reject(new Error('PASSWORD_HASH_FAILED', { userId }));
            }

            resolve(hash);

        });

    });

}

module.exports = {
    hashPassword
};