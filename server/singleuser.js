//requires
var http = require('http');
var mongoose = require('mongoose');
//var URL = require('./url.js');

/// HACK to get URL.js working as a dependancy. Hope to change later
var fs = require('fs');
eval(fs.readFileSync('C:/Users/Gateway/Desktop/server/url.js')+'');

//connect to DB
mongoose.connect('mongodb://localhost/codelump');
var db = mongoose.connection;
//if error warn
db.on('error', console.error.bind(console, 'connection error:'));
//otherwise connect
db.once('open', function callback () {
  //define vars
  var URLDBSchema = mongoose.Schema({
    url: String,
    items:{
      mines: Number,
      crates: Number,
      posts: Array /*[{
        address: String, 
        remainingHits: Number, 
        posttext: String}] */
    }
  });
  var Page = mongoose.model('Page', URLDBSchema);

  function simplify(url){
    var newurl = URL(URL.normalize(url));
    newurl = newurl.authority()+newurl.path();
    if (newurl.substr(0,4) == 'www.'){
      newurl = newurl.substr(4, newurl.length-3);
    }
    return(newurl);
  }

  var onreq = function (req, res){


    if(req.method == 'POST'){ //when HTTP POST recieved 

      function addpage(url){
        var newpage = new Page({
          url: url, 
          items:{
            mines:0, 
            crates:0, 
            posts:[]
          }
        });
        //console.log(newpage);
        //newpage.save();
        return(newpage);
      }

      var val = "";
      req.on('data', function (data){
        val += data;
        if(val.length > 1000000){ // IF FLOOD ATTACK OR FAULTY CLIENT, NUKE req
          req.connection.destroy();
        }
      });
      req.on('end', function (){
        val = JSON.parse(val);
        val.url = simplify(val.url);
        var dataS = new String;
        //var scorechange = 0;
        //console.log(val);
        if (val.method == "onload"){
          var mines = 0;
          var crates = 0;
          var posts = [];
          var postindex = 0;
          Page.find({url: val.url}, function (err, pages) { //find match
            if (!err){
              for (var i = 0; i < pages.length; i++) { //for each match
                //pages[i].count++; //increment counter in DB
                if (pages[i].items.mines>0){
                  //scorechange-=5;
                  mines++;
                  pages[i].items.mines--;
                }
                if (pages[i].items.crates>0){
                  //scorechange+=10;
                  crates++;
                  pages[i].items.crates--;
                }
                if (pages[i].items.posts != []){ //for each page
                  //posts=pages[i].items.posts;
                  for (j = 0; j < pages[i].items.posts.length; j++) { //for each post on page
                    var thispost = pages[i].items.posts[j];
                    if (thispost.remainingHits){
                      posts[postindex] = pages[i].items.posts[j]; //set post in array to return equal to post
                      thispost.remainingHits--; //decrement remainingHits counter
                      pages[i].items.posts.set(j, thispost); //store changes to DB
                      postindex++; //move to next pos in array to be returned
                    }
                    //pages[i].save();
                    //console.log("\n"+pages[i].items.posts[j].address+"\n"+pages[i].items.posts[j].remainingHits+"\n");
                  };
                }
                pages[i].save();
              };
              //console.log(pages);
              dataS = JSON.stringify({mines:mines, crates: crates, posts: posts});
              res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
              console.log("dataS: "+dataS);
              res.write(dataS);
              res.end("");
            }
          });
        }
        if (val.method == "plantmine"){
          Page.find({url: val.url}, function (err, pages) { //find pages in DB whose urls match
            if (!err){
              console.log("noerr");
              //console.log(pages);
              if (pages.length == 0) {
                console.log("no page");
                var newpage = addpage(val.url);
                newpage.save();
                pages.push(newpage);
                //console.log(newpage);
              }
              for (var i = 0; i < pages.length; i++) { //for each match
                pages[i].items.mines++;
                pages[i].save();
              }
              //console.log(newpage);
              console.log(pages);
            } else{
              console.log(err);
            }
            res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
            res.end("");
          });
        }
        if (val.method == "plantcrate"){
          Page.find({url: val.url}, function (err, pages) { //find pages in DB whose urls match
            if (!err){
              //console.log("noerr");
              //console.log(pages);
              if (pages.length == 0) {
                console.log("no page");
                var newpage = addpage(val.url);
                newpage.save();
                pages.push(newpage);
                //console.log(newpage);
              }
              for (var i = 0; i < pages.length; i++) { //for each match
                pages[i].items.crates++;
                pages[i].save();
              }
              //console.log(newpage);
              console.log(pages);
            } else{
              console.log(err);
            }
            res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
            res.end("");
          });
        }
        if (val.method == "makeposts"){
          Page.find({url: val.url}, function (err, pages) { //find pages in DB whose urls match
            if (!err){
              console.log("noerr");
              if (pages.length == 0) {
                console.log("no page");
                var newpage = addpage(val.url);
                newpage.save();
                pages.push(newpage);
                //console.log(newpage);
              }
              for (var i = 0; i < pages.length; i++) { //for each matching URL
                for (var j = 0; j < val.posts.length; j++){ //for each post from input
                  pages[i].items.posts.push({
                    address: simplify(val.posts[j].address), 
                    remainingHits: 1, 
                    posttext: val.posts[j].posttext
                  });
                }
                pages[i].save();
              }
            } else{
              console.log(err);
            }
            res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
            res.end("");
          });
        }
      });
    }
  }
  // server start
  var port = process.env.PORT || 3000; 
  var server = http.createServer(onreq).listen(port);
});