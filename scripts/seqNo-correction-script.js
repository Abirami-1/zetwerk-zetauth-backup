const db = require('../lib/utils/db');
const businessUnitModel = require('../models/business-unit');
const mongoose = require('mongoose');
const confluentKafka = require('../lib/utils/confluent-kafka');
const { UPDATE_BUSINESS_UNIT } = require('../lib/constants/kafka-events');

async function seqNoCorrection() {
    await db.connect(async () => {}).catch(error => console.log(error));
    await confluentKafka.initializeConfluentKafka();
    mongoose.connection.db
        .collection('business-units-backup', function(err, collection){
            collection.find({}).toArray(async function(err, oldBUs){
                for(let oldBU of oldBUs) {
                    const obj = {};
                    const newBU = await businessUnitModel.findOne({_id: oldBU._id});
                    if(newBU.slug !== oldBU.slug) {
                        obj.slug = oldBU.slug;
                        console.log('old slug ', oldBU.slug, 'new slug  ', newBU.slug);
                    }
                    if(newBU.sequenceName !== oldBU.sequenceName) {
                        obj.sequenceName = oldBU.sequenceName;
                        console.log('old sequenceName ', oldBU.sequenceName, 'new sequenceName  ', newBU.sequenceName);
                    }
                    console.log('---------------', obj);
                    await businessUnitModel.findByIdAndUpdate(newBU._id, obj);
                    await confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
                        event: UPDATE_BUSINESS_UNIT,
                        message: 'Business unit updated',
                        data: {
                            _id: newBU._id
                        }
                    });
                }
            });
        });
}

seqNoCorrection().then(()=>{
    console.log('------------- seqNo corrected ------------');
});