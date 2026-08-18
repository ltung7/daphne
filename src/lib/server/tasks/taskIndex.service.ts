// Service that maps task names to executable functions

import { logger, thrower } from '$lib/utils/logger';
import slackMessage from '../services/slack.service';

/**
 * Map of task identifiers to async functions. Each function receives a payload (any) and should return a Promise.
 * Add new task functions here as they become available.
 */
const taskMap: Record<string, (payload: any) => Promise<ExplicitAnyToExtend>> = {
    
};

/**
 * Execute a task by name.
 * @param task – identifier string matching a key in {@link taskMap}
 * @param payload – optional data passed to the task implementation
 */
export async function runTaskFromIndex(task: string, payload: any = {}): Promise<void> {
    const fn = taskMap[task];
    if (!fn) {
        logger.error(`Unknown task requested: ${task}`);
        throw new Error(`Task "${task}" not found`);
    }
    logger.log(`Executing task "${task}" with payload: ${JSON.stringify(payload)}`);
    const start = Date.now();
    slackMessage(`Executing task "${task}"`);
    try {
        await fn(payload);
        slackMessage(`Task done "${task}" in ${((Date.now() - start) / 1000).toFixed(0)}s`);
    } catch (error) {
        // Report the error via Slack without propagating it further
        thrower.slack(error, `Task [${task}] execution error`);
    }
}
