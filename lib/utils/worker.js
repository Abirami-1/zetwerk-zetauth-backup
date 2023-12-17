const Excel = require('exceljs');
const fs = require('fs');
const AWS = require('aws-sdk');
const CAPITAL_LETTERS = new Array(26).fill('').map((value, index) => String.fromCharCode(65 + index));
const LETTERS_LENGTH = CAPITAL_LETTERS.length;
const config = require('config');
AWS.config.credentials = new AWS.Credentials(config.get('s3'));
const s3 = new AWS.S3({
    params: {
        Bucket: config.get('s3.bucket'),
        timeout: 6000000
    }
});
const path = require('path');

async function generateExcel({ worksheetName, headers, rows }) {
    
    let defaultFont = {
        name: 'Calibri',
        family: 2,
        size: 8,
        bold: false
    };
    let tableHeaderFontInitial = {
        size: 12,
        bold: true
    };

    let workbook = new Excel.Workbook();
    let worksheet = workbook.addWorksheet(worksheetName);
    worksheet.properties.defaultRowHeight = 15;
    let columns = [];
    for (let i = 0; i < headers.length; i++) {
        columns.push({
            width: 40
        });
    }

    worksheet.columns = columns;

    let headerRow = headers.map(header => {
        return header.title;
    });

    let tableData = rows.map(row => {
        return headers.map(header => {
            return row[header.name];
        });
    });

    let tableHeaderFont = Object.assign({}, defaultFont, tableHeaderFontInitial);

    worksheet.addRow(headerRow);
    setRowFont({
        worksheet,
        rowNumber: -1,
        font: tableHeaderFont
    });

    // Cache start cell address to add border border
    let startCell = worksheet.lastRow.getCell(1)._address;

    // Write table data
    addRows({
        worksheet,
        rows: tableData
    });

    let endCell = incrementColumn(worksheet.lastRow.getCell(1)._address, headerRow.length - 1);
    let range = `${startCell}:${endCell}`;

    addBorderToCellsInRange({
        range
    });

    wrapCellTextInRange({
        range
    });

    // Write empty row
    worksheet.addRow([]);

    let filepath = path.join(path.resolve('./temp'), `${Date.now()}_${worksheetName}-dump.xlsx`);

    await workbook.xlsx.writeFile(filepath);

    let result = await uploadFileToS3(filepath);
    await fs.unlinkSync(filepath);

    return result;
}

function setRowFont({ worksheet, rowNumber, font }) {
    let row = null;

    if (rowNumber === -1) {
        row = worksheet.lastRow;
    } else {
        row = worksheet.getRow(rowNumber);
    }

    row.font = font;
}

function addRows({ worksheet, rows }) {
    worksheet.addRows(rows);
}

function incrementColumn(cellAddress, increment) {
    let incrementValue = 1;

    if (increment && increment > 0) {
        incrementValue = increment;
    }

    let temp = cellAddress.match(/[a-z]+|[^a-z]+/gi);
    let columnIndex = temp[0].toUpperCase();

    let columnIndexReducer = (result, current) => {
        let nextValue = CAPITAL_LETTERS.indexOf(current) + result.increment;
        let nextIncrement = Math.floor(nextValue / LETTERS_LENGTH);

        if (nextIncrement) {
            result.increment = nextIncrement;
        } else {
            result.increment = 0;
        }

        let letterIndex = nextValue % LETTERS_LENGTH;
        result.index = CAPITAL_LETTERS[letterIndex] + result.index;

        return result;
    };

    let result = columnIndex
        .split('')
        .reverse()
        .reduce(columnIndexReducer, {
            index: '',
            increment: incrementValue
        });

    while (result.increment) {
        result = columnIndexReducer(result, '');
    }

    temp[0] = result.index;

    return temp.join('').toUpperCase();
}

function addBorderToCellsInRange({ range }) {
    generateCellsFromRange(range);

}

function wrapCellTextInRange({ range }) {
    generateCellsFromRange(range);
}

function generateCellsFromRange(range) {
    let [startCell, endCell] = range.split(':');
    let [startColumn, startRow] = startCell.match(/[a-z]+|[^a-z]+/gi);
    let [endColumn, endRow] = endCell.match(/[a-z]+|[^a-z]+/gi);
    let startColumnCharCode = startColumn.charCodeAt(0);
    let endColumnCharCode = endColumn.charCodeAt(0);
    let cells = [];

    for (let i = startColumnCharCode; i <= endColumnCharCode; i++) {
        for (let j = startRow; j <= endRow; j++) {
            cells.push(String.fromCharCode(i) + j);
        }
    }

    return cells;
}

async function uploadFileToS3(filepath) {
    return s3
        .upload({
            Key: filepath.split('/').pop(),
            Body: fs.createReadStream(filepath),
            ACL: 'public-read'
        })
        .promise();
}


module.exports.generateExcel = generateExcel;