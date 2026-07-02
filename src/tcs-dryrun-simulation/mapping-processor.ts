import type { LoggerService } from '@tazama-lf/frms-coe-lib';
import type { iMappingResult } from 'src/interfaces/iMappingResult';
import type { FieldMapping } from 'src/interfaces/schema.interfaces';
import { getValueByPath } from '../utils/path-utils';

/**
 * Processes configured mappings to extract data cache and transaction relationship data
 * @param payload The payload to extract data from
 * @param configuredMapping The mapping configuration
 * @param endpoint The endpoint identifier
 * @param loggerService Optional logger service for error logging
 * @returns Object containing dataCache, transactionRelationship, and endToEndId
 */
export function processMappings(
  payload: Record<string, unknown>,
  configuredMapping: FieldMapping[] | undefined,
  endpoint: string,
  loggerService?: LoggerService,
): iMappingResult {
  // console.log("Starting mapping processing with payload...", JSON.stringify(payload, null, 2));

  // console.log("--------------------------------------------------------------------------");
  // console.log(`Processing mappings for endpoint: in tcs lib tcs-dry-run `);
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
  // CstmrCdtTrfInitn.PmtInf.CdtTrfTxInf.Cdtr.Id.PrvtId.Othr.0.Id

  // dynamic object creation logic
  const dynamicMapping: Record<string, Record<string, unknown>> = {};
  let endToEndId = '';
  if (configuredMapping) {
    try {
      // let i = 0;
      for (const mapping of configuredMapping) {
        // console.log(`Processing mapping ${i + 1}/${configuredMapping.length}`);
        // i += 1;
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
          const mappingSources = mapping.source ?? [];
          const sourceValue =
            mappingSources.length > 0 ? getValueByPath(payload, mappingSources[0]) : undefined;

          // Validate destParts.length and handle 1, 2, or >=3 parts
          if (destParts.length === 1) {
            // Single-part destination: assign directly as a wrapped object
            const ObjectName = destParts[0];
            dynamicMapping[ObjectName] ??= {};
            dynamicMapping[ObjectName].value = sourceValue;
          } else if (destParts.length === 2) {
            // Two-part destination: ObjectName.PropertyName
            const ObjectName = destParts[0];
            const PropertyName = destParts[1];
            dynamicMapping[ObjectName] ??= {};
            dynamicMapping[ObjectName][PropertyName] = sourceValue;
          } else if (destParts.length >= 3) {
            // Three-or-more-part destination: ObjectName.PropertyName.nestedPropertyName
            const ObjectName = destParts[0];
            const PropertyName = destParts[1];
            const nestedPropertyName = destParts[2];
            dynamicMapping[ObjectName] ??= {};
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- Using ||= to handle falsy values
            dynamicMapping[ObjectName][PropertyName] ||= {};
            (dynamicMapping[ObjectName][PropertyName] as Record<string, unknown>)[
              nestedPropertyName
            ] = sourceValue;
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
        // console.log("inner loop sources length:", mappingSources.length);
        for (let i = 0; i < mappingSources.length; i += 1) {
          // console.log(`Processing source ${i + 1}/${mappingSources.length} for mapping ${destination}`);
          if (type === 'redis') {
            // console.log(`Extracted value for source ${mappingSources[i]}`);
            dataCacheValue += String(getValueByPath(payload, mappingSources[i]));

            // console.log(`${getValueByPath(payload, mappingSources[i])}`);
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
      if (loggerService) {
        loggerService.error(
          `Error in processMappings for endpoint '${endpoint}': ${String(error)}`,
          error instanceof Error ? error.stack : undefined,
        );
      }
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
