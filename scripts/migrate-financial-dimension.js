const db = require('../lib/utils/db');
const CompanyModel = require('../models/company');
const segmentModel = require('../models/segment');
const businessUnitModel = require('../models/business-unit');
const subBUModel = require('../models/sub-business-unit');
const regionModel = require('../models/region');
const factoryModel = require('../models/factory-erp');
const XLSX = require('@zetwerk/xlsx');
const config = require('config');
const AWS = require('aws-sdk');
const mongoose = require('mongoose');
const dummyCountry = [
    // {
    //     name: 'Zetchem',
    //     slug: 'zetchem'
    // },
    {
        name: 'Zetwerk Kinetix',
        slug: 'zetwerk-kinetix'
    },
    {
        name: 'Zet Town',
        slug: 'Zettown'
    }
];
const companies = {
    'FD -ZMBPL': {
        name: 'zetwerk',
        header: 2
    },
    'FD -Zetfab': {
        name: 'zetfab',
        header: 2
    },
    'FD -ZetAero': {
        name: 'zetwerk-aerosystems',
        header: 2
    },
    'FD -Pinaka': {
        name: 'pinaka',
        header: 2
    },
    'FD -Sharptanks': {
        name: 'sharptanks',
        header: 0
    },
    'FD -ZetChem': {
        name: 'zetchem',
        header: 2
    }
};
const element = ['Segments', 'Business Units', 'Sub-Business Unit', 'Regions', 'Factory'];
// was not in DB ['FD -MEA -FZ', 'FD -MEA-ML', 'FD -ZetChem - Draft']
const buNameMap = {
    'Middle East & Africa - FZ': 'MEA FZ',
    'Middle East & Africa - ML': 'MEA Mainland',
    GFB: 'General Fabrication',
    'Transmission and Distribution': 'Transmission & Distribution',
    'North America Business': 'US/Machining',
    // 'Ecosystem Non-Ferrous': 'Ecosystem Non Ferrous'
};

function readExcelFromS3(url, key = '') {
    AWS.config.credentials = new AWS.Credentials(config.get('s3'));
    const s3 = new AWS.S3({
        params: {
            Bucket: config.get('s3.bucket'),
            timeout: 6000000
        }
    });

    let s3Key;
    if (key) {
        s3Key = key;
    } else {
        s3Key = url.split('/').pop();
    }

    const params = {
        Bucket: config.get('s3.bucket'),
        Key: s3Key
    };

    const fileData = s3.getObject(params).createReadStream();

    const buffers = [];

    return new Promise(resolve => {
        fileData.on('data', function(data) {
            buffers.push(data);
        });
        fileData.on('end', function() {
            var buffer = Buffer.concat(buffers);
            const workbook = XLSX.read(buffer, { cellDates: true });

            resolve(workbook);
        });
    });
}

/*async function updateUniqueCode() {
    await db.connect(async () => {}).catch(error => console.log(error));
    console.log('----------------------');
    const segments = await segmentModel.find().lean();
    await segmentModel.collection.dropIndexes();
    for (const segment of segments) {
        if (segment.fdValue) {
            await segmentModel.findByIdAndUpdate(segment._id, { $set: { uniqueCode: segment.fdValue } });
        }
    }
    await businessUnitModel.collection.dropIndexes();
    const bus = await businessUnitModel.find().lean();
    for (const bu of bus) {
        if (bu.fdValue) await businessUnitModel.findByIdAndUpdate(bu._id, { $set: { uniqueCode: bu.fdValue } });
    }
    await subBUModel.collection.dropIndexes();
    const subBus = await subBUModel.find().lean();
    for (const subbu of subBus) {
        if (subbu.fdValue) await subBUModel.findByIdAndUpdate(subbu._id, { $set: { uniqueCode: subbu.fdValue } });
    }

    await factoryModel.collection.dropIndexes();
    const factories = await factoryModel.find().lean();
    for (const factory of factories) {
        if (factory.fdValue)
            await factoryModel.findByIdAndUpdate(factory._id, { $set: { uniqueCode: factory.fdValue } });
    }

    await regionModel.collection.dropIndexes();
    const regions = await regionModel.find().lean();
    for (const region of regions) {
        if (region.fdValue) await regionModel.findByIdAndUpdate(region._id, { $set: { uniqueCode: region.fdValue } });
    }
}*/

