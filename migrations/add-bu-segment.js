/**
 * Migration script for adding segment and uniqueCode in Business unit
 */

const db = require('../lib/utils/db');
const BusinessUnit = require('../models/business-unit');
const Segment = require('../models/segment');
const confluentKafka = require('../lib/utils/confluent-kafka');
const { UPDATE_BUSINESS_UNIT } = require('../lib/constants/kafka-events');

async function run() {
    try {
        await db.connect(async () => {});
        await confluentKafka.initializeConfluentKafka();
        await confluentKafka.initializeProducer();
        await updateBUs();
        return;
    } catch (e) {
        console.log('Error in run Block', e);
        throw e;
    }
}

const BUSegmentMSDCodeMapper = {
    Scaffolding: {
        segment: 'Industrial',
        uniqueCode: '18SCA'
    },
    Boiler: {
        segment: 'Industrial',
        uniqueCode: '19BOI'
    },
    Onsite: {
        segment: 'Industrial',
        uniqueCode: '20ONS'
    },
    Healthcare: {
        segment: 'Consumer',
        uniqueCode: '21HLT'
    },
    'Oil and Gas': {
        segment: 'Industrial',
        uniqueCode: '06OIL'
    }
};
/**
 * Add system users and pass updated data to downstream to respective application.
 * @returns {Promise<void>}
 */
async function updateBUs() {
    try {
        let buMigratedCount = 0;
        for (const buName in BUSegmentMSDCodeMapper) {
            const businessUnits = await BusinessUnit.find({ name: buName });
            for (const bu of businessUnits) {
                const res = await updateBU(bu, BUSegmentMSDCodeMapper[buName]);
                console.log(`${++buMigratedCount} ${res.company.slug} ${buName}`);
            }
        }
    } catch (e) {
        console.log('Some error occurred', e);
        throw e;
    }
}

async function updateBU(businessUnit, { segment, uniqueCode }) {
    const segmentObj = await Segment.findOne({ name: segment }, { name: 1, uniqueCode: 1 });
    if (!segmentObj) {
        throw new Error(`Segment not found with name ${segment}`);
    }

    const buSegments = businessUnit.segments || [];
    const segmentExists = businessUnit.segments.find(s => s.name === segment);
    if (!segmentExists) {
        buSegments.push(segmentObj);
    }
    const res = await BusinessUnit.findOneAndUpdate(
        {
            _id: businessUnit._id
        },
        {
            segments: buSegments,
            uniqueCode
        }
    );
    await confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
        event: UPDATE_BUSINESS_UNIT,
        message: 'Business unit updated',
        data: {
            _id: businessUnit._id
        }
    });
    return res;
}

run().then(() => {
    console.log('Business units migrated succesfully.');
});
