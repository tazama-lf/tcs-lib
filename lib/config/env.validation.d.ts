declare enum NodeEnv {
    DEVELOPMENT = "development",
    PRODUCTION = "production",
    TEST = "test",
    DEV = "dev"
}
export declare class EnvironmentVariables {
    NODE_ENV: NodeEnv;
    MAX_CPU: string;
    FUNCTION_NAME: string;
    CONFIGURATION_DATABASE_URL: string;
    CONFIGURATION_DATABASE: string;
    CONFIGURATION_DATABASE_USER: string;
    CONFIGURATION_DATABASE_PASSWORD: string;
}
export {};
