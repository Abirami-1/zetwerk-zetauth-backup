const db = require('../lib/utils/db');
const BusinessUnitModel = require('../models/business-unit');
const FactoryModel = require('../models/factory');
const CompanyModel = require('../models/company');
const WarehouseModel = require('../models/warehouse');

const dbHelpers = require('../lib/utils/setup-db-helpers');

async function run() {
    await db.connect(async () => {}).catch(error => console.log(error));
    await dbHelpers.setup();
    await addUniqueCodeInFactory();
    await addUniqueCodeInBusinessUnit();
    await addUniqueCodeInWarehouse();
    console.log('Migration complete');
    process.exit();
}

function generateRandomCode() {
    return Math.random()
        .toString(36)
        .slice(2, 7);
}

async function addUniqueCodeInFactory() {
    const factories = await FactoryModel.find({}).exec();
    for (const factory of factories) {
        if (factory.company) {
            const { companyId } = factory.company;
            const getUniqueCodeOfCompany = await CompanyModel.findOne({ _id: companyId }, { uniqueCode: 1 });
            factory.company.uniqueCode = getUniqueCodeOfCompany.uniqueCode;
        }
        factory.uniqueCode = generateRandomCode().toUpperCase();
        await FactoryModel.findOneAndUpdate({ _id: factory._id }, factory);
    }
    console.log('Migration complete for factory');
}

async function addUniqueCodeInBusinessUnit() {
    const businessUnits = await BusinessUnitModel.find({}).exec();
    for (const businessUnit of businessUnits) {
        if (businessUnit.company) {
            const { companyId } = businessUnit.company;
            const getUniqueCodeOfCompany = await CompanyModel.findOne({ _id: companyId }, { uniqueCode: 1 });
            businessUnit.company.uniqueCode = getUniqueCodeOfCompany.uniqueCode;
        }
        businessUnit.uniqueCode = generateRandomCode().toUpperCase();
        await BusinessUnitModel.findOneAndUpdate({ _id: businessUnit._id }, businessUnit);
    }
    console.log('Migration complete for business unit');
}

async function addUniqueCodeInWarehouse() {
    const warehouses = await WarehouseModel.find({}).exec();
    for (const warehouse of warehouses) {
        if (warehouse.company) {
            const { companyId } = warehouse.company;
            const getUniqueCodeOfCompany = await CompanyModel.findOne({ _id: companyId }, { uniqueCode: 1 });
            warehouse.company.uniqueCode = getUniqueCodeOfCompany.uniqueCode;
        }
        warehouse.uniqueCode = generateRandomCode().toUpperCase();
        await WarehouseModel.findOneAndUpdate({ _id: warehouse._id }, warehouse);
    }
    console.log('Migration complete for factory');
}

run();
