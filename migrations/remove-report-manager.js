const User = require('../models/user');
const Role = require('../models/role');
const confluentKafka = require('../lib/utils/confluent-kafka');
const { UPDATE_USER } = require('../lib/constants/kafka-events');
const { REPORT_MANAGERS } = require('../lib/constants/report-managers');
const db = require('../lib/utils/db');

async function run() {
    await db.connect(async () => {});
    await confluentKafka.initializeConfluentKafka();
    await confluentKafka.initializeProducer();
    await db.setupHelpers();
    const userEmails = REPORT_MANAGERS;
    const userRole = await Role.findOne({ name: 'REPORT_MANAGER' });
    const users = await User.find();
    const userRoleId = userRole._id;
    console.log({ userRoleId });
    await removeOrAddRolesFromUser({ emails: userEmails, users, roleId:  userRoleId });
    console.log('%c  !Done', 'background: #222; color: #bada55');

    process.exit();
}

async function removeOrAddRolesFromUser({ emails, users, roleId }) {
    for (let user of users) {
        let isUserDataChanged = false;
        const matchingUserIndex = emails.findIndex(ele => ele === user.email);
        if (matchingUserIndex > -1) {
            const matchingIndexOfRole = user.roleId.findIndex((ele) => String(ele) === String(roleId));
            if (matchingIndexOfRole === -1) {
                user.roleId.push(roleId);
                isUserDataChanged = true;
            }
        } else {
            const matchingIndexOfRole = user.roleId.findIndex((ele) => String(ele) === String(roleId));
            if (matchingIndexOfRole > -1) {
                user.roleId.splice(matchingIndexOfRole, 1);
                isUserDataChanged = true;
            }
        }
        if (isUserDataChanged) {
            const updatedData = await User.updateById(user._id, user);

            await confluentKafka.sendMessage('ZET-USER', {
                event: UPDATE_USER,
                message: 'User Updated',
                data: updatedData
            });

            console.log(`Permission updated for user ${user.email}`);
        }
    }
}


run();