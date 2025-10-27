"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EndpointStatus = exports.FieldType = exports.ContentType = exports.HttpMethod = void 0;
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["GET"] = "GET";
    HttpMethod["POST"] = "POST";
    HttpMethod["PUT"] = "PUT";
    HttpMethod["DELETE"] = "DELETE";
    HttpMethod["PATCH"] = "PATCH";
})(HttpMethod || (exports.HttpMethod = HttpMethod = {}));
var ContentType;
(function (ContentType) {
    ContentType["JSON"] = "application/json";
    ContentType["XML"] = "application/xml";
})(ContentType || (exports.ContentType = ContentType = {}));
var FieldType;
(function (FieldType) {
    FieldType["STRING"] = "STRING";
    FieldType["NUMBER"] = "NUMBER";
    FieldType["BOOLEAN"] = "BOOLEAN";
    FieldType["OBJECT"] = "OBJECT";
    FieldType["ARRAY"] = "ARRAY";
    FieldType["DATE"] = "DATE";
})(FieldType || (exports.FieldType = FieldType = {}));
var EndpointStatus;
(function (EndpointStatus) {
    EndpointStatus["IN_PROGRESS"] = "IN_PROGRESS";
    EndpointStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    EndpointStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    EndpointStatus["READY_FOR_DEPLOYMENT"] = "READY_FOR_DEPLOYMENT";
    EndpointStatus["DEPLOYED"] = "DEPLOYED";
    EndpointStatus["SUSPENDED"] = "SUSPENDED";
    EndpointStatus["PUBLISHED"] = "PUBLISHED";
})(EndpointStatus || (exports.EndpointStatus = EndpointStatus = {}));
//# sourceMappingURL=core.interfaces.js.map