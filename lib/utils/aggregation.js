/* eslint-disable no-prototype-builtins */
const BaseService = require('@zetwerk/zetapp-v2/services/BaseService');
const commonIPCService = require('@zetwerk/zetapp-v2/services/CommonIPCService');

class AggregationService extends BaseService {
    constructor() {
        super();
        if (AggregationService.instance) {
            return AggregationService.instance;
        }

        AggregationService.instance = this;
    }

    /**
     * Aggregates data for a given response and virtuals.
     *
     * @param {Object} proxyResData - The response data to aggregate.
     * @param {Array} virtuals - Virtual fields to aggregate.
     */
    async aggregateData(proxyResData, virtuals) {
        if (proxyResData?.hasOwnProperty('records') && Array.isArray(proxyResData?.records)) {
            // eslint-disable-next-line no-unsafe-optional-chaining
            for (let record of proxyResData?.records) {
                await this.aggregateDataForRecord(record, virtuals);
            }
        } else if (proxyResData) {
            await this.aggregateDataForRecord(proxyResData, virtuals);
        }
    }

    /**
     * Recursively finds virtual fields within the configuration fields.
     *
     * @param {Object} lcConfigFields - Configuration fields to search.
     * @param {Array} virtuals - An array to collect virtual field information.
     * @param {Array} nestedPath - The nested path for virtual fields.
     * @returns {Array} - An array of virtual field information.
     */
    findVirtuals(lcConfigFields, virtuals = [], nestedPath = []) {
        Object.entries(lcConfigFields).forEach(([fieldName, fieldObj]) => {
            if (fieldObj?.virtual && fieldObj?.refId && fieldObj?.ref?.includes('.')) {
                nestedPath.push(fieldObj.refId);
                virtuals.push({
                    ...fieldObj,
                    virtualName: fieldName,
                    nestedPath: JSON.parse(JSON.stringify(nestedPath))
                });
                nestedPath.pop();
            } else if (fieldObj?.fields && !fieldObj.virtual) {
                nestedPath.push(fieldName);
                this.findVirtuals(fieldObj?.fields, virtuals, nestedPath);
                nestedPath.pop();
            }
        });
        return virtuals;
    }

    /**
     * Aggregates virtual data for a given record and virtual fields.
     *
     * @param {Object} record - The record to aggregate virtual data for.
     * @param {Array} virtuals - Virtual fields to aggregate.
     */
    async aggregateDataForRecord(record, virtuals) {
        for (let virtual of virtuals) {
            await this.aggregateVirtualData(record, virtual.nestedPath, virtual.ref, virtual.virtualName);
        }
    }

    /**
     * Aggregates virtual data for a given record at the specified nested path.
     *
     * @param {Object} record - The record to aggregate virtual data for.
     * @param {Array} nestedPath - The nested path to access the virtual field.
     * @param {string} ref - Reference information.
     * @param {string} virtualName - The name of the virtual field.
     */
    async aggregateVirtualData(record, nestedPath, ref, virtualName) {
        let target = record;
        let virtualToBeEmbedInObj;
        for (let index = 0; index < nestedPath.length; index++) {
            let pathElement = nestedPath[index];
            if (target && !Array.isArray(target) && index === nestedPath.length - 1) {
                virtualToBeEmbedInObj = target;
                target = target?.hasOwnProperty(pathElement) ? target[pathElement] : null;
                target &&
                    (await this.getDatFromSecondaryServiceAndEmbedVirtualData(
                        virtualToBeEmbedInObj,
                        { ref, virtualName, refId: pathElement },
                        target
                    ));
                return;
            } else {
                if (Array.isArray(target)) {
                    for (let obj of target) {
                        await this.aggregateVirtualData(obj, nestedPath.slice(index), ref, virtualName);
                        return;
                    }
                } else if (typeof target === 'object') {
                    target = target[pathElement];
                }
            }
        }
    }

    /**
     * Fetches data from a secondary service and embeds it into the given data.
     *
     * @param {Object} data - The data to embed virtual data into.
     * @param {Object} virtual - Virtual field information.
     * @param {string | Array} idOrIds - ID or IDs to fetch data.
     */
    async getDatFromSecondaryServiceAndEmbedVirtualData(data, virtual, idOrIds) {
        const serviceName = virtual.ref?.split('.')[0];
        const entity = virtual.ref?.split('.')[1];
        let id, idArray;
        if (Array.isArray(idOrIds)) {
            if (idOrIds.length == 0) {
                this.logger.info(`getDatFromSecondaryServiceAndEmbedVirtualData::${virtual.refId}: IdArray is Empty`);
                return;
            }
            idArray = idOrIds;
        } else if (typeof idOrIds === 'string') {
            id = idOrIds;
        } else {
            this.logger.warn(
                `getDatFromSecondaryServiceAndEmbedVirtualData::${virtual.refId}: Invalid Id or Ids for common ipc`
            );
            return;
        }
        let res;
        if (idArray?.length > 0) {
            res = await commonIPCService.getEntitiesById('', { serviceName, entity, idArray });
        } else if (id) {
            res = await commonIPCService.getEntityById('', { serviceName, entity, id });
        }

        data[virtual.virtualName] = res?.data?.data;
    }
}

module.exports = new AggregationService();