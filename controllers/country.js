const Country = require('../models/country');

const logger = require('../lib/utils/logger');

const {
    FETCH_COUNTRIES_SUCCESS,
    FETCH_COUNTRIES_FAILED
} = require('../lib/constants/response-codes');

async function getAllCountries(options) {

    return await Country.findAll(options);

}

async function _getAllCountries(req, res) {
    try {
        let queryParams = {
            searchText: req.query.searchText,
            pageNumber: req.query.pageNumber,
            recordsPerPage: req.query.recordsPerPage
        };

        let fieldsToSearch = ['name'];

        let {
            allDocuments,
            meta
        } = await getAllCountries({
            queryParams,
            fieldsToSearch
        });

        logger.info({
            description: 'Countries are fetched successfully',
            user: req.user
        });

        return res.status(200).json({
            success: true,
            statusCode: FETCH_COUNTRIES_SUCCESS,
            message: 'Countries are fetched successfully',
            meta,
            data: allDocuments
        });

    } catch (error) {

        logger.error({
            description: 'Countries Fetch Failed',
            error,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            statusCode: FETCH_COUNTRIES_FAILED,
            message: error.errmsg || error.errors || error.message
        });

    }
}

async function _setActiveCountries(req, res) {
    try {
        let activeCountriesList = req.body.countries;
        let countryUpdated = [];
        let countryFailedToUpdate = [];
        for (let country of activeCountriesList) {
            let activeCountry = await Country.findOneAndUpdate({
                $or: [{
                    name: country
                }, {
                    alpha2: country
                }, {
                    alpha3: country
                }]
            }, {
                $set: {
                    deleted: false
                }
            });
            if (!activeCountry) {
                countryFailedToUpdate.push(country);
            } else {
                countryUpdated.push(country);
            }
        }
        logger.error({
            description: 'Countries updated Successfully',
            activeCountriesList,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            statusCode: FETCH_COUNTRIES_SUCCESS,
            message: 'Countries updated successfully',
            data: {
                countryFailedToUpdate,
                countryUpdated
            }
        });
    } catch (error) {
        logger.error({
            description: 'Update Countries Failed',
            error,
            user: req.user
        });

        return res.status(400).json({
            success: false,
            statusCode: FETCH_COUNTRIES_FAILED,
            message: error.errmsg || error.errors || error.message
        });
    }
}

module.exports._getAllCountries = _getAllCountries;
module.exports._setActiveCountries = _setActiveCountries;