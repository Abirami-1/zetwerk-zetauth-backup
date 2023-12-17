const WarehouseZone = require('../models/warehouse-zone');
const mongoose = require('mongoose');
const AuditLogService = new (require('../services-v2/AuditLogService'))();
class WarehouseZoneService {
    constructor() {}

    /**
     * insert Bulk zone
     * @param payload
     * @returns {Promise<void>}
     */
    async insertBulkZone({ payload, user }) {
        try {
            const insertedZones = await WarehouseZone.insertMany(payload);
            
            const batchId = new mongoose.Types.ObjectId;

            for(const zone of payload) {
                const zoneData = await WarehouseZone.findOne({ warehouseId: zone.warehouseId});
                // Making audit log entry for multiple zones
                await AuditLogService.createAuditLog({
                    newData: zoneData,
                    user,
                    model: WarehouseZone,
                    batchId
                });
            }
            return insertedZones;
        } catch (e) {
            throw new Error(e);
        }
    }

    /**
     * Get warehouse zone by warehouseId
     * @param warehouseId
     * @returns {Promise<*>}
     */
    async getWarehouseZoneByWarehouseId({ warehouseId }) {
        try {
            return WarehouseZone.find({ warehouseId, deleted: false});
        } catch (e) {
            throw new Error(e);
        }
    }

    /**
     * Get warehouse
     * @param warehouseId
     * @param name
     * @returns {Promise<void>}
     */
    async getWarehouseZoneByWarehouseIdAndName ({ warehouseId, name }) {
        try {
            return WarehouseZone.findOne({ warehouseId, name});
        } catch (e) {
            throw new Error(e);
        }
    }
}

module.exports = WarehouseZoneService;