async function migration() {
    await db.connect(async () => {}).catch(error => console.log(error));
    // await updateUniqueCode();
    await businessUnitModel.collection.dropIndexes();
    var workbook = await readExcelFromS3('https://zet-auth.s3.ap-south-1.amazonaws.com/fd-copy.xlsx');
    var sheet_name_list = workbook.SheetNames;
    for (const sheet of sheet_name_list) {
        if (companies[sheet]) {
            const companySlug = companies[sheet].name;
            const company = await CompanyModel.findOne({ slug: companySlug }).lean();
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], { range: companies[sheet].header });
            let fdParams = '';
            for (const obj of data) {
                if (obj['Financial Dimension ']) {
                    if (element.includes(obj['Financial Dimension '])) {
                        fdParams = obj['Financial Dimension '];
                    } else {
                        fdParams = '';
                    }
                }
                if (fdParams !== '' && obj['FD value'] && obj['Description']) {
                    const fdObj = {
                        name: obj.Description.trim(),
                        uniqueCode: obj['FD value']
                    };
                    if (fdParams === 'Segments') {
                        if (fdObj.name.toLowerCase() === 'corporate') {
                            await segmentModel.deleteMany({ name: fdObj.name });
                            continue;
                        }
                        const condition = { uniqueCode: fdObj.uniqueCode };
                        const segment = await segmentModel
                            .findOneAndUpdate(condition, fdObj, { upsert: true, new: true })
                            .lean();
                        const seg = {
                            _id: segment._id,
                            uniqueCode: segment.uniqueCode,
                            name: segment.name
                        };
                        await CompanyModel.findByIdAndUpdate(company._id, { $addToSet: { segments: seg } });
                    } else if (fdParams === 'Business Units') {
                        if (fdObj.name.toLowerCase() === 'corporate') {
                            await businessUnitModel.deleteMany({ name: fdObj.name });
                            continue;
                        }
                        if (fdObj.name === 'GFB') {
                            await businessUnitModel.deleteMany({ name: 'GFB' });
                        }

                        fdObj.company = {
                            companyId: company._id,
                            slug: company.slug,
                            uniqueCode: company.uniqueCode
                        };
                        fdObj.sequenceName = createSeqName(fdObj.name);
                        fdObj.segments = await getSegments(obj['Nested under - MULTIPLE VALUES ALLOWED HERE.']);
                        const condition = {
                            'company.companyId': company._id
                        };
                        if (fdObj.name === 'North America Business') {
                            const deleteCond = {
                                name: fdObj.name,
                                'company.companyId': company._id
                            };
                            await businessUnitModel.deleteMany(deleteCond);
                            condition.name = buNameMap[fdObj.name];
                        } else {
                            const busName = buNameMap[fdObj.name] || fdObj.name;
                            condition.name = busName;
                        }
                        fdObj.name = buNameMap[fdObj.name] || fdObj.name;
                        fdObj.slug = createSlug(fdObj.name, companySlug);
                        fdObj.subBusinessUnits = [];
                        console.log(condition, fdParams);
                        await businessUnitModel.updateOne(condition, fdObj, { upsert: true });

                        // confluentKafka.sendMessage('ZET-BUSINESS_UNIT', {
                        //     event: CREATE_BUSINESS_UNIT,
                        //     message: 'New business unit created',
                        //     data: {
                        //         _id: data._id
                        //     }
                        // });
                    } else if (fdParams === 'Sub-Business Unit') {
                        if (fdObj.name.toLowerCase() === 'corporate') {
                            await subBUModel.deleteMany({ name: fdObj.name });
                            continue;
                        }
                        const condition = {
                            uniqueCode: fdObj.uniqueCode
                        };
                        const subBU = await subBUModel.findOneAndUpdate(condition, fdObj, { upsert: true, new: true });
                        let buNames = obj['Nested under - MULTIPLE VALUES ALLOWED HERE.'].split(/\r?\n/);
                        for (let buName of buNames) {
                            buName = buName.trim();
                            buName = buNameMap[buName] || buName;
                            const buSlug = createSlug(buName, companySlug);
                            const buCondition = {
                                name: buName,
                                slug: buSlug,
                                'company.companyId': company._id
                            };
                            console.log(fdParams, subBU);
                            const sub = {
                                _id: subBU._id,
                                uniqueCode: subBU.uniqueCode,
                                name: subBU.name,
                                draft: false,
                                hidden: false
                            };
                            await businessUnitModel.findOneAndUpdate(buCondition, {
                                $addToSet: { subBusinessUnits: sub }
                            });
                        }
                    } else if (fdParams === 'Regions') {
                        if (fdObj.name.toLowerCase() === 'corporate') {
                            await regionModel.deleteMany({ name: fdObj.name });
                            continue;
                        }
                        const businessUnits = await getBUs(
                            obj['Nested under - MULTIPLE VALUES ALLOWED HERE.'],
                            company._id
                        );
                        // console.log('***********', businessUnits);
                        for (const bu of businessUnits) {
                            const regionObj = {
                                ...fdObj,
                                slug: createSlug(fdObj.name, bu.slug),
                                businessUnit: bu
                            };
                            const condition = {
                                uniqueCode: fdObj.uniqueCode,
                                'businessUnit._id': bu._id
                            };
                            console.log(fdParams, regionObj);
                            await regionModel.updateOne(condition, regionObj, { upsert: true });
                        }
                    } else if (fdParams === 'Factory') {
                        if (fdObj.name.toLowerCase() === 'corporate') {
                            await factoryModel.deleteMany({ name: fdObj.name });
                            continue;
                        }
                        const condition = {
                            uniqueCode: fdObj.uniqueCode
                        };
                        fdObj.shortName = fdObj.name;
                        const factory = await factoryModel
                            .findOneAndUpdate(condition, fdObj, { upsert: true, new: true })
                            .lean();

                        let buNames = obj['Nested under - MULTIPLE VALUES ALLOWED HERE.'].split(',');
                        let buSlugs = buNames.map(name => {
                            let buName = name.trim();
                            buName = buNameMap[buName] || buName;
                            const buSlug = createSlug(buName, companySlug);
                            return buSlug;
                        });
                        buSlugs = buSlugs.join('|');
                        const buCondition = {
                            slug: { $regex: buSlugs, $options: 'i' },
                            'company.companyId': company._id
                        };
                        console.log(fdParams, factory);
                        const fac = {
                            _id: factory._id,
                            uniqueCode: factory.uniqueCode,
                            name: factory.name
                        };
                        await businessUnitModel.updateMany(buCondition, { $addToSet: { erpFactories: fac } });
                    }
                }
            }
        }
    }
}

