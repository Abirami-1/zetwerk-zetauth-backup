const db = require('../lib/utils/db');
const RolesModel = require('../models/role');
const ApplicationModel = require('../models/application');
const CompanyModel = require('../models/company');
const confluentKafka = require('../lib/utils/confluent-kafka');
const dbHelpers = require('../lib/utils/setup-db-helpers');
const { readDataFromS3PublicUrl } = require('../lib/utils/readExcel');
const excelWorker = require('../lib/utils/worker');
const userService = require('../services/user');
const logger = require('../lib/utils/logger');
const Users = require('../models/user');
const { CREATE_USER, UPDATE_USER } = require('../lib/constants/kafka-events');
const { updateSupplierDetails } = require('../lib/utils/external-smes');
const minimist = require('minimist');

async function run() {
    await db.connect(async () => {}).catch(error => console.log(error));
    await dbHelpers.setup();
    await confluentKafka.initializeConfluentKafka();
    await confluentKafka.initializeProducer();
    await createOrUpdateBulkUsers();
    console.log('Migration complete');
    process.exit();
}

async function createOrUpdateBulkUsers() {
    try {
        const parsedArgs = minimist(process.argv.slice(2));
        if(!parsedArgs.s3Url){
            throw new Error('Pass S3 File URL to process users data');
        }
        const s3Url = parsedArgs.s3Url;
        const parsedUsersData = await readDataFromS3PublicUrl(s3Url);
        const allRoles = await RolesModel.find({}, 'name title'); 
        const allApplications = await ApplicationModel.find({}, 'name');
        const allCompanies = await CompanyModel.find({}, 'name slug');
        const adminUser = await Users.findOne({email:'admin@zetwerk.com'}, '_id email');
        if(!adminUser){
            throw new Error('There is no admin user available');
        }
        if(parsedUsersData.length>100){
            return 'Please limit rows to 100 only!';
        }
        const validUsers = [];
        const allUsers = [];
        let isErrors = false;
        for (let user of parsedUsersData) {
            let remarks = [];
            let validUser = {
                roleId: [],
                appsEnabled: [],
                companies: [],
                email: '',
                firstName: '',
                lastName: '',
                phoneNumber: '',
                createdBy: adminUser._id,
                updatedBy: adminUser._id
            };
            user['Action'] = user['Action'] ? user['Action'].toUpperCase() : '';
            const validDataResponse = checkValidData({ user});
            if(validDataResponse.length > 0){
                remarks.push(validDataResponse);
            }
            validUser.email = user['Email ID*'] && user['Email ID*'].trim();
            validUser.firstName = user['First Name'] && user['First Name'].trim();
            validUser.lastName = user['Last Name'] && user['Last Name'].trim();
            validUser.phoneNumber = user['Phone No.'];
            let userExists = await checkIfUserExists({ email: validUser.email });
            let UserRoles = user['User roles'];
            UserRoles = UserRoles ? UserRoles.split(',') : [];
            let invalidUserRoles = [];
            UserRoles = UserRoles.filter(userRole => {
                if (userRole.length > 0) {
                    userRole = userRole.trim();
                    const { isRoleExists, roleId } = checkValidRole({ allRoles, userRole });
                    if (!isRoleExists) {
                        invalidUserRoles.push(userRole);
                        return false;
                    } else {
                        validUser.roleId.push(roleId);
                    }
                } else {
                    return false;
                }
                return true;
            });
            invalidUserRoles.length && remarks.push(`Invalid roles available - ${invalidUserRoles.join(',')}`);

            let appsEnabled = user['Apps Enabled'];
            appsEnabled = appsEnabled ? appsEnabled.split(',') : [];
            let invalidApps = [];
            appsEnabled.filter(userApp => {
                if (userApp.length > 0) {
                    userApp = userApp.trim();
                    const { isAppExists, appId } = checkValidApplications({
                        allApplications,
                        userApp
                    });
                    if (!isAppExists) {
                        invalidApps.push(userApp);
                        return false;
                    } else {
                        validUser.appsEnabled.push(appId);
                    }
                } else {
                    return false;
                }
                return true;
            });

            invalidApps.length && remarks.push(`Invalid Apps available - ${invalidApps.join(',')}`);

            let companies = user['Company'];
            companies = companies ? companies.split(',') : [];
            let invalidCompanies = [];
            companies.filter(userCompany => {
                if (userCompany.length > 0) {
                    userCompany = userCompany.trim();
                    const { isCompanyExists, companyData } = checkValidCompanies({
                        allCompanies,
                        userCompany
                    });
                    if (!isCompanyExists) {
                        invalidCompanies.push(userCompany);
                        return false;
                    } else {
                        companyData['companyId'] = companyData._id;
                        validUser.companies.push(companyData);
                    }
                } else {
                    return false;
                }
                return true;
            });
            invalidCompanies.length &&
                remarks.push(`Invalid Companies available - ${invalidCompanies.join(',')}`);
            if (user['Action'] == 'CREATE' && userExists) {
                remarks.push('User Already Exists in the system for create operation!');
            } else if( user['Action'] == 'UPDATE' && !userExists ){
                remarks.push('User does not exists in the system for update operation!');
            } 
            if(remarks.length != 0){
                user.remarks = remarks.join(', ');
                isErrors = true;
            }else{
                validUser['Action'] = user['Action'];
                validUsers.push(validUser);
            }
            allUsers.push(user);
        }
        if(!isErrors){
            for (let user of validUsers){
                if (user['Action'] == 'CREATE') {
                    delete user['Action'];
                    await createUser({ userData: user });
                } else if (user['Action'] == 'UPDATE') {
                    delete user['Action'];
                    await updateUser({ userData: user });

                }
            }
        }


        if (allUsers.length > 0) {
            const errorReportUrl = await generateErrorReport(allUsers);
            logger.error({
                description: 'Error Report URL',
                errorReportUrl
            });
        }
    } catch (err) {
        logger.error({
            description: 'Error In Create Or Update Bulk Users',
            err
        });
    }

}

