const db = require('../lib/utils/db');
const segmentModel = require('../models/segment');
const subBUModel = require('../models/sub-business-unit');
const regionModel = require('../models/region');
const factoryModel = require('../models/factory-erp');
const allModel = [segmentModel, subBUModel, regionModel, factoryModel];

async function run() {
    await db.connect(async () => {});
    for(const fdModel of allModel) {
        const allFDs = await fdModel.find({deleted: {$exists: false}}).lean();
        let fdMigrated = 0;
        for(const fd of allFDs) {
            fd.deleted = false;
            await fdModel.findByIdAndUpdate(fd._id, {$set: {deleted: false}});
            fdMigrated++;
        }
        console.log(fdModel, fdMigrated);
    }
}

run().then(()=>console.log('script completed'));