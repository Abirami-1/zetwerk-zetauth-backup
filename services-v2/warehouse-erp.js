const DefaultService = require('@zetwerk/zetapp/services/DefaultService');
const { ExcelToJson } = require('@zetwerk/zet-common-utilites');
const { genereateExcel } = require('../lib/utils/excel');
const { getExcelFileFromS3 } = require('../lib/utils/file');
const fs = require('fs').promises;
const CompanyService = require('../services/company');
const SiteModel = require('../models/site');
const mongoose = require('mongoose');

class WarehouseErpService extends DefaultService {
    constructor() {
        super('warehouse-erp');
        this.companyService = new CompanyService();
    }

    async handleExcelUpload(agendaJob) {
        const fileKey = agendaJob?.attrs?.data?.fileKey;
        const userId = agendaJob?.attrs?.data?.userId;
        const companyData = agendaJob?.attrs?.data?.company;
        if (!fileKey) {
            throw new Error('Cannot process job without fileKey');
        }
        if (!userId) {
            throw new Error('Cannot process job without user id');
        }
        if (!companyData) {
            throw new Error('Cannot process job without company');
        }

        const company = await this.companyService.getCompanyById(companyData._id);

        if (!company) {
            throw new Error(`Company doesn't exist ${companyData._id}`);
        }

        const { filePath } = await getExcelFileFromS3({ fileName: fileKey, tempFileName: 'Warehouse_master.xlsx' });
        const { Warehouses_ZW: warehousesFromExcel } = ExcelToJson({
            sourceFile: filePath,
            sheets: ['Warehouses_ZW'],
            columnToKey: {
                A: 'company.uniqueCode',
                B: 'siteCode',
                C: 'warehouseCode',
                D: 'name',
                E: 'category',
                F: 'type',
                G: 'gstNumber',
                H: 'vendorCode',
                K: 'cityName',
                L: 'countryISO',
                N: 'addressDescription',
                Q: 'locationRoles',
                U: 'stateCode',
                V: 'street',
                W: 'pincode'
            },
            header: { rows: 1 }
        });
        await fs.unlink(filePath);

        const { totalCount, createdCount, updatedCount, errorCount, reportRows } = await this.createUpdateWarehouses({
            warehouses: warehousesFromExcel,
            userId,
            company
        });
        let s3ErrorCSVUrl;
        s3ErrorCSVUrl = await genereateExcel({
            headers: [
                { title: 'Legal Entitiy ID', name: 'company' },
                { title: 'OPERATIONALSITEID', name: 'siteCode' },
                { title: 'WAREHOUSEID', name: 'warehouseCode' },
                { title: 'WAREHOUSENAME', name: 'name' },
                { title: 'Category', name: 'category' },
                { title: 'WAREHOUSETYPE', name: 'type' },
                { title: 'GST Number', name: 'gstNumber' },
                { title: 'VendorCode', name: 'vendorCode' },
                { title: 'PRIMARYADDRESSCITY', name: 'cityName' },
                { title: 'PRIMARYADDRESSCOUNTRYREGIONID', name: 'countryISO' },
                { title: 'PRIMARYADDRESSDESCRIPTION', name: 'addressDescription' },
                { title: 'PRIMARYADDRESSLOCATIONROLES', name: 'locationRoles' },
                { title: 'PRIMARYADDRESSSTATEID', name: 'stateCode' },
                { title: 'PRIMARYADDRESSSTREET', name: 'street' },
                { title: 'PRIMARYADDRESSZIPCODE', name: 'pincode' },
                { title: 'Error Reason', name: 'reason' }
            ],
            rows: reportRows,
            sheetName: 'Warehouses_ZW-Error-Report',
            ACL: 'public-read'
        });
        await this.services.AgendaService.updateJob({
            job: agendaJob,
            updateAttrs: {
                jobStats: { totalCount, createdCount, updatedCount, errorCount, errorReportUrl: s3ErrorCSVUrl }
            }
        });
    }

