const axios = require('axios');
const { SMESInfo } = require('../utils/ipcHeaderAndUrl');

let AUTHORIZED_HTTP_CLIENT;

async function setup() {
    const smesInfo = new SMESInfo();
    AUTHORIZED_HTTP_CLIENT = axios.create({
        baseURL: smesInfo.getUrl(),
        timeout: 100000,
        headers: smesInfo.getHeader()
    });
}

async function _getSupplierByEmail(email) {
    await setup();

    const path = `/v1/suppliers/details/${email}`;

    const response = await AUTHORIZED_HTTP_CLIENT.get(path);

    return response.data.data;
}

module.exports._getSupplierByEmail = _getSupplierByEmail;
