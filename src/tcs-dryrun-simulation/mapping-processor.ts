import { iMappingConfiguration } from '../interfaces/iMappingConfiguration';
import { iMappingResult } from '../interfaces/iMappingResult';
import { getValueByPath } from '../services/utils';

/**
 * Processes configured mappings to extract data cache and transaction relationship data
 * @param payload The payload to extract data from
 * @param configuredMapping The mapping configuration
 * @param loggerCallback Optional logger callback function
 * @returns Object containing dataCache, transactionRelationship, and endToEndId
 */
export function processMappings(
  payload: any,
  configuredMapping: iMappingConfiguration,
): iMappingResult {
  const dataCache: any = {};
  const transactionRelationship: any = {};
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
            DataCachevalue += getValueByPath(payload, sources[i]);
            if (i < sources.length - 1) {
              DataCachevalue += separator;
            }
          }
          if (type === 'transaction') {
            const value = getValueByPath(payload, sources[i]);
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
    } catch (error) {
      throw error;
    }
  } else {
    throw new Error('No mappings configured');
  }

  return { dataCache, transactionRelationship, endToEndId };
}