    async handleExcelDownload(agendaJob) {
        const { allDocuments: docs } = await this.findMany({
            getAllDocuments: true
        });

        const excelData = docs.map(doc => {
            return {
                ...doc,
                companyCode: doc.company?.uniqueCode,
                cityName: doc.address?.city?.name,
                countryCode: doc.address?.country?.code,
                addressDescription: doc.address?.name,
                locationRoles: doc.address?.locationRoles,
                stateCode: doc.address?.state?.code,
                street: doc.address?.street,
                pincode: doc.address?.pincode,
                addressId: doc.address?.addressId
            };
        });

        const s3DownloadUrl = await genereateExcel({
            headers: [
                { title: 'Legal Entitiy ID', name: 'companyCode' },
                { title: 'OPERATIONALSITEID', name: 'siteCode' },
                { title: 'WAREHOUSEID', name: 'warehouseCode' },
                { title: 'WAREHOUSENAME', name: 'name' },
                { title: 'Category', name: 'category' },
                { title: 'WAREHOUSETYPE', name: 'type' },
                { title: 'GST Number', name: 'gstNumber' },
                { title: 'VendorCode', name: 'vendorCode' },
                { title: 'PRIMARYADDRESSCITY', name: 'cityName' },
                { title: 'PRIMARYADDRESSCOUNTRYREGIONID', name: 'countryCode' },
                { title: 'PRIMARYADDRESSDESCRIPTION', name: 'addressDescription' },
                { title: 'PRIMARYADDRESSLOCATIONROLES', name: 'locationRoles' },
                { title: 'PRIMARYADDRESSSTATEID', name: 'stateCode' },
                { title: 'PRIMARYADDRESSSTREET', name: 'street' },
                { title: 'PRIMARYADDRESSZIPCODE', name: 'pincode' },
                { title: 'MSD Address Unique Code', name: 'addressId' }
            ],
            rows: excelData,
            sheetName: 'Warehouses_ZW',
            ACL: 'public-read'
        });

        await this.services.AgendaService.updateJob({
            job: agendaJob,
            updateAttrs: { jobStats: { downloadUrl: s3DownloadUrl } }
        });

        return { s3DownloadUrl };
    }

    async createUpdateWarehouses({ warehouses, userId, company }) {
        const reportRows = [];
        const totalCount = warehouses.length;
        let createdCount = 0,
            updatedCount = 0,
            errorCount = 0;
        for (const warehouse of warehouses) {
            let message = '',
                addressError = '';
            try {
                let warehouseObj = (
                    await this.resourceModel.find({
                        warehouseCode: warehouse.warehouseCode,
                        'company.companyId': new mongoose.Types.ObjectId(company._id)
                    })
                )[0];

                if (!warehouseObj) {
                    warehouseObj = warehouse;
                    warehouseObj.company = {
                        companyId: company._id,
                        slug: company.slug,
                        uniqueCode: company.uniqueCode
                    };
                }

                for (const key in warehouse) {
                    if (Object.hasOwnProperty.call(warehouse, key)) {
                        warehouseObj[key] = warehouse[key];
                    }
                }

                const site = await SiteModel.findOne({
                    'company.companyId': company._id,
                    siteId: warehouse.siteCode
                }).lean();

                if (!site) {
                    throw new Error(`${warehouse.siteCode} doesn't exist for company ${company.uniqueCode}`);
                }

                warehouseObj.siteId = site._id;

                let { address, error: errorInAddress } = await this.getWarehouseAddress(warehouse);
                warehouseObj.address = address;
                if (errorInAddress) {
                    addressError += errorInAddress;
                    errorCount++;
                }

                if (warehouseObj._id) {
                    warehouseObj.updatedBy = userId;
                    await warehouseObj.save();
                    updatedCount++;
                    message = 'UPDATED';
                } else {
                    warehouseObj.updatedBy = userId;
                    warehouseObj.createdBy = userId;
                    await this.create(warehouseObj);
                    createdCount++;
                    message = 'CREATED';
                }
            } catch (err) {
                errorCount++;
                message = err.message;
            }
            reportRows.push({
                warehouseCode: warehouse.warehouseCode,
                name: warehouse.name,
                reason: message + (addressError && '; ' + addressError)
            });
        }

        return {
            totalCount,
            createdCount,
            updatedCount,
            errorCount,
            reportRows
        };
    }

    async getWarehouseAddress(warehouse) {
        const { addressDescription, street, cityName, stateCode, countryISO, pincode, locationRoles } = warehouse;
        let country,
            state,
            city,
            error = '',
            address = {};
        try {
            if (countryISO) {
                country = await this.services.CountryService.getCountryByISO(countryISO);
                if (country) {
                    state = await this.services.CountryService.getStateByCountry({
                        countryId: country._id,
                        stateCode: stateCode
                    });
                    if (state) {
                        city = await this.services.CountryService.getCityByCountryAndState({
                            countryId: country._id,
                            stateId: state._id,
                            name: cityName
                        });
                    }
                }
            }

            address = {
                ...(country?._id && {
                    country: {
                        _id: country?._id,
                        name: country?.name,
                        code: country?.iso3 || countryISO,
                        phone_code: country?.phone_code
                    }
                }),
                ...(state?._id && {
                    state: {
                        _id: state?._id,
                        name: state?.name,
                        code: state?.state_code || stateCode
                    }
                }),
                ...(city?.id && {
                    city: {
                        _id: city?._id,
                        name: city?.name || cityName
                    }
                }),
                name: addressDescription,
                street,
                locationRoles,
                pincode,
                isPrimary: true
            };

            if (!country) {
                error += ` Country - ${countryISO} not found `;
            } else if (!state) {
                error += ` State - ${stateCode} not found in country - ${countryISO}`;
            } else if (!city) {
                error += ` City - ${cityName} not found in state - ${stateCode}, country -  ${countryISO}`;
            }
        } catch (err) {
            error += err.message;
        }
        return { address, error };
    }
}

module.exports = WarehouseErpService;
