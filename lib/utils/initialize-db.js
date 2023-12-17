const User = require('../../models/user');
const Role = require('../../models/role');
const Application = require('../../models/application');
const logger = require('./logger');

async function addUser() {
    try {
        let users = await User.find({}) || [];

        if (!users || !users.length) {

            let userData = [{
                firstName: 'Admin',
                email: 'admin@zetwerk.com',
                phoneNumber: 8093107592,
                appsEnabled: []
            }, {
                firstName: 'Test',
                email: 'testsupplier@zetwerk.com',
                phoneNumber: 9999999999,
                appsEnabled: []
            }];

            let createdUsers = User.insertMany(userData);
            logger.info({ description: 'Admin User Created Successfully', createdUsers });
        }
    } catch (error) {
        logger.error({ description: 'User Creation Failed', error });
    }
}

async function addRoles(){
    try{
        let roles = await Role.find({}) || [];
        if(!roles || !roles.length){
            roles = [{
                name: 'PLANNING ENGINEER',
                title: 'Planning Engineer'
            },{
                name: 'PROJECT HEAD',
                title: 'Project Head'
            },{
                name: 'REGIONAL HEAD',
                title: 'Regional Head'
            },{
                name: 'PROJECT MANAGER',
                title: 'Project Manager'
            },{
                name: 'SALES HEAD',
                title: 'Sales Head'
            },{
                name: 'REGIONAL SALES HEAD',
                title: 'Regional Sales Head'
            },{
                name: 'SALES MANAGER',
                title: 'Sales Manager'
            },{
                name: 'SALES EXECUTIVE',
                title: 'Sales Executive'
            },{
                name: 'FINANCE HEAD',
                title: 'Finance Head'
            },{
                name: 'AR EXECUTIVE',
                title: 'AR Executive'
            },{
                name: 'AP EXECUTIVE',
                title: 'AP Executive'
            },{
                name: 'PROJECT CONTROLLER',
                title: 'Project Controller'
            },{
                name: 'SUPPLY HEAD',
                title: 'Supply Head'
            },{
                name: 'SUPPLY OPERATIONS MANAGER',
                title: 'Supply Operations Manager'
            },{
                name: 'PURCHASE MANAGER',
                title: 'Purchase Manager'
            },{
                name: 'SUPPLY EXECUTIVE',
                title: 'Supply Executive'
            },{
                name: 'SUPPLY ONBOARDING MANAGER',
                title: 'Supply Onboarding Manager'
            },{
                name: 'MANAGEMENT',
                title: 'Management'
            },{
                name: 'ADMIN',
                title: 'Admin'
            }];

            await Role.insertMany(roles);
            console.log('Roles added successfully');
            logger.info({ description: 'Roles added Successfully', roles });
        }
    } catch(error) {
        logger.error({ description: 'Failed to add roles', error });
    }
}

async function addApplications(){
    try{
        let applications = await Application.find({}) || [];
        if(!applications || !applications.length){
            applications = [{
                name: 'OMS'
            },{
                name: 'ZIRA'
            },{
                name: 'ZISO'
            },{
                name: 'ZETPRO'
            },{
                name: 'ZUPPLY'
            }];

            await Application.insertMany(applications);
            console.log('Applications added successfully');
            logger.info({ description: 'Applications added Successfully', applications });
        }
    } catch(error) {
        logger.error({ description: 'Failed to add applications', error });
    }
}

module.exports = {
    addUser,
    addRoles,
    addApplications
};