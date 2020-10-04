import fs from 'fs';
import path from 'path';
import copy from 'recursive-copy';
import { InvalidJsonError, InvalidFileType, InvalidPathError } from '@j.u.p.iter/custom-error';

import { JsonDB } from '..';

describe('JsonDB', () => {
  beforeEach(async () => {
    await copy(path.resolve(__dirname, 'fixtures'), path.resolve(__dirname, '__fixtures'));
  });

  afterEach(() => {
    fs.rmdirSync(path.resolve(__dirname, '__fixtures'), { recursive: true });
  });

  describe('new JsonDB(path)', () => {
    describe('if path is a path to json file', () => {
      it('throws an error if a json data is not valid', () => {
        expect(() => new JsonDB('./__fixtures/invalidData.json')).toThrowError(InvalidJsonError);
      });

      it('initialize database with content from json file', () => {
        const db = new JsonDB('./__fixtures/db.json')

        expect(db.scan()).toEqual({ posts: [] });
      });
    });

    describe('if path is a path to a not json file', () => {
      it('throws error', () => {
        expect(() => new JsonDB('./__fixtures/db.txt')).toThrowError(InvalidFileType);
      });

      it('does not create such a file if it does not exist', () => {
        try {
          new JsonDB('./__fixtures/someFile.txt')
        } catch(error) {}

        expect(fs.existsSync(path.resolve(__dirname, './__fixtures/someFile.txt'))).toBe(false); 
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
      const db = new JsonDB('./__fixtures/db.json');

      expect(db.getCollection('users')).toBeNull();
    });

    it('returns collection if there is such a collection in a db', () => {
      const db = new JsonDB('./__fixtures/db.json');

      expect(db.getCollection('posts')).toEqual([]);
    });
  });

  describe('collection.add(collectionData)', () => {
    it('inserts data into the collection', () => {
      const db = new JsonDB('./__fixtures/db.json');
      const newPost = { title: "Some title", description: "Some description" };

      const postsCollection = db.getCollection('posts');
      expect(postsCollection).toEqual([]);

      postsCollection.add(newPost);

      expect(postsCollection).toEqual([newPost]);

      expect(JSON.parse(String(fs.readFileSync(path.resolve(__dirname, './__fixtures/db.json'))))).toEqual({
        posts: [newPost]
      });
    });
  });
})
