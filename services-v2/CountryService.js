const { axiosClient } = require('../lib/utils/axios');
const config = require('config');
class CountryService{
    constructor() {
        this.baseUrl = config.get('commonMasters.baseUrl');
        this.httpClient = axiosClient({ baseURL: this.baseUrl });
    }

    async getCountryByISO(countryISO) {
        try {
            const response = await this.httpClient.get(`geo/country?iso3=${countryISO}`);
            return response && response.data && response.data.data[0];
        } catch(error) {
            throw Error(`Invalid country name : ${countryISO}`);
        }
    }

    async getStateByCountry({countryId, stateCode}) {
        try {
            const response = await this.httpClient.get(`geo/state?countryId=${countryId}&stateCode=${stateCode}`);
            return response && response.data && response.data.data[0];
        } catch(error) {
            throw Error(`Invalid state name : ${countryId}, ${stateCode}`);
        }
    }

    async getCityByCountryAndState({countryId, stateId, name}) {
        try {
            const response = await this.httpClient.get(`geo/city?countryId=${countryId}&stateId=${stateId}&searchText=${name}&getAllDocuments=true`);
            return response && response.data && response.data.data.allDocuments[0];
        } catch(error) {
            throw Error(`Invalid City name : ${countryId}, ${stateId}, ${name}`);
        }
    }
}

module.exports = CountryService;