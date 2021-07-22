export function isBlob(value) {
  return value instanceof Blob || Object.prototype.toString.call(value) === '[object Blob]';
}

export function isImageType(value) {
  const imgRegex = /^image\/.+$/;
  return imgRegex.test(value);
}

export function toRangeInteger(value, min, max) {
  return Math.floor(Math.min(Math.max(value, min), max));
}
