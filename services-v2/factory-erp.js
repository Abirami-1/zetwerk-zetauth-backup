const DefaultService = require('@zetwerk/zetapp/services/DefaultService');
const { queryGenerator } = require('../lib/utils');
const FactoryService = require('../services/factory');
const factoryService = new FactoryService();
class FactoryErpService extends DefaultService {
    constructor() {
        super('factory-erp');
    }

    async getFactoryErpByQuery({ query }) {
        if(query.businessUnitId) {
            const bu = await this.models['business-unit'].findOne({_id: query.businessUnitId}).lean();
            const factories = bu.erpFactories;
            return factories;
        }
        return this.resourceModel.find(queryGenerator(query));
    }

    async getFactoryErpById({ factoryId }) {
        const factory = await this.findById(factoryId, []);
        return factory;
    }

    async getAllValuesOfFilter({ filter }) {
        const filterArr = [];
        if(filter === 'company') {
            const filterValues = await this.models['company'].distinct('slug');
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

    async createFactory(factoryData) {
        const factoryErpPayload = {
            ...factoryData,
            city: factoryData.city?.name,
            state: factoryData.state?.name,
        };
        const factoryErp = await this.create(factoryErpPayload);

        const businessUnitIds = factoryData?.businessUnits?.map(bu => bu._id);
        await this.models['business-unit'].updateMany({_id: {$in: businessUnitIds}}, {$addToSet: { erpFactories: factoryErp }});

        const defaultCompany = await this.models['company'].findOne({name: 'Zetwerk'}); 
        const factoryPayload = {
            ...factoryData,
            location: {
                address: factoryData.address,
                city: factoryData.city?.name,
                state: factoryData.state?.name,
                stateCode: factoryData.state?.state_code,
                shortName: factoryData.shortName
            },
            company: {
                companyId: defaultCompany._id,
                slug: defaultCompany.slug,
                uniqueCode: defaultCompany.uniqueCode
            },
            businessUnitIds: factoryData?.businessUnits?.map(bu => bu._id)
        };
        await factoryService.create(factoryPayload);
        return factoryErp;
    }

    async getFactories(query) {
        const factories = await this.findMany(query);
        let docs = [];
        for (const factory of factories.allDocuments) {
            if (factory.businessUnit) {
                const obj = {_id: factory.businessUnit._id};
                if(query.company) {
                    obj['company.slug'] = {$in: query.company};
                }
                const businessUnit =  await this.models['business-unit'].findOne(obj);
                if(businessUnit) {
                    docs.push({...factory, company: businessUnit.company});
                }
            } else {
                docs.push(factory);
            }
        }
        return {allDocuments: docs, meta: factories.meta};
    }
}

module.exports = FactoryErpService;
