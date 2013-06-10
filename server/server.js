//requires
var http = require('http');
//var https = require('https');
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
/// HACK to get URL.js working as a dependancy. Hope to change later
var fs = require('fs');
eval(fs.readFileSync('./url.js')+'');
//https server options
/*var options = {
  key:fs.readFileSync('./server.key').toString(),
  cert:fs.readFileSync('./server.crt').toString()
};*/

//connect to DB
mongoose.connect('mongodb://localhost/codelump');
var db = mongoose.connection;
//if error warn
db.on('error', console.error.bind(console, 'connection error:'));
//otherwise connect
db.once('open', function callback () {
  //define schemas and mongoose vars
  var URLDBSchema = mongoose.Schema({
    url: String,
    items:{
      mines: Number,
      crates: Number,
      posts: Array /*[{
        address: String, 
        RemainingHits: Number, 
        posttext: String}, ... ] */
    }
  });
  var UserDBSchema = mongoose.Schema({
    username: String,
    pwd: String, //hashed pw
    email: String,
    items: {
      mines: Number,
      crates: Number,
      posts: Number
    },
    points: Number
  });
  var PlaceDBSchema = mongoose.Schema({
    loc:{
      x: Number,
      y: Number
    },
    items: {
      mines: Number,
      crates: Number
    }
  });
  var Page = mongoose.model('Page', URLDBSchema);
  var User = mongoose.model('User', UserDBSchema);
  var Loc = mongoose.model('Loc', PlaceDBSchema);
  function simplify(url){
    if (url){
      var newurl = URL(URL.normalize(url));
      newurl = newurl.authority()+newurl.path();
      if (newurl.substr(0,4) == 'www.'){
        newurl = newurl.substr(4, newurl.length-3);
      }
      return(newurl);
    }
  }

  var onreq = function (req, res){
    try{
      //console.log(req);
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
          var dataS = '';
          //var scorechange = 0;
          //console.log(val);
          if (val.method == "onload" && val.userinfo){
            console.log("onload");
            User.find({username: val.userinfo.username.toLowerCase()}, function (err, users){
              if (!err){
                if(bcrypt.compareSync(val.userinfo.pwd, users[0].pwd)){
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
                          users[0].points -= 5;
                          users[0].save();
                        }
                        if (pages[i].items.crates>0){
                          //scorechange+=10;
                          crates++;
                          pages[i].items.crates--;
                          users[0].points += 10;
                          users[0].save();
                        }
                        if (pages[i].items.posts != []){ //for each page
                          //posts=pages[i].items.posts;
                          for (var j = 0; j < pages[i].items.posts.length; j++) { //for each post on page
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
                      //console.log(users);
                      dataS = JSON.stringify({mines:mines, crates: crates, posts: posts, userinfo: users[0]});
                      res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                      console.log("dataS: "+dataS);
                      res.write(dataS);
                      res.end("");
                    }
                  });
                };
              } else {
                res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                //console.log("dataS: "+dataS);
                res.write(err);
                res.end("");
              };
              
            });
          }
          if (val.method == "plantmine" && val.userinfo){
            User.find({username: val.userinfo.username.toLowerCase()}, function (err, users) {
              if(!err){
                if(bcrypt.compareSync(val.userinfo.pwd, users[0].pwd)){
                  Page.find({url: val.url}, function (err, pages) { //find pages in DB whose urls match
                    if (!err){
                      //console.log("noerr");
                      //console.log(pages);
                      if (pages.length === 0) { //if no page, add it
                        console.log("adding page to DB");
                        var newpage = addpage(val.url);
                        newpage.save();
                        pages.push(newpage);
                        //console.log(newpage);
                      }
                      for (var i = 0; i < pages.length; i++) { //for each match
                        if (users[0].items.mines >= val.num) { //if player can afford
                          pages[i].items.mines+=val.num;
                          users[0].items.mines-=val.num;
                          users[0].save();
                        }
                        pages[i].save();
                      }
                      //console.log(newpage);
                      console.log(pages);
                      res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                      res.write(JSON.stringify({userinfo: users[0]}));
                      res.end();
                    } else{
                      console.log(err);
                      res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                      res.write(JSON.stringify({userinfo: users[0]}));
                      res.end();
                    }
                  });
                }
              }
            });
          }
          if (val.method == "plantcrate" && val.userinfo){
            User.find({username: val.userinfo.username.toLowerCase()}, function (err, users) { 
              if(!err){ 
                if(bcrypt.compareSync(val.userinfo.pwd, users[0].pwd)){
                  Page.find({url: val.url}, function (err, pages) { //find pages in DB whose urls match
                    if (!err){
                      //console.log("noerr");
                      //console.log(pages);
                      if (pages.length === 0) {
                        console.log("no page");
                        var newpage = addpage(val.url);
                        newpage.save();
                        pages.push(newpage);
                        //console.log(newpage);
                      }
                      for (var i = 0; i < pages.length; i++) { //for each match
                        if (users[0].items.crates >= val.num){
                          pages[i].items.crates+=val.num;
                          users[0].items.crates-=val.num;
                          users[0].save();
                        }
                        pages[i].save();
                      }
                      //console.log(newpage);
                      console.log(pages);
                    } else{
                      console.log(err);
                    }
                    res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                    res.write(JSON.stringify({userinfo: users[0]}));
                    res.end("");
                  });
                }
              }
            });
          }
          if (val.method == "makeposts" && val.userinfo){
            User.find({username: val.userinfo.username.toLowerCase()}, function (err, users) {
              if(!err){
                if(bcrypt.compareSync(val.userinfo.pwd, users[0].pwd)){
                  Page.find({url: val.url}, function (err, pages) { //find pages in DB whose urls match
                    if (!err){
                      console.log("noerr");
                      if (pages.length === 0) {
                        console.log("no page");
                        var newpage = addpage(val.url);
                        newpage.save();
                        pages.push(newpage);
                        //console.log(newpage);
                      }
                      for (var i = 0; i < pages.length; i++) { //for each matching URL
                        for (var j = 0; j < val.posts.length; j++){ //for each post from input
                          if (users[0].items.posts >= val.posts[j].RemainingHits){ //if user can afford
                            pages[i].items.posts.push({ //add post
                              address: simplify(val.posts[j].address), 
                              remainingHits: val.posts[j].RemainingHits, 
                              posttext: val.posts[j].posttext
                            });
                            users[0].items.posts -= val.posts[j].RemainingHits;
                            users[0].save();
                          }
                        }
                        pages[i].save();
                        res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                        res.write(JSON.stringify({userinfo: users[0]}));
                        res.end("");
                      }
                    } else{
                      console.log(err);
                      res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                      res.write(JSON.stringify({userinfo: users[0]}));
                      res.end("");
                    }
                  });
                }
              }
            });
          }
          if (val.method == "addusr"){
            //console.log(JSON.stringify(val));
            var salt = bcrypt.genSaltSync(10);
            var username = val.username.toLowerCase();
            var email = val.email;
            var pwdold = val.pwd;
            var pwd = bcrypt.hashSync(val.pwd, salt);
            //ping db for username
            User.find({username: username}, function (err, users){
              var success = ""; //string to reply
              //if not present add user
              if (!users[0]) {
                //console.log("no match!");
                var newusr = new User({
                  username: username,
                  pwd: pwd, //hashed pw
                  email: email,
                  items: {
                    mines: 20,
                    crates: 10,
                    posts: 5
                  },
                  points: 100
                });
                success = "true";
                newusr.save();
                //console.log("pwd: "+pwd);
              } else {
                //console.log("match!");
                for (var i = users.length - 1; i >= 0; i--) {
                  console.log("pwd matches: "+bcrypt.compareSync(val.pwd, users[i].pwd));
                };
                success = "false";
              }
              //else reply that username exists
              //send reply
              //dataS = "a";
              res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
              res.write(success);
              res.end("");
              console.log("adduser success: "+success);
            });
          }
          if (val.method == "delusr"){
            //ping db for username
            //remove user from DB
          }
          if (val.method == "login"){
            User.find({username: val.username.toLowerCase()}, function (err, users){
              var success = "false"; //string to reply
              //if not present add user
              if (!users[0]) {
                console.log("no match!");
                success = "false"
              } else {
                console.log("match!");
                for (var i = users.length - 1; i >= 0; i--) {
                  if(bcrypt.compareSync(val.pwd, users[i].pwd)){
                    success = "true";
                    console.log("pwd matches");
                  }
                };
              }
              //else reply that username exists
              //send reply
              //dataS = "a";
              res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
              res.write(success);
              res.end("");
              console.log("login success: "+success);
            });
          }
          if (val.method == "getusrinfo"){
            User.find({username: val.username.toLowerCase()}, function (err, users){
              if(!err){
                if(bcrypt.compareSync(val.pwd, users[0].pwd)){
                  var dataS = JSON.stringify({
                    userinfo: users[0]
                  });
                  res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                  res.write(dataS);
                  res.end("");
                }
              }
            });
          }
          if (val.method == "buyitems"){
            User.find({username: val.username.toLowerCase()}, function (err, users){
              if (users[0]){
                var success = "false"; //string to reply
                var dataS;
                if(bcrypt.compareSync(val.pwd, users[0].pwd)){
                  var responseStr;
                  if (val.cost <= users[0].points){
                    responseStr = "can afford";
                    users[0].points-=val.cost;
                    //parseFloat() forces string into number
                    users[0].items.crates += parseFloat(val.items.crates);
                    users[0].items.mines += parseFloat(val.items.mines);
                    users[0].items.posts += parseFloat(val.items.posts);
                    users[0].save();
                  } else{
                    responseStr = "can't afford";
                  }
                  dataS = JSON.stringify({
                    response: responseStr,
                    userinfo: users[0]
                  });
                  //console.log("pwd matches");
                }
                //else reply that username exists
                //send reply
                //dataS = "a";
                res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                res.write(dataS);
                res.end("");
                console.log(dataS);
              }
            });
          }
        });
      }
      if(req.method == 'GET'){
        console.log("get");
        res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
        res.write('Please do not connect from browser.\n');
        res.end('');
      }
    } catch (err) {
      console.log(err);
    }
    
  };

  //randiom item generator
  setInterval(function(){
    Page.find(function(err, pages){
      if (!err){
        var pagenum = Math.round(Math.random()*pages.length);
        if (pages[pagenum]){
          if (Math.random() >= .5){
            pages[pagenum].items.crates++;
            pages[pagenum].save();
            console.log(pages[pagenum]);
          } else {
            pages[pagenum].items.mines++;
            pages[pagenum].save();
            console.log(pages[pagenum]);
          }
        }
      }
    });
  }, 300000); //every 5 min add 1 crate/mine (random) to a random page in DB and log change

  // server start
  var port = process.env.PORT || 8080; //compatibility  with cloud9 IDE/Hosting
  console.log("Listening on port "+port);
  //var server = https.createServer(options, onreq).listen(port);
  http/*s*/.createServer(/*options, */onreq).listen(port);
  //console.log(server);
});
