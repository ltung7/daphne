import { LOGGER_COLORS, logger } from "$lib/utils/logger";
import { getCurrentStatusBar, setCurrentStatusBar } from "$lib/server/db/firebase/status.fdb";
import { isDev } from "$lib/utils/isDev";

export interface StatusBarData {
    taskName: string;
    currentTaskName: string;
    maxValue: number;
    currentValue: number;
    startTime: number;
    done?: boolean;
    finished?: number;
}

export const initStatusbar = (account: string, taskName: string, index: string, currentTaskName: string = 'Przygotowywanie'): StatusBar => 
    new StatusBar(account, taskName, index, currentTaskName);

export const initLogStatus = () => new StatusBar('TEST', 'Task', 'log', 'Init')

export const isStatusPending = async (account: string, index: string, timeout: number = 5): Promise<boolean> => {
    if (isDev) return false;
    const status = await getCurrentStatusBar(account, index);
    if (!status) return false;
    if (status.done) return false;
    const threshold = (Date.now() - status.startTime) / 60000;
    const isPending = threshold < timeout;
    if (isPending) logger.warn(`Task ${index} is still pending for ${Math.ceil(threshold)} / ${timeout} minutes`);
    return isPending;
}

export class StatusBar {
    account: string;
    index: string;
    log: boolean;
    data: StatusBarData;

    constructor(account: string, taskName: string, index: string, currentTaskName: string) {
        this.account = account;
        this.index = index;
        this.log = index === 'log';
        this.data = {
            taskName: taskName,
            currentTaskName: currentTaskName,
            maxValue: 1,
            currentValue: 0,
            startTime: Date.now()
        };
        this.save();
    }

    async setTaskName(currentTaskName: string, increase: boolean = false): Promise<void> {
        this.data.currentTaskName = currentTaskName;
        if (increase) this.data.currentValue += 1;
        return this.save();
    }

    async setTask(currentTaskName: string, maxValue: number = 1, currentValue: number = 0): Promise<void> {
        this.data.currentTaskName = currentTaskName;
        this.data.maxValue = maxValue;
        this.data.currentValue = currentValue;
        return this.save();
    }

    async increase(increaseBy: number = 1): Promise<void> {
        this.data.currentValue += increaseBy;
        return this.save();
    }

    async save(): Promise<void> {
        if (this.index) {
            if (this.log) logger.log(`${this.data.currentTaskName}: ${this.data.currentValue} / ${this.data.maxValue}`, LOGGER_COLORS.GRAY);
            else setCurrentStatusBar(this.account, this.index, this.data);
        }
    }

    async clean(): Promise<void> {
        if (!this.index || this.data.done) return;
        this.data.done = true;
        this.data.finished = Date.now();
        if (this.log) logger.log(`Done ${this.data.taskName} in ${Math.ceil((Date.now() - this.data.startTime) / 1000)}s`, LOGGER_COLORS.GREEN);
        else setCurrentStatusBar(this.account, this.index, this.data);
    }
}