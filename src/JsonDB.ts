import { getCallerPath } from "@j.u.p.iter/caller-path";
import {
  InvalidFileTypeError,
  InvalidJsonError,
  InvalidPathError
} from "@j.u.p.iter/custom-error";
import fs from "fs";
import path from "path";

import { Collection } from "./Collection";
import { Document } from "./types";

interface DB {
  [collectionName: string]: Collection;
}

const errorContext = { context: "JsonDB" };

export class JsonDB {
  private path: string;
  private value: DB = {};

  private serialize(data) {
    return JSON.stringify(data, null, 2);
  }

  private deserialize(data) {
    try {
      return JSON.parse(data);
    } catch (error) {
      throw new InvalidJsonError(this.path, errorContext);
    }
  }

  private writeIntoFile(filePath = this.path) {
    fs.writeFileSync(filePath, this.serialize(this.value));

    return this.value;
  }

  /**
   * During an initialization step we store a content of a file into "this.value".
   *
   * The goal is not to read the file everytime we modify the file data but only to write.
   *
   * And if there's no file, related to the filePath, we create one.
   *
   */
  private init() {
    const isFile = Boolean(path.extname(this.path));

    if (isFile) {
      const isJson = path.extname(this.path) === ".json";

      if (isJson) {
        if (!fs.existsSync(this.path)) {
          this.writeIntoFile();
        } else {
          this.wrapWithCollection(this.deserialize(fs.readFileSync(this.path)));
        }
      } else {
        throw new InvalidFileTypeError(path.extname(this.path), ".json");
      }
    } else {
      if (this.path && !fs.existsSync(this.path)) {
        throw new InvalidPathError(this.path);
      }

      const defaultFilePath = path.resolve(this.path, "db.json");

      if (fs.existsSync(defaultFilePath)) {
        this.wrapWithCollection(
          this.deserialize(fs.readFileSync(defaultFilePath))
        );
      } else {
        this.writeIntoFile(defaultFilePath);
      }
    }
  }

  private proxyCollection(collectionInstance) {
    return new Proxy(collectionInstance, {
      get: (collection, prop) => {
        if (prop === "add" || prop === "delete") {
          return (...args) => {
            const result = collection[prop](...args);

            this.writeIntoFile();

            return result;
          };
        }

        return collection[prop];
      }
    });
  }

  private wrapWithCollection(data) {
    Object.entries(data).forEach(([collectionName, collectionData]) => {
      this.value[collectionName] = this.proxyCollection(
        new Collection(...(collectionData as any))
      );
    });
  }

  private getCollectionsArray() {
    return Object.keys(this.value);
  }

  constructor(filePath: string = "") {
    this.path = path.resolve(getCallerPath(1).dirPath, filePath);

    this.init();
  }

  /**
   * Retrieves collection's data from db.
   *
   * @class
   *
   * @param {string} collectionName A name of the collection to retrieve data from.
   *
   * @returns {Array} Collection of data.
   *
   * @example
   * const db = new JsonDB('./db/db.json');
   *
   * const postsCollection = db.getCollection('posts');
   *
   */

  public getCollection(collectionName: string): Collection | null {
    if (!this.doesCollectionExist(collectionName)) {
      console.log(`A collection ${collectionName} does not exist.`);

      return null;
    }

    return this.value[collectionName];
  }

  /**
   * Adds a document into a collection.
   *
   * @method
   *
   * @param {string} collectionName Name of a collection to add the data to.
   * @param {Object} document Data (document) to insert into the collection.
   *
   * @returns {Object} Added document.
   *
   * @example
   * const db = new JsonDB('./db/db.json');
   *
   * const addedPost = db.create('posts', {
   *   title: "Some title",
   *   description: "Some description",
   * });
   *
   * console.log(addedPost);
   * // { title: "Some title", description: "Some description" }
   *
   */
  public create<T extends Document>(collectionName: string, document: T): T {
    if (!this.doesCollectionExist(collectionName)) {
      this.createCollection(collectionName);
    }

    this.getCollection(collectionName)!.add(document);

    return document;
  }

