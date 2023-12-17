const logger = require('../lib/utils/logger');
const CustomerUserService = require('../services/customer-user');

async function _getCustomerUser(req, res) {
    try {
        const customerUserId = req.params.customerUserId;

        const address = await CustomerUserService.getCustomerUser(customerUserId);

        return res.status(200).json({
            success: true,
            message: 'Address is updated successfully',
            data: address
        });
    } catch (error) {
        logger.error({
            description: 'Update User failed',
            error,
            user: req.user
        });

        return res.status(error.code || 500).json({
            success: false,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _addAddress(req, res) {
    try {
        const customerUserId = req.params.customerUserId;

        const address = await CustomerUserService.addAddress(customerUserId, req.body);
        return res.status(200).json({
            success: true,
            message: 'Address is updated successfully',
            data: address
        });
    } catch (error) {
        logger.error({
            description: 'Update User failed',
            error,
            user: req.user
        });

        return res.status(error.code || 500).json({
            success: false,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _updateAddress(req, res) {
    try {
        const customerUserId = req.params.customerUserId;
        const address = await CustomerUserService.updateAddress(customerUserId, req.body);
        return res.status(200).json({
            success: true,
            message: 'Address is updated successfully',
            data: address
        });
    } catch (error) {
        logger.error({
            description: 'Update User failed',
            error,
            user: req.user
        });

        return res.status(error.code || 500).json({
            success: false,
            message: error.errmsg || error.errors || error.message
        });
    }
}

async function _deleteAddress(req, res) {
    try {
        const customerUserId = req.params.customerUserId;

        console.log(req.body);

        const address = await CustomerUserService.deleteAddress(customerUserId, req.body);
        return res.status(200).json({
            success: true,
            message: 'Address is deleted successfully',
            data: address
        });
    } catch (error) {
        logger.error({
            description: 'Update User failed',
            error,
            user: req.user
        });

        return res.status(error.code || 500).json({
            success: false,
            message: error.errmsg || error.errors || error.message
        });
    }
}



module.exports = {
    _addAddress,
    _updateAddress,
    _getCustomerUser,
    _deleteAddress
};
