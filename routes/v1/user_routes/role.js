const express = require('express');
const router = express.Router();

const roleController = require('../../../controllers/role');

router.post('/roles', roleController._createRole);

router.get('/roles', roleController._getAllRoles);

router.get('/roles/roleName/:roleName', roleController._getRoleByName);

router.get('/roles/:roleId', roleController._getRoleById);

router.put('/roles/:roleId', roleController._updateRoleById);

router.delete('/roles/:roleId', roleController._deleteRoleById);

module.exports = router;