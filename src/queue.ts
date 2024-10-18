import { INTERNAL_kv } from "./kv.ts";

export type Task = {
    type: "duck-spawn";
    payload: {
        guildId: string;
        duckId: string;
    };
} | {
    type: "duck-leave";
    payload: {
        guildId: string;
        duckId: string;
    };
};

export function generateRandomDelay() {
    const now = new Date();

    const startTime = new Date(now.setHours(8, 0, 0, 0)).getTime();
    const endTime = new Date(now.setHours(23, 59, 59, 999)).getTime();

    const currentTime = Date.now();

    const randomTime = startTime + Math.random() * (endTime - startTime);
    const millis = randomTime - currentTime;

    return millis;
}

const scheduleTask = (task: Task, { delay }: { delay: number }) => {
    if (delay < 0) {
        console.warn("Delay is negative, ignoring task");
        return;
    }
    INTERNAL_kv.enqueue(task, { delay });
};
const listen = (handler: (task: Task) => void) => INTERNAL_kv.listenQueue(handler);

export const queue = {
    scheduleTask,
    listen,
};
