export interface iMappingConfiguration {
    mappings?: Array<{
        destination: string;
        sources: string[];
        separator?: string;
        prefix?: string;
        suffix?: string;
    }>;
}
