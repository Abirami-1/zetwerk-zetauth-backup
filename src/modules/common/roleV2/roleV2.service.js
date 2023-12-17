const EntityService = require('@zetwerk/zetapp-v2/services/EntityService');
const ServiceEntityActionService = require('../../serviceEntityAction/serviceEntityAction.service');
const { convertToTitleCase } = require('../../../lib/utils/textFormatter');


class RoleV2Service extends EntityService {
    constructor() {
        super({ modelName: 'roleV2' });
        if (RoleV2Service.instance) {
            return RoleV2Service.instance;
        }

        RoleV2Service.instance = this;
    }

    async createEntityPreHook(reqContext, { body }) {
        const { name, permissionsTree } = body;
        const { permissions, permissionsCount } = await this.parsePermissionsTree(permissionsTree);
        body = { name, permissions, permissionsCount };
        return { reqContext, body };
    }
    async findEntityByIdPostHook(reqContext, { result }) {
        if(result) {
            result = result.toJSON({ virtual: true });
            const permissions = result?.permissions;
            const permissionsTree = await ServiceEntityActionService.getAllEntityActions(reqContext, permissions);
            const selectedPermissionsTree = this.prepareSelectedPermissionTree(reqContext, permissions);
            result.permissionsTree = permissionsTree;
            result.selectedPermissionsTree = selectedPermissionsTree;
        }
        return result;
    }

    async deleteEntityByIdPreHook(reqContext, { entityId }) {
        const isExist = await this.findAll(reqContext, { roleIdsV2: { $elemMatch: { $eq: entityId } } });
        if (isExist?.length) {
            throw new Error('The role trying to delete is mapped to some user');
        }
        return { reqContext, entityId };
    }

    async fetchAllEntitiesPreHook(reqContext, { query }) {
        if(!query.sort) {
            query.sort = {};
        }
        query.sort.name = 1;
        return { reqContext, query };
    }

    prepareSelectedPermissionTree(reqContext, permissions) {
        return Object.keys(permissions || {})?.map(service => ({
            id: service,
            label: convertToTitleCase(service),
            children: Object.keys(permissions[service])?.map(entity => ({
                id: entity,
                label: convertToTitleCase(entity),
                children: Object.keys(permissions[service][entity]).map(action => ({
                    id: action,
                    label: convertToTitleCase(action),
                    isSelected: true
                }))
            }))
        }));
    }

    async updateEntityByIdPreHook(reqContext, { body, entityId }) {
        const {permissionsTree } = body;
        const { permissions, permissionsCount } = await this.parsePermissionsTree(permissionsTree);
        body.permissions = permissions;
        body.permissionsCount = permissionsCount;
        return {reqContext, body, entityId};
    }

    parsePermissionsTree(permissionsTree) {
        let permissions = {};
        let permissionsCount = { totalCount: 0, services: [] };
    
        permissionsTree.forEach(serviceDetails => {
            permissions[serviceDetails?.id] = {};
            let serviceCount = 0;
            
            serviceDetails?.children?.forEach(entityDetails => {
                permissions[serviceDetails?.id][entityDetails?.id] = {};
                let entityCount = 0;
    
                entityDetails?.children?.forEach(action => {
                    if (action?.isSelected) {
                        permissions[serviceDetails?.id][entityDetails?.id][action?.id] = true;
                        entityCount++;
                    }
                });
    
                if (entityCount > 0) {
                    serviceCount = serviceCount + entityCount;
                }
    
                if (Object.keys(permissions[serviceDetails?.id][entityDetails?.id]).length === 0) {
                    delete permissions[serviceDetails?.id][entityDetails?.id];
                }
            });

            if (serviceCount > 0) {
                permissionsCount.totalCount += serviceCount; 
                permissionsCount.services.push({ name: serviceDetails?.id, count: serviceCount});
            }
    
            if (Object.keys(permissions[serviceDetails?.id]).length === 0) {
                delete permissions[serviceDetails?.id];
            } 
        });
    
        return { permissions, permissionsCount };
    }
    
}

module.exports = new RoleV2Service();
