const UserRoles = require('../models/role');
const confluentKafka = require('../lib/utils/confluent-kafka');
const { CREATE_ROLE, UPDATE_ROLE, DELETE_ROLE } = require('../lib/constants/kafka-events');
const AuditLogService = new (require('../services-v2/AuditLogService'))();
const { AUDIT_LOG_ACTIONS } = require('../lib/constants/audit-log');

async function createRole(roleData) {
    
    let role = await UserRoles.create(roleData);

    confluentKafka.sendMessage('ZET-USER', {
        event: CREATE_ROLE, 
        message: 'Role Created', 
        data: role
    });
    return role;
  
}
  
async function updateRoleById(roleId, roleData, user) {
  
    const oldRoleData = await UserRoles.findOne({ _id: roleId });

    let role = await UserRoles.updateById(roleId, roleData);

    // Making audit log entry for roles
    await AuditLogService.createAuditLog({
        newData: role,
        oldData: oldRoleData,
        user,
        model: UserRoles,
        actionType: AUDIT_LOG_ACTIONS.UPDATE,
        action: AUDIT_LOG_ACTIONS.UPDATE
    });

    confluentKafka.sendMessage('ZET-USER', {
        event: UPDATE_ROLE, 
        message: 'Role Updated', 
        data: role
    });
    return role;
  
}
  
async function findRoleById(roleId) {
  
    return UserRoles.findById(roleId);
  
}
  
async function findRoleByName(roleName) {
    return UserRoles.findOne({name: roleName});
  
}
  
async function deleteRoleById(roleId, user) {
  
    let role = await UserRoles.findByIdAndDelete(roleId);

    // Making audit log entry for roles
    await AuditLogService.createAuditLog({
        newData: role,
        user,
        model: UserRoles,
        actionType: AUDIT_LOG_ACTIONS.DELETE,
        action: AUDIT_LOG_ACTIONS.DELETE
    });
    
    confluentKafka.sendMessage('ZET-USER', {
        event: DELETE_ROLE, 
        message: 'Role Deleted', 
        data: {_id: roleId}
    });
    return role;
  
}
  
async function getAllRoles() {
  
    return UserRoles.find({}).sort({name: 1});
  
}

module.exports = {
    createRole,
    deleteRoleById,
    findRoleById,
    updateRoleById,
    findRoleByName,
    getAllRoles
};