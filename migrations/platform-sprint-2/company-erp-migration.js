const CompanyModel = require('../../models/company');
const db = require('../../lib/utils/db');
const confluentKafka = require('../../lib/utils/confluent-kafka');
const { UPDATE_COMPANY } = require('../../lib/constants/kafka-events');
const config = require('config');
const AWS = require('aws-sdk');

async function run() {
    await db.connect(async () => {});
    await confluentKafka.initializeConfluentKafka();
    await confluentKafka.initializeProducer();

    await updateCompanies();
}

async function updateCompanies() {
    const migrationJSON = await getJSONFileFromS3(
        'https://zet-auth.s3.ap-south-1.amazonaws.com/legalEntityAddress.json'
    );
    const companiesToUpdate = migrationJSON;

    for (const company in companiesToUpdate) {
        /**
         * Using regex operator to do a case insensitive match because legal name in db and sheet might have variation
         */
        const existingCompany = await CompanyModel.findOne({
            legalName: { $regex: company, $options: 'i' }
        });
        if (!existingCompany) {
            throw new Error(`Could not find company ${company}`);
        }

        const docToUpdate = {
            uniqueCode: companiesToUpdate[company].uniqueCode
        };

        const updatedCompany = await CompanyModel.findOneAndUpdate(
            { _id: existingCompany._id },
            {
                $set: docToUpdate
            },
            { new: true }
        );
        console.log(`Updated company ${existingCompany.name}`);
        await confluentKafka.sendMessage('ZET-COMPANY', {
            event: UPDATE_COMPANY,
            message: 'Company details updated',
            data: updatedCompany
        });
    }

    const companiesWithoutUniqueCode = await CompanyModel.find({ uniqueCode: { $exists: false } });
    for (const company of companiesWithoutUniqueCode) {
        const uniqueCode = generateUniqueCode(company.name);

        const updatedCompany = await CompanyModel.findOneAndUpdate(
            { _id: company._id },
            {
                $set: { uniqueCode }
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

function generateUniqueCode(companyName) {
    const code = companyName.split(' ')[1].slice(0, 3);
    return `Z${code.toUpperCase()}01`;
}
async function getJSONFileFromS3(url) {
    AWS.config.credentials = new AWS.Credentials(config.get('s3'));
    const s3 = new AWS.S3({
        params: {
            Bucket: config.get('s3.bucket'),
            timeout: 6000000
        }
    });

    const s3Key = url.split('/').pop();

    const params = {
        Bucket: config.get('s3.bucket'),
        Key: s3Key
    };
    const fileData = await s3.getObject(params).promise();
    const jsonData = JSON.parse(fileData.Body.toString('utf-8'));
    return jsonData;
}

run()
    .then(() => console.log('Migration Complete'))
    .catch(err => console.log(err))
    .finally(process.exit);
