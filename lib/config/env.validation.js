"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentVariables = void 0;
const class_validator_1 = require("class-validator");
var NodeEnv;
(function (NodeEnv) {
    NodeEnv["DEVELOPMENT"] = "development";
    NodeEnv["PRODUCTION"] = "production";
    NodeEnv["TEST"] = "test";
    NodeEnv["DEV"] = "dev";
})(NodeEnv || (NodeEnv = {}));
class EnvironmentVariables {
    NODE_ENV = NodeEnv.DEVELOPMENT;
    MAX_CPU;
    FUNCTION_NAME;
    CONFIGURATION_DATABASE_URL;
    CONFIGURATION_DATABASE;
    CONFIGURATION_DATABASE_USER;
    CONFIGURATION_DATABASE_PASSWORD;
}
exports.EnvironmentVariables = EnvironmentVariables;
__decorate([
    (0, class_validator_1.IsEnum)(NodeEnv),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "NODE_ENV", void 0);
__decorate([
    (0, class_validator_1.IsNumberString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "MAX_CPU", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "FUNCTION_NAME", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CONFIGURATION_DATABASE_URL", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CONFIGURATION_DATABASE", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CONFIGURATION_DATABASE_USER", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EnvironmentVariables.prototype, "CONFIGURATION_DATABASE_PASSWORD", void 0);
//# sourceMappingURL=env.validation.js.map