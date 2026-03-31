export interface RuleEntity {
  rule_id: string;
  rule_name: string;
  description: string;
  tenant_id: string;
  txtp: string;
  version: string;
  status: string;
  publishing_status: string;
  updated_by: string;
  rule_type?: string;
  rule_config_id?: string;
  created_at: Date;
  updated_at: Date;
}