function createSlug(entityName, companySlug) {
    let slug = entityName.toLowerCase().trim();
    slug = slug.split(' ').join('-');
    slug = companySlug + '-' + slug;
    return slug;
}

function createSeqName(entityName) {
    let sequenceName = '';
    if (entityName.split(' ').length > 1) {
        const str = entityName.toLowerCase();
        const matches = str.split(' ');
        for (const m of matches) {
            sequenceName += m[0] + m[m.length - 1];
        }
    } else {
        sequenceName = entityName.toLowerCase().substr(0, 2);
    }
    return sequenceName;
}

async function getSegments(segmentNames) {
    let segmantNames = segmentNames.split(',');
    segmantNames = segmantNames.map(name => name.toLowerCase().trim());

    segmantNames = segmantNames.join('|');
    const segments = await segmentModel.find({ name: { $regex: segmantNames, $options: 'i' } }).lean();
    const segmentArr = [];
    for (const segment of segments) {
        segmentArr.push({
            _id: segment._id,
            name: segment.name,
            uniqueCode: segment.uniqueCode
        });
    }
    return segmentArr;
}

async function getBUs(buNames, companyId) {
    buNames = buNames.split(',');
    buNames = buNames.map(name => buNameMap[name.trim()] || name.trim());
    buNames = buNames.join('|');
    let BUs = await businessUnitModel
        .find({ name: { $regex: buNames, $options: 'i' }, 'company.companyId': companyId })
        .lean();
    BUs = BUs.map(bu => {
        return {
            _id: bu._id,
            name: bu.name,
            uniqueCode: bu.uniqueCode,
            slug: bu.slug
        };
    });
    return BUs;
}

async function unset() {
    await mongoose.connection.db
        .collection('business-units')
        .updateMany({ fdValue: { $exists: true } }, { $unset: { fdValue: '' } });
    console.log('unset fdValue');
}

async function addZetchem() {
    for (const comp of dummyCountry) {
        const name = comp.name;
        const slug = comp.slug;
        const company = await CompanyModel.findOne({ slug });
        const segObj = {
            uniqueCode: slug,
            name
        };
        const segment = await segmentModel.findOneAndUpdate(segObj, segObj, { upsert: true, new: true });
        segObj._id = segment._id;
        await CompanyModel.findByIdAndUpdate(company._id, { $addToSet: { segments: segObj } });

        const buObj = {
            uniqueCode: slug,
            name,
            segments: [segObj],
            slug: createSlug(name, company.slug),
            sequenceName: createSeqName(name),
            company: {
                companyId: company._id,
                slug: company.slug,
                uniqueCode: company.uniqueCode
            }
        };
        const bu = await businessUnitModel.findOneAndUpdate({ uniqueCode: buObj.uniqueCode }, buObj, {
            upsert: true,
            new: true
        });

        const subbuObj = {
            name,
            uniqueCode: slug,
            draft: false,
            hidden: false
        };
        const subbu = await subBUModel.findOneAndUpdate(subbuObj, subbuObj, { upsert: true, new: true });
        await businessUnitModel.findByIdAndUpdate(bu._id, { $addToSet: { subBusinessUnits: subbu } });
    }
}

async function addUniqueCodeToBU() {
    const bus = await businessUnitModel.find({uniqueCode: {$exists: false}});
    for(const bu of bus) {
        await businessUnitModel.findByIdAndUpdate(bu._id, {uniqueCode: bu.name});
    }
}
migration()
    .then(async () => {
        await addZetchem();
        await addUniqueCodeToBU();
        await unset();
        console.log('Had dropped the indexes for running the script. Please restart the server to create the indexes');
        console.log('Migration Complete');
    })
    .catch(err => console.log(err))
    .finally(process.exit);
