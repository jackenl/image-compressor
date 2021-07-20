import defaults from './defaults';
import { isBlob, errMessageHandler, isImageType, normalizeLength } from './utils/index';

export default class ImageCompressor {
  constructor(file, options) {
    this.file = file;
    this.image = new Image();
    this.options = {
      ...defaults,
      ...options,
    };
    this.aborted = false;
    this.result = null;
    this.init();
  }

  init() {
    const { file, options } = this;

    const fileType = file.type;
    if (!isBlob(file) || isImageType(fileType)) {
      errMessageHandler(new Error('The first argument must be a Blob object.'), options.error, this);
      return;
    }

    this.load();
  }

  load() {
    const { file, image, options } = this;

    const url = URL.createObjectURL(file);
    image.onload = () => {
      this.draw();
    };
    image.onabort = () => {
      errMessageHandler(new Error('Abort to load the image.'), options.error, this);
    };
    image.onerror = () => {
      errMessageHandler(new Error('Failed to load the image.'), options.error, this);
    };

    // arrow load image cross domain
    image.crossOrigin = 'anonymous';

    image.alt = file.name;
    image.src = url;
  }

  draw() {
    const { file, image, options } = this;

    const { naturalWidth, naturalHeight } = image;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const aspectRatio = naturalWidth / naturalHeight;
    let maxWidth = Math.max(options.maxWidth, 0) || Infinity;
    let maxHeight = Math.max(options.maxHeight, 0) || Infinity;
    let minWidth = Math.max(options.minWidth, 0);
    let minHeight = Math.max(options.minHeight, 0);
    let width = Math.max(options.width, 0) || naturalWidth;
    let height = Math.max(options.height, 0) || naturalHeight;

    if (maxWidth < Infinity && maxHeight < Infinity) {
      if (maxHeight * aspectRatio > maxWidth) {
        maxHeight = maxWidth / aspectRatio;
      } else {
        maxWidth = maxHeight * aspectRatio;
      }
    } else if (maxWidth < Infinity) {
      maxHeight = maxWidth / aspectRatio;
    } else if (maxHeight < Infinity) {
      maxWidth = maxHeight * aspectRatio;
    }

    if (minWidth > 0 && minHeight > 0) {
      if (minHeight * aspectRatio > minWidth) {
        minHeight = minWidth / aspectRatio;
      } else {
        minWidth = minHeight * aspectRatio;
      }
    } else if (minWidth > 0) {
      minHeight = minWidth / aspectRatio;
    } else if (minHeight > 0) {
      minWidth = minHeight * aspectRatio;
    }

    if (height * aspectRatio > width) {
      height = width / aspectRatio;
    } else {
      width = height * aspectRatio;
    }

    width = normalizeLength(width, minWidth, maxWidth);
    height = normalizeLength(height, minHeight, maxHeight);

    const destX = -width / 2;
    const destY = -height / 2;
    const destWidth = width;
    const destHeight = height;

    canvas.width = width;
    canvas.height = height;

    if (!isImageType(options.imageType)) {
      options.imageType = file.type;
    }

    if (this.aborted) {
      return;
    }

    context.fillRect(0, 0, width, height);
    context.save();
    context.translate(width / 2, height / 2);
    context.drawImage(image, destX, destY, destWidth, destHeight);
    context.restore();

    if (this.aborted) {
      return;
    }

    const done = (result) => {
      if (!this.aborted) {
        this.done({
          naturalWidth,
          naturalHeight,
          result,
        });
      }
    };

    canvas.toBlob(done, options.imageType, options.quality);
  }

  done({ naturalWidth, naturalHeight, result }) {
    const { file, options } = this;

    if (result) {
      if (
        result.size > file.size &&
        options.imageType === file.type &&
        !(options.width > naturalWidth || options.height > naturalHeight)
      ) {
        result = file;
      }
    } else {
      result = file;
    }

    this.result = result;

    if (options.success) {
      options.success.call(this, result);
    }
  }

  abort() {
    const { options } = this;

    if (!this.aborted) {
      this.aborted = true;
      if (!this.image.complete) {
        this.image.onload = null;
        this.image.onabort();
      } else {
        errMessageHandler(new Error('The compression has been aborted.'), options.error, this);
      }
    }
  }
}
