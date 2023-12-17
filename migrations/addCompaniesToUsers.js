/**
 * Migration script for migration for company id in user
 * and downstream user copies as well
 * Date- 16 Sep 2020
 */
const Users = require('../models/user');
const Company = require('../models/company');
const db = require('../lib/utils/db');
const confluentKafka = require('../lib/utils/confluent-kafka');
const { UPDATE_USER } = require('../lib/constants/kafka-events');

async function  run() {
    try {
        await db.connect(async () => {});
        await confluentKafka.initializeConfluentKafka();
        await confluentKafka.initializeProducer();
        await db.setupHelpers();
        await updateCompaniesInAllUsersAndCopiesUserDownstream();
        console.log('\x1b[36m%s\x1b[0m', 'All User has been Updated');
        // await db.close();
        return;
    } catch (e) {
        console.log('Error in run Block', e);
        throw e;
    }
}

/**
 * Update ZetAuth user companies and pass same user data to downstream to respective application.
 * @param
 * @returns {Promise<void>}
 */
async function updateCompaniesInAllUsersAndCopiesUserDownstream() {
    try {
        let count = 0;
        const {_id, slug} = await getCompanyData();
        let centralAuthUserDocs = await Users.find({deleted:false});
        for (let user of centralAuthUserDocs) {
            const companies = [];
            companies.push({ companyId: _id, slug });
            let userData = JSON.parse(JSON.stringify(user));
            userData.companies = companies;

            try {
                let updatedUser = await Users.updateById(user._id, userData);
                count++;
                if (updatedUser) {
                    confluentKafka.sendMessage('ZET-USER', {
                        event: UPDATE_USER,
                        message: 'User Updated',
                        data: updatedUser
                    });
                }
                console.log('\x1b[33m%s\x1b[0m', `${user.firstName} ${user.lastName} has been updated`);
            } catch (e) {
                console.log('error while updating user info');
                throw e;
            }
        }
        console.log('\x1b[36m%s\x1b[0m', `${count} number of user got updated`);
        return;
    } catch (e) {
        console.log('Error in updateCompaniesInAllUsersAndCopiesUserDownstream Block', e);
        throw  e;
    }

}

/**
 * Get Zetwerk Company Information
 * @param
 * @returns {Promise<*>}
 */

async function getCompanyData() {
    try {
        let centralAuthCompanyDoc = await Company.findOne({slug: 'zetwerk', deleted:false});
        return JSON.parse(JSON.stringify(centralAuthCompanyDoc));
    } catch (e) {
        console.log('Error in get company Data Block', e);
        throw  e;
    }
}

run().then(() => {
    console.log('Done');
});
