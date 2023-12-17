/**
 * Migration script for adding companyId in factory
 * and downstream factory copies as well
 */
const Factory = require('../models/factory');
const Company = require('../models/company');
const db = require('../lib/utils/db');
const confluentKafka = require('../lib/utils/confluent-kafka');
const { UPDATE_FACTORY } = require('../lib/constants/kafka-events');

async function run() {
    try {
        await db.connect(async () => {});
        await confluentKafka.initializeConfluentKafka();
        await confluentKafka.initializeProducer();
        await db.setupHelpers();
        await addCompanyIdInFactory();
        console.log('%c !All factories has been updated', 'background: #222; color: #bada55');
        return;
    } catch (e) {
        console.log('Error in run Block', e);
        throw e;
    }
}

/**
 * Update ZetAuth factories and pass updated data to downstream to respective application.
 * @returns {Promise<void>}
 */
async function addCompanyIdInFactory() {
    try {
        const { _id, slug } = await getCompanyData();
        const factories = await Factory.find({ deleted: false });
        for (let factory of factories) {
            try {
                let factoryData = JSON.parse(JSON.stringify(factory));
                factoryData.company = {
                    companyId: _id,
                    slug
                };
                let updatedFactory = await Factory.updateById(factory._id, factoryData);
                if (updatedFactory) {
                    confluentKafka.sendMessage('ZET-FACTORY', {
                        event: UPDATE_FACTORY,
                        message: 'Factory Updated',
                        data: updatedFactory
                    });
                }
                console.log(
                    `%c !${factory.name} : ${factory._id} has been updated`,
                    'background: #222; color: #bada55'
                );
            } catch (e) {
                console.log('error while updating factory info');
                throw e;
            }
        }
        return;
    } catch (e) {
        console.log('Error in addCompanyIdInFactory Block', e);
        throw e;
    }
}

/**
 * Get Zetwerk Company Information
 * @returns {Promise<*>}
 */

async function getCompanyData() {
    try {
        let data = await Company.findOne({ slug: 'zetwerk', deleted: false });
        return JSON.parse(JSON.stringify(data));
    } catch (e) {
        console.log('Error in get company Data Block', e);
        throw e;
    }
}

run().then(() => {
    console.log('%c !Need to close the connection of db', 'background: #222; color: #bada55');
});
