function parseValue(value: string): unknown {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (value === 'undefined') return undefined;
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') return num;
    return value;
}

export default function searchParamsToObject(url: URL) {
    const obj: Record<string, ExplicitAnyToExtend> = {};
    for (const [ rawKey, value ] of url.searchParams) {
        const bracket = rawKey.indexOf('[');
        let objectValue: unknown = parseValue(value);
        let key = rawKey;
        if (bracket > 0) {
            const subkey = rawKey.substring(bracket + 1, rawKey.length - 1);
            key = rawKey.substring(0, bracket);
            const tempObj: Record<string, ExplicitAnyToExtend> = {};
            tempObj[subkey] = objectValue;
            objectValue = tempObj;
        }

        if (obj[key]) {
            if (Array.isArray(obj[key])) {
                obj[key].push(objectValue);
            } else if (typeof objectValue === 'object' && objectValue !== null) {
                Object.assign(obj[key], objectValue)
            } else {
                obj[key] = [ obj[key], objectValue ];
            }
        } else {
            obj[key] = objectValue;
        }
    }
    return obj;
}

export function parseFiltersAndFields<T extends object>(
    url: URL
): { filters: Partial<T>; fields: (keyof T)[] | false } {
    const params = searchParamsToObject(url);

    const { fields, ...filters } = params;

    let parsedFields: (keyof T)[] | false = false;

    if (fields) {
        if (Array.isArray(fields)) {
            parsedFields = fields.filter((f): f is string => typeof f === 'string') as (keyof T)[];
        } else if (typeof fields === 'string' && fields.length > 0) {
            parsedFields = fields.split(',').map(f => f.trim()).filter((f): f is string => f.length > 0) as (keyof T)[];
        }
    }

    return {
        filters: filters as Partial<T>,
        fields: parsedFields !== false && parsedFields.length === 0 ? false : parsedFields
    };
}