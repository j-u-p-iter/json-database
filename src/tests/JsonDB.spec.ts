import fs from 'fs';
import path from 'path';
import { InvalidJsonError, InvalidFileType } from '@j.u.p.iter/custom-error';

import { JsonDB } from '..';

describe('JsonDB', () => {
  it('throws error if json data is not valid', () => {
    expect(() => new JsonDB('./fixtures/invalidData.json')).toThrowError(InvalidJsonError);
  });

  describe('if file is not a json', () => {
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

  describe('root directory does not contain db.json', () => {
    it('creates db.json in the root dir', () => {
      new JsonDB();

      expect(fs.existsSync(path.resolve(__dirname, './db.json'))).toBe(true); 

      fs.unlinkSync(path.resolve(__dirname, './db.json')); 
    });
  });
});
