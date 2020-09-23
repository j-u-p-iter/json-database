const { DB } = require('./dist/lib');

const db = new DB('./db.json');

const createdPost = db.create('posts', { title: 'super title' });
console.log('createdPost:', createdPost);

const allPosts = db.read('posts');
console.log('allPosts:', allPosts);

const absentPost = db.read('posts', { title: 'new title' });
console.log('absentPost:', absentPost);

const presentPost = db.read('posts', { title: 'super title' });
console.log('presentPost:', presentPost);
