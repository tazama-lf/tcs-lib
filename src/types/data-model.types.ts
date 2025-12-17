// SPDX-License-Identifier: Apache-2.0

export interface TazamaField {
  name: string;
  type: string;
  required: boolean;
  parent_id: number | null;
  serial_no: number;
  collection_id: number;
  field_id: number;
  properties?: TazamaField[];
}

export interface GetCollectionsParams {
  tenantId: string;
}

export interface CreateDestinationTypeBody {
  collection_type: string;
  name: string;
  description?: string;
  destination_id: number;
}

export interface AddFieldBody {
  name: string;
  field_type: string;
  parent_id?: number;
  is_active?: boolean;
  serial_no?: number;
}

export interface DestinationTypeParams {
  destinationTypeId: string;
}
