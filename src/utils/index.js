export function isBlob(value) {
  if (typeof Blob === 'undefined') {
    return false;
  }
  return value instanceof Blob || Object.prototype.toString.call(value) === '[object Blob]';
}

export function isImageType(value) {
  const imgRegex = /^image\/.+$/;
  return imgRegex.test(value);
}

export function errMessageHandler(err, callback, target) {
  if (callback) {
    target ? callback.call(target, err) : callback(err);
  } else {
    throw err;
  }
}

export function normalizeLength(value, min, max) {
  return Math.floor(Math.min(Math.max(value, min), max));
}
