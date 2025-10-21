"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processMappings = processMappings;
const utils_1 = require("../services/utils");
function processMappings(payload, configuredMapping) {
    const dataCache = {};
    const transactionRelationship = {};
    let endToEndId = '';
    if (configuredMapping?.mappings) {
        try {
            for (const mapping of configuredMapping.mappings) {
                const destination = mapping.destination.split('.')[1];
                const type = mapping.destination.split('.')[0];
                const separator = mapping.separator || '';
                const sources = mapping.sources;
                let DataCachevalue = mapping.prefix ? mapping.prefix : '';
                let transactionRelationshipValue = mapping.prefix ? mapping.prefix : '';
                for (let i = 0; i < sources.length; i++) {
                    if (type === 'redis') {
                        DataCachevalue += (0, utils_1.getValueByPath)(payload, sources[i]);
                        if (i < sources.length - 1) {
                            DataCachevalue += separator;
                        }
                    }
                    if (type === 'transaction') {
                        const value = (0, utils_1.getValueByPath)(payload, sources[i]);
                        transactionRelationshipValue += value;
                        if (i < sources.length - 1) {
                            transactionRelationshipValue += separator;
                        }
                    }
                }
                if (type === 'redis') {
                    DataCachevalue += mapping.suffix ? mapping.suffix : '';
                    dataCache[destination] = DataCachevalue;
                }
                if (type === 'transaction') {
                    transactionRelationshipValue += mapping.suffix ? mapping.suffix : '';
                    transactionRelationship[destination] = transactionRelationshipValue;
                    if (destination === 'endToEndId') {
                        endToEndId = transactionRelationshipValue;
                    }
                }
            }
        }
        catch (error) {
            throw error;
        }
    }
    else {
        throw new Error('No mappings configured');
    }
    return { dataCache, transactionRelationship, endToEndId };
}
//# sourceMappingURL=mapping-processor.js.map