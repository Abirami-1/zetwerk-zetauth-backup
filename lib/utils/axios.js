const axios = require('axios');
const axiosClient = function ({ baseURL, headers }) {
    return axios.create({
        baseURL,
        timeout: 100000,
        headers
    });
};

module.exports.axiosClient = axiosClient;
