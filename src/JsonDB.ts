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
        if (prop === "add") {
          return (...args) => {
            collection.add(...args);

            this.writeIntoFile();
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
   * Adds a document into the collection
   *
   */
  public create<T extends Document>(
    collectionName: string,
    document: T
  ): T {
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
   * Finds row in the collection .
   *
   */
  public read(
    collectionName: string,
    params?: Partial<Document>
  ) {
    if (!this.doesCollectionExist(collectionName)) {
      console.log(`A collection ${collectionName} does not exist.`);

      return null;
    }

    return this.getCollection(collectionName)!.read(params);
  }

  /**
   * Adds into a row or extends a row with data, that is passed as first argument of object type.
   *
   */
  public update() {}

  /**
   * Removes a row from the collection by some creteria, that has an object type.
   *
   */
  public delete() {}
}
