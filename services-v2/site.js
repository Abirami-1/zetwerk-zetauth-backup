const DefaultService = require('@zetwerk/zetapp/services/DefaultService');
const { ExcelToJson } = require('@zetwerk/zet-common-utilites');
const { genereateExcel } = require('../lib/utils/excel');
const { getExcelFileFromS3 } = require('../lib/utils/file');
const fs = require('fs').promises;
const CompanyService = require('../services/company');
const mongoose = require('mongoose');
class SiteService extends DefaultService {
    constructor() {
        super('site');
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
        const { filePath } = await getExcelFileFromS3({ fileName: fileKey, tempFileName: 'Site_master.xlsx' });
        const { Sites_ZW: sitesData } = ExcelToJson({
            sourceFile: filePath,
            sheets: ['Sites_ZW'],
            columnToKey: {
                B: 'siteId',
                C: 'siteName'
            },
            header: { rows: 1 }
        });
        await fs.unlink(filePath);
        const { totalCount, createdCount, updatedCount, errorCount, errorRows } = await this.createUpdateSites({
            sites: sitesData,
            userId,
            companyData
        });
        let s3ErrorCSVUrl;
        if (errorCount) {
            s3ErrorCSVUrl = await genereateExcel({
                headers: [
                    { title: 'Site Id', name: 'siteId' },
                    { title: 'Site Name', name: 'siteName' },
                    { title: 'Error Reason', name: 'reason' }
                ],
                rows: errorRows,
                sheetName: 'Site-Error-Report',
                ACL: 'public-read'
            });
        }
        await this.services.AgendaService.updateJob({
            job: agendaJob,
            updateAttrs: {
                jobStats: { totalCount, createdCount, updatedCount, errorCount, erroReportUrl: s3ErrorCSVUrl }
            }
        });
    }

    async handleExcelDownload(agendaJob) {
        const { allDocuments: docs } = await this.findMany({
            getAllDocuments: true
        });

        const excelData  = docs.map(doc => {
            return {
                ...doc,
                companyCode: doc.company?.uniqueCode
            };
        });
      
        const s3DownloadUrl = await genereateExcel({
            headers: [
                {title: 'Legal Entitiy ID', name: 'companyCode'},
                { title: 'SITEID', name: 'siteId' },
                { title: 'SITENAME', name: 'siteName' },
            ],
            rows: excelData,
            sheetName: 'Sites_ZW',
            ACL: 'public-read'
        });
      
        await this.services.AgendaService.updateJob({
            job: agendaJob,
            updateAttrs: { jobStats: { downloadUrl: s3DownloadUrl } }
        });
      
        return { s3DownloadUrl };
    }

    async createUpdateSites({ sites, userId, companyData }) {
        const errorRows = [];
        const totalCount = sites.length;
        let createdCount = 0,
            updatedCount = 0;
        for (let site of sites) {
            try {
                let siteObj = (await this.resourceModel.find({
                    'company.companyId': new mongoose.Types.ObjectId(companyData._id),
                    siteId: site.siteId
                }))[0];

                if (!siteObj) {
                    siteObj = site;
                }

                for (const key in site) {
                    siteObj[key] = site[key];
                }

                const company = await this.companyService.getCompanyById(companyData._id);
                if (company) {
                    let companyObj = {
                        companyId: company._id,
                        slug: company.slug,
                        uniqueCode: company.uniqueCode
                    };
                    siteObj.company = companyObj;
                }

                if (siteObj._id) {
                    siteObj.updatedBy = userId;
                    await siteObj.save();
                    updatedCount++;
                } else {
                    siteObj.updatedBy = userId;
                    siteObj.createdBy = userId;
                    await this.create(siteObj);
                    createdCount++;
                }
            } catch (err) {
                errorRows.push({ siteId: site.siteId, siteName: site.siteName, reason: err.message });
            }
        }

        return {
            totalCount,
            createdCount,
            updatedCount,
            errorCount: errorRows.length,
            errorRows
        };
    }

    async getSiteAddress(site) {
        try {
            const { addressDescription, street, cityName, stateCode, countryISO, pincode, locationRoles } = site;
            const country = await this.services.CountryService.getCountryByISO(countryISO);
            if (!country) {
                throw new Error(`Country - ${countryISO} not found `);
            }
            const state = await this.services.CountryService.getStateByCountry({
                countryId: country._id,
                stateCode: stateCode
            });
            if (!state) {
                throw new Error(`State - ${stateCode} not found in country - ${countryISO}`);
            }
            const city = await this.services.CountryService.getCityByCountryAndState({
                countryId: country._id,
                stateId: state._id,
                name: cityName
            });
            if (!city) {
                throw new Error(`City - ${cityName} not found in state - ${stateCode}, country -  ${countryISO}`);
            }
            const address = {
                country: {
                    _id: country._id,
                    name: country.name,
                    code: country.numeric_code
                },
                state: {
                    _id: state._id,
                    name: state.name,
                    code: state.state_code
                },
                city: {
                    _id: city._id,
                    name: city.name
                },
                name: addressDescription,
                street,
                locationRoles,
                pincode,
                isPrimary: true
            };
            return address;
        } catch (error) {
            throw Error(`Error in Address: ${error.message}`);
        }
    }
}

module.exports = SiteService;
