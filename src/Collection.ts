interface Document {
  [key: string]: string | number;
}

export class Collection extends Array<Document> {
  constructor(private name) {
    super();
  }

  add(document) {
    this.push(document);
  }

  delete() {}

  update() {}
}
