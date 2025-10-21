"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValueByPath = getValueByPath;
function getValueByPath(obj, path) {
    const properties = path.split('.');
    let current = obj;
    for (const prop of properties) {
        if (prop.match(/^\d+$/)) {
            current = current[parseInt(prop)];
        }
        else {
            current = current?.[prop];
        }
        if (current === undefined || current === null) {
            return undefined;
        }
    }
    return current;
}
//# sourceMappingURL=utils.js.map