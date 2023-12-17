/* eslint-disable no-unused-vars */
const EntityService = require('@zetwerk/zetapp-v2/services/EntityService');
const _ = require('lodash');
const serviceVersionInfoService = require('../serviceVersionInfo/serviceVersionInfo.service');
const { convertToTitleCase } = require('../../lib/utils/textFormatter');
class ServiceEntityActionService extends EntityService {
    constructor() {
        super({ modelName: 'serviceEntityAction' });
        if (ServiceEntityActionService.instance) {
            return ServiceEntityActionService.instance;
        }

        ServiceEntityActionService.instance = this;
    }

    async createAction(reqContext, body) {
        await this.create(reqContext, body);
    }

    async getAllEntityActions(reqContext, permissions) {
        const allEntitiesActions = await this.findAll(reqContext, {}, {}, { lean: true });
        let permissionStructure = {};
        allEntitiesActions.forEach(entityAction => {
            const { service, entity, actions } = entityAction;

            if (!permissionStructure?.[service]) {
                permissionStructure[service] = { children: [] };
            }

            const actionDetails = actions?.map(action => {
                if (permissions) {
                    const path = `${service}.${entity}.${action?.id}`;
                    if (_.get(permissions, path)) {
                        return { id: action?.id, label: convertToTitleCase(action?.label), isSelected: true };
                    } else {
                        return { id: action?.id, label: convertToTitleCase(action?.label), isSelected: false };
                    }
                }
                return { id: action?.id, label: convertToTitleCase(action?.label) };
            });

            permissionStructure[service].children.push({ id: entity, label: convertToTitleCase(entity), children: actionDetails });
        });

        permissionStructure = Object.keys(permissionStructure).map(serviceId => ({
            id: serviceId,
            label: convertToTitleCase(serviceId),
            children: permissionStructure[serviceId]?.children
        }));

        return permissionStructure;
    }

    async _updateEntityActions(reqContext, service, versionFromService) {
        const versionFromDB = await this._fetchLatestEntityActionsVersion(reqContext, service);
        let entityActionsAfterOperation = await this.findAll(reqContext, { service });

        if (versionFromDB != versionFromService) {
            const commonIPCService = require('@zetwerk/zetapp-v2/services/CommonIPCService');

            let dataFromService = await commonIPCService.getEntityAction(reqContext, {
                serviceName: service
            });
            let allEntitiesActionsFromService = dataFromService?.data?.data;
            await this.updateOrCreateEntityActions(reqContext, service, allEntitiesActionsFromService);
            await this.deleteOrphanedEntityActions(reqContext, service, allEntitiesActionsFromService);
            await serviceVersionInfoService.findOneAndUpdate(
                reqContext,
                { service },
                { service, lastSyncedVersion: versionFromService },
                { upsert: true }
            );
        }
        return entityActionsAfterOperation;
    }

    async _fetchLatestEntityActionsVersion(reqContext, service) {
        const serviceEntityActionInfo = await serviceVersionInfoService.findOne(reqContext, { service });
        return serviceEntityActionInfo?.lastSyncedVersion;
    }

    async updateOrCreateEntityActions(reqContext, service, allEntitiesActionsFromService) {
        for (const entityConfig of Object.entries(allEntitiesActionsFromService)) {
            const entityNameFromService = entityConfig[0];
            const existingEntityAction = await this.findOne(
                reqContext,
                { service, entity: entityNameFromService },
                { service: 1, entity: 1, 'actions.label': 1, 'actions.id': 1 },
                { lean: true }
            );
            let actions = Object.entries(entityConfig[1])
                .filter(([actionId, actionValue]) => {
                    return actionValue !== false;
                })
                .map(([actionId, actionValue]) => {
                    return { label: actionId, id: actionId };
                });

            if (!existingEntityAction) {
                await this.create(reqContext, {
                    service,
                    entity: entityNameFromService,
                    actions
                });
            } else if (!_.isEqual(existingEntityAction.actions, actions)) {
                await this.updateEntityAction(reqContext, service, entityNameFromService, actions);
            }
        }
    }

    async updateEntityAction(reqContext, service, entity, actions) {
        await this.findOneAndUpdate(reqContext, { service, entity }, { actions });
    }

    async deleteOrphanedEntityActions(reqContext, service, allEntitiesActionsFromService) {
        const allEntityActionsFromDB = await this.findAll(reqContext, { service });

        for (const entityActionFromDB of allEntityActionsFromDB) {
            const isEntityExistInBoth = Object.entries(allEntitiesActionsFromService)?.find(
                entityAction => entityAction[0] === entityActionFromDB.entity
            );

            if (!isEntityExistInBoth) {
                await this.findOneAndDelete(reqContext, { _id: entityActionFromDB._id });
            }
        }
    }
}

module.exports = new ServiceEntityActionService();
