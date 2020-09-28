import fs from "fs";
import path from "path";

import { Collection } from "./Collection";

interface DB {
  [collectionName: string]: Collection;
}

export class JsonDB {
  private path: string;
  private value: DB = {};

  private serialize(data) {
    return JSON.stringify(data, null, 2);
  }

  private deserialize(data) {
    return JSON.parse(data);
  }

  private writeIntoFile() {
    const resultValue = this.value || {};

    fs.writeFileSync(this.path, this.serialize(resultValue));

    return resultValue;
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
    // filePath is an optional param
    //
    // if there is no a path:
    //
    // - we search ./db.json (db.json file in the current working directory)
    //
    // -- if there is no db.json in the current directory we throw an error.
    //
    // if there is a path
    //
    // - we check if this path is valid (existsSync)
    // --  if there's no such a path we throw an error
    //
    // -- if there is such a path
    //
    // --- if it is a .json file we use this file as a database.
    // --- if it is a not .json file we throw an error.
    // --- if it is a directory path - we search ./db.json file there.
    // ---- if there's no db.json file by this path we throw an error.

    if (fs.existsSync(this.path)) {
      this.wrapWithCollection(this.deserialize(fs.readFileSync(this.path)));

      return;
    }

    this.value = this.writeIntoFile();
  }

  private wrapWithCollection(data) {
    Object.entries(data).forEach(([collectionName, collectionData]) => {
      this.value[collectionName] = new Collection(...collectionData as any) 
      console.log(this.value[collectionName].add)
    });
  }

  private getCollectionsArray() {
    return Object.keys(this.value);
  }

  constructor(filePath?: string) {
    this.path = path.resolve(process.cwd(), filePath);

    this.init();
  }

  public getCollection(collectionName: string): Collection | undefined {
    if (!this.doesCollectionExist(collectionName)) {
      console.log(`A collection ${collectionName} does not exist.`);
      return;
    }

    return this.value[collectionName];
  }

  /**
   * Creates a row in the collection
   *
   */
  public create<T extends { [key: string]: string | number }>(
    collectionName: string,
    data: T
  ): T {
    if (!this.doesCollectionExist(collectionName)) {
      this.createCollection(collectionName)
    }

    console.log(this.getCollection(collectionName));
    this.getCollection(collectionName)!.add(data);

    this.writeIntoFile();

    return data;
  }

  public createCollection(collectionName) {
    this.value[collectionName] = new Collection();
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
  public scan() {
    return this.value;
  }

  /**
   * Finds row in the collection .
   *
   */
  public read(
    collectionName: string,
    params?: { [key: string]: string | number }
  ) {
    if (!params) {
      return this.value[collectionName];
    }

    return this.value[collectionName].filter(collectionRow => {
      // Find in eash row params from "params";
      const filteringResult = Object.entries(collectionRow).filter(
        ([key, value]) => {
          return params[key] === value;
        }
      );

      /**
       * If all the params from "params" were found, the length of these arrays should be equal
       *
       */
      return filteringResult.length === Object.keys(params).length;
    });
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
