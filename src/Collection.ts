import { Document } from "./types";

export class Collection extends Array<Document> {
  /**
   * Resets the collection and adds newDocuments
   * into it
   *
   */
  private renewCollection(newDocuments: Document[]): void {
    this.resetCollection();
    this.push(...newDocuments);
  }

  private resetCollection() {
    this.length = 0;
  }

  /**
   * Finds documents by params object.
   * Document is considered to be founded if all props from params
   * are equal to appropriate properties of the document
   *
   */
  private findDocuments(params: Partial<Document>): Document[] {
    return this.filter(document => {
      // Find in eash row params from "params";
      const filteringResult = Object.entries(document).filter(
        ([key, value]) => params[key] === value
      );

      // If all the params from "params" were found, the length of these arrays should be equal
      return filteringResult.length === Object.keys(params).length;
    });
  }

  constructor(...args) {
    super(...args);

    // https://github.com/Microsoft/TypeScript/wiki/FAQ#why-doesnt-extending-built-ins-like-error-array-and-map-work
    Object.setPrototypeOf(this, Collection.prototype);
  }

  /**
   * Adds a document into a collection.
   *
   * @method
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
   * @method
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
  public read(params?: Partial<Document>): Document[] {
    if (!params) {
      return this;
    }

    return this.findDocuments(params);
  }

  /**
   * Deletes documents from a collection by params object.
   *
   * @method
   *
   * @param {Object} [params] Searching params.
   *
   * @returns {Document[]} An array of removed documents.
   *
   * @example
   * // without params
   * const db = new JsonDB('./db/db.json');
   *
   * const postsCollection = db.getCollection('posts');
   *
   * // removes all posts
   * const removedPosts = postsCollection.delete();
   *
   * // Contains removed documents from the collection "posts"
   * console.log(removedPosts);
   *
   * @example
   * // with params
   * const db = new JsonDB('./db/db.json');
   *
   * const postsCollection = db.getCollection('posts');
   *
   * // removes posts with a title "Some title" from a collection "posts"
   * const removedPosts = postsCollection.delete({ title: "Some title" });
   *
   * // Contains removed documents from a collection "posts"
   * console.log(removedPosts);
   *
   */
  public delete(params?: Partial<Document>): Document[] {
    if (!params) {
      const documentsToRemove = [...this];

      this.resetCollection();

      return documentsToRemove;
    }

    const documentsToDelete = this.findDocuments(params);

    if (!documentsToDelete.length) {
      return [];
    }

    const updatedCollection = this.filter(
      document => !documentsToDelete.includes(document)
    );

    this.renewCollection(updatedCollection);

    return documentsToDelete;
  }
}
