const { JsonDB } = require('./dist/lib');

const db = new JsonDB('./db.json');

const createdPost = db.create('posts', { title: 'super title' });

console.log('createdPost:', createdPost);

