import fs from 'fs';
import path from 'path';
import copy from 'recursive-copy';
import { InvalidJsonError, InvalidFileType, InvalidPathError } from '@j.u.p.iter/custom-error';

import { JsonDB } from '..';

describe('JsonDB', () => {
  let DB_PATH;
  let createDB;
  let checkDBFileContent;
  
  beforeAll(() => {
    DB_PATH = './__fixtures/db.json';

    createDB = (path = DB_PATH) => {
      return new JsonDB(path);
    };

    checkDBFileContent = (content) => {
      expect(JSON.parse(String(fs.readFileSync(path.resolve(__dirname, DB_PATH))))).toEqual(content);
    };
  });

  beforeEach(async () => {
    await copy(path.resolve(__dirname, 'fixtures'), path.resolve(__dirname, '__fixtures'));
  });

  afterEach(() => {
    fs.rmdirSync(path.resolve(__dirname, '__fixtures'), { recursive: true });
  });

  describe('new JsonDB(path)', () => {
    describe('if path is a path to json file', () => {
      it('throws an error if a json data is not valid', () => {
        expect(() => createDB('./__fixtures/invalidData.json')).toThrowError(InvalidJsonError);
      });

      it('initialize database with content from json file', () => {
        const db = createDB();

        expect(db.scan()).toEqual({ posts: [] });
      });
    });

    describe('if path is a path to a not json file', () => {
      it('throws error', () => {
        expect(() => createDB('./__fixtures/db.txt')).toThrowError(InvalidFileType);
      });

      it('does not create such a file if it does not exist', () => {
        try {
          createDB('./__fixtures/someFile.txt')
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
      const db = createDB();

      expect(db.getCollection('users')).toBeNull();
    });

    it('returns collection if there is such a collection in a db', () => {
      const db = createDB();

      expect(db.getCollection('posts')).toEqual([]);
    });
  });

  describe('collection.add(collectionData)', () => {
    it('inserts data into the collection', () => {
      const db = createDB();
      const newPost = { title: "Some title", description: "Some description" };

      const postsCollection = db.getCollection('posts');
      expect(postsCollection).toEqual([]);

      postsCollection.add(newPost);

      expect(postsCollection).toEqual([newPost]);

      checkDBFileContent({ posts: [newPost] });
    });
  });

  describe('db.create(collectionName, data)', () => {
    describe('if a collection with the collectionName exists', () => {
      it('inserts document into the collection with collectionName', () => {
        const db = createDB();
        const newPost = { title: "Some title", description: "Some description" };

        const postsCollection = db.getCollection('posts');
        expect(postsCollection).toEqual([]);
    
        db.create('posts', { title: 'Some title', description: 'Some description' });

        expect(postsCollection).toEqual([newPost]);

        checkDBFileContent({ posts: [newPost] });
      });
    });

    describe('if a collection with the collectionName does not exist', () => {
      it('creates a collection and insterts a document into this collection', () => {
        const db = createDB();
        const newUser = { name: "Some name", role: 'admin' };

        let usersCollection = db.getCollection('users');
        expect(usersCollection).toBeNull();
    
        const newDocument = db.create('users', newUser);

        expect(newDocument).toEqual(newUser);

        usersCollection = db.getCollection('users');
        expect(usersCollection).toEqual([newUser]);

        checkDBFileContent({ posts: [], users: [newUser] });
      });
    });
  });

  describe('db.read(collectionName, params)', () => {
    describe('if a collection with the collectionName does not exist', () => {
      it('returns null', () => {
        const db = createDB();

        const userDocuments = db.read('users');

        expect(userDocuments).toEqual(null);
      });
    });

    describe('if a collection with the collectionName exists', () => {
      describe('with params', () => {
        describe('if there is a data according to the params', () => {
          it('returns an appropriate data', () => {
            const db = createDB();

            db.create('users', { name: 'Some name', age: 25 });

            const anotherUser = db.create('users', { name: 'Another name', age: 40 });
            const oneMoreUser = db.create('users', { name: 'One more user name', age: 40 });

            const userDocuments = db.read('users', { age: 40 });

            expect(userDocuments).toEqual([anotherUser, oneMoreUser]);
          });
        });

        describe('if there is no data according to the params', () => {
          it('returns an empty collection', () => {
            const db = createDB();

            db.create('users', { name: 'Some name', age: 25 });
            db.create('users', { name: 'Another name', age: 40 });

            const userDocuments = db.read('users', { age: 12 });

            expect(userDocuments).toEqual([]);
          });
        });
      });

      describe('without params', () => {
        it('returns the whole collection', () => {
          const db = createDB();

          const firstUser = db.create('users', { name: 'Some name', age: 25 });
          const secondUser = db.create('users', { name: 'Another name', age: 40 });

          const userDocuments = db.read('users');
          const expectedCollection = [firstUser, secondUser];

          expect(userDocuments).toEqual(expectedCollection);
        });
      });
    });
  });

  describe('db.delete(collectionName, params)', () => {
    describe('if a collection with the collectionName does not exist', () => {
      it('returns null', () => {
        const db = createDB();

        const result = db.delete('users');

        expect(result).toEqual(null);
      });
    });

    describe('if a collection with the collectionName exists', () => {
      describe('with params', () => {
        describe('if there is a data according to the params', () => {
          it('removes related data and returns it', () => {
            const db = createDB();

            db.create('users', { name: 'Some name', age: 25 });
            db.create('users', { name: 'Another name', age: 40 });
            db.create('users', { name: 'One more name', age: 40 });

            const removedDocuments = db.delete('users', { name: 'One more name', age: 40 });

            expect(db.read('users')).toEqual([
              { name: 'Some name', age: 25 },
              { name: 'Another name', age: 40 },
            ]);

            expect(removedDocuments).toEqual([{ name: 'One more name', age: 40 }]);

            checkDBFileContent({
              posts: [],
              users: [
                { name: 'Some name', age: 25 },
                { name: 'Another name', age: 40 },
              ]
            });
          });
        });

        describe('if there is no data according to the params', () => {
          it('returns an empty collection', () => {
            const db = createDB();

            db.create('users', { name: 'Some name', age: 25 });
            db.create('users', { name: 'Another name', age: 40 });

            const removedDocuments = db.delete('users', { age: 12 });

            checkDBFileContent({
              posts: [],
              users: [
                { name: 'Some name', age: 25 },
                { name: 'Another name', age: 40 },
              ]
            });

            expect(removedDocuments).toEqual([]);
          });
        });
      });

      describe('without params', () => {
        it('removes all documents from a collection', () => {
          const db = createDB();

          const firstUser = db.create('users', { name: 'Some name', age: 25 });
          const secondUser = db.create('users', { name: 'Another name', age: 40 });

          const removedDocuments = db.delete('users');
          const expectedCollection = [firstUser, secondUser];

          expect(removedDocuments).toEqual(expectedCollection);
        });
      });
    });
  });

  describe('db.update(collectionName, dataToUpdate, params)', () => {
    describe('if a collection with the collectionName does not exist', () => {
      it('returns null', () => {
        const db = createDB();

        const result = db.update('users');

        expect(result).toEqual(null);
      });
    });

    describe('if a collection with the collectionName exists', () => {
      describe('with params', () => {
        describe.only('if there is a data according to the params', () => {
          it('removes related data and returns it', () => {
            const db = createDB();

            db.create('users', { name: 'Some name', age: 25 });
            db.create('users', { name: 'Another name', age: 40 });
            db.create('users', { name: 'One more name', age: 40 });

            const updatedDocuments = db.update('users', { name: 'New name' }, { age: 25 });

            expect(db.read('users')).toEqual([
              { name: 'New name', age: 25 },
              { name: 'Another name', age: 40 },
              { name: 'One more name', age: 40 },
            ]);

            expect(updatedDocuments).toEqual([{ name: 'New name', age: 25 }]);

            checkDBFileContent({
              posts: [],
              users: [
                { name: 'New name', age: 25 },
                { name: 'Another name', age: 40 },
                { name: 'One more name', age: 40 },
              ]
            });
          });
        });

        describe('if there is no data according to the params', () => {
          it('returns an empty collection', () => {
            const db = createDB();

            db.create('users', { name: 'Some name', age: 25 });
            db.create('users', { name: 'Another name', age: 40 });

            const removedDocuments = db.delete('users', { age: 12 });

            checkDBFileContent({
              posts: [],
              users: [
                { name: 'Some name', age: 25 },
                { name: 'Another name', age: 40 },
              ]
            });

            expect(removedDocuments).toEqual([]);
          });
        });
      });

      describe('without params', () => {
        it('removes all documents from a collection', () => {
          const db = createDB();

          const firstUser = db.create('users', { name: 'Some name', age: 25 });
          const secondUser = db.create('users', { name: 'Another name', age: 40 });

          const removedDocuments = db.delete('users');
          const expectedCollection = [firstUser, secondUser];

          expect(removedDocuments).toEqual(expectedCollection);
        });
      });
    });
  });
})
