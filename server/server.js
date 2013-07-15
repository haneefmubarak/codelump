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
      mines: Array,
      crates: Array, /*[{
        placer: String (userid),
        RemainingHits: Number
        }, ... ] */
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
  function addpage(url){
    var newpage = new Page({
      url: url, 
      items:{
        mines:[], 
        crates:[], 
        posts:[]
      }
    });
    ////console.log(newpage);
    //newpage.save();
    return(newpage);
  }
  var onreq = function (req, res){
    try{
      ////console.log(req);
      if(req.method == 'POST'){ //when HTTP POST recieved 

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
          ////console.log(val);
          if (val.method == "onload" && val.userinfo){
            //console.log("onload");
            User.find({username: val.userinfo.username.toLowerCase()}, function (err, users){
              if (!err){
                if(bcrypt.compareSync(val.userinfo.pwd, users[0].pwd)){
                  var mines = [];
                  var mineindex = 0;
                  var crates = [];
                  var crateindex = 0;
                  var posts = [];
                  var postindex = 0;
                  Page.find({url: val.url}, function (err, pages) { //find match
                    if (!err){
                      for (var i = 0; i < pages.length; i++) { //for each match
                        //pages[i].count++; //increment counter in DB
                        if (pages[i].items.crates>0){
                          //posts=pages[i].items.posts;
                          for (var j = 0; j < pages[i].items.mines.length; j++) { //for each post on page
                            var thismine = pages[i].items.crates[j];
                            if (thismine.remainingHits){
                              mines[mineindex] = pages[i].items.mines[j]; //set post in array to return equal to post
                              thismine.remainingHits--; //decrement remainingHits counter
                              pages[i].items.mines.set(j, thismine); //store changes to DB
                              mineindex++; //move to next pos in array to be returned
                              users[0].points -= 5;
                              users[0].save();
                              console.log(users[0].username +' got hit by a mine at '+val.url+' placed by '+thismine.placer+'!');
                            }
                            //pages[i].save();
                            ////console.log("\n"+pages[i].items.posts[j].address+"\n"+pages[i].items.posts[j].remainingHits+"\n");
                          };
                        }
                        if (pages[i].items.crates>0){
                          //posts=pages[i].items.posts;
                          for (var j = 0; j < pages[i].items.crates.length; j++) { //for each post on page
                            var thiscrate = pages[i].items.crates[j];
                            if (thiscrate.remainingHits){
                              crates[crateindex] = pages[i].items.crates[j]; //set post in array to return equal to post
                              thiscrate.remainingHits--; //decrement remainingHits counter
                              pages[i].items.crates.set(j, thiscrate); //store changes to DB
                              crateindex++; //move to next pos in array to be returned
                              users[0].points += 10;
                              users[0].save();
                              console.log(users[0].username +' found a crate at '+val.url+' placed by '+thiscrate.placer+'!');
                            }
                            //pages[i].save();
                            ////console.log("\n"+pages[i].items.posts[j].address+"\n"+pages[i].items.posts[j].remainingHits+"\n");
                          };
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
                            ////console.log("\n"+pages[i].items.posts[j].address+"\n"+pages[i].items.posts[j].remainingHits+"\n");
                          };
                        }
                        pages[i].save();
                      };
                      ////console.log(pages);
                      ////console.log(users);
                      dataS = JSON.stringify({mines:mines, crates: crates, posts: posts, userinfo: users[0]});
                      res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                      //console.log("dataS: "+dataS);
                      res.write(dataS);
                      res.end("");
                    }
                  });
                };
              } else {
                res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                ////console.log("dataS: "+dataS);
                res.write(err);
                //console.log(err);
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
                      ////console.log("noerr");
                      ////console.log(pages);
                      if (pages.length === 0) { //if no page, add it
                        //console.log("adding page to DB");
                        var newpage = addpage(val.url);
                        newpage.save();
                        pages.push(newpage);
                        ////console.log(newpage);
                      }
                      for (var i = 0; i < pages.length; i++) { //for each matching URL
                        if (users[0].items.mines >= val.num){ //if user can afford
                          pages[i].items.mines.push({ //add post
                            remainingHits: val.num, 
                            placer: val.userinfo.username
                          });
                          users[0].items.mines -= val.num;
                          users[0].save();
                        }
                        pages[i].save();
                        console.log(users[0].username+" placed some mines on "+val.url);
                        res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                        res.write(JSON.stringify({userinfo: users[0]}));
                        res.end("");
                      }
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
                      if (pages.length === 0) {
                        //console.log("no page");
                        var newpage = addpage(val.url);
                        newpage.save();
                        pages.push(newpage);
                        ////console.log(newpage);
                      }
                      for (var i = 0; i < pages.length; i++) { //for each matching URL
                        if (users[0].items.crates >= val.num){ //if user can afford
                          pages[i].items.crates.push({ //add post
                            remainingHits: val.num, 
                            placer: val.userinfo.username
                          });
                          users[0].items.crates -= val.num;
                          users[0].save();
                        }
                        pages[i].save();
                        console.log(users[0].username+" placed some crates on "+val.url);
                        res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                        res.write(JSON.stringify({userinfo: users[0]}));
                        res.end("");
                      }
                    } else{
                      //console.log(err);
                      res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                      res.write(JSON.stringify({userinfo: users[0]}));
                      res.end("");
                    }
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
                      //console.log("noerr");
                      if (pages.length === 0) {
                        //console.log("no page");
                        var newpage = addpage(val.url);
                        newpage.save();
                        pages.push(newpage);
                        ////console.log(newpage);
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
                      //console.log(err);
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
            ////console.log(JSON.stringify(val));
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
                ////console.log("no match!");
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
                ////console.log("pwd: "+pwd);
              } else {
                ////console.log("match!");
                for (var i = users.length - 1; i >= 0; i--) {
                  //console.log("pwd matches: "+bcrypt.compareSync(val.pwd, users[i].pwd));
                };
                success = "false";
              }
              //else reply that username exists
              //send reply
              //dataS = "a";
              res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
              res.write(success);
              res.end("");
              //console.log("adduser success: "+success);
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
                //console.log("no match!");
                success = "false"
              } else {
                //console.log("match!");
                for (var i = users.length - 1; i >= 0; i--) {
                  if(bcrypt.compareSync(val.pwd, users[i].pwd)){
                    success = "true";
                    //console.log("pwd matches");
                  }
                };
              }
              //else reply that username exists
              //send reply
              //dataS = "a";
              res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
              res.write(JSON.stringify({status: success, userinfo: users[0]}));
              res.end("");
              //console.log("login success: "+success);
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
                  ////console.log("pwd matches");
                }
                //else reply that username exists
                //send reply
                //dataS = "a";
                res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
                res.write(dataS);
                res.end("");
                //console.log(dataS);
              }
            });
          }
        });
      }
      if(req.method == 'GET'){
        //console.log("get");
        res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
        res.write('Please do not connect from browser.\n');
        res.end('');
      }
    } catch (err) {
      //console.log(err);
    }
    
  };

  //random crate generator
  setInterval(function(){
    Page.find(function(err, pages){
      if (!err){
        var pagenum = Math.round(Math.random()*pages.length);
        if (pages[pagenum]){
          pages[pagenum].items.crates.push({
            remainingHits: 10,
            placer: "system"
          });
          pages[pagenum].save();
          console.log('system placed a mine at '+pages[pagenum].url);
        }
      }
    });
  }, 300000); //every 5 min add 1 crate to a random page in DB and log change


  //startup script -- adds 1 mine to each page in alexa top 500
  var alexa = ['facebook.com/','google.com/','youtube.com/','yahoo.com/','amazon.com/','baidu.com/','wikipedia.org/','live.com/','qq.com/','taobao.com/','google.co.in/','twitter.com/','blogspot.com/','yahoo.co.jp/','bing.com/','linkedin.com/','sina.com.cn/','yandex.ru/','vk.com/','ask.com/','google.com.hk/','163.com/','tumblr.com/','ebay.com/','msn.com/','delta-search.com/','google.de/','hao123.com/','amazon.co.jp/','weibo.com/','wordpress.com/','xvideos.com/','mail.ru/','google.co.jp/','google.co.uk/','google.com.br/','fc2.com/','conduit.com/','microsoft.com/','tmall.com/','odnoklassniki.ru/','google.fr/','googleusercontent.com/','xhamster.com/','babylon.com/','craigslist.org/','instagram.com/','pinterest.com/','sohu.com/','amazon.de/','google.it/','google.ru/','akamaihd.net/','pornhub.com/','apple.com/','soso.com/','google.es/','imdb.com/','amazon.co.uk/','paypal.com/','xnxx.com/','avg.com/','ifeng.com/','google.com.mx/','bbc.co.uk/','neobux.com/','mywebsearch.com/','360.cn/','google.ca/','aol.com/','jd.com/','alipay.com/','redtube.com/','youku.com/','go.com/','blogspot.in/','alibaba.com/','dailymotion.com/','yieldmanager.com/','vube.com/','amazon.fr/','blogger.com/','netflix.com/','google.com.tr/','adf.ly/','youporn.com/','google.com.au/','google.pl/','cnn.com/','about.com/','ebay.de/','imgur.com/','rakuten.co.jp/','adobe.com/','thepiratebay.sx/','media.tumblr.com/','livejasmin.com/','adcash.com/','amazon.cn/','directrev.com/','ku6.com/','softonic.com/','uol.com.br/','livedoor.com/','nicovideo.jp/','sogou.com/','ebay.co.uk/','bp.blogspot.com/','buildathome.info/','flickr.com/','douban.com/','ameblo.jp/','huffingtonpost.com/','amazon.it/','globo.com/','clkmon.com/','indiatimes.com/','cnet.com/','espn.go.com/','badoo.com/','stackoverflow.com/','google.com.sa/','t.co/','google.com.eg/','weather.com/','amazon.es/','bannersdontwork.com/','ask.fm/','google.nl/','wikia.com/','snapdo.com/','xinhuanet.com/','google.co.th/','reddit.com/','slideshare.net/','google.com.tw/','renren.com/','youjizz.com/','tube8.com/','mediafire.com/','4shared.com/','chinaz.com/','google.com.ar/','deviantart.com/','booking.com/','ilivid.com/','google.co.id/','searchnu.com/','wigetmedia.com/','bankofamerica.com/','google.com.pk/','blogfa.com/','tianya.cn/','56.com/','google.cn/','dailymail.co.uk/','wordpress.org/','letv.com/','leboncoin.fr/','google.co.za/','chase.com/','people.com.cn/','skype.com/','walmart.com/','search-results.com/','goo.ne.jp/','nytimes.com/','systweak.com/','goodgamestudios.com/','xtendmedia.com/','vimeo.com/','amazonaws.com/','cloudfront.net/','pconline.com.cn/','orange.fr/','tudou.com/','hardsextube.com/','zedo.com/','livejournal.com/','amazon.ca/','godaddy.com/','espncricinfo.com/','comcast.net/','answers.com/','onet.pl/','china.com.cn/','indeed.com/','google.gr/','aliexpress.com/','google.com.my/','dropbox.com/','outbrain.com/','google.com.vn/','wikimedia.org/','yelp.com/','google.co.ve/','zol.com.cn/','sweetim.com/','adserverplus.com/','wellsfargo.com/','torrentz.eu/','incredibar.com/','flipkart.com/','foxnews.com/','web.de/','siteadvisor.com/','allegro.pl/','java.com/','cnzz.com/','rediff.com/','dmm.co.jp/','bizcoaching.info/','popads.net/','58.com/','soundcloud.com/','ehow.com/','gmx.net/','etsy.com/','bet365.com/','kickass.to/','photobucket.com/','guardian.co.uk/','hudong.com/','google.ro/','ucoz.ru/','tripadvisor.com/','wikihow.com/','google.com.ua/','mozilla.org/','wp.pl/','beeg.com/','google.com.co/','liveinternet.ru/','etao.com/','kaixin001.com/','soufun.com/','google.com.ng/','secureserver.net/','china.com/','employmentapplicationsforally.asia/','soku.com/','google.com.ph/','naver.jp/','pandora.com/','files.wordpress.com/','ameba.jp/','tagged.com/','yesky.com/','google.be/','avito.ru/','iminent.com/','sourceforge.net/','goal.com/','stumbleupon.com/','xcar.com.cn/','google.dz/','lollipop-network.com/','xunlei.com/','nbcnews.com/','iqiyi.com/','reference.com/','4dsply.com/','mypcbackup.com/','pengyou.com/','google.se/','download.com/','mobile01.com/','rambler.ru/','morefreecamsecrets.com/','addthis.com/','pch.com/','aili.com/','twoo.com/','it168.com/','libero.it/','likes.com/','themeforest.net/','thefreedictionary.com/','linkbucks.com/','loading-delivery1.com/','webcrawler.com/','google.com.bd/','google.co.kr/','doorblog.jp/','kaskus.co.id/','hurriyet.com.tr/','t-online.de/','google.com.pe/','samsung.com/','4399.com/','putlocker.com/','detik.com/','ganji.com/','zillow.com/','naver.com/','milliyet.com.tr/','hulu.com/','fiverr.com/','drtuber.com/','pof.com/','google.at/','autohome.com.cn/','google.pt/','dangdang.com/','acesse.com/','lnksr.com/','weebly.com/','olx.in/','pixiv.net/','lnksdata.com/','qvo6.com/','ign.com/','scribd.com/','varzesh3.com/','uploaded.net/','paipai.com/','youdao.com/','kakaku.com/','yamahaonlinestore.com/','pchome.net/','seznam.cz/','so.com/','zing.vn/','archive.org/','uimserv.net/','target.com/','bleacherreport.com/','mercadolivre.com.br/','bild.de/','cntv.cn/','deadlyblessing.com/','google.com.sg/','google.cl/','pcpop.com/','inbox.com/','hootsuite.com/','aweber.com/','jobrapido.com/','w3schools.com/','optmd.com/','onlineaway.net/','oyodomo.com/','cam4.com/','glispa.com/','51job.com/','forbes.com/','clicksor.com/','datasrvrs.com/','goodreads.com/','ikea.com/','match.com/','in.com/','extratorrent.com/','csdn.net/','blogspot.com.es/','chinanews.com/','quikr.com/','google.ch/','hp.com/','ndtv.com/','bestbuy.com/','imageshack.us/','fbcdn.net/','dianping.com/','51buy.com/','yandex.ua/','bitauto.com/','free.fr/','usatoday.com/','naukri.com/','warriorforum.com/','gmw.cn/','enet.com.cn/','nih.gov/','ebay.com.au/','wsj.com/','twitch.tv/','homedepot.com/','marca.com/','statcounter.com/','google.co.hu/','ig.com.br/','fhserve.com/','39.net/','mysearchresults.com/','xyxy.net/','rutracker.org/','ixxx.com/','ck101.com/','hdfcbank.com/','exoclick.com/','youm7.com/','terra.com.br/','interbiz.me/','mlb.com/','126.com/','ups.com/','pogo.com/','webmd.com/','outlook.com/','huanqiu.com/','att.com/','isohunt.com/','qunar.com/','gsmarena.com/','streamcloud.eu/','seesaa.net/','reuters.com/','roblox.com/','friv.com/','imesh.com/','google.cz/','adultfriendfinder.com/','2ch.net/','groupon.com/','nba.com/','github.com/','narod.ru/','ccb.com/','buzzfeed.com/','google.ie/','kijiji.ca/','y8.com/','telegraph.co.uk/','webs.com/','nifty.com/','shaadi.com/','aizhan.com/','usps.com/','largeporntube.com/','jrj.com.cn/','pcauto.com.cn/','mobile.de/','miniclip.com/','nuvid.com/','spiegel.de/','rednet.cn/','kooora.com/','clixsense.com/','hostgator.com/','wix.com/','fucked-tube.com/','dell.com/','google.ae/','google.co.il/','justdial.com/','youtube-mp3.org/','mp3skull.com/','sahibinden.com/','washingtonpost.com/','hypergames.net/','doubleclick.com/','taleo.net/','americanexpress.com/','kinox.to/','pornerbros.com/','pclady.com.cn/','domaintools.com/','snapdeal.com/','baiducontent.com/','icicibank.com/','taringa.net/','sweetpacks.com/','pornhublive.com/','icbc.com.cn/','google.no/','singlessalad.com/','biglobe.ne.jp/','myspace.com/','expedia.com/','bravotube.net/','yihaodian.com/','homeway.com.cn/','duowan.com/','myfreecams.com/','fedex.com/','farsnews.com/','salesforce.com/','yellowpages.com/','wordreference.com/','zippyshare.com/','gazeta.pl/','lady8844.com/','2345.com/','adultadworld.com/','google.dk/','hupu.com/','v9.com/','microsoftonline.com/','vancl.com/','xe.com/','accuweather.com/','zhaopin.com/','capitalone.com/','livedoor.biz/','mixi.jp/','onlinesbi.com/','ce.cn/','ebay.it/','histats.com/'];
  for (var i = 0; i < alexa.length; i++) {
    Page.find({url:alexa[i]}, function(err, pages){
      if (!err){
        ////console.log("noerr");
        ////console.log(pages);
        if (pages.length === 0) { //if no page, add it
          //console.log("adding page to DB");
          var newpage = addpage(alexa[i]);
          newpage.save();
          pages.push(newpage);
          ////console.log(newpage);
        }
        for (var i = 0; i < pages.length; i++) { //for each matching URL
          pages[i].items.mines.push({ //add post
            remainingHits: 1, 
            placer: 'system'
          });
          pages[i].save();
          console.log("system placed some mines on "+alexa[i]);
          res.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*'});
          res.write(JSON.stringify({userinfo: users[0]}));
          res.end("");
        }
      }
    });
  };
  // server start
  var port = process.env.PORT || 8080; //compatibility  with cloud9 IDE/Hosting
  //console.log("Listening on port "+port);
  //var server = https.createServer(options, onreq).listen(port);
  http/*s*/.createServer(/*options, */onreq).listen(port);
  ////console.log(server);
});
