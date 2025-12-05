// SPDX-License-Identifier: Apache-2.0

export interface CollectionRow {
  destination_type_id: number;
  collection_name: string;
  collection_type: string;
  collection_description: string;
}

export interface FieldRow {
  field_name: string;
  field_type: string;
  parent_id: number | null;
  serial_no: number;
  collection_id: number;
}

export interface DestinationTypeResult {
  destination_type_id: number;
  collection_type: string;
  name: string;
  description: string | null;
  destination_id: number;
  created_at: string;
}

export interface FieldResult {
  field_id: number;
  field_name: string;
  field_type: string;
  parent_id: number | null;
  is_active: boolean;
  serial_no: number | null;
  collection_id: number;
}
