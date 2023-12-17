const EntityService = require('@zetwerk/zetapp-v2/services/EntityService');
const { name: appName } = require('../../../../package.json');
const userUtils = require('../../../../lib/utils/user');
class UserService extends EntityService {
    constructor() {
        super({ modelName: 'user' });
        if (UserService.instance) {
            return UserService.instance;
        }

        UserService.instance = this;
    }

    filterArray(array, secordaryArray) {
        const records = [];
        for (const doc of array) {
            const entityExist = secordaryArray.find(arr => arr._id.toString() === doc._id.toString());
            if (!entityExist) records.push(doc);
        }
        return records;
    }

    async findEntityByIdPostHook(reqContext, { result }) {
        if(result) {
            result = result.toJSON({ virtual: true });
            if (reqContext?.user?._id?.toString() !== result?._id?.toString()) {
                result.zActions = { updateRole: true, updateApplication: true };  
            }
        }
        return result;
    }

    async fetchAllEntitiesPreHook(reqContext, { query }) {
        if (!query.sort) {
            query.sort = {};
        }
        query.sort.firstName = 1;
        return { reqContext, query };
    }    

    async fetchAllEntitiesPostHook(reqContext, { query, result }) {
        let {ids} = query;
        if (ids) {
            ids = ids.split(',');
            if (ids.length > 0) {
                const entityByIds = await this.findAll(reqContext, { _id: { $in: ids } });
                result.records = [...entityByIds, ...this.filterArray(result.records, entityByIds)];
            }
        }
        return result;
    }
    
    async updateRole(reqContext, {
        body, entityId
    }) {
        const { roleIdsV2 } = body;
        const updatedUser = await this.updateUser(reqContext, { entityId, roleIdsV2 });
        return updatedUser;
    }

    async updateApplication(reqContext, {
        body, entityId
    }) {
        const { applicationIds } = body;
        const updatedUser = await this.updateUser(reqContext, { entityId, applicationIds });
        return updatedUser;
    }

    /* eslint-disable@zetwerk/custom-rules/service-methodDef-context-as-first-parameter */
    async getSystemUser() {
        const systemUserEmail = `${appName}.sys@zetwerk.com`;
        const reqContext = {};
        return this.entityModel
            .findOne(
                {
                    email: systemUserEmail
                },
                {},
                { reqContext }
            )
            .lean();
    }

    async updateUser(reqContext, { entityId: userId, applicationIds, roleIdsV2 } ) {
        const user = await this.findById(reqContext, userId);
        let isRoleUpdated = false;

        if (roleIdsV2?.length) {
            isRoleUpdated = this.isRoleUpdated(reqContext, roleIdsV2, user?.roleIdsV2);
            user.roleIdsV2 = roleIdsV2;
        }

        if(applicationIds?.length) {
            user.applicationIds = applicationIds;
        }

        user.passPhrase = userUtils.generateUserPassPhrase();
        
        const updatedUser = await user.save({reqContext});
        if (isRoleUpdated) {
            await this.modules.CommonModule.KafkaService.sendMessage(reqContext, 'ZET-USER', {
                entity: 'user', 
                event: 'roleUpdated',
                reqEntityId: updatedUser?._id?.toString()
            });
        }
        return updatedUser;
    }

    isRoleUpdated(reqContext, newRoles, oldRoles) {
        for (const role of oldRoles) {
            if (!newRoles.includes(role?.toString())) {
                return true;
            }
        }
        return false;
    }
}

module.exports = new UserService();
