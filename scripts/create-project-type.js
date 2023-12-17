const businessUnitModel = require('../models/business-unit');
const projectModel = require('../models/project-type');
const db = require('../lib/utils/db');
const confluentKafka = require('../lib/utils/confluent-kafka');
const { CREATE_BUSINESS_UNIT, UPDATE_BUSINESS_UNIT, CREATE_PROJECT_TYPE } = require('../lib/constants/kafka-events');

async function createProject() {
    await db.connect(async () => {}).catch(error => console.log(error));
    await confluentKafka.initializeConfluentKafka();
    await fireUpdateBuEvent();
    let bus = await businessUnitModel.find({ 'projectTypeIds.0': { $exists: false } }).lean();
    for (let bu of bus) {
        let slug = bu.name.toLowerCase().trim();
        slug = slug.split(' ').join('-');
        let obj = {
            name: bu.name,
            slug
        };
        let condition = {
            name: bu.name
        };
        const proj = await projectModel.findOneAndUpdate(condition, obj, { upsert: true, new: true }).lean();
        console.log(proj);
        await confluentKafka.sendMessage('ZET-PROJECT_TYPE', {
            event: CREATE_PROJECT_TYPE,
            message: 'New project type created',
            data: {
                _id: proj._id
            }
        });
        await businessUnitModel.findByIdAndUpdate(bu._id, { $addToSet: { projectTypeIds: proj._id } });
        // updating for sharp Tanks BU as this BU was already there and it didn't have projectTypeId in it
        if (bu.name === 'Sharp Tanks') {
            confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
                event: UPDATE_BUSINESS_UNIT,
                message: 'Business unit updated',
                data: {
                    _id: bu._id
                }
            });
        } else {
            await confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
                event: CREATE_BUSINESS_UNIT,
                message: 'New business unit created',
                data: {
                    _id: bu._id
                }
            });
        }
    }
}

//updating for BUs which was updated last time when script run
async function fireUpdateBuEvent() {
    let bus = await businessUnitModel
        .find({ 'segments.0': { $exists: true }, 'projectTypeIds.0': { $exists: true } })
        .lean();
    for (let bu of bus) {
        await confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
            event: UPDATE_BUSINESS_UNIT,
            message: 'Business unit updated',
            data: {
                _id: bu._id
            }
        });
    }
}

createProject().then(async () => {
    console.log('--------script completed--------');
});
