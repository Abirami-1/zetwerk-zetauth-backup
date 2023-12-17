const axios = require('axios');

const { SMESInfo } = require('./ipcHeaderAndUrl');

const smesInfo = new SMESInfo();
const baseURL = smesInfo.getUrl();
const headers = smesInfo.getHeader();

async function updateSupplierDetails(user, email) {
    return await axios.put(`${baseURL}/v1/supplier-update-by-zetauth/${email}`, user, {
        headers
    });
}

module.exports = {
    updateSupplierDetails
};
