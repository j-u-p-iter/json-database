import { InvalidJsonError } from '@j.u.p.iter/custom-error';

import { JsonDB } from '..';

describe('JsonDB', () => {
  it('throws error if json data is not valid', () => {
    try {
      new JsonDB('./fixtures/invalidData.json');
    } catch(error) {
      console.log(InvalidJsonError)
      expect(error instanceof InvalidJsonError).toBe(true);
    }
  });

  describe.only('root directory does not contain db.json', () => {
    it('creates db.json in the root dir', () => {
      new JsonDB();

      console.log(__dirname);
    })
  });
});
