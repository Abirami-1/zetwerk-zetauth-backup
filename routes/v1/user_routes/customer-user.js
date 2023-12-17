const express = require('express');
const router = express.Router();

const CustomerUserController = require('../../../controllers/customer-user');

router.get('/customer-users/:customerUserId', CustomerUserController._getCustomerUser);

router.post('/customer-users/:customerUserId/address', CustomerUserController._addAddress);

router.put('/customer-users/:customerUserId/address', CustomerUserController._updateAddress);

router.put('/customer-users/:customerUserId/address/delete', CustomerUserController._deleteAddress);

module.exports = router;