const Users = require('../models/user');
const Role = require('../models/role');
const Application = require('../models/application');
const confluentKafka = require('../lib/utils/confluent-kafka');
const userUtils = require('../lib/utils/user');
const { CREATE_USER, UPDATE_USER, DELETE_USER } = require('../lib/constants/kafka-events');
const {
    USER_STATUS: { PENDING_ACK, ACKNOWLEDGED }
} = require('../lib/constants/user');
const { SUPPLIER: SUPPLIER_ROLE_NAME } = require('../lib/constants/roles');
const { updateSupplierDetails } = require('../lib/utils/external-smes');
const logger = require('../lib/utils/logger');
const AuditLogService = new (require('../services-v2/AuditLogService'))();
const { AUDIT_LOG_ACTIONS } = require('../lib/constants/audit-log');
const _ = require('lodash');
const { RESTRICTED_ROLES, ROLE_ACCESS_MAPPER } = require('../lib/constants/role-access');

const FIELDS_TO_POPULATE = [
    'createdByDetails',
    'updatedByDetails',
    'roleDetails',
    'appsEnabledDetails'
];

const { TOKEN_FIELDS } = require('../lib/constants/token-fields');
const { UNAUTHORIZED_ROLE_ACCESS } = require('../lib/constants/response-codes');

async function createUser(userData) {
    userData = await transformUserData(userData);
    if (userData?.roleId?.length) {
        const roleIds = userData.roleId.map(id => id.toString());
        const validationResponse = await validateUserRoleAddition(userData.updatedBy, roleIds);
        if (!validationResponse.authorisedUserCheck) {
            logger.info({
                description: 'Requesting user not authorised to provide access to this role',
                user: userData.updatedBy
            });
            const error = new Error(`You are not authorised to update ${validationResponse.restrictedAccessRoles} role`);
            error.code = 401;
            error.statusCode = UNAUTHORIZED_ROLE_ACCESS;
            throw error;
        }
    }
    let user = await Users.create(userData, FIELDS_TO_POPULATE);

    /**
     * Confluent kafka notification
     * to keep the users in sync.
     */
    if (user) {
        await sendKafkaNotificationForUserUpdate(user, CREATE_USER, 'New User created');
    }

    return user;
}

async function transformUserData(userData) {
    if (userData.roleId && Array.isArray(userData.roleId)) {
        const referencedRoles = await Role.find({ name: { $in: userData.roleId } });
        if (referencedRoles && referencedRoles.length) {
            userData.roleId = referencedRoles.map(role => role._id);
        }
    }
    if (userData.appsEnabled && Array.isArray(userData.appsEnabled)) {
        const referencedApps = await Application.find({ name: { $in: userData.appsEnabled } });
        if (referencedApps && referencedApps.length) {
            userData.appsEnabled = referencedApps.map(app => app._id);
        }
    }
    if (userData._id) {
        delete userData._id;
    }
    return userData;
}

async function updateUserById(userId, userData) {
    /**
     * TODO =>  Deprecate updating supplier details in SMES using old email-id after supplier reference Id migration is done
     */
    const oldUserDetails = await Users.findById(userId);
    if (!oldUserDetails) {
        throw new Error('User not Found');
    }
    if (userData?.roleId?.length && !userUtils.isUserRolesEqual(userData.roleId, oldUserDetails.roleId)) {
        // Get the newly added roles to the update user
        const newRoleIds = userUtils.getNewUserRoles(userData.roleId, oldUserDetails.roleId);
        // Validate the newly added roles to check if the requesting user has authority to update the role
        const validationResponse = await validateUserRoleAddition(userData.updatedBy, newRoleIds);
        if (!validationResponse.authorisedUserCheck) {
            logger.info({
                description: 'User not authorised to update this role',
                user: userData.updatedBy
            });
            const error = new Error(`You are not authorised to update ${validationResponse.restrictedAccessRoles} role`);
            error.code = 401;
            error.statusCode = UNAUTHORIZED_ROLE_ACCESS;
            throw error;
        }
        userData.passPhrase = userUtils.generateUserPassPhrase();
    }

    userData = await transformUserData(userData);
    let user = await Users.updateById(userId, userData, FIELDS_TO_POPULATE);

    if (user) {
        /**
         * If user is supplier,
         * Update Supplier Details in SMES
         */
        if (await isUser_Supplier(user)) {
            try {
                const updateSupplier = await updateSupplierDetails(user, oldUserDetails.email);

                if (!updateSupplier) {
                    throw new Error('Update Supplier Details Failed');
                }
            } catch (error) {
                logger.error({
                    description: 'Supplier Update Failed',
                    error,
                    user: user
                });
            }
        } else {
            /**
             * Confluent kafka notification
             * to keep the users in sync.
             */
            await sendKafkaNotificationForUserUpdate(user, UPDATE_USER, 'User Updated');
            
            //Creating audit log for the updated user
            await AuditLogService.createAuditLog({
                oldData: oldUserDetails,
                newData: _.cloneDeep(user),
                user: user.updatedBy,
                model: Users,
                actionType: AUDIT_LOG_ACTIONS.UPDATE,
                action: AUDIT_LOG_ACTIONS.UPDATE
            });
        }
    }
    return user;
}

async function updateUserByEmail(userEmail, userData) {
    /**
     * TODO =>  Deprecate updating supplier details in SMES using old email-id after supplier reference Id migration is done
     */
    const oldUserDetails = await Users.findOne({ email: userEmail });
    if (!oldUserDetails) {
        throw new Error('User not Found');
    }
    if (!userUtils.isUserRolesEqual(userData.roleId, oldUserDetails.roleId)) {
        userData.passPhrase = userUtils.generateUserPassPhrase();
    }

    userData = await transformUserData(userData);
    let user = await Users.findOneAndUpdate({ email: userEmail }, userData, {
        new: true
    });

    //Creating audit log for the updated user
    await AuditLogService.createAuditLog({
        oldData: oldUserDetails,
        newData: user,
        user: user.updatedBy,
        model: Users,
        actionType: AUDIT_LOG_ACTIONS.UPDATE,
        action: AUDIT_LOG_ACTIONS.UPDATE
    });
    
    if (user) {
        /**
         * If user is supplier,
         * Update Supplier Details in SMES
         */
        if (await isUser_Supplier(user)) {
            try {
                const updateSupplier = await updateSupplierDetails(user, userEmail);

                if (!updateSupplier) {
                    throw new Error('Update Supplier Details Failed');
                }
            } catch (error) {
                logger.error({
                    description: 'Supplier Update Failed',
                    error,
                    user: user
                });
            }
        } else {
            /**
             * Confluent kafka notification
             * to keep the users in sync.
             */
            await sendKafkaNotificationForUserUpdate(user, UPDATE_USER, 'User Updated');
        }
    }
    return user;
}

async function deleteUserById(userId, reqUser) {
    let user = await Users.deleteById(userId);

    //Creating audit log for the updated user
    await AuditLogService.createAuditLog({
        newData: user,
        user: reqUser,
        model: Users,
        actionType: AUDIT_LOG_ACTIONS.DELETE,
        action: AUDIT_LOG_ACTIONS.DELETE
    });
    
    /**
     * Confluent kafka notification
     * to keep the users in sync.
     */

    if (user) {
        await sendKafkaNotificationForUserUpdate(user, DELETE_USER, 'User deleted');
    }
    return user;
}

async function getAllUsers({ queryParams }) {
    let findConditions = {};

    if (queryParams.userType && queryParams.userType === 'ZETWERK') {
        let supplierRole = await Role.findOne({
            name: 'SUPPLIER'
        });

        findConditions = {
            roleId: { $ne: supplierRole._id }
        };
    } else {
        delete queryParams.userType;
    }
    if (queryParams.ipRestrictionStatus) {
        findConditions = {
            ...findConditions,
            ipRestrictionStatus: queryParams.ipRestrictionStatus
        };
    }
    const fieldsToSearch = ['firstName', 'email'];
    return Users.findAll({ fieldsToPopulate: FIELDS_TO_POPULATE, findConditions, queryParams, fieldsToSearch });
}

