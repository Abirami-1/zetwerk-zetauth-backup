/**
 * Migration script for adding companyId in factory
 * and downstream factory copies as well
 */

/*eslint indent: ["error", 2] */

const User = require('../models/user');
const db = require('../lib/utils/db');
const confluentKafka = require('../lib/utils/confluent-kafka');
const {
  CREATE_USER
} = require('../lib/constants/kafka-events');

async function run() {
  try {
    await db.connect(async () => {});
    await confluentKafka.initializeConfluentKafka();
    await confluentKafka.initializeProducer();
    await addSystemUsers();
    return;
  } catch (e) {
    console.log('Error in run Block', e);
    throw e;
  }
}

/**
 * Add system users and pass updated data to downstream to respective application.
 * @returns {Promise<void>}
 */
async function addSystemUsers() {
  try {
    const SYSTEM_USERS = [
      {
        firstName: 'ZETWERK_OMS',
        lastName: 'SYSTEM',
        email: 'zetwerk_oms.sys@zetwerk.com',
        phoneNumber: 'ZETWERK_OMS'
      },
      {
        firstName: 'ZETFAB_OMS',
        lastName: 'SYSTEM',
        email: 'zetfab_oms.sys@zetwerk.com',
        phoneNumber: 'ZETFAB_OMS'

      },
      {
        firstName: 'AGGREGATION_OMS',
        lastName: 'SYSTEM',
        email: 'aggregation_oms.sys@zetwerk.com',
        phoneNumber: 'AGGREGATION_OMS'

      },
      {
        firstName: 'ZISO',
        lastName: 'SYSTEM',
        email: 'ziso.sys@zetwerk.com',
        phoneNumber: 'ZISO'
      },
      {
        firstName: 'RFQ',
        lastName: 'SYSTEM',
        email: 'rfq.sys@zetwerk.com',
        phoneNumber: 'RFQ'
      },
      {
        firstName: 'EQS',
        lastName: 'SYSTEM',
        email: 'eqs.sys@zetwerk.com',
        phoneNumber: 'EQS'
      },
      {
        firstName: 'CMS',
        lastName: 'SYSTEM',
        email: 'cms.sys@zetwerk.com',
        phoneNumber: 'CMS'
      },
      {
        firstName: 'Customer Old',
        lastName: 'SYSTEM',
        email: 'customer.sys@zetwerk.com',
        phoneNumber: 'CUSTOMER'
      },
      {
        firstName: 'SMES',
        lastName: 'SYSTEM',
        email: 'smes.sys@zetwerk.com',
        phoneNumber: 'SMES'
      },
      {
        firstName: 'NOTIFICATION',
        lastName: 'SYSTEM',
        email: 'notification.sys@zetwerk.com',
        phoneNumber: 'NOTIFICATION'
      },
      {
        firstName: 'ISSUES',
        lastName: 'SYSTEM',
        email: 'issues.sys@zetwerk.com',
        phoneNumber: 'ISSUES'
      },
      {
        firstName: 'ZETAUTH',
        lastName: 'SYSTEM',
        email: 'zetauth.sys@zetwerk.com',
        phoneNumber: 'ZETAUTH'
      }
    ];

    for (let sysUser of SYSTEM_USERS) {
      let createdUser = await User.create({
        ...sysUser,
        userType: 'SYSTEM'
      });

      confluentKafka.sendMessage('ZET-USER', {
        event: CREATE_USER,
        message: 'User created',
        data: createdUser
      });
    }

  } catch (e) {
    console.log('Some error occurred', e);
    throw e;
  }
}



run().then(() => {
  console.log('System users created succesfully.');
});