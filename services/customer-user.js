const CustomerUser = require('../models/customer-user');

async function getCustomerUser(customerUserId) {
    return CustomerUser.findOne({ _id: customerUserId });
}
async function findUserById(userId) {
    return CustomerUser.findOne({ _id: userId });
}

async function addAddress(customerUserId, address) {
    const customerUser = await getCustomerUser(customerUserId);

    const updatedAddresses = [...(customerUser.addresses || []), address];
    await CustomerUser.updateOne(
        { _id: customerUserId },
        {
            $set: { addresses: updatedAddresses }
        }
    );
    return CustomerUser.findOne({ _id: customerUserId }, { addresses: 1 });
}

async function updateAddress(customerUserId, address) {
    const customerUser = await CustomerUser.findOne({ _id: customerUserId }, { addresses: 1 }).lean();
    const updatedAddresses = customerUser.addresses.map(addr => {
        if (addr._id.toString() === address._id.toString()) {
            addr = address;
        }
        return addr;
    });
    await CustomerUser.updateOne({ _id: customerUserId }, { $set: { addresses: updatedAddresses } });
    return this.findUserById(customerUserId);
}

async function deleteAddress(customerUserId, address) {
    const customerUser = await CustomerUser.findOne({ _id: customerUserId }, { addresses: 1 }).lean();
    const updatedAddresses = customerUser.addresses.filter(addr => addr && addr._id && addr._id.toString() !== address._id.toString());
    await CustomerUser.updateOne({ _id: customerUserId }, { $set: { addresses: updatedAddresses } });
    return this.findUserById(customerUserId);
}



module.exports = {
    updateAddress,
    addAddress,
    getCustomerUser,
    findUserById,
    deleteAddress
};
