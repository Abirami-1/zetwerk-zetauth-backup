const axios = require('axios');

const { INZEInfo } = require('./ipcHeaderAndUrl');
let AUTHORIZED_HTTP_CLIENT;

async function setup() {
    const inzeInfo = new INZEInfo();
    AUTHORIZED_HTTP_CLIENT = axios.create({
        baseURL: inzeInfo.getUrl(),
        timeout: 100000,
        headers: inzeInfo.getHeader()
    });
}

async function getWarehouseStatus(warehouseId) {
    await setup();
    const path = `/inventory/inactivate-warehouse/${warehouseId}`;
    return await AUTHORIZED_HTTP_CLIENT.get(path);
}

async function updateApproversInSTC(payload) {
    await setup();
    const path = 'stc/update-stc-approver';
    return await AUTHORIZED_HTTP_CLIENT.post(path, payload);
}



module.exports = {
    getWarehouseStatus,
    updateApproversInSTC
};