async function findUserById(userId) {
    return Users.findOne({ _id: userId }).populate(FIELDS_TO_POPULATE);
}

async function findUserByEmail(emailId, fields) {
    if (!fields) {
        fields = TOKEN_FIELDS;
    }
    return Users.findOne({ email: emailId }, fields);
}

async function findSupplierByEmail(emailId, fields) {
    if (!fields) {
        fields = TOKEN_FIELDS;
    }
    return Users.findOne({ email: emailId, supplierId: { $exists: true } }, fields);
}

async function findUserByPhoneNumber(phoneNumber) {
    return Users.findOne({ phoneNumber: phoneNumber }).populate(FIELDS_TO_POPULATE);
}

async function getUsersByRole({ queryParams }) {
    let findConditions = {};

    let regex = new RegExp('');
    if (queryParams.role) {
        regex = new RegExp(queryParams.role.replace(/\s/g, ''), 'i');
    }

    let FIELDS_TO_POPULATE_FOR_ROLE = [
        {
            path: 'roleDetails',
            match: {
                name: regex
            }
        }
    ];

    let users = await Users.find(findConditions).populate(FIELDS_TO_POPULATE_FOR_ROLE);
    users = users.filter(user => user.roleDetails.length > 0);
    let pageNumber = 0;
    let recordsPerPage = users.length;

    if (queryParams.pageNumber) {
        pageNumber = Number(queryParams.pageNumber) - 1;
    }
    if (queryParams.recordsPerPage) {
        recordsPerPage = Number(queryParams.recordsPerPage);
    }
    return users.slice((pageNumber - 1) * recordsPerPage, pageNumber * recordsPerPage);
}

/**
 * Create User V2
 * Assign a status to user created/upserted as ack pending
 * Only once the user is acknowledged by the responsible system
 * (eg:- For suppliers responsible system is SOS)
 * then only the user will be treated as a functional user in the system
 */
async function createUserV2(userData) {
    userData = await transformUserData(userData);
    userData = { status: PENDING_ACK, ...userData };

    let user = await Users.findOne({ email: userData.email });

    if (user) {
        if (user.status === PENDING_ACK) {
            const oldUserDetails = user;
            user = await Users.updateById(user._id, userData, FIELDS_TO_POPULATE);
            //Creating audit log for the updated user
            await AuditLogService.createAuditLog({
                oldData: oldUserDetails,
                newData: _.cloneDeep(user),
                user: user.updatedBy,
                model: Users,
                actionType: AUDIT_LOG_ACTIONS.UPDATE,
                action: AUDIT_LOG_ACTIONS.UPDATE
            });
            
        } else {
            throw new Error('Cannot Create User. User Email Already EXISTS !');
        }
    } else {
        user = await Users.create(userData, FIELDS_TO_POPULATE);
    }

    return user;
}

async function acknowledgeUserCreation(userId, user) {
    const oldUserDetails = await Users.findOne({ _id: userId });

    const updatedUser = await Users.findOneAndUpdate(
        { _id: userId, status: PENDING_ACK },
        { $set: { status: ACKNOWLEDGED } },
        { new: true }
    );

    if(updatedUser) {
        //Creating audit log for the updated user
        await AuditLogService.createAuditLog({
            oldData: oldUserDetails,
            newData: _.cloneDeep(updatedUser),
            user,
            model: Users,
            actionType: AUDIT_LOG_ACTIONS.UPDATE,
            action: 'ACKNOWLEDGE_USER_CREATION'
        });
    }

    return updatedUser;
}

async function sendUserPasswordMail() {
    return;
    /* 
        Supplier user email has been deprecated. 
        Will be moved to messaging service.
    
    await kafka._sendMessage('SOS-EMAIL', {
        type: 'SOS',
        subtype: 'SUPPLIER_PASSWORD',
        data: {
            email: userData.email,
            name: `${userData.firstName} ${userData.lastName || ''}`,
            password: userData.password
        }
    }); */
}

