const mongoose = require('mongoose');
const db = require('../lib/utils/db');
const { _getSupplierByEmail } = require('../lib/utils/smes');
const UserModel = require('../models/user');
const RoleModel = require('../models/role');

async function addSupplierId() {
    const supplierRole = await RoleModel.findOne({ name: 'SUPPLIER' });
    const suppliers = await UserModel.find({ roleId: { $in: [supplierRole._id] }, supplierId: { $exists: false } });

    for (const supplier of suppliers) {
        const smesSupplierDetails = await _getSupplierByEmail(supplier.email);

        const UserCollectionModel = await mongoose.connection.db.collection('users');

        if (smesSupplierDetails && smesSupplierDetails._id) {
            await UserCollectionModel.updateOne({ _id: supplier._id }, { $set: { supplierId: new mongoose.Types.ObjectId(smesSupplierDetails._id) } });
        }
    }
}

async function run() {
    try {
        await db.connect(async () => {});
        await addSupplierId();
        return;
    } catch (e) {
        console.log('Error in run Block', e);
        throw e;
    }
}

run()
    .catch(console.log)
    .finally(process.exit);

module.exports = run;
