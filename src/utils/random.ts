export function randomRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min)) + min;
}

export function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
