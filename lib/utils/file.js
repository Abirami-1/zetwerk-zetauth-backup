const fs = require('fs').promises;
const config = require('config');
const { S3, FileUtils } = require('@zetwerk/zet-common-utilites');

const S3Utils = new S3(config);
const path = require('path');

async function createDirIfNotExists(dirPath) {
    try {
        await fs.access(dirPath);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.mkdir(dirPath);
        }
    }
}

async function getExcelFileFromS3({ fileName, tempFileName }) {
    const S3Params = {
        Key: fileName
    };
    const obj = await S3Utils.getObject(S3Params);
    const tempDirPath = path.resolve(path.join(__dirname, '../temp'));
    await createDirIfNotExists(tempDirPath);
    const tempFilePath = path.join(tempDirPath, tempFileName || S3Params.Key);

    const fileUtils = new FileUtils();
    await fileUtils.streamToFile({ inputStream: obj.Body, filePath: tempFilePath });
    return { filePath: tempFilePath };
}
module.exports.getExcelFileFromS3 = getExcelFileFromS3;
