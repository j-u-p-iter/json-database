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
});
