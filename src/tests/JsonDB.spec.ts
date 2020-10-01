import { JsonDB } from '..';

describe('JsonDB', () => {
  let db;

  beforeEach(() => {
    db = new JsonDB('./fixtures/fakeDB.json'); 
  });

  it('contains empty object by default after initialization', () => {
    const dbContent = db.scan(); 

    expect(dbContent).toBe('hello');
  });
});