function checkValidRole({ allRoles , userRole}) {
    let isRoleExists = false;
    let roleId = null;
    for (let role of allRoles) {
        if (role.name == userRole) {
            isRoleExists = true;
            roleId = role._id;
            break;
        }
    }
    return { isRoleExists, roleId};
}
function checkValidApplications({ allApplications, userApp }){
    let isAppExists = false;
    let appId = null;
    for (let app of allApplications) {
        if (app.name == userApp) {
            isAppExists = true;
            appId = app._id;
            break;
        }
    }
    return {isAppExists, appId};
}
function checkValidCompanies({ allCompanies , userCompany}) {
    let isCompanyExists = false;
    let companyData = null;
    for (let company of allCompanies) {
        if (company.name == userCompany) {
            isCompanyExists = true;
            companyData = JSON.parse(JSON.stringify(company));
            companyData['companyId'] = companyData._id;
            break;
        }
    }
    return {isCompanyExists, companyData};
}

async function checkValidZetwerkEmail({ email }){
    // eslint-disable-next-line no-useless-escape
    var re = /^([\w-\.\+W]+@([\w-]+\.)+[\w-]{2,4})?$/;
    if (!re.test(email)) {
        return false;
    }
    let emailSplits = email.split('@');
    return email && emailSplits[1].toLowerCase() == 'zetwerk.com';
}

function checkValidPhoneNumber({ phoneNumber }) {
    return phoneNumber.toString().trim().length == 10;
}

async function createUser({ userData }){
    let user = await Users.create(userData);

    if (user) {
        await sendKafkaNotificationForUserUpdate(user, CREATE_USER, 'New User created');
    }
    console.log('Created User:',user.email);
}

async function checkIfUserExists({ email }){
    let user = await Users.findOne({ email });
    if(!user){
        return false;
    }
    return true;
}

async function updateUser({ userData }) {
    let user = await Users.findOneAndUpdate({ email: userData.email }, userData, {
        new: true
    });

    if (user) {
        /**
         * If user is supplier,
         * Update Supplier Details in SMES
         */
        if (await userService.isUser_Supplier(user)) {
            try {
                const updateSupplier = await updateSupplierDetails(user, userData.userEmail);

                if (!updateSupplier) {
                    logger.error({
                        description: 'Update Supplier Details Failed',
                        user: user,
                        supplier:updateSupplier
                    });
                    console.log('Update Supplier Details Failed', updateSupplier);
                    // throw new Error('Update Supplier Details Failed');
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
}

function checkValidData({ user }) {
    let validUserActions = ['CREATE','UPDATE'];
    let errors = [];
    if(!user['Email ID*']){
        errors.push('Email Column does not exists!');
    }else{
        if (!checkValidZetwerkEmail({ email: user['Email ID*'] })) {
            errors.push(`Invalid Email available - ${user['Email ID*']}`);
        }
    }
    if(user['Action'].length==0){
        errors.push('Action Value does not exists!');
    }else{
        if (!validUserActions.includes(user['Action'])) {
            errors.push(`Invalid Action -  ${user['Action']} for user ${user['Email ID*']}`);
        }
    }
    if (!user['First Name']){
        errors.push('First Name Column does not exists!');
    } 
    if (!user['Last Name']) {
        errors.push('Last Name Column does not exists!');
    } 
    if (!user['Phone No.']) {
        errors.push('Phone No. Column does not exists!');
    }else{
        if (!checkValidPhoneNumber({ phoneNumber: user['Phone No.'] })) {
            errors.push(`Invalid Phone Number available - ${user['Phone No.']}`);
        }
    }
    return errors.join(', ');
}

async function generateErrorReport(data){
    try {
        const headers = [
            { name: 'Action', title: 'Action' },
            { name: 'First Name', title: 'First Name' },
            { name: 'Last Name', title: 'Last Name' },
            { name: 'Email ID*', title: 'Email ID*' },
            { name: 'Phone No.', title: 'Phone No.' },
            { name: 'User roles', title: 'User roles' },
            { name: 'Apps Enabled', title: 'Apps Enabled' },
            { name: 'Company', title: 'Company' },
            { name: 'remarks', title: 'remarks' }
        ];
        let rows = data;
        
        let result = await excelWorker.generateExcel({
            worksheetName: 'users-error-report',
            headers,
            rows
        });

        return {
            url: result.Location
        };

    } catch (error) {
        logger.error({
            description: 'Generate user error report failed',
            error
        });

        throw error;
    }
}
async function sendKafkaNotificationForUserUpdate(user, event, message = 'Notification Sent Successfully') {
    if (!user || !event) {
        logger.error({
            message: 'Insufficient Data for sending notification'
        });
        // throw new Error('Insufficient Data for sending notification');
    }

    if (user && !(await userService.isUser_Supplier(user))) {
        await confluentKafka.sendMessage('ZET-USER', {
            event,
            message,
            data: user
        });
    }
}
run();
