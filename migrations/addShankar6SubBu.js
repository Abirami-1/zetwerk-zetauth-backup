const db = require('../lib/utils/db');
const BusinessUnit = require('../models/business-unit');
const SubBusinessUnit = require('../models/sub-business-unit');

async function run() {
    await db.connect(async () => {});
    await db.setupHelpers();
    await createShankar6SubBU();
    console.log('Done!');
    process.exit();
}

// Create a Shankar 6 SubBU and add it to apparel BU under ZKA1 company
async function createShankar6SubBU() {
    const subBu = {
        name: 'Shankar 6',
        uniqueCode: '10SH6',
        draft: true,
        hidden: true
    };

    const result = await SubBusinessUnit.create(subBu);
    await BusinessUnit.findOneAndUpdate(
        {
            name: 'Apparel',
            'company.uniqueCode': 'ZKA1'
        },
        {
            $addToSet: {
                subBusinessUnits: {
                    ...subBu,
                    _id: result._id
                }
            }
        }
    );
}

run();
