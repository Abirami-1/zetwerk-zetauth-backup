const db = require('../lib/utils/db');
const CompanyModel = require('../models/company');
const segmentModel = require('../models/segment');
const businessUnitModel = require('../models/business-unit');
const projectTypeModel = require('../models/project-type');
const subBUModel = require('../models/sub-business-unit');
const companyName = 'Zetwerk';
const BUs = [{
    name: 'Agri, Food & Nutrition',
    segment: 'Consumer',
    slug: 'agri-food-and-nutrition',
    uniqueCode: '17AFN',
    sequenceName: 'AG'
}];
const subBUs = {
    'Agri, Food & Nutrition': [
        {
            name: 'Cereals, Oilseeds & Pulses',
            uniqueCode: '01COP'
        },
        {
            name: 'Spices & Condiments',
            uniqueCode: '02ASC'
        },
        {
            name: 'Fibres',
            uniqueCode: '03FIB'
        },
        {
            name: 'Plantation Crops',
            uniqueCode: '04APC'
        },
        {
            name: 'SeaFood, Meat & Eggs',
            uniqueCode: '05SME'
        },
        {
            name: 'Dry Fruit & Nuts',
            uniqueCode: '06DFN'
        },
        {
            name: 'Dairy - Milk & Milk Products',
            uniqueCode: '07DMM'
        },
        {
            name: 'Fruits, Vegetables & Flowers',
            uniqueCode: '08FVF'
        },
        {
            name: 'Processed Food',
            uniqueCode: '09PFO'
        },
    ]
};
const { CREATE_BUSINESS_UNIT, CREATE_PROJECT_TYPE } = require('../lib/constants/kafka-events');
const confluentKafka = require('../lib/utils/confluent-kafka');

async function addNewBU() {
    await db.connect(async () => {}).catch(error => console.log(error));
    await confluentKafka.initializeConfluentKafka();
    for(const businessUnit of BUs) {
        const subBusinessUnits = await subBUModel.create(subBUs[businessUnit.name]);
        const segments = await segmentModel.find({name: businessUnit.segment});
        const comp = await CompanyModel.findOne({name: companyName});
        const projectTypeIds = await addProjectType(businessUnit.name, businessUnit.slug);
        const buObj = {
            name: businessUnit.name,
            slug: businessUnit.slug,
            uniqueCode: businessUnit.uniqueCode,
            sequenceName: businessUnit.sequenceName,
            segments,
            subBusinessUnits,
            company: {
                companyId: comp._id,
                slug: comp.slug,
                uniqueCode: comp.uniqueCode
            },
            projectTypeIds: [projectTypeIds]
        };
        const bu = await businessUnitModel.create(buObj);
        console.log('business unit created', bu);
        await confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
            event: CREATE_BUSINESS_UNIT,
            message: 'New business unit created',
            data: {
                _id: bu._id
            }
        });
    }
}

async function addProjectType(projectName, slug) {
    const projectObj = {
        name: projectName,
        slug: slug
    };
    const proj = await projectTypeModel.create(projectObj);
    console.log({proj});
    await confluentKafka.sendMessage('ZET-PROJECT_TYPE', {
        event: CREATE_PROJECT_TYPE,
        message: 'New project type created',
        data: {
            _id: proj._id
        }
    });
    return proj._id;
}

addNewBU().then(()=>console.log('script completed'));