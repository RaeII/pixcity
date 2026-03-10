export function fract(value: number) {
  return value - Math.floor(value);
}

export function seeded(x: number, z: number, salt = 0) {
  return fract(Math.sin(x * 127.1 + z * 311.7 + salt * 74.7) * 43758.5453123);
}
