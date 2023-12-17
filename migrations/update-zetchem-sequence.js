const db = require('../lib/utils/db');
const BusinessUnit = require('../models/business-unit');
const confluentKafka = require('../lib/utils/confluent-kafka');

const { UPDATE_BUSINESS_UNIT } = require('../lib/constants/kafka-events');

const dbHelpers = require('../lib/utils/setup-db-helpers');

async function run() {
    await db.connect(async () => {}).catch(error => console.log(error));
    await dbHelpers.setup();
    await confluentKafka.initializeConfluentKafka();
    await confluentKafka.initializeProducer();
    await updateBusinessUnits();
    console.log('Migration complete');
    process.exit();
}

function getBuCode(buName) {
    console.log(buName);
    const buNameToCodeMap = {
        'Process chemicals': 'PR',
        'Agro chemicals': 'AC',
        'Industrial Chemicals': 'IC',
        'Pharma chemicals': 'PH',
        'Flavors and Fragrances': 'FF',
        'Personal and Home care': 'PC',
        'Food and Nutrition': 'FN'
    };
    return buNameToCodeMap[buName];
}

async function updateBusinessUnits() {
    try {
        const businessUnits = await BusinessUnit.find({ 'company.slug': 'zetchem', name: { $ne: 'ZetChem' } });
        console.log('businessUnits', businessUnits.length);
        for (const businessUnit of businessUnits) {
            const buName = businessUnit.name;
            businessUnit.sequenceName = getBuCode(buName) || businessUnit.sequenceName;
            console.log('updatedBusinessUnitSequence', businessUnit.sequenceName);
            await BusinessUnit.updateById(businessUnit._id, businessUnit);
            await confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
                event: UPDATE_BUSINESS_UNIT,
                message: 'Business unit updated',
                data: {
                    _id: businessUnit._id
                }
            });
        }
    } catch (error) {
        console.log(error);
        throw error;
    }
}

run();
