const AUDIT_LOG_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE'
};

const FILTER_KEYS = ['businessUnitDetails', 'auditLogDetails', 'updatedByDetails', 'createdByDetails', 'appsEnabledDetails', 'roleDetails'];

module.exports = { AUDIT_LOG_ACTIONS, FILTER_KEYS };
