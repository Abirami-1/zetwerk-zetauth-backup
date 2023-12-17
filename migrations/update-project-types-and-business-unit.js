/**
 * expects business units collection with slugs to be copied from OMS
 * expects project types with slugs copied from ziso
 * Update business Unit with project type ids emit kafka events
 * Create not existing project type with slug and emit kafka event
 * Scope of work and config shifted to OMS now
 */


const db = require('../lib/utils/db');
const Company = require('../models/company');
const BusinessUnit = require('../models/business-unit');
const ProjectType = require('../models/project-type');
const confluentKafka = require('../lib/utils/confluent-kafka');

const {
    WATER,
    GENERAL_FABRICATION,
    RAILWAYS,
    SCAFFOLDING,
    ONSITE,
    APPAREL,
    BOILER,
    CONSUMER_GOODS,
    ECOSYSTEM,
    HEALTHCARE,
    MATERIAL_HANDLING,
    OILANDGAS,
    OTHERS,
    TD,
    US_MACHINING
} = require('../lib/constants/business-units');

const {
    UPDATE_BUSINESS_UNIT,
    CREATE_BUSINESS_UNIT,
    CREATE_PROJECT_TYPE
} = require('../lib/constants/kafka-events');

const dbHelpers = require('../lib/utils/setup-db-helpers');

async function run() {

    await db.connect(async () => {}).catch(error => console.log(error));
    await dbHelpers.setup();
    await confluentKafka.initializeConfluentKafka();
    await confluentKafka.initializeProducer();
    await removeExtraInfoFromProjectTypes();
    await updateBusinessUnits();
    await createBusinessUnitsForZetFab();
    console.log('Migration complete');
    process.exit();
}

function getSlug(businessUnitName) {
    const SLUG_MAP = {
        [WATER]: 'water',
        [GENERAL_FABRICATION]: 'general-fabrication',
        [RAILWAYS]: 'railways',
        [SCAFFOLDING]: 'scaffolding',
        [ONSITE]: 'onsite',
        [APPAREL]: 'apparel',
        [BOILER]: 'boiler',
        [CONSUMER_GOODS]: 'consumer-goods',
        [ECOSYSTEM]: 'ecosystem',
        [HEALTHCARE]: 'healthcare',
        [MATERIAL_HANDLING]: 'material-handling',
        [OILANDGAS]: 'oil-and-gas',
        [OTHERS]: 'others',
        [TD]: 'transmission-and-distribution',
        [US_MACHINING]: 'us-machining'
    };
    return SLUG_MAP[businessUnitName];
}

async function removeExtraInfoFromProjectTypes() {
    await ProjectType.updateMany({}, {
        $unset: {
            masterList: true,
            templates: true
        }
    });
    console.log('Removed extra information - masterList and templates from project types');
}


async function updateBusinessUnits() {
    try {
        let zetwerkCompanyDetails = await Company.findOne({
            slug: 'zetwerk',
            deleted: false
        });
        let businessUnits = await BusinessUnit.find();
        for (let businessUnit of businessUnits) {
            let projectType = await ProjectType.findOne({
                name: businessUnit.name
            });

            let projectTypeId;

            if (!projectType) {
                /** Project type doesnt exist in ZISO, lets create it */
                let projectTypeData = {
                    name: businessUnit.name,
                    slug: getSlug(businessUnit.name)
                };

                let createdProjectType = await ProjectType.create(projectTypeData);
                projectTypeId = createdProjectType._id;


            } else {
                /** Project type already exists from ZISO and has slug */
                projectTypeId = projectType._id;
            }
            await confluentKafka.sendMessage('ZET-PROJECT_TYPE', {
                event: CREATE_PROJECT_TYPE,
                message: 'Project type created',
                data: {
                    _id: projectTypeId
                }
            });


            let buData = JSON.parse(JSON.stringify(businessUnit));
            buData.company = {
                companyId: zetwerkCompanyDetails._id,
                slug: zetwerkCompanyDetails.slug
            };
            buData.projectTypeIds = [projectTypeId];

            await BusinessUnit.updateById(businessUnit._id, buData);

            await confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
                event: UPDATE_BUSINESS_UNIT,
                message: 'Business unit updated',
                data: {
                    _id: buData._id
                }
            });
        }

        console.log('Updated all project types and business units');
    } catch (error) {
        console.log(error);
        throw error;
    }
}

async function createBusinessUnitsForZetFab() {
    let zetfabCompanyDetails = await Company.findOne({
        slug: 'zetfab',
        deleted: false
    });

    /** Array of business units to be created for zetfab */

    const businessUnitsForZetFab = [{
        name: 'General Fabrication',
        slug: 'zetfab-general-fabrication',
        company: {
            slug: zetfabCompanyDetails.slug,
            companyId: zetfabCompanyDetails._id
        },
    }];

    for (let businessUnit of businessUnitsForZetFab) {
        let projectType = await ProjectType.findOne({
            name: businessUnit.name
        });
        if (!projectType) {
            throw new Error('Project type not found');
        }
        businessUnit.projectTypeIds = [projectType._id];
        
        let buCreated = await BusinessUnit.create(businessUnit);

        await confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
            event: CREATE_BUSINESS_UNIT,
            message: 'Business unit created',
            data: {
                _id: buCreated._id
            }
        });
    }
}

run();