import type { iMappingResult } from 'src/interfaces/iMappingResult';
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
  configuredMapping: any,
  endpoint: string,
): iMappingResult {
  // static object creation logic
  const dataCache: any = {};
  const transactionRelationship: any = {
    source: '',
    destination: '',
    TxTp: '',
    TenantId: '',
    MsgId: '',
    CreDtTm: '',
    Amt: -1,
    Ccy: '',
    EndToEndId: '',
    lat: '',
    long: '',
    TxSts: '',
  };
  // dynamic object creation logic
  const dynamicMapping: any = {};
  let endToEndId = '';
  this.loggerService.log(`Processing mappings for endpoint: ${endpoint}`, this.LOG_CONTEXT);
  if (configuredMapping) {
    this.loggerService.log('configuredMapping is: ', JSON.stringify(configuredMapping));
    try {
      for (const mapping of configuredMapping) {
        const sources = mapping.source;
        //usually a string but can be array in case of multiple sources(split usecase)
        let destination =
          typeof mapping.destination === 'string'
            ? mapping.destination.split('.')[1]
            : mapping.destination;
        const type =
          typeof mapping.destination === 'string'
            ? mapping.destination.split('.')[0]
            : mapping.destination;
        // case: redis.instdAmt.amt or redis.instdAmt.ccy ---> [redis,instdAmt,amt]
        // stringSize will be 3 in this case
        const stringSize =
          typeof mapping.destination === 'string' ? mapping.destination.split('.').length : -1;
        const separator = mapping.delimiter;
        // dynamic mapping logic based on datasource(datamodel ya payload)
        if (type !== 'redis' && type !== 'transactionDetails') {
          // append to dynamic mapping object
          const ObjectName: string = mapping.destination.split('.')[0]; // e.g., Toyota
          const PropertyName: string = mapping.destination.split('.')[1]; // e.g., model
          const nestedPropertyName: string = mapping.destination.split('.')[2]; // e.g., name (if any)
          // if (mapping.datasource === 'dataModel') {
          this.loggerService.log('dataModel case for dynamic mapping source: ', mapping.source[0]);
          this.loggerService.log(
            'dataModel case for dynamic mapping value: ',
            getValueByPath(payload, mapping.source[0]),
          );
          dynamicMapping[ObjectName] ??= {};
          if (nestedPropertyName) {
            dynamicMapping[ObjectName][PropertyName] ??= {};
            dynamicMapping[ObjectName][PropertyName][nestedPropertyName] = getValueByPath(
              payload,
              mapping.source[0],
            );
          } else {
            dynamicMapping[ObjectName][PropertyName] = getValueByPath(payload, mapping.source[0]);
          }
          // }
          this.loggerService.log('dynamicMapping object is now: ', JSON.stringify(dynamicMapping));
          continue;
        }
        //constant value injection logic
        if (mapping.constantValue) {
          if (type === 'redis') {
            dataCache[destination] = mapping.constantValue;
          }
          if (type === 'transactionDetails') {
            transactionRelationship[destination] = mapping.constantValue;
          }
          continue;
        }
        // handling multiple destinations for single source - split value usecase
        if (typeof destination !== 'string' || typeof type !== 'string') {
          const sourceValue = getValueByPath(payload, mapping.source[0]);
          const splitValues = sourceValue.split(mapping.delimiter);
          for (let j = 0; j < mapping.destination.length; j += 1) {
            const dest = mapping.destination[j].split('.')[1];
            const destType = mapping.destination[j].split('.')[0];
            if (destType === 'redis') {
              dataCache[dest] = splitValues[j];
            }
            if (destType === 'transactionDetails') {
              transactionRelationship[dest] = splitValues[j];
            }
          }
          continue;
        }
        let dataCacheValue = mapping.prefix ?? '';
        let transactionRelationshipValue = mapping.prefix ?? '';
        // REAL LOGIC STARTS HERE
        // Iterate through sources to build the value based on mapping - totally dynamic work
        for (let i = 0; i < sources.length; i += 1) {
          if (type === 'redis') {
            dataCacheValue += getValueByPath(payload, sources[i]);
            if (i < sources.length - 1) {
              dataCacheValue += separator;
            }
          } else if (type === 'transactionDetails') {
            transactionRelationshipValue += getValueByPath(payload, sources[i]);
            if (i < sources.length - 1) {
              transactionRelationshipValue += separator;
            }
          }
        }
        // Post processing for both dataCache and transactionRelationship
        if (type === 'redis') {
          dataCacheValue += mapping.suffix ?? '';
          if (stringSize === 3) {
            destination = mapping.destination.split('.')[2];
            // Handle nested object case
            const objectName: string = mapping.destination.split('.')[1]; // instdAmt or intrBkSttlmAmt
            dataCache[objectName] ??= {};
            dataCache[objectName][destination] = dataCacheValue;
          } else {
            dataCache[destination] = dataCacheValue;
          }
        } else if (type === 'transactionDetails') {
          transactionRelationshipValue += mapping.suffix ?? '';
          transactionRelationship[destination] = transactionRelationshipValue;
          // Fix the case sensitivity issue
          if (destination === 'EndToEndId') {
            // Changed from 'endToEndId' to 'EndToEndId'
            endToEndId = transactionRelationshipValue;
          }
        }
      }
    } catch (error) {
      this.loggerService.error(`Failed to process mapping data: ${String(error)}`);
      return {
        dataCache,
        transactionRelationship,
        endToEndId,
        dynamicMapping,
      };
    }
  } else {
    this.loggerService.log(`No mapping configured for endpoint: ${endpoint}`);
  }
  this.loggerService.log(
    `Completed processing mappings for endpoint: ${endpoint}`,
    this.LOG_CONTEXT,
  );
  this.loggerService.log(
    `Transaction Relationship: ${JSON.stringify(transactionRelationship)}`,
    this.LOG_CONTEXT,
  );
  return {
    dataCache,
    transactionRelationship,
    endToEndId,
    dynamicMapping,
  };
}
