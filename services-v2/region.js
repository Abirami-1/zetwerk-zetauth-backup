const DefaultService = require('@zetwerk/zetapp/services/DefaultService');
class RegionService extends DefaultService {
    constructor() {
        super('region');
    }

    async create(region) {
        let payload = region;
        if (region && !region?.slug) {
            payload.slug = `${region.company?.slug}-${region.businessUnit.name}-${region.name}`
                ?.replace(' ', '-')
                ?.toLowerCase();
        }
        return this.resourceModel._create(payload);
    }

    async getRegionByBuId(buId) {
        const regions = await this.resourceModel.find({ 'businessUnit._id': buId }).lean();
        return regions;
    }

    async getRegions(query) {
        const findConditions = {};
        if (query.name) {
            findConditions.name = query.name;
        }
        if (query?.searchText) {
            const regex = new RegExp(query?.searchText, 'i');
            findConditions.name = regex;
        }
        const regions = await this.resourceModel.find(findConditions).lean();
        let docs = [];
        for (const region of regions) {
            const obj = { _id: region.businessUnit._id };
            if (query.company) {
                obj['company.slug'] = { $in: query.company };
            }
            const businessUnit = await this.models['business-unit'].findOne(obj);
            if (businessUnit) {
                docs.push({ ...region, company: businessUnit.company });
            }
        }
        const meta = {
            total: docs.length,
            limit: query.recordsPerPage,
            offset: parseInt(query.pageNumber) - 1,
            nextStart: parseInt(query.pageNumber) * parseInt(query.recordsPerPage) + 1
        };
        const startdoc = (parseInt(query.pageNumber) - 1) * parseInt(query.recordsPerPage);
        const endDoc = parseInt(query.pageNumber) * parseInt(query.recordsPerPage);
        return { allDocuments: docs.slice(startdoc, endDoc), meta };
    }

    async getAllValuesOfFilter({ filter }) {
        const filterArr = [];
        if (filter === 'company') {
            const filterValues = await this.models['company'].distinct('slug');
            for (const value of filterValues) {
                filterArr.push({ _id: value, name: value });
            }
        } else if (filter === 'business-unit') {
            const filterValues = await this.resourceModel.distinct('businessUnit.name');
            for (const value of filterValues) {
                filterArr.push({ _id: value, name: value });
            }
        } else {
            const filterValues = await this.resourceModel.distinct(filter);
            for (const value of filterValues) {
                filterArr.push({ _id: value, name: value });
            }
        }
        return filterArr;
    }
}

module.exports = RegionService;