async function sendKafkaNotificationForUserUpdate(user, event, message = 'Notification Sent Successfully') {
    if (!user || !event) {
        throw new Error('Insufficient Data for sending notification');
    }

    if (user && !(await isUser_Supplier(user))) {
        confluentKafka.sendMessage('ZET-USER', {
            event,
            message,
            data: user
        });
    }
}

async function isUser_Supplier(user) {
    const supplierRoleId = (await Role.findOne({ name: SUPPLIER_ROLE_NAME }))?._id.toString();

    return user.roleId
        .join(',')
        .split(',')
        .includes(supplierRoleId);
}

async function updateNotificationTokens({ appName, appId, token, userId }) {
    const user = await findUserById(userId);

    user.notificationTokens = user.notificationTokens ? user.notificationTokens : {};
    let updatedTokens;
    if (user.notificationTokens[appName] && user.notificationTokens[appName].tokens.length) {
        updatedTokens = [...new Set([...user.notificationTokens[appName].tokens, token])];
    } else {
        updatedTokens = [token];
    }
    user.notificationTokens[appName] = {
        appId,
        tokens: updatedTokens
    };

    return updateUserById(userId, user);
}

async function deleteNotificationTokens({ appName, tokens, userId }) {
    // Find the user notification token inorder to update
    const user = await findUserById(userId);

    user.notificationTokens = user.notificationTokens ? user.notificationTokens : {};
    let updatedTokens = [];
    if (user.notificationTokens[appName] && user.notificationTokens[appName].tokens.length) {
        const userTokens = user.notificationTokens[appName].tokens;
        updatedTokens = userTokens.filter(userToken => !tokens.includes(userToken));
    }
    user.notificationTokens[appName] = {
        ...user.notificationTokens[appName],
        tokens: updatedTokens
    };

    return updateUserById(userId, user);
}

async function validateUserRoleAddition(requestUserId, roleIds) {
    const requestUserRoleIds = await Users.distinct('roleId', { _id: requestUserId });
    let validationResponse = { authorisedUserCheck: true};
    if (Array.isArray(roleIds) && Array.isArray(requestUserRoleIds)) {
        const requestorReferencedRoles = await Role.distinct('name', { _id: { $in: requestUserRoleIds } });
        const userReferencedRoles = await Role.distinct('name', { _id: { $in: roleIds } });
        const restrictedAccessRoles = userReferencedRoles.filter(role => Object.keys(RESTRICTED_ROLES).includes(role));
        let allPermisions = [];
        // Getting all the permissions the requestor based based on his roles based on ROLE_ACCESS_MAPPER
        for (const role of requestorReferencedRoles) {
            if (Object.keys(RESTRICTED_ROLES).includes(role)) {
                allPermisions = [...allPermisions, ...(ROLE_ACCESS_MAPPER[role] || [])];
            }
        }

        if (restrictedAccessRoles.length) {
            let canAuthorizeRoles = [];
            for (const userRole of restrictedAccessRoles) {
                if (allPermisions.includes(userRole)) {
                    canAuthorizeRoles.push(userRole);
                }
            }
            // checking the length of roles with restricted access and if requestor has access to those roles
            validationResponse.authorisedUserCheck = restrictedAccessRoles.length === canAuthorizeRoles.length;
            validationResponse.restrictedAccessRoles = restrictedAccessRoles;
        }
    }
    
    return validationResponse;
}

module.exports = {
    createUser,
    getUsersByRole,
    findUserByPhoneNumber,
    findUserByEmail,
    findUserById,
    getAllUsers,
    deleteUserById,
    updateUserByEmail,
    updateUserById,
    createUserV2,
    acknowledgeUserCreation,
    sendUserPasswordMail,
    updateNotificationTokens,
    deleteNotificationTokens,
    findSupplierByEmail,
    sendKafkaNotificationForUserUpdate,
    isUser_Supplier,
    updateSupplierDetails
};
