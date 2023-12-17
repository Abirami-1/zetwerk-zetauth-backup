const Warehouse = require('../models/warehouse');
const WarehouseAuditLog = require('../models/warehouse-audit-log');
const { getWarehouseStatus, updateApproversInSTC } = require('../lib/utils/external-inze');
const mongoose = require('mongoose');

const FIELDS_TO_POPULATE = [
    {
        path: 'createdByDetails'
    },
    {
        path: 'updatedByDetails'
    },
    {
        path: 'zones'
    },
    {
        path: 'auditLogs',
        populate: [
            {
                path: 'createdByDetails',
                select: 'firstName lastName'
            }
        ]
    },
    {
        path: 'stcApproversDetails'
    }
];
const CompanyService = require('./company');
const FactoryService = require('./factory');
const WarehouseZoneService = require('./warehouse-zone');

class WarehouseService {
    cosntructor() {}

    /**
     * Create Warehouse
     * @param payload
     * @param user
     * @returns {Promise<*>}
     */

    async createWarehouse({ payload, user }) {
        try {
            const { zones } = payload;
            let { name, shortName } = payload;
            name = name.trim();
            shortName = shortName.trim();
            const regexForName = new RegExp(`^${name}$`, 'i');
            const availableDuplicatesForName = await Warehouse.countDocuments({ name: regexForName });
            if (availableDuplicatesForName) {
                throw new Error('Cannot create warehouse with duplicate name');
            }
            const regexForShortName = new RegExp(`^${shortName}$`, 'i');
            const availableDuplicatesForShortName = await Warehouse.countDocuments({
                shortName: regexForShortName
            });
            if (availableDuplicatesForShortName) {
                throw new Error('Cannot create warehouse with duplicate short name');
            }

            payload = await this.transformPayload({ payload, user });
            payload.createdBy = user._id;
            const data = await Warehouse.create(payload);
            /** insert multiple warehouse zone corresponding to ware house */
            const warehouseZonePayload = await this.generateWarehouseZonePayload({ zones, warehouseId: data._id });
            await this.insertZoneInBulk({ warehouseZonePayload, user });
            await WarehouseAuditLog.create(
                this.generateWarehouseAuditLogPayload({ warehouseId: data._id, user, actionType: 'CREATE' })
            );
            if (!data) {
                throw new Error('Unable to create company');
            }
            return data;
        } catch (e) {
            // /** delete warehouse if unable to create zone*/
            // if (warehouseId) {
            //     await this.deleteWarehouseById({ warehouseId });
            // }
            throw new Error(e);
        }
    }

    /**
     * Get Warehouse
     * @returns {Promise<*>}
     */
    async getWarehouses({ query = {} }) {
        let queryParams = {
            status: query.status,
            searchWithStatus: true,
            searchText: query.searchText,
            pageNumber: query.pageNumber,
            recordsPerPage: query.recordsPerPage
        };
        const fieldsToSearch = ['name', 'shortName', 'contract.contractNumber', 'warehouseCode'];
        return Warehouse.findAll({ fieldsToSearch, queryParams, fieldsToPopulate: FIELDS_TO_POPULATE });
    }

    /**
     * Get warehouse by Id
     * @param warehouseIds
     * @returns {Promise<*>}
     */
    async getWarehouseById({ warehouseId }) {
        return await Warehouse.findById(warehouseId, FIELDS_TO_POPULATE);
    }

    /**
     * Update particular warehouse
     * @param warehouseId
     * @param payload
     * @param user
     * @returns {Promise<*>}
     */
    async updateWarehouseById({ warehouseId, payload, user }) {
        try {
            const { zones } = payload;
            let { name } = payload;
            name = name.trim();
            const regexForName = new RegExp(`^${name}$`, 'i');
            const availableDuplicatesForName = await Warehouse.countDocuments({
                name: regexForName,
                _id: { $nin: [new mongoose.Types.ObjectId(warehouseId)] }
            });
            if (availableDuplicatesForName) {
                throw new Error('Cannot update warehouse with duplicate name');
            }
            const zonesPayload = await this.generateWarehouseZonePayload({ warehouseId, zones });
            await this.insertZoneInBulk({ zonesPayload, user });
            payload = await this.transformPayload({ payload });
            payload.updatedBy = user._id;
            await WarehouseAuditLog.create(
                this.generateWarehouseAuditLogPayload({ warehouseId, user, actionType: 'EDIT' })
            );

            let removedApprovers = await this.checkIfApproversRemoved({
                warehouseId,
                newApprovers: payload.stcApprovers
            });

            const updatedWarehouse = Warehouse.updateById(warehouseId, payload, FIELDS_TO_POPULATE);
            /**
             * If approvers were removed make internal call to InZe service to update STCs
             * */

            if (removedApprovers && removedApprovers.length) {
                await updateApproversInSTC({
                    warehouseId,
                    removedApprovers,
                    newApproverId:
                        payload.stcApprovers && payload.stcApprovers[0] && payload.stcApprovers[0]._id.toString()
                });
            }
            return updatedWarehouse;
        } catch (e) {
            throw new Error(e);
        }
    }

