const mongoose = require('mongoose');

module.exports.setup = function(model) {

    model.findById = async function(_id, fieldsToPopulate, lean = true) {
        let document = this.findOne({
            _id: new mongoose.Types.ObjectId(_id)
        });

        if (fieldsToPopulate) {

            for (let field of fieldsToPopulate) {

                document = document.populate(field);

            }

        }

        if (lean) {
            return document.lean().exec();
        }

        return document.exec();

    };

    model.create = async function(document, fieldsToPopulate) {

        let model = new this(document);

        document = await model.save();

        return this.findById(document._id, fieldsToPopulate);

    };

    model.deleteById = async function(_id) {

        let document = await this.findOneAndUpdate({
            _id: new mongoose.Types.ObjectId(_id)
        }, {
            deleted: true
        }, {
            new: true
        });

        return document;

    };

    model.updateById = async function(_id, updatedDocument, fieldsToPopulate, runValidators = true) {

        await this.findOneAndUpdate({
            _id: new mongoose.Types.ObjectId(_id)
        }, updatedDocument, {
            new: true,
            runValidators
        });

        return this.findById(_id, fieldsToPopulate);

    };

    model.updateSubDocumentById = async function({ parentDocumentId, subDocumentName, subDocumentId, subDocumentData }) {

        let document = await this.findById(parentDocumentId, [], false);

        let subdocument = document[subDocumentName].id(subDocumentId);

        subdocument.set(subDocumentData);

        return document.save();

    };

    model.deleteSubDocumentById = async function({ parentDocumentId, subDocumentName, subDocumentId }) {

        let document = await this.findById(parentDocumentId, [], false);

        await document[subDocumentName].pull(subDocumentId);

        return document.save();

    };

    model.findAll = async function({ fieldsToPopulate, queryParams, fieldsToSearch, findConditions, lean }) {

        if (lean === undefined) {
            lean = true;
        }
        if (!queryParams) {
            queryParams = {};
        }

        let searchText = queryParams.searchText;
        let pageNumber = queryParams.pageNumber;
        let recordsPerPage = queryParams.recordsPerPage;
        let status = queryParams.status;
        let filter = queryParams.filter;
        let skip = (pageNumber - 1) * recordsPerPage;
        let sortBy = queryParams.sortBy || 'updatedAt';
        let sortCriteria = queryParams.sortCriteria || -1;
        let searchWithStatus = queryParams.searchWithStatus;

        let sortQuery = {};

        if (sortBy !== 'noSort') {
            sortQuery[sortBy] = sortCriteria;
        }

        let query = { deleted: false };

        if (status) {
            if (!Array.isArray(status)) {
                status = [status];
            }
            query.status = { $in: status };
        }

        if (searchText && searchText.replace(/\s/g, '').length) {
            const regex = new RegExp(searchText, 'i');
            if (!searchWithStatus) {
                delete query['status'];
            }
            if (filter) {
                if (!Array.isArray(filter)) {
                    filter = [filter];
                }
                filter = filter.map(eachFilter => eachFilter.toUpperCase());
                query.status = { $nin: filter };
            }
            query['$or'] = fieldsToSearch.map(fieldName => {
                let fieldObject = {};
                fieldObject[fieldName] = regex;
                return fieldObject;
            });
        }

        query = {
            ...query,
            ...findConditions
        };

        let totalDocuments = await this.countDocuments(query);
        let documents = this.find(query, null, { skip, limit: +(recordsPerPage), sort: sortQuery });

        if (fieldsToPopulate) {
            for (let field of fieldsToPopulate) {
                documents = documents.populate(field);
            }
        }

        let allDocuments;

        if (lean) {
            allDocuments = await documents.lean().exec();
        } else {
            allDocuments = await documents.exec();
        }

        let nextStart = (recordsPerPage * pageNumber) + 1;

        if (totalDocuments <= recordsPerPage) {
            nextStart = 0;
        }

        let meta = {
            total: totalDocuments,
            limit: +(recordsPerPage),
            offset: (pageNumber - 1),
            nextStart
        };

        return { allDocuments, meta };
    };
};