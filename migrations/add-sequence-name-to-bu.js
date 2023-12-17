const db = require('../lib/utils/db');
const confluentKafka = require('../lib/utils/confluent-kafka');
const BusinessUnit = require('../models/business-unit');
const { UPDATE_BUSINESS_UNIT } = require('../lib/constants/kafka-events');

async function run() {
    await db.connect(async () => {});
    await confluentKafka.initializeConfluentKafka();
    await confluentKafka.initializeProducer();
    await db.setupHelpers();
    await addSequenceNameInBusinessUnit();
    console.log('%c !Done', 'background: #222; color: #bada55');
    process.exit();
}

async function addSequenceNameInBusinessUnit() {
    let businessUnits = await BusinessUnit.find({});
    for (let businessUnit of businessUnits) {
        let sequenceName;
        if (businessUnit.name === 'General Fabrication') {
            sequenceName = 'GB';
        } else if (businessUnit.name === 'Scaffolding') {
            sequenceName = 'SF';
        } else if (businessUnit.name === 'Railways') {
            sequenceName = 'RA';
        } else if (businessUnit.name === 'Onsite') {
            sequenceName = 'OS';
        } else if (businessUnit.name === 'US/Machining') {
            sequenceName = 'UM';
        } else if (businessUnit.name === 'Water') {
            sequenceName = 'WR';
        } else if (businessUnit.name === 'Boiler') {
            sequenceName = 'BO';
        } else if (businessUnit.name === 'Material Handling Devices') {
            sequenceName = 'MD';
        } else if (businessUnit.name === 'Healthcare') {
            sequenceName = 'HC';
        } else if (businessUnit.name === 'Oil and Gas') {
            sequenceName = 'OG';
        } else if (businessUnit.name === 'Ecosystem') {
            sequenceName = 'EC';
        } else if (businessUnit.name === 'Transmission & Distribution') {
            sequenceName = 'TD';
        } else if (businessUnit.name === 'Consumer Goods') {
            sequenceName = 'CG';
        } else if (businessUnit.name === 'Apparel') {
            sequenceName = 'AP';
        } else {
            sequenceName = businessUnit.name ? businessUnit.name.substring(0, 2) : '';
            sequenceName = sequenceName ? sequenceName.toUpperCase() : '';
        }
        await BusinessUnit.findOneAndUpdate({ _id: businessUnit._id }, { $set: { sequenceName } });

        await confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
            event: UPDATE_BUSINESS_UNIT,
            message: 'Business unit updated',
            data: {
                _id: businessUnit._id
            }
        });
    }
    console.log('DONE');
}

run();
