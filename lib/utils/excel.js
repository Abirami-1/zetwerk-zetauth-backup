const ExcelService = require('@zetwerk/zet-xls');
const fs = require('fs').promises;
const createReadStream = require('fs').createReadStream;

const { S3 } = require('@zetwerk/zet-common-utilites');
const config = require('config');
const S3Utils = new S3(config);

async function genereateExcel({ headers = [], rows = [], sheetName = 'Worksheet', ACL = '' }) {
    const excelService = new ExcelService(__dirname);
    if (rows.length) {
        const filePath = await excelService.generateExcel({
            worksheetName: sheetName,
            headers: headers,
            rows: rows
        });
        const { Location: url } = await S3Utils.writeToS3MultipartData({
            Key: `error-reports/${filePath.split('/').pop()}`,
            Body: createReadStream(filePath),
            ...(ACL && { ACL })
        });
        await fs.unlink(filePath);
        return url;
    }
}

async function generateExcelBatch({ headers = [], sheetName = 'Worksheet' }) {
    const excelService = new ExcelService(__dirname);

    const processNextBatch = await excelService.generateExcel({
        processingBatch: true,
        worksheetName: sheetName,
        headers: headers,
        rows: []
    });

    async function batchWriter(rows) {
        if (!rows || !rows.length) {
            const filePath = await processNextBatch();
            return await uploadOnS3(filePath);
        }
        await processNextBatch(rows);
    }

    const obj = {
        next: batchWriter,
        end: batchWriter
    };

    return obj;
}

async function uploadOnS3(filePath) {
    const { Key: key } = await S3Utils.writeToS3MultipartData({
        Key: `error-reports/${filePath.split('/').pop()}`,
        Body: createReadStream(filePath),
        ACL: 'public-read'
    });
    const bucket = config.get('s3.bucket');
    const region = config.get('s3.region');
    const s3ObjectUrl = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    await fs.unlink(filePath);
    return s3ObjectUrl;
}

module.exports.genereateExcel = genereateExcel;
module.exports.generateExcelBatch = generateExcelBatch;
