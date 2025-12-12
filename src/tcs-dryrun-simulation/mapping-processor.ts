import { getValueByPath } from '../services/utils';
import type { TransactionDetails } from 'src/interfaces/iTransactionDetails';

/**
 * Processes configured mappings to extract data cache and transaction relationship data
 * @param payload The payload to extract data from
 * @param configuredMapping The mapping configuration
 * @param loggerCallback Optional logger callback function
 * @returns Object containing dataCache, transactionRelationship, and endToEndId
 */
export async function processMappings(
  payload: any,
  configuredMapping: any,
  endpoint: string,
): Promise<{ dataCache: any; transactionRelationship: TransactionDetails; endToEndId: string }> {
  const dataCache: any = {};
  const transactionRelationship: TransactionDetails = {
    source: '',
    destination: '',
    TxTp: '',
    TenantId: '',
    MsgId: '',
    CreDtTm: '',
    Amt: '',
    Ccy: '',
    EndToEndId: '',
    lat: '',
    long: '',
    TxSts: '',
  };
  let endToEndId = '';

  if (configuredMapping) {
    try {
      // Support both array format and object with mappings property
      const mappingsArray = Array.isArray(configuredMapping)
        ? configuredMapping
        : configuredMapping.mappings || [];

      for (const mapping of mappingsArray) {
        const sources = mapping.source || [];
        const destination =
          typeof mapping.destination === 'string'
            ? mapping.destination.split('.')[1]
            : mapping.destination;
        const type =
          typeof mapping.destination === 'string'
            ? mapping.destination.split('.')[0]
            : mapping.destination;
        const separator = mapping.delimiter;
        const {transformation} = mapping;

        // Skip if no sources defined (unless it's a constant value)
        if (!mapping.constantValue && (!sources || sources.length === 0)) {
          continue;
        }

        if (mapping.constantValue) {
          if (type === 'redis') {
            dataCache[destination] = mapping.constantValue;
          }
          if (type === 'transactionDetails') {
            transactionRelationship[destination] = mapping.constantValue;
          }
          continue;
        }

        if (typeof destination !== 'string' || typeof type !== 'string') {
          const sourceValue = getValueByPath<string>(payload, mapping.source[0]);
          const splitValues = sourceValue.split(mapping.delimiter);

          for (let j = 0; j < mapping.destination.length; j++) {
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

        let dataCacheValue = mapping.prefix ? mapping.prefix : '';
        let sum = 0;
        let transactionRelationshipValue = mapping.prefix ? mapping.prefix : '';

        for (let i = 0; i < sources.length; i++) {
          if (type === 'redis') {
            const value = getValueByPath<string>(payload, sources[i]);
            if (transformation == 'SUM') {
              const numValue: number = getValueByPath<number>(payload, sources[i]);
              sum += numValue;
            } else {
              dataCacheValue += value ?? '';
            }
            if (separator && i < sources.length - 1) {
              dataCacheValue += separator;
            }
          }
          if (type === 'transactionDetails') {
            const value = getValueByPath<string>(payload, sources[i]);
            if (transformation == 'SUM') {
              const numValue = getValueByPath<number>(payload, sources[i]);
              sum += numValue;
            } else {
              transactionRelationshipValue += value ?? '';
            }
            if (separator && i < sources.length - 1) {
              transactionRelationshipValue += separator;
            }
          }
        }

        if (type === 'redis') {
          dataCacheValue += mapping.suffix ? mapping.suffix : '';
          if (transformation == 'SUM') {
            dataCache[destination] = sum.toString();
          } else {
            dataCache[destination] = dataCacheValue;
          }
        }

        if (type === 'transactionDetails') {
          transactionRelationshipValue += mapping.suffix ? mapping.suffix : '';
          if (transformation == 'SUM') {
            transactionRelationship[destination] = sum.toString();
          } else {
            transactionRelationship[destination] = transactionRelationshipValue;
          }

          // Fix the case sensitivity issue
          if (destination === 'EndToEndId') {
            // Changed from 'endToEndId' to 'EndToEndId'
            endToEndId = transactionRelationshipValue;
          }
        }
      }
    } catch (error) {
      console.error(`Failed to process mapping data: ${String(error)}`);
      // Return valid objects even on error
      return {
        dataCache,
        transactionRelationship,
        endToEndId,
      };
    }
  }

  return {
    dataCache,
    transactionRelationship,
    endToEndId,
  };
}
