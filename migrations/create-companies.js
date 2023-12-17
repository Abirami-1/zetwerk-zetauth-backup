/**
 * Migration script for adding companyId in factory
 * and downstream factory copies as well
 */

/*eslint indent: ["error", 2] */

const Company = require('../models/company');
const db = require('../lib/utils/db');
const confluentKafka = require('../lib/utils/confluent-kafka');
const {
  CREATE_COMPANY
} = require('../lib/constants/kafka-events');



async function run() {
  try {
    await db.connect(async () => {});
    await confluentKafka.initializeConfluentKafka();
    await confluentKafka.initializeProducer();
    await addCompanies();
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
async function addCompanies() {
  try {
    const COMPANIES = [
      {
        name: 'Zetwerk',
        slug: 'zetwerk',
        legalName: 'Zetwerk Manufacturing Businesses Private Limited',
        cinNo: 'U74999TN2017PTC119848',
        email: 'contact@zetwerk.com',
        phone: '',
        website: 'www.zetwerk.com',
        address: {
          city: 'Bengaluru',
          country: 'India',
          line1: 'Oriental Towers No.461, 1st Floor',
          line2: '17th Cross Road, 4th Sector, HSR Layout',
          pin: '560102',
          state: 'Karnataka'
        }
      },
      {
        name: 'Zetfab',
        slug: 'zetfab',
        legalName: 'Zetfab India Private Limited',
        cinNo: 'U28110KA2020PTC136347',
        email: 'contact@zetfab.com',
        phone: '',
        website: '',
        address: {
          city: 'Bengaluru',
          country: 'India',
          line1: 'Oriental Towers No.461, 1st Floor',
          line2: '17th Cross Road, 4th Sector, HSR Layout',
          pin: '560102',
          state: 'Karnataka'
        }
      },
    ];

    for (let company of COMPANIES) {
      let companyCreated = await Company.create(company);
      confluentKafka.sendMessage('ZET-COMPANY', {
        event: CREATE_COMPANY,
        message: 'New Company added',
        data: companyCreated
      });
    }

  } catch (e) {
    console.log('Some error occurred', e);
    throw e;
  }
}


run().then(() => {
  console.log('Companies created succesfully.');
});