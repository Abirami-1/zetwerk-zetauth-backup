const logger = require('../lib/utils/logger');
const WarehouseService = require('../services/warehouse');

const warehouseService = new WarehouseService();

const {
    WAREHOUSE_CREATE_SUCCESS,
    WAREHOUSE_CREATE_FAILED,
    WAREHOUSE_DELETE_FAILED,
    WAREHOUSE_DELETE_SUCCESS,
    WAREHOUSE_UPDATE_FAILED,
    WAREHOUSE_UPDATE_SUCCESS,
    FETCH_WAREHOUSE_FAILED,
    FETCH_WAREHOUSE_SUCCESS
} = require('../lib/constants/response-codes');

class WarehouseController {
    constructor() {}

    /**
     * Method: POST
     * endPoint: api/v1/warehouse
     * @param req
     * @param res
     * @returns {Promise<any>} - return warehouse document
     */
    async createWarehouse(req, res) {
        try {
            let warehouse = await warehouseService.createWarehouse({ payload: req.body, user: req.user });

            logger.info({ description: 'Warehouse is created successfully', warehouse, user: req.user });

            return res.status(200).json({
                success: true,
                statusCode: WAREHOUSE_CREATE_SUCCESS,
                message: 'Warehouse is created successfully',
                data: warehouse
            });
        } catch (error) {
            logger.error({ description: 'Warehouse add failed', error, user: req.user });

            return res.status(400).json({
                success: false,
                statusCode: WAREHOUSE_CREATE_FAILED,
                message: error.message
            });
        }
    }

    /**
     * Method: PUT
     * endPoint: api/v1/warehouse/:warehouseId
     * @param req
     * @param res
     * @returns {Promise<any>} update and return updated warehouse document
     */
    async updateWarehouseById(req, res) {
        try {
            let warehouse = await warehouseService.updateWarehouseById({
                warehouseId: req.params.warehouseId,
                payload: req.body,
                user: req.user
            });

            logger.info({ description: 'Warehouse is updated successfully', warehouse, user: req.user });

            return res.status(200).json({
                success: true,
                statusCode: WAREHOUSE_UPDATE_SUCCESS,
                message: 'Warehouse is updated successfully',
                data: warehouse
            });
        } catch (error) {
            logger.error({ description: 'Update Warehouse failed', error, user: req.user });

            return res.status(400).json({
                success: false,
                statusCode: WAREHOUSE_UPDATE_FAILED,
                message: error.message
            });
        }
    }

    /**
     * Method: DELETE
     * endPoint: api/v1/warehouse/:warehouseId
     * @param req
     * @param res
     * @returns {Promise<any>} soft delete particular warehouse
     * @private
     */
    async _deleteWarehouseById(req, res) {
        try {
            let warehouse = await warehouseService.deleteWarehouseById({ warehouseId: req.params.warehouseId });

            logger.info({ description: 'Warehouse is deleted successfully', warehouse, user: req.user });

            return res.status(200).json({
                success: true,
                statusCode: WAREHOUSE_DELETE_SUCCESS,
                message: 'Warehouse is deleted successfully'
            });
        } catch (error) {
            logger.error({ description: 'Delete warehouse failed', error, user: req.user });

            return res.status(500).json({
                success: false,
                statusCode: WAREHOUSE_DELETE_FAILED,
                message: error.message
            });
        }
    }

    /**
     * Method: GET
     * endPoint: api/v1/warehouse/:warehouseId
     * @param req
     * @param res
     * @returns {Promise<any>} Get warehouse by warehouseId and return warehouse document
     */
    async getWarehouseById(req, res) {
        try {
            let warehouse = await warehouseService.getWarehouseById({ warehouseId: req.params.warehouseId });

            logger.info({ description: 'Warehouse is fetched successfully', warehouse, user: req.user });

            return res.status(200).json({
                success: true,
                statusCode: FETCH_WAREHOUSE_FAILED,
                message: 'Warehouse is fetched successfully',
                data: warehouse
            });
        } catch (error) {
            logger.error({ description: 'Fetch warehouse failed', error, user: req.user });

            return res.status(500).json({
                success: false,
                statusCode: FETCH_WAREHOUSE_SUCCESS,
                message: error.message
            });
        }
    }

    /**
     * Method: GET
     * endPoint: api/v1/warehouse
     * @param req
     * @param res
     * @returns {Promise<any>} Get all warehouse documents
     */
    async getWarehouses(req, res) {
        try {
            const query = req.query;
            let warehouses = await warehouseService.getWarehouses({ query });

            logger.info({ description: 'Warehouse fetched successfully', warehouses, user: req.user });

            return res.status(200).json({
                success: true,
                statusCode: FETCH_WAREHOUSE_SUCCESS,
                message: 'Warehouse fetched successfully',
                data: warehouses
            });
        } catch (error) {
            logger.error({ description: 'Fetch warehouse failed', error, user: req.user });

            return res.status(500).json({
                success: false,
                statusCode: FETCH_WAREHOUSE_FAILED,
                message: error.message
            });
        }
    }

    /**
     * @description: update warehouse status to active
     * @method: PUT
     * @url: /warehouse/:warehouseId/active
     * @param {*} req
     * @param {*} res
     */
    async _makeWarehouseActive(req, res) {
        try {
            let payload = req.body;
            payload['status'] = 'ACTIVE';
            let warehouse = await warehouseService.updateWarehouseStatus({
                warehouseId: req.params.warehouseId,
                payload: payload
            });

            logger.info({ description: 'Warehouse status updated successfully', warehouse, user: req.user });

            return res.status(200).json({
                success: true,
                statusCode: WAREHOUSE_UPDATE_SUCCESS,
                message: 'Warehouse status updated successfully',
                data: warehouse
            });
        } catch (error) {
            logger.error({ description: 'Warehouse status update failed', error, user: req.user });

            return res.status(500).json({
                success: false,
                statusCode: WAREHOUSE_UPDATE_FAILED,
                message: error.message
            });
        }
    }

    /**
     * @description: update warehouse status to inactive
     * @method: PUT
     * @url: /item/:warehouseId/in-active
     * @param {*} req
     * @param {*} res
     */
    async _makeWarehouseInActive(req, res) {
        try {
            let payload = req.body;
            const warehouseId = req.params.warehouseId;
            payload['status'] = 'INACTIVE';
            let warehouse = await warehouseService.updateWarehouseStatusWithCheck({
                warehouseId: warehouseId,
                payload: payload
            });

            logger.info({ description: 'Warehouse status updated successfully', warehouse, user: req.user });

            return res.status(200).json({
                success: true,
                statusCode: WAREHOUSE_UPDATE_SUCCESS,
                message: 'Warehouse status updated successfully',
                data: warehouse
            });
        } catch (error) {
            logger.error({ description: 'Warehouse status update failed', error, user: req.user });

            return res.status(500).json({
                success: false,
                statusCode: WAREHOUSE_UPDATE_FAILED,
                message: error.message
            });
        }
    }
}
module.exports = WarehouseController;
