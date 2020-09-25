import fs from "fs";

interface Row {
  [key: string]: string | number;
}

interface Collection extends Array<Row> {}

interface DB {
  [key: string]: Collection;
}

export class JsonDB {
  private value: DB;

  private serialize(data) {
    return JSON.stringify(data, null, 2);
  }

  private deserialize(data) {
    return JSON.parse(data);
  }

  private writeIntoFile() {
    const resultValue = this.value || {};

    fs.writeFileSync(this.filePath, this.serialize(resultValue));

    return resultValue;
  }

  /**
   * During an initialization step we store a content of a file
   *   into "this.value".
   *
   * The goal is not to read the file everytime we modify the
   *   file data but only to write.
   *
   * And if there's no file, related to the filePath, we create one.
   *
   */
  private init() {
    if (fs.existsSync(this.filePath)) {
      this.value = this.deserialize(fs.readFileSync(this.filePath));

      return;
    }

    this.value = this.writeIntoFile();
  }

  private getCollectionsArray() {
    return Object.keys(this.value);
  }

  constructor(private filePath: string) {
    this.init();
  }

  /**
   * Creates a row in the collection
   *
   */
  public create<T extends { [key: string]: string | number }>(
    collectionName: string,
    data: T
  ): T {
    this.value[collectionName] = this.value[collectionName] || [];

    this.value[collectionName].push(data);

    this.writeIntoFile();

    return data;
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

    this.value[collectionName] = [];

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

      // If all the params from "params" were found, the length of these arrays
      // should be equal
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