    /**
     * Delete Warehouse By Id
     * @param warehouseId
     * @returns {Promise<Document>}
     */

    async deleteWarehouseById({ warehouseId }) {
        return await Warehouse.deleteById(warehouseId);
    }

    /**
     * add company and factory in payloads
     * @param payload
     * @param user
     * @returns {Promise<any>}
     */
    async transformPayload({ payload }) {
        const { factoryId, companyId, ...rest } = payload || {};
        rest.factory = await this.getFactoryById({ factoryId });
        rest.company = await this.getCompanyById({ companyId });
        return rest;
    }

    /**
     * Get company info
     * @param companyId
     * @returns {Promise<{companyId: *, name: string, shortName: string, slug: string}>}
     */
    async getCompanyById({ companyId }) {
        const companyService = new CompanyService();
        const { name = '', slug = '', legalName = '' } = await companyService.getCompanyById(companyId);
        return { name, slug, legalName, companyId };
    }

    /**
     * Get factory Info
     * @param factoryId
     * @returns {Promise<{factoryId: *, name: string, shortName: string}>}
     */
    async getFactoryById({ factoryId }) {
        if (!factoryId) {
            return {};
        }
        const factoryService = new FactoryService();
        const { name = '', shortName = '' } = await factoryService.getFactoryDetails({ factoryId });
        return { name, shortName, factoryId };
    }

    /**
     * add zone based on warehouseId in warehouse-zone
     * @param warehouseZonePayload
     * @returns {Promise<void>}
     */
    async insertZoneInBulk({ warehouseZonePayload, user }) {
        const wareHouseZoneService = new WarehouseZoneService();
        return wareHouseZoneService.insertBulkZone({ payload: warehouseZonePayload, user });
    }

    /**
     * Generate Warehouse payload
     * @param zones
     * @param warehouseId
     * @returns {Promise<[]>}
     */
    async generateWarehouseZonePayload({ zones, warehouseId }) {
        const wareHouseService = new WarehouseZoneService();
        const payload = [];
        for (let zone of zones) {
            zone = zone && zone.name.trim();
            const isZoneAlreadyAvailable = await wareHouseService.getWarehouseZoneByWarehouseIdAndName({
                warehouseId,
                name: zone
            });
            if (!isZoneAlreadyAvailable) {
                payload.push({ warehouseId, name: zone });
            }
        }
        return payload;
    }

    /**
     * Update warehouse status
     * @param warehouseId
     * @param payload
     * @returns {Promise<*>}
     */
    async updateWarehouseStatus({ warehouseId, payload }) {
        try {
            return Warehouse.updateById(warehouseId, payload, FIELDS_TO_POPULATE);
        } catch (e) {
            throw new Error(e);
        }
    }

    /**
     * Update warehouse status to inactive with check
     * @param warehouseId
     * @param payload
     * @returns {Promise<*>}
     */
    async updateWarehouseStatusWithCheck({ warehouseId, payload }) {
        try {
            let status;
            const response = await getWarehouseStatus(warehouseId);
            if (response && response.data) {
                status = response.data && response.data.data && response.data.data.canInactivate;
            }
            if (status) {
                return Warehouse.updateById(warehouseId, payload, FIELDS_TO_POPULATE);
            } else {
                throw new Error('Warehouse with active items cannot be inactivated');
            }
        } catch (e) {
            throw new Error(e);
        }
    }

    generateWarehouseAuditLogPayload({ actionType, user, warehouseId }) {
        return {
            type: 'WAREHOUSE',
            action: actionType || 'CREATE',
            typeId: warehouseId,
            createdBy: user._id
        };
    }
    /**
     * Check if any Stock correction approvers were removed
     * @param {*} warehouseId
     * @param {*} newApprovers Updated list of approvers
     */
    async checkIfApproversRemoved({ warehouseId, newApprovers }) {
        let existingApprovers = [];
        newApprovers = newApprovers.map(el => el._id.toString());
        const warehouse = await Warehouse.findById(warehouseId);
        existingApprovers = warehouse.stcApprovers || [];
        const removedApprovers = existingApprovers.filter(user => !newApprovers.includes(user.toString()));
        return removedApprovers;
    }
}

module.exports = WarehouseService;
