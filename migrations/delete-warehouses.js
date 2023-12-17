/**
 * Migration script for adding companyId in factory
 * and downstream factory copies as well
 */

/*eslint indent: ["error", 2] */
const yargs = require('yargs');
const args = yargs(process.argv.slice(2)).argv;
let { warehouseCode, uniqueCode, name } = args;

const db = require('../lib/utils/db');
const Warehouses = require('../models/warehouse-erp');
async function run() {
  try {
    await db.connect(async () => {});
    await deleteWarehouses();
    return;
  } catch (e) {
    console.log('Error in run Block', e);
    throw e;
  }
}

/**
 * Add system users and pass updated data to downstream to respective application.
 * @returns {Promise<void>}
 */
async function deleteWarehouses() {
  try {
    if (!warehouseCode && !name) {
      throw new Error('Warehouse code/name is required');
    }
    if (warehouseCode) {
      warehouseCode = Array.isArray(warehouseCode) ? warehouseCode : [warehouseCode];
    }

    if (name) {
      name = Array.isArray(name) ? name : [name];
    }

    console.log(warehouseCode);
    console.log(name);

    const res = await Warehouses.deleteMany({
      ...(uniqueCode && { 'company.uniqueCode': uniqueCode }),
      ...(name && { name: { $in: name } }),
      ...(warehouseCode && { warehouseCode: { $in: warehouseCode } })
    });
    console.log(res);
  } catch (e) {
    console.log('Some error occurred', e);
    throw e;
  }
}

run().then(() => {
  console.log('Warehouses deleted succesfully.');
});
