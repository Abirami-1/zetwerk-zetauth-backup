/**
 * Migration script for adding companyId in factory
 * and downstream factory copies as well
 */

/*eslint indent: ["error", 2] */

const db = require('../lib/utils/db');
const Warehouses = require('../models/warehouse-erp');
async function run() {
  try {
    await db.connect(async () => {});
    await deleteWarehouses();
    return;
  } catch (e) {
    console.log('Error in run Block', e);
    throw e;
  }
}

/**
 * Add system users and pass updated data to downstream to respective application.
 * @returns {Promise<void>}
 */
async function deleteWarehouses() {
  try {
    const warehouseCodes = [
      'RDEnggWork',
      'RWardha_C',
      'RWardha_O',
      'RAIL_SO',
      'RAIL_DD',
      'R-Transit',
      'RKA-VWH-MH',
      'SC_Yard',
      'Trichy_C',
      'Trichy_O',
      'GKA-VWH-TN',
      'GBhilai1_C',
      'GBhilai1_O',
      'GKA-VWH-CT',
      'GBhilai2_C',
      'GBhilai2_O',
      'Bhilwara',
      'GKA-VWH-RJ',
      'GWardha_C',
      'GKA-VWH-MH',
      'GBarakath',
      'GParagB',
      'GVEE_AAR',
      'GSaradhi',
      'GGlobalW',
      'GBAIT',
      'GKkonvert',
      'GShreeSt',
      'GSriGan',
      'GTeknomac',
      'GVK_Steel',
      'GFB_SO',
      'GFB_DD',
      'G-transit',
      'CCeez',
      'CPathRet',
      'CBhagwati',
      'CSKAFac',
      'C-Transit',
      'CG_SO',
      'CG_DD',
      'EEOSNAR',
      'EMaanTube',
      'EKrupay',
      'EAGAshta',
      'EChePrt',
      'EAVJoshi',
      'EJCO',
      'EFlowflex',
      'ERiddhi',
      'ETrichy',
      'ENavaSewa',
      'EHST Steel',
      'ECO_SO',
      'ECO_DD',
      'ENF_DD',
      'NF-Transit',
      'E-Transit',
      'ENF_SO',
      'DEF_SO',
      'DEF_DD',
      'D-Transit',
      'APP_SO',
      'APP_DD',
      'AP-Transit',
      'AFN_SO',
      'AFN_DD',
      'A-Transit',
      'B&F_SO',
      'B&F_DD',
      'BF-Transit',
      'O&G_SO',
      'O&G_DD',
      'OG-Transit',
      'Roads_SO',
      'Roads_DD',
      'RO-Transit',
      'T&D_SO',
      'T&D_DD',
      'TD-Transit',
      'Water_SO',
      'Water_DD',
      'W-Transit',
      'MEA FZ_SO',
      'MEA FZ_DD',
      'MF-Transit',
      'MEA ML_SO',
      'MEA ML_DD',
      'ML-Transit',
      'UAJIPL',
      'UGSS',
      'UMaersk',
      'USM_SO',
      'USM_DD',
      'U-Transit',
      'UJayam',
      'UAalpha',
      'USpacenex',
      'UCreative',
      'UOrbit',
      'UHitech',
      'UGM',
      'UMarcus',
      'UShreeRap',
      'UDHL',
      'USanvijay',
      'UKLSteel',
      'UEncorp',
      'URSInfra',
      'UMTC',
      'RBhilai1_C',
      'RBhilai1_O',
      'RKA-VWH-CG',
      'RBhilai2_C',
      'RBhilai2_O',
      'GKA-VWH-CG',
      'AE_SO',
      'AE_DD',
      'AE-Transit',
      'PIN_SO',
      'PIN_DD',
      'PI-Transit',
      'Sharp_SO',
      'Sharp_DD',
      'S-Transit',
      'CKA-VWH-TN'
    ];

    const res = await Warehouses.deleteMany({
      'company.uniqueCode': 'ZKA3',
      warehouseCode: { $in: warehouseCodes }
    });
    console.log(res);
  } catch (e) {
    console.log('Some error occurred', e);
    throw e;
  }
}

run().then(() => {
  console.log('Warehouses deleted succesfully.');
});
