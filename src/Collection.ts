export interface Document {
  [key: string]: string | number;
}

export class Collection extends Array {
  constructor(...args) {
    super(...args);

    // https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
    Object.setPrototypeOf(this, Collection.prototype);
  }

  public add(document): Collection {
    this.push(document);

    return this;
  }
}
