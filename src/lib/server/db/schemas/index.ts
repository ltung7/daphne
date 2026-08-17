export interface BQSchemaField {
    name: string,
    type: string,
    mode: string,
    description: string
}

export interface BQSchema {
    fields: Array<BQSchemaField>,
    index?: Array<string>,
    editable?: string
}

import log_random from './log_random.schema.js'

export default {
	log: {
		log_random,
	}
} as Record<string, Record<string, BQSchema>>