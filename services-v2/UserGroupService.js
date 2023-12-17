const DefaultService = require('@zetwerk/zetapp/services/DefaultService');
const { AUDIT_LOG_ACTIONS } = require('../lib/constants/audit-log');

class UserGroupService extends DefaultService {
    constructor() {
        super('user-group');
        this.FIELDS_TO_POPULATE = [
            {
                path: 'usersDetail'
            },
            {
                path: 'updatedByDetails'
            },
            {
                path: 'createdByDetails'
            }
        ];
        this.userGroupModel = this.models['user-group'];
        this.userModel = this.models['user'];
    }

    /**
     * create a new User Group
     * @param payload,
     * @returns Document
     */
    async createUserGroup(payload) {
        const updatedUserGroup = await this.userGroupModel.create(payload);

        this.updateUserOnUserGroupUpdate({
            userGroupId: updatedUserGroup._id,
            userIds: updatedUserGroup.userIds
        });
        return updatedUserGroup;
    }

    /**
     * Get all User Groups
     * @returns Documents
     */
    async getUserGroups() {
        return await this.userGroupModel.findAll({
            fieldsToPopulate: this.FIELDS_TO_POPULATE,
            findConditions: { deleted: false }
        });
    }

    /**
     * Get User Group by _id
     * @param userGroupId,
     * @returns Document
     */
    async getUserGroupById(userGroupId) {
        return await this.userGroupModel._findOne(
            {
                $and: [{ _id: userGroupId }, { deleted: false }]
            },
            this.FIELDS_TO_POPULATE,
            true
        );
    }

    /**
     * delete User Group
     * @param userGroupId,
     * @returns Old Document
     */
    async deleteUserGroup(userGroupId, user) {
        const updatedUserGroup = await this.userGroupModel.findOneAndUpdate(
            { _id: userGroupId },
            { $set: { deleted: true } }
        );

        // Making audit log entry for user groups
        await this.services.AuditLogService.createAuditLog({
            newData: updatedUserGroup,
            user,
            model: this.userGroupModel,
            actionType: AUDIT_LOG_ACTIONS.DELETE,
            action: AUDIT_LOG_ACTIONS.DELETE
        });

        this.updateUserOnUserGroupUpdate({
            userGroupId: updatedUserGroup._id,
            userIds: []
        });
        return updatedUserGroup;
    }

    /**
     * Update User Group
     * @param userIds,
     * @param slug,
     * @param updatedBy,
     * @returns Old Document
     */
    async updateUserGroup({ userGroupId, userIds, user }) {
        const oldData = await this.userGroupModel.findOne({ _id: userGroupId });

        const updatedUserGroup = await this.userGroupModel.findOneAndUpdate(
            { _id: userGroupId },
            { $set: { userIds, updatedBy: user._id } },
            { new: true }
        );

        // Making audit log entry for user groups
        await this.services.AuditLogService.createAuditLog({
            newData: updatedUserGroup,
            oldData,
            user,
            model: this.userGroupModel,
            actionType: AUDIT_LOG_ACTIONS.UPDATE,
            action: AUDIT_LOG_ACTIONS.UPDATE
        });

        this.updateUserOnUserGroupUpdate({
            userGroupId: updatedUserGroup._id,
            userIds: userIds
        });
        return updatedUserGroup;
    }

    /**
     * Updates userGroupIds
     * in user schema
     */
    async updateUserOnUserGroupUpdate({ userGroupId, userIds = [] }) {
        const allUsers = await this.userModel.find({
            $or: [{ _id: { $in: userIds } }, { userGroupIds: userGroupId }]
        });
        const userIdMap = {};
        for (const id of userIds) {
            userIdMap[String(id)] = id;
        }
        const removedUsers = [];
        const newUsers = [];
        for (const user of allUsers) {
            if (!userIdMap[String(user._id)]) {
                const matchIndex = user.userGroupIds.findIndex(groupId => String(groupId) === String(userGroupId));
                user.userGroupIds.splice(matchIndex, 1);
                removedUsers.push(user);
            } else {
                const matchIndex = user.userGroupIds.findIndex(groupId => String(groupId) === String(userGroupId));
                if (matchIndex === -1) {
                    user.userGroupIds.push(userGroupId);
                    newUsers.push(user);
                }
            }
        }
        const usersToUpdate = [...removedUsers, ...newUsers];
        await this.bulkupdateUsers({ users: usersToUpdate });
    }

    async bulkupdateUsers({ users }) {
        await this.userModel.bulkWrite(
            users.map(user => {
                const _id = user._id;
                delete user._id;
                return {
                    updateOne: {
                        filter: { _id },
                        update: { userGroupIds: user.userGroupIds }
                    }
                };
            })
        );
    }
}

module.exports = UserGroupService;
