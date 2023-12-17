const CompanyModel = require('../../models/company');
const db = require('../../lib/utils/db');
const confluentKafka = require('../../lib/utils/confluent-kafka');
const { UPDATE_COMPANY } = require('../../lib/constants/kafka-events');

async function run() {
    await db.connect(async () => {});
    await confluentKafka.initializeConfluentKafka();
    await confluentKafka.initializeProducer();

    await updateCompanies();
}

async function updateCompanies() {
    const existingCompanies = await CompanyModel.find({});
    console.log(`Found ${existingCompanies.length} companies`);
    for (const company of existingCompanies) {
        const docToUpdate = {
            localization: 'DOMESTIC'
        };

        const updatedCompany = await CompanyModel.findOneAndUpdate(
            { _id: company._id },
            {
                $set: docToUpdate
            },
            { new: true }
        );
        console.log(`Updated company ${company.name}`);
        await confluentKafka.sendMessage('ZET-COMPANY', {
            event: UPDATE_COMPANY,
            message: 'Company details updated',
            data: updatedCompany
        });
    }
}
run()
    .then(() => console.log('Migration Complete'))
    .catch(err => console.log(err))
    .finally(process.exit);
