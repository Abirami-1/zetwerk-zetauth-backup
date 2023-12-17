const DefaultController = require('@zetwerk/zetapp/controllers/DefaultController');

class SiteController extends DefaultController {
    constructor() {
        super('site');
    }

    async getSitesByQuery(req, res) {
        let findConditions = {};
        const { companyId, siteName, siteId, legalEntityCode, recordsPerPage, searchText, pageNumber} = req.query;
        if (companyId) {
            findConditions['company.companyId'] = companyId;
        }
        if (siteName) {
            findConditions['siteName'] = siteName;
        }

        if (legalEntityCode){
            findConditions['company.uniqueCode'] = legalEntityCode;
        }

        if(siteId){
            findConditions['siteId'] = siteId;
        }
        
        const getAllDocuments = recordsPerPage ? false : true;

        const sites = await this.services.SiteService.findMany({
            searchText,
            fieldsToSearch: ['company.uniqueCode', 'siteName'],
            findConditions,
            recordsPerPage,
            pageNumber,
            getAllDocuments
        });
        res.success({
            message: 'Sites fetched successfully',
            data: sites
        });
    }

    async excelUpload(req, res) {
        const { file, company } = req.body;
        const userId = req?.user?._id;
        if (!file || !file.Key) {
            throw new Error('File information is required');
        }
        if (!userId) {
            throw new Error('User information is required');
        }
        if (!company) {
            throw new Error('Company information is required');
        }
        const agendaJob = await this.services.AgendaService.createJob({
            jobName: 'site-excel-upload',
            payload: { fileKey: file.Key, fileUrl: file?.src, userId, company }
        });
        res.success({
            data: { taskId: agendaJob?.attrs?._id },
            message: 'Site excel upload initiated successfully'
        });
    }

    async excelDownload(req, res) {
        const userId = req?.user?._id;
    
        if (!userId) {
            throw new Error('User information is required');
        }
        const agendaJob = await this.services.AgendaService.createJob({
            jobName: 'site-excel-download',
            payload: { userId }
        });
        res.success({
            data: { taskId: agendaJob?.attrs?._id },
            message: 'Site excel download initiated successfully'
        });
    }
}

module.exports = SiteController;
