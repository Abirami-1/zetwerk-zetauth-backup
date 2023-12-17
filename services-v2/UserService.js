const { generateUserPassPhrase } = require('../lib/utils/user');
const DefaultService = require('@zetwerk/zetapp/services/DefaultService');
const config = require('config');
const Role = require('../models/role');
const { AUDIT_LOG_ACTIONS } = require('../lib/constants/audit-log');
const mongoose = require('mongoose');
class UserService extends DefaultService {
    constructor() {
        super('user');
    }

    async logoutUsersByUserId(userIds) {
        const result = await this.resourceModel.updateMany(
            { _id: { $in: userIds } },
            { $set: { passPhrase: generateUserPassPhrase() } }
        );
        return result;
    }

    async logoutAllUsers(userType) {
        let updateConditions = {};
        if (userType && userType === 'ZETWERK') {
            let supplierRole = await Role.findOne({
                name: 'SUPPLIER'
            });
            updateConditions = {
                roleId: { $ne: supplierRole._id }
            };
        }
        /* same passphrase for each user */
        const result = await this.resourceModel.updateMany(updateConditions, {
            $set: { passPhrase: generateUserPassPhrase() }
        });
        return result;
    }

    async updateUsersByUserId({ userIds, updateObj }) {
        const oldUsersData = await this.resourceModel.find({ _id: { $in: userIds } });
        const result = await this.resourceModel.updateMany({ _id: { $in: userIds } }, { $set: updateObj });
        const batchId = new mongoose.Types.ObjectId;
        for(const userId of userIds) {
            const updatedUser = await this.resourceModel.findOne({_id: userId});
            // Making audit log entry for multiple user objects
            await this.services.AuditLogService.createAuditLog({
                newData: updatedUser,
                oldData: oldUsersData.find(user => user._id == userId ),
                user: updatedUser.updatedBy,
                model: this.resourceModel,
                actionType: AUDIT_LOG_ACTIONS.UPDATE,
                action: AUDIT_LOG_ACTIONS.UPDATE,
                batchId
            });
        }
        return result;
    }

    async getSystemUser() {
        return this.resourceModel.findOne({
            email: config.get('systemUserEmail')
        });
    }
}

module.exports = UserService;
