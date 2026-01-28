import type { iMappingResult } from 'src/interfaces/iMappingResult';
import type { FieldMapping } from 'src/interfaces/schema.interfaces';
import { getValueByPath } from '../services/utils';

/**
 * Processes configured mappings to extract data cache and transaction relationship data
 * @param payload The payload to extract data from
 * @param configuredMapping The mapping configuration
 * @param loggerCallback Optional logger callback function
 * @returns Object containing dataCache, transactionRelationship, and endToEndId
 */
export function processMappings(
  payload: Record<string, unknown>,
  configuredMapping: FieldMapping[] | undefined,
  endpoint: string,
): iMappingResult {
  // static object creation logic
  const dataCache: Record<string, unknown> = {};
  const transactionRelationship: Record<string, unknown> = {
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
  const dynamicMapping: Record<string, Record<string, unknown>> = {};
  let endToEndId = '';
  if (configuredMapping) {
    try {
      for (const mapping of configuredMapping) {
        const sources = mapping.source;
        //usually a string but can be array in case of multiple sources(split usecase)
        const destination =
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

        // handling multiple destinations for single source - split value usecase
        if (typeof destination !== 'string' || typeof type !== 'string') {
          const sources = mapping.source ?? [];
          const sourceValue = sources.length > 0 ? String(getValueByPath(payload, sources[0])) : '';
          const splitValues = sourceValue.split(mapping.delimiter ?? '');

          for (let j = 0; j < mapping.destination.length; j += 1) {
            const destItem = (mapping.destination as string[])[j];
            const [destType, dest] = destItem.split('.');
            if (destType === 'redis') {
              dataCache[dest] = splitValues[j];
            }
            if (destType === 'transactionDetails') {
              transactionRelationship[dest] = splitValues[j];
            }
          }

          continue;
        }

        // dynamic mapping logic based on datasource(datamodel ya payload)
        if (type !== 'redis' && type !== 'transactionDetails') {
          // append to dynamic mapping object - destination is confirmed string at this point
          const destParts = destination.split('.');
          const ObjectName: string = destParts[0]; // e.g., Toyota
          const PropertyName: string = destParts[1]; // e.g., model
          const nestedPropertyName: string = destParts[2]; // e.g., name (if any)
          const mappingSources = mapping.source ?? [];
          // if (mapping.datasource === 'dataModel') {
          dynamicMapping[ObjectName] ??= {};
          if (nestedPropertyName) {
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- Using ||= to handle falsy values
            dynamicMapping[ObjectName][PropertyName] ||= {};
            (dynamicMapping[ObjectName][PropertyName] as Record<string, unknown>)[
              nestedPropertyName
            ] = mappingSources.length > 0 ? getValueByPath(payload, mappingSources[0]) : undefined;
          } else {
            dynamicMapping[ObjectName][PropertyName] =
              mappingSources.length > 0 ? getValueByPath(payload, mappingSources[0]) : undefined;
          }

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

        let dataCacheValue = mapping.prefix ?? '';
        let transactionRelationshipValue = mapping.prefix ?? '';
        const mappingSources = sources ?? [];
        // REAL LOGIC STARTS HERE
        // Iterate through sources to build the value based on mapping - totally dynamic work
        for (let i = 0; i < mappingSources.length; i += 1) {
          if (type === 'redis') {
            dataCacheValue += String(getValueByPath(payload, mappingSources[i]));
            if (i < mappingSources.length - 1) {
              dataCacheValue += separator;
            }
          } else {
            transactionRelationshipValue += String(getValueByPath(payload, mappingSources[i]));
            if (i < mappingSources.length - 1) {
              transactionRelationshipValue += separator;
            }
          }
        }
        // Post processing for both dataCache and transactionRelationship
        if (type === 'redis') {
          dataCacheValue += mapping.suffix ?? '';
          if (stringSize === 3) {
            const destStr = mapping.destination as string;
            const [, objectName, destName] = destStr.split('.');
            // Handle nested object case
            dataCache[objectName] ??= {};
            (dataCache[objectName] as Record<string, unknown>)[destName] = dataCacheValue;
          } else {
            dataCache[destination] = dataCacheValue;
          }
        } else {
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
      return {
        dataCache,
        transactionRelationship,
        endToEndId,
        dynamicMapping,
      };
    }
  }

  return {
    dataCache,
    transactionRelationship,
    endToEndId,
    dynamicMapping,
  };
}
