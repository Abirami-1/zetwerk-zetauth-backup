// Validator function
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

function isValidObjectId(id) {
    if (ObjectId.isValid(id)) {
        if (String(new ObjectId(id)) === id) return true;
        return false;
    }
    return false;
}

function isLiteralObject(object) {
    return !!object && object.constructor === Object;
}

function queryGenerator(query) {
    if (!isLiteralObject) {
        return query;
    }
    for (const q in query) {
        if (isValidObjectId(query[q])) {
            query[q] = new ObjectId(query[q]);
        }
    }
    return query;
}

module.exports = {
    queryGenerator
};
