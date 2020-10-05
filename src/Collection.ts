import { Document } from "./types";

export class Collection extends Array<Document> {
  constructor(...args) {
    super(...args);

    // https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
    Object.setPrototypeOf(this, Collection.prototype);
  }

  /**
   * Adds a document into a collection.
   *
   * @class
   *
   * @param {Object} document Data (document) to insert into the collection.
   *
   * @returns {Collection} Collection of a data.
   *
   * @example
   * const db = new JsonDB('./db/db.json');
   *
   * const postsCollection = db.getCollection('posts');
   *
   * postsCollection.add({
   *   title: "Some title",
   *   description: "Some description",
   * });
   *
   */
  public add(document: Document): Collection {
    this.push(document);

    return this;
  }

  /**
   * Reads a collection with or without params.
   *
   * @class
   *
   * @param {Object} [params] Searching params.
   *
   * @returns {Collection} Filtered collection of data according to params.
   *
   * @example
   * // without params
   * const db = new JsonDB('./db/db.json');
   *
   * const postsCollection = db.getCollection('posts');
   *
   * const allPostsCollection = postsCollection.read();
   *
   * // Contains all posts in collection
   * console.log(allPostsCollection);
   *
   * @example
   * // with params
   * const db = new JsonDB('./db/db.json');
   *
   * const postsCollection = db.getCollection('posts');
   *
   * const postsWithSomeTitle = postsCollection.read({ title: 'Some title' });
   *
   * // Contains all posts with "Some title" title
   * console.log(postsWithSomeTitle);
   */
  public read(params?: Partial<Document>): Collection {
    if (!params) {
      return this;
    }

    return this.filter(document => {
      // Find in eash row params from "params";
      const filteringResult = Object.entries(document).filter(
        ([key, value]) => params[key] === value
      );

      // If all the params from "params" were found, the length of these arrays should be equal
      return filteringResult.length === Object.keys(params).length;
    }) as Collection;
  }
}
