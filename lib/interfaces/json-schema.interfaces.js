"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSONSchemaFormat = exports.JSONSchemaType = void 0;
var JSONSchemaType;
(function (JSONSchemaType) {
    JSONSchemaType["STRING"] = "string";
    JSONSchemaType["NUMBER"] = "number";
    JSONSchemaType["INTEGER"] = "integer";
    JSONSchemaType["BOOLEAN"] = "boolean";
    JSONSchemaType["OBJECT"] = "object";
    JSONSchemaType["ARRAY"] = "array";
    JSONSchemaType["NULL"] = "null";
})(JSONSchemaType || (exports.JSONSchemaType = JSONSchemaType = {}));
var JSONSchemaFormat;
(function (JSONSchemaFormat) {
    JSONSchemaFormat["DATE_TIME"] = "date-time";
    JSONSchemaFormat["DATE"] = "date";
    JSONSchemaFormat["TIME"] = "time";
    JSONSchemaFormat["EMAIL"] = "email";
    JSONSchemaFormat["HOSTNAME"] = "hostname";
    JSONSchemaFormat["IPV4"] = "ipv4";
    JSONSchemaFormat["IPV6"] = "ipv6";
    JSONSchemaFormat["URI"] = "uri";
    JSONSchemaFormat["UUID"] = "uuid";
})(JSONSchemaFormat || (exports.JSONSchemaFormat = JSONSchemaFormat = {}));
//# sourceMappingURL=json-schema.interfaces.js.map