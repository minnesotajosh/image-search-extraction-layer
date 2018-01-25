// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies
var connected=false;

var db;

var mongodb = require('mongodb');
// Standard URI format: mongodb://[dbuser:dbpassword@]host:port/dbname, details set in .env
const MONGODB_URI = 'mongodb://'+process.env.USER+':'+process.env.PASS+'@'+process.env.HOST+':'+process.env.DB_PORT+'/'+process.env.DB;
const ObjectId = require('mongodb').ObjectId;
const MongoClient = require('mongodb').MongoClient;
const request = require('request');
const google = require('googleapis');



MongoClient.connect(MONGODB_URI, (err, database) => {
  if (err) return console.log(err)
  let db = database
  app.listen(3000, () => {

    // http://expressjs.com/en/starter/basic-routing.html
    app.get("/", function (req, res) {
      res.sendFile(__dirname + '/views/index.html');
          
    });


    
    app.get("/api/getImages/:searchTerm", function (req, res) {
      console.log(req.query);
      const searchTerm = req.params.searchTerm || '';
      let offset = +req.query.offset || 1;
      
      offset = offset > 20 ? 20 : offset;
      offset = offset < 1 ? 1 : offset;
      console.log('offset:', offset);
      
      if (!searchTerm) res.send({results: 'Provide a search term'});
      try {
        
        const googleApiUrl = `https://www.googleapis.com/customsearch/v1?key=${process.env.GOOGLEAPIKEY}&cx=${process.env.SEARCHENGINEKEY}&q=${searchTerm}&safe=high&searchType=image&num=10&start=${offset}`;

        request(googleApiUrl, function(error, response, body) {
          //url, snippet, thumbnail, context
          console.log(body);
          let results = JSON.parse(body).items.map(item => {
            return {
              url: item.link,
              snippet: item.snippet,
              thumbnail: item.image.thumbnailLink,
              context: item.image.contextLink
            };
          });
          
          let searchQuery = {
            term: searchTerm,
            when: new Date()
          };
          
          db.collection('images').insert(searchQuery);
          res.send(results);
        });
        

        //first, call googleAPI to fetch images
        //then, create function to transform data into sendable format
        //then, push to images collection the latest search query (what it was, when it was)
        
        
        
        
        // db.collection('images').insert({url: req.body.url}, function(err,docsInserted){
        //   console.log(docsInserted);
        //   res.send(docsInserted.insertedIds[0]);
        // });


        // And then we redirect the view back to the homepage
      } catch (err) {
        console.log('err', err);
        handleError(err, res);
      }
    });
    
    app.get("/api/latest", function (req, res) {
      
      db.collection('images').find({}, {sort: {when: -1}, limit: 10}).toArray(function(err, results) {
        res.send(results.map(result => { return {
          when: result.when,
          term: result.term
        }}));
      });
    });
    
  });
});


// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));


function handleError(err, response) {
  response.status(500);
  response.send(
    "<html><head><title>Internal Server Error!</title></head><body><pre>"
    + JSON.stringify(err, null, 2) + "</pre></body></pre>"
  );
}

