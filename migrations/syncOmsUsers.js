/** Migration script to sync users between OMS and zetauth
 * PRE-CONDITION : Place zetwerk-oms db in zetauth/cauth db
*/
const mongoose = require('mongoose');
const config = require('config');
const ObjectId = mongoose.Types.ObjectId;

async function run() {

    try {
        const url1 =
                'mongodb+srv://' +
                config.get('db.username') +
                ':' +
                config.get('db.password') +
                '@' +
                config.get('db.host') +
                '/' + 'zetwerk-auth';
        var cAuthConn = mongoose.createConnection(url1).asPromise();
  
        const url2 =
                'mongodb+srv://' +
                config.get('dbOMS.username') +
                ':' +
                config.get('dbOMS.password') +
                '@' +
                config.get('dbOMS.host') +
                '/' + 'zetwerk-oms';
        
        var omsConn = mongoose.createConnection(url2).asPromise();
  
        if(await verifyRoles(cAuthConn, omsConn)){
            await addUsers(cAuthConn, omsConn);
            await syncExistingUsers(cAuthConn, omsConn);
        }
        else{
            console.log('ERROR: MIGRATION DID NOT RUN AS ROLES ARE NOT IN SYNC');
        }
        
        console.log('Migration Complete. Press Ctrl-C to exit');
    } catch (error) {
        console.log('Migration Failed with error.', error ,' Press Ctrl-C to exit');
    }
}

async function verifyRoles(cAuthConn, omsConn) {
    try {
        let cAuthRoles = await cAuthConn.collection('roles').find();
        let cAuthRoleArray = await cAuthRoles.toArray();

        let omsRoles = await omsConn.collection('user-roles').find();
        let omsRoleArray = await omsRoles.toArray();
    
        let flag = true;
        let missingRolesCount = 0;

   
        for( let omsRole of omsRoleArray ){
      
            const found = cAuthRoleArray.filter(
                (cauthRole) =>{
                    if (String(cauthRole._id) === String(omsRole._id) && cauthRole.name === omsRole.name && cauthRole.title === omsRole.title){
                        return true;
                    }
                    else {
                        return false;
                    }    
                } 
            );
            if(!found.length){
                console.log('This role is missing in Cauth : ', omsRole);
                flag = false;
                missingRolesCount++;
            }
        
        
        }
        console.log('Missing Roles: ', missingRolesCount );
        return flag;

    } catch (error) {
        console.log('Error At verifyRoles:', error);
        return false;
    }
    
}

async function syncExistingUsers(cAuthConn, omsConn){
    try {
        let omsUsers = await omsConn.collection('users').find({deleted:false});
        let omsUserArray = await omsUsers.toArray();
        let updateUser = 0, queryMatch = 0;
    
        for(let omsUser of omsUserArray){
            let updateMe = await cAuthConn.collection('users').findOne({email: omsUser.email, roleId: {$ne: omsUser.roleId} , deleted: false });
            if(updateMe){
            // console.log('role-diff', updateMe.roleId, omsUser.roleId);
                let existingRoleSet = new Set(updateMe.roleId.map(e=> String(e)));
                omsUser.roleId.forEach(element => {
                    existingRoleSet.add(String(element));
                });
                let newRoleArray = Array.from(existingRoleSet);
                if(newRoleArray.length!= updateMe.roleId.length){
                    //console.log(updateMe._id,'cauth role', updateMe.roleId,'oms-role', omsUser.roleId,'merged-role', newRoleArray );
                    updateUser++;
                    let newRoleArrayOfObjecIds = newRoleArray.map(r => ObjectId(r));
                    await cAuthConn.collection('users').findOneAndUpdate({ _id: ObjectId( String(updateMe._id))}, {$set : {roleId : newRoleArrayOfObjecIds}});  
                }
                queryMatch++;
            }
        }
        console.log('Users updated:', updateUser, 'Query Matched:', queryMatch);
    } catch (error) {
        console.log('Error at Sync User', error);
    }
}

async function addUsers(cAuthConn, omsConn) {
    try {
        let omsUsers = await omsConn.collection('users').find({deleted:false});
        let omsUserArray = await omsUsers.toArray();
        let addedUser = 0;
    
        for(let omsUser of omsUserArray){
            let found = await cAuthConn.collection('users').findOne({ $or : [{email: omsUser.email}, {_id: ObjectId( String(omsUser._id))}] , deleted: false });
       
            if(found){
            //console.log(omsUser.email, found.email, omsUser._id, found._id);
            }
            else{
           
                let createdUser = await cAuthConn.collection('users').insertOne(omsUser);
                console.log('user_created', createdUser && createdUser.email, omsUser.email);
                addedUser++;
            
            }
        }

        console.log('new users added ', addedUser); 
    } catch (error) {
        console.log('Error at add users ', error); 
    }
}


run();