const { JsonDB } = require('./dist/lib');

const db = new JsonDB('./db.json');

const createdPost = db.create('posts', { title: 'super title' });

console.log('createdPost:', createdPost);

const allPosts = db.read('posts');

console.log('allPosts:', allPosts);

const absentPost = db.read('posts', { title: 'new title' });

console.log('absentPost:', absentPost);

const presentPost = db.read('posts', { title: 'super title' });

console.log('presentPost:', presentPost);

let allCollections = db.getAllCollections();

console.log('allCollections:', allCollections);

if (!db.doesCollectionExist('users')) {
  db.addCollection('users');
}

allCollections = db.getAllCollections();
console.log('allCollections:', allCollections);

db.removeCollection('users');

allCollections = db.getAllCollections();
console.log('allCollections:', allCollections);

const allDatabase = db.scan();
console.log('allDatabase:', allDatabase);
