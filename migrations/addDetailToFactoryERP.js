const db = require('../lib/utils/db');
const FactoryErp = require('../models/factory-erp');
const Factory = require('../models/factory');
const { readDataFromS3PublicUrl } = require('../lib/utils/readExcel');
const confluentKafka = require('../lib/utils/confluent-kafka');
const { UPDATE_FACTORY } = require('../lib/constants/kafka-events');
const minimist = require('minimist');
async function run() {
    await db.connect(async () => { }).catch(error => console.log(error));
    console.log('script started .......');
    await addDetailsToERPFactories();
    await addUniqueCodeToFactories();
    console.log('script ended ....');
}
async function addDetailsToERPFactories() {
    try {
        const parsedArgs = minimist(process.argv.slice(2));
        if (!parsedArgs.s3Url) {
            throw new Error('Pass S3 File URL to process users data');
        }
        const s3Url = parsedArgs.s3Url;
        const parsedFactoryData = await readDataFromS3PublicUrl(s3Url);
        for (let factory of parsedFactoryData) {
            if (!factory['FD Factory']) {
                continue;
            }
            await FactoryErp.findOneAndUpdate({ name: factory['FD Factory'] }, { $set: { state: factory['ZW state'] } });
            console.log(`State Added in Factory FD ${factory['FD Factory']} `);

        }
    } catch (err) {
        console.log({
            description: 'Error In add factory gst and state to factory',
            err
        });
    }

}
async function addUniqueCodeToFactories() {
    await confluentKafka.initializeConfluentKafka();
    await confluentKafka.initializeProducer();
    try {
        const parsedArgs = minimist(process.argv.slice(2));
        if (!parsedArgs.s3Url) {
            throw new Error('Pass S3 File URL to process users data');
        }
        const s3Url = parsedArgs.s3Url;
        const parsedFactoryData = await readDataFromS3PublicUrl(s3Url);
        for (let factory of parsedFactoryData) {
            if (factory['FD Factory'] && factory['Old Factory']) {
                const factoryErp = await FactoryErp.findOne({ name: factory['FD Factory'] });
                const factoryOld = await Factory.findOne({ name: factory['Old Factory'] });
                if (!factoryOld || !factoryErp) {
                    continue;
                }
                factoryOld.uniqueCode = factoryErp.uniqueCode;
                await factoryOld.save();
                await confluentKafka.sendMessage('ZET-FACTORY', {
                    event: UPDATE_FACTORY,
                    message: 'Factory updated',
                    data: factoryOld
                });
                console.log(`${factory['FD Factory']} FD Linked to ${factoryOld.name}`);
            }

        }
    } catch (err) {
        console.log({
            description: 'Error In add factory gst and state to factory',
            err
        });
    }

}
run().catch(console.log).finally(process.exit);

//node migrations/addDetailToFactoryERP.js --s3Url https://zetwerk-oms.s3.amazonaws.com/5ec7872eb0f419707f53d9f8/November%2014th%202022%2C%204%3A22%3A11%20am/Factory%20State%20%281%29.xlsx