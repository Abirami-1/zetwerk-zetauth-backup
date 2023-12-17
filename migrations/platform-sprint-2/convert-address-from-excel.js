const migrationFileUrl = '';
const { readExcelFromS3 } = require('../../lib/utils/readExcel');
const companyAddressJson = {};
const fs = require('fs');
async function run() {
    let excelData = await readExcelFromS3(migrationFileUrl);

    for (const row of excelData) {
        const legalName = row['Legal Name'];
        const uniqueCode = row['Company Code'];
        if (!companyAddressJson[legalName]) {
            companyAddressJson[legalName] = {
                registeredAddresses: [],
                deliveryAddresses: [],
                uniqueCode
            };
        }
        const state = row['State'];
        const gstNumber = row['GSTIN'];
        const country = 'India';
        for (const column in row) {
            if (column === 'Main Address' || column.startsWith('APOB')) {
                const { streetName, pincode, city } = extractDetailsFromAddressString(row[column]);
                companyAddressJson[legalName].registeredAddresses.push({
                    state,
                    gstNumber,
                    country,
                    streetName,
                    pincode,
                    city,
                    isPrimary: column === 'Main Address' ? true : false
                });
            }
        }
    }

    fs.writeFileSync('legalEntityAddress.json', JSON.stringify(companyAddressJson, null, 4));
}
function extractDetailsFromAddressString(addressString) {
    const pincodeRegex = /[1-9][0-9]{5}/;
    const pincode = addressString.match(pincodeRegex)[0].trim();
    const addressStringCommaSeparated = addressString.split(',');
    const city = addressStringCommaSeparated[addressStringCommaSeparated.length - 3].trim();
    const streetName = addressStringCommaSeparated
        .slice(0, -3)
        .join(',')
        .trim();
    return { pincode, streetName, city };
}
run()
    .then()
    .catch(err => console.log(err))
    .finally(process.exit);