  public createCollection(collectionName) {
    this.value[collectionName] = this.proxyCollection(new Collection());
  }

  public getAllCollections() {
    const collectionsNames = this.getCollectionsArray();
    const collectionsCount = collectionsNames.length;

    if (collectionsCount) {
      return collectionsNames.join(", ").trim();
    }

    return "Database is empty. There are no collections.";
  }

  public doesCollectionExist(collectionName) {
    return this.getCollectionsArray().includes(collectionName);
  }

  public addCollection(collectionName: string): void {
    if (this.doesCollectionExist(collectionName)) {
      console.log(`A collection ${collectionName} already exists`);

      return;
    }

    this.createCollection(collectionName);

    this.writeIntoFile();
  }

  public removeCollection(collectionName) {
    if (!this.doesCollectionExist(collectionName)) {
      console.log(`A collection ${collectionName} does not exist`);

      return;
    }

    delete this.value[collectionName];

    this.writeIntoFile();
  }

  /**
   * Returns all database data
   *
   */
  public scan(): DB {
    return this.value;
  }

  /**
   * Reads data from collection with or without params.
   *
   * @class
   *
   * @param {string} collectionName Name of a collection to read the data from.
   * @param {Object} [params] Searching params.
   *
   * @returns {Collection} Filtered collection of data according to the params.
   *
   * @example
   * // without params
   * const db = new JsonDB('./db/db.json');
   *
   * const allPostsCollection = db.read('posts');
   *
   * // Contains all posts in collection
   * console.log(allPostsCollection);
   *
   * @example
   * // with params
   * const db = new JsonDB('./db/db.json');
   *
   * const postsWithSomeTitle = db.read('posts', { title: 'Some title' });
   *
   * // Contains all posts with "Some title" title
   * console.log(postsWithSomeTitle);
   */
  public read<T extends Document>(collectionName: string, params?: Partial<T>) {
    if (!this.doesCollectionExist(collectionName)) {
      return null;
    }

    return this.getCollection(collectionName)!.read(params);
  }

  /**
   * Updates documents in a collection founded by params object with dataToUpdate.
   *
   * @method
   *
   * @param {Object} collectionName A collection name to update documents in.
   * @param {Object} dataToUpdate Data to update founded documents.
   * @param {Object} [params] Searching params.
   *
   * @returns {Document[]} An array of removed documents.
   *
   * @example
   * // without params
   * const db = new JsonDB('./db/db.json');
   *
   * // updates all posts
   * const updatedPosts = db.update('posts', { title: "New title" });
   *
   * // Contains updated documents from the collection "posts"
   * console.log(updatedPosts);
   *
   *
   * @example
   * // with params
   * const db = new JsonDB('./db/db.json');
   *
   * // updates posts with a title "Some title" with new title "New title"
   * const updatedPosts = db.update('posts', { title: "New title" }, { title: "Some title" });
   *
   * // Contains updated documents from a collection "posts"
   * console.log(updatedPosts);
   *
   */

  public update<T extends Document>(
    collectionName: string,
    dataToUpdate: Partial<T>,
    params: Partial<T>
  ) {
    if (!this.doesCollectionExist(collectionName)) {
      return null;
    }

    return this.getCollection(collectionName).update(dataToUpdate, params);
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
   * // removes all posts
   * const removedPosts = db.delete('posts');
   *
   * // Contains removed documents from the collection "posts"
   * console.log(removedPosts);
   *
   * @example
   * // with params
   * const db = new JsonDB('./db/db.json');
   *
   * // removes posts with "Some title" title
   * const removedPosts = db.delete('posts', { title: "Some title" });
   *
   * // Contains removed documents from a collection "posts"
   * console.log(removedPosts);
   *
   */
  public delete(collectionName, params) {
    if (!this.doesCollectionExist(collectionName)) {
      return null;
    }

    return this.getCollection(collectionName)!.delete(params);
  }
}
