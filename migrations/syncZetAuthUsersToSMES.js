/**
 *  Migration script to sync users between Zetauth and SMES
 */
const mongoose = require('mongoose');
const config = require('config');
const ObjectId = mongoose.Types.ObjectId;


const states = [
    'Andaman and Nicobar Islands',
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chandigarh',
    'Chhattisgarh',
    'Dadra and Nagar Haveli',
    'Daman and Diu',
    'Delhi',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jammu and Kashmir',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Lakshadweep',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Orissa',
    'Pondicherry',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamilnadu',
    'Telangana',
    'Tripura',
    'Uttaranchal',
    'Uttar Pradesh',
    'West Bengal'
];

const wrongStates = {
    Orissa: 'Odisha',
    Pondicherry: 'Puducherry',
    Tamilnadu: 'Tamil Nadu'
};

async function run() {
    try {
        /** ZetAuth DB URL */
        const zetAuthDBUrl =
            config.has('db.isCluster') && config.get('db.isCluster') ?
                'mongodb+srv://' +
                config.get('db.username') +
                ':' +
                config.get('db.password') +
                '@' +
                config.get('db.host') +
                '/' +
                config.get('db.name') +
                '?retryWrites=true&w=majority' :
                'mongodb://' +
                config.get('db.host') +
                ':' +
                config.get('db.port') +
                '/' +
                config.get('db.name');

        /** SMES DB URL */
        const smeDBUrl =
            config.has('dbSMES.isCluster') && config.get('dbSMES.isCluster') ?
                'mongodb+srv://' +
                config.get('dbSMES.username') +
                ':' +
                config.get('dbSMES.password') +
                '@' +
                config.get('dbSMES.host') +
                '/' +
                config.get('dbSMES.name') +
                '?retryWrites=true&w=majority' :
                'mongodb://' +
                config.get('dbSMES.host') +
                ':' +
                config.get('dbSMES.port') +
                '/' +
                config.get('dbSMES.name');

        console.log(smeDBUrl, zetAuthDBUrl);

        const smesConn = mongoose.createConnection(smeDBUrl).asPromise();
        const zetAuthConn = mongoose.createConnection(zetAuthDBUrl).asPromise();
        await createAndSyncZetauthUsersInSMES(zetAuthConn, smesConn, (createdCount, updatedCount, deletedCount) => {
            console.log({ createdUsers: createdCount, updatedUsers: updatedCount, deletedUsers: deletedCount });
            console.log('Migration Complete. Press Ctrl-C to exit');
        });

    } catch (error) {
        console.log('Migration Failed with error.', error, ' Press Ctrl-C to exit');
    }
}

async function createAndSyncZetauthUsersInSMES(zetAuthConn, smesConn, cb) {
    try {
        /**
         * Get all zetauth user
         */
        const allUsers = await zetAuthConn.collection('users').aggregate([
            {
                $lookup: {
                    from: 'roles',
                    localField: 'roleId',
                    foreignField: '_id',
                    as: 'roleDetails'
                }
            }, {
                $addFields: {
                    roleDetailsArr: {
                        $map: {
                            input: '$roleDetails',
                            as: 'ele',
                            in: '$$ele.name'
                        }
                    }
                }
            }
        ]);

        const allUsersArr = await allUsers.toArray();
        let createdUsers = 0;
        let updatedUsers = 0;
        let deletedUsers = 0;

        const promiseArr = allUsersArr.map((user) => new Promise(resolve => {
            /**
             * Check if the user is actually a supplier
             */
            if (user.supplierId || user.roleDetailsArr.includes('SUPPLIER')) {
                deleteUser(smesConn, user.email).then(result => {
                    console.log('User Deleted', { matched: result.lastErrorObject.n, ok: result.ok, value: user.email });
                    if (result.lastErrorObject.n && result.ok) {
                        ++deletedUsers;
                    }
                    resolve();
                });
            } else {
                /**
                 * Check if user exists in SMES USERS or not 
                 * If Yes, then update the reference id with zetauth user id
                 * IF NO, create the new user in SMES
                 */
                smesConn.collection('users').find({ email: user.email }).toArray().then(smeUser => {
                    if (!smeUser.length) {
                        createNewUserInSMES(smesConn, user).then(result => {
                            console.log('New User Created', { ...result.result, email: user.email });
                            ++createdUsers;
                            resolve();
                        });
                    } else {
                        updateReferenceIdForExistingUsersInSMES(smesConn, smeUser[0], user._id).then(result => {
                            console.log('User Updated', { ok: result.ok, email: result.value.email, referenceId: result.value.referenceId });
                            ++updatedUsers;
                            resolve();
                        });
                    }
                });
            }
        }));


        await Promise.all(promiseArr);
        /**
         * Run Callback when migration completed
         */
        cb(createdUsers, updatedUsers, deletedUsers);

    } catch (error) {
        console.log('Error at Sync User', error);
    }
}

/**
 * 
 * @param {*} smesConn => SMES DB CONNECTION
 * @param {*} userData => User to be created
 * Creates a new user in SMES if the user is not supplier and 
 * not already present in SMES
 */
async function createNewUserInSMES(smesConn, userData) {

    const newSMESUser = {
        phone: userData.phoneNumber,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        isActive: userData.isActive,
        deleted: userData.deleted,
        states,
        referenceId: userData._id
    };


    if (userData.createdBy) {
        newSMESUser['createdBy'] = userData.createdBy;
    }

    if (userData.updatedBy) {
        newSMESUser['updatedBy'] = userData.updatedBy;
    }

    if (userData.createdAt) {
        newSMESUser['createdAt'] = userData.createdAt;
    }

    if (userData.updatedAt) {
        newSMESUser['updatedAt'] = userData.updatedAt;
    }

    const createdUser = await smesConn.collection('users').insertOne(newSMESUser);
    return createdUser;
}

/**
 * 
 * @param {*} smesConn => SMES DB CONNECTION
 * @param {*} userId => User id in SMES USER COLLECTION
 * @param {*} referenceId => User id in ZETAUTH USER COLLECTION
 * ADD/UPDATE referenceId of the user with the ZETAUTH USER ID
 */
async function updateReferenceIdForExistingUsersInSMES(smesConn, user, referenceId) {
    if (user.states) {
        let states = user.states;

        for (let i = 0; i < states.length; i++) {
            if (Object.keys(wrongStates).includes(states[i])) {
                states[i] = wrongStates[`${states[i]}`];
            }
        }
        user.states = states;
    }
    return await smesConn.collection('users').findOneAndUpdate({ _id: ObjectId(user._id) }, { $set: { referenceId, states: user.states } });

}

/**
 * 
 * @param {*} smesConn => SMES DB CONNECTION
 * @param {*} email => email of the user for checking if it exists in SMES
 * Delete User from SMES USER COLLECTION that is actually a supplier and 
 * has a supplier ID field against it in ZETAUTH USER COLLECTION
 */
async function deleteUser(smesConn, email) {
    return await smesConn.collection('users').findOneAndDelete({ email });
}

run();