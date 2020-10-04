import fs from 'fs';
import path from 'path';
import { InvalidJsonError, InvalidFileType, InvalidPathError } from '@j.u.p.iter/custom-error';

import { JsonDB } from '..';

describe('JsonDB', () => {
  describe('new JsonDB(path)', () => {
    describe('if path is a path to json file', () => {
      it('throws an error if a json data is not valid', () => {
        expect(() => new JsonDB('./fixtures/invalidData.json')).toThrowError(InvalidJsonError);
      });

      it('initialize database with content from json file', () => {
        const db = new JsonDB('./fixtures/db.json')

        expect(db.scan()).toEqual({ posts: [] });
      });
    });

    describe('if path is a path to a not json file', () => {
      it('throws error', () => {
        expect(() => new JsonDB('./fixtures/db.txt')).toThrowError(InvalidFileType);
      });

      it('does not create such a file if it does not exist', () => {
        try {
          new JsonDB('./fixtures/someFile.txt')
        } catch(error) {}

        expect(fs.existsSync(path.resolve(__dirname, './fixtures/someFile.txt'))).toBe(false); 
      });
    });

    describe('if path does not exist', () => {
      it('creates a db.json in the root dir if there is no such a file', () => {
        new JsonDB();

        expect(fs.existsSync(path.resolve(__dirname, './db.json'))).toBe(true); 

        fs.unlinkSync(path.resolve(__dirname, './db.json')); 
      });

      it('initialize database with content from db.json from the root directory if there is such a file', () => {
        fs.writeFileSync(path.resolve(__dirname, './db.json'), JSON.stringify({ posts: [] }));

        const db = new JsonDB();

        expect(db.scan()).toEqual({ posts: [] }); 

        fs.unlinkSync(path.resolve(__dirname, './db.json')); 
      });
    });

    describe('if path is path to non-existent directory', () => {
      it('throws error', () => {
        expect(() => new JsonDB('./databases')).toThrowError(InvalidPathError);
      });
    });
  });

  describe('db.getCollection(collectionName)', () => {
    it('returns null if a collection does not exist', () => {
      const db = new JsonDB('./fixtures/db.json');

      expect(db.getCollection('users')).toBeNull();
    });

    it('returns collection if there is such a collection in a db', () => {
      const db = new JsonDB('./fixtures/db.json');

      expect(db.getCollection('posts')).toEqual([]);
    });
  });

  describe.only('collection.add(collectionData)', () => {
    it('inserts data into the collection', () => {
      const db = new JsonDB('./fixtures/db.json');

      const postsCollection = db.getCollection('posts');
      expect(postsCollection).toEqual([]);

      postsCollection.add({ 
        title: "Some title", 
        description: "Some description", 
      });

      expect(postsCollection).toEqual([{ title: "Some title", description: "Some description" }]);
    });
  });
})
