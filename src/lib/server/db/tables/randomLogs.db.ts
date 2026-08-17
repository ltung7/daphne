import slackMessage from "$lib/server/services/slack.service";
import { randomDatedId } from "$lib/utils/randomString";
import { getItemById, getItems, insertItems, LOG_DATASET } from "./wrapper.db";

const TABLE_NAME = 'log_random';
const INDEX = 'log_id'

interface RandomLog {
    log_id: string;
    description: string;
    data: string;
    timestamp: number;
}

export const insertRandomLog = async (description: string, data: ExplicitAnyToExtend) => {
    if (typeof data !== 'string') data = JSON.stringify(data);
    const timestamp = Date.now();
    const log_id = randomDatedId('RL');
    await insertItems(TABLE_NAME)(LOG_DATASET, [ { log_id, description, data, timestamp } ]);
    slackMessage(`Random log inserted (${log_id}): ` + description);
}

export const getRandomLogs = async (offset = 0) => getItems(TABLE_NAME)(LOG_DATASET, null, null, 'timestamp DESC', offset, 50) as Promise<RandomLog[]>;

export const getPrinterLogs = async (account: string): Promise<RandomLog[]> => {
    const description = `printerlogs ${account}`;
    return getItems(TABLE_NAME)(LOG_DATASET, { description }, [ INDEX, 'timestamp' ], 'timestamp DESC', 0, 50);
}

export const getRandomLogContent = async (logId: string): Promise<RandomLog | null> => {
    return getItemById(TABLE_NAME, INDEX)(LOG_DATASET, logId);
}