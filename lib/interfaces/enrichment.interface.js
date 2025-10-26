"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigType = exports.AuthType = exports.FileType = exports.JobStatus = exports.SourceType = exports.IngestMode = exports.ScheduleStatus = void 0;
var ScheduleStatus;
(function (ScheduleStatus) {
    ScheduleStatus["ACTIVE"] = "active";
    ScheduleStatus["INACTIVE"] = "in-active";
})(ScheduleStatus || (exports.ScheduleStatus = ScheduleStatus = {}));
var IngestMode;
(function (IngestMode) {
    IngestMode["APPEND"] = "append";
    IngestMode["REPLACE"] = "replace";
})(IngestMode || (exports.IngestMode = IngestMode = {}));
var ConfigType;
(function (ConfigType) {
    ConfigType["PUSH"] = "push";
    ConfigType["PULL"] = "pull";
})(ConfigType || (exports.ConfigType = ConfigType = {}));
var FileType;
(function (FileType) {
    FileType["CSV"] = "CSV";
    FileType["JSON"] = "JSON";
    FileType["TSV"] = "TSV";
})(FileType || (exports.FileType = FileType = {}));
var SourceType;
(function (SourceType) {
    SourceType["SFTP"] = "SFTP";
    SourceType["HTTP"] = "HTTP";
})(SourceType || (exports.SourceType = SourceType = {}));
var AuthType;
(function (AuthType) {
    AuthType["USERNAME_PASSWORD"] = "USERNAME_PASSWORD";
    AuthType["PRIVATE_KEY"] = "PRIVATE_KEY";
})(AuthType || (exports.AuthType = AuthType = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "pending";
    JobStatus["APPROVED"] = "approved";
    JobStatus["INPROGRESS"] = "in-progress";
    JobStatus["REJECTED"] = "rejected";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
//# sourceMappingURL=enrichment.interface.js.map