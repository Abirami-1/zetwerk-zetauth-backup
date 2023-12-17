const config = require('config');
const AWS = require('aws-sdk');
const XLSX = require('@zetwerk/xlsx');
const axios = require('axios');
const fs = require('fs');

const readExcelToArray = buffers => {
    let fileContent = [];
    const buffer = Array.isArray(buffers) ? Buffer.concat(buffers) : buffers;
    const workbook = XLSX.read(buffer, { cellDates: true });
    const wsname = workbook.SheetNames[0];
    fileContent = XLSX.utils.sheet_to_json(workbook.Sheets[wsname]);

    if (!fileContent) {
        throw new Error('Error reading Excel!');
    }

    return fileContent;
};

const readDataFromS3PublicUrl = async url => {
    if (!isFileExcel(url)) {
        throw new Error('Wrong File Type. File type should be excel.');
    }
    const fileData = await axios.get(url, { responseType: 'arraybuffer' });
    const fileContent = readExcelToArray(fileData.data);
    return fileContent;
};

const isFileExcel = url => {
    const excelTypes = [
        'xlsx',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    const extension = url.split('.').pop();
    if (!excelTypes.includes(extension)) {
        return false;
    }
    return true;
};

const readExcelFromLocal = path => {
    if (!isFileExcel(path)) {
        throw new Error('Wrong File Type. File type should be excel.');
    }

    return new Promise((resolve, reject) => {
        fs.readFile(path, function(err, content) {
            if (err) {
                return reject(err);
            }
            const fileContent = readExcelToArray(content);
            return resolve(fileContent);
        });
    });
};

const readExcelFromS3 = (url, key = '') => {
    if (!isFileExcel(url)) {
        throw new Error('Wrong File Type. File type should be excel.');
    }

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
            const fileContent = readExcelToArray(buffers);

            resolve(fileContent);
        });
    });
};

module.exports = {
    readExcelFromLocal,
    readExcelFromS3,
    readDataFromS3PublicUrl
};
