export function generateRandomDelay() {
  const now = new Date();

  const startTime = new Date(now.setHours(8, 0, 0, 0)).getTime();
  const endTime = new Date(now.setHours(23, 59, 59, 999)).getTime();

  const currentTime = Date.now();

  const randomTime = startTime + Math.random() * (endTime - startTime);
  const millis = randomTime - currentTime;

  return millis;
}
