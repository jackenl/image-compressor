import defaults from './defaults';
import { isBlob, isImageType, toRangeInteger } from './utils/index';

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
    this.reader = null;
    this.init();
  }

  init() {
    const { file } = this;

    if (!isBlob(file) || isImageType(file.type)) {
      this.error(new Error('The first argument must be a Blob object.'));
      return;
    }

    const reader = new FileReader();
    this.reader = reader;
    reader.onload = (e) =>{
      const { result } = e.target;
      this.load(result);
    }
    reader.onabort = () => {
      this.error(new Error('Aborted to read the image.'));
    }
    reader.onerror = () => {
      this.error(new Error('Failed to read the image.'));
    }
    reader.onloadend = () => {
      this.reader = null;
    }
  }

  load(url) {
    const { image } = this;

    image.onload = () => {
      this.draw();
    };
    image.onabort = () => {
      this.error(new Error('Abort to load the image.'));
    };
    image.onerror = () => {
      this.error(new Error('Failed to load the image.'));
    };

    // arrow load image cross domain
    image.crossOrigin = 'anonymous';
    image.src = url;
  }

  draw() {
    if (this.aborted) {
      return;
    }

    const { file, image, options } = this;

    const { naturalWidth, naturalHeight } = image;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const aspectRatio = naturalWidth / naturalHeight;
    let maxWidth = Math.max(options.maxWidth, 0);
    let maxHeight = Math.max(options.maxHeight, 0);
    let minWidth = Math.max(options.minWidth, 0);
    let minHeight = Math.max(options.minHeight, 0);
    let width = Math.max(options.width, 0) || naturalWidth;
    let height = Math.max(options.height, 0) || naturalHeight;

    // init maxWidth and maxHeight
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

    // init minWidth and minHeight
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

    // init width and height
    if (height * aspectRatio > width) {
      height = width / aspectRatio;
    } else {
      width = height * aspectRatio;
    }
    width = toRangeInteger(width, minWidth, maxWidth);
    height = toRangeInteger(height, minHeight, maxHeight);

    canvas.width = width;
    canvas.height = height;

    if (!isImageType(options.imageType)) {
      options.imageType = file.type;
    }

    context.save();
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    context.restore();

    // toBlob callback function
    const done = (result) => {
      if (!this.aborted) {
        this.done(result);
      }
    };

    canvas.toBlob(done, options.imageType, options.quality);
  }

  done(result) {
    const { file, options } = this;

    if (result) {
      // return original file if the result more large than original file
      if (result.size > file.size && options.imageType === file.type) {
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

  error(err) {
    const { options } = this;
    
    if (options.error) {
      options.error.call(this, err);
    } else {
      throw err;
    }
  }

  // instance method to abort compress image
  abort() {
    if (!this.aborted) {
      this.aborted = true;
      if (this.reader) {
        this.reader.abort();
      } else if (!this.image.complete) {
        this.image.onload = null;
        this.image.onabort();
      }
    }
  }
}
