$(document).ready(function(){ //when DOM ready
  var port = chrome.runtime.connect({name: "OHaiThere"});
  var codelumpurl = "http://codelump.com:8080"
  //define item labels
  var scorelabel = document.getElementById('score');
  var pwdin = document.getElementById("pwd");
  var userin = document.getElementById("username");
  var loginbtn = document.getElementById("loginbtn");
  var logoutbtn = document.getElementById("logoutbtn");
  //var alertbutton = document.getElementById("alertbutton");
  //var logbutton = document.getElementById("logbutton");
  var sendbutton = document.getElementById("sendbutton");
  var minebutton = document.getElementById("minebutton");
  var cratebutton = document.getElementById("cratebutton");
  var postbutton = document.getElementById("postbutton");
  var delusrbutton = document.getElementById("delusrbutton");
  var addusrbutton = document.getElementById("addusrbutton");
  var minesdisp = document.getElementById("mines");
  var cratesdisp = document.getElementById("crates");
  var postsdisp = document.getElementById("posts");

  var userinfo;
  minebutton.onclick = function() {
    var nummines = 1*(prompt("Please enter the number of posts you wish to add:", "1234"))
    if (nummines==NaN) {
      alert("Please enter a number.");
    }else{
      port.postMessage({greeting:"OHaiThere", method: "gettab"});
      var listen = true;
      port.onMessage.addListener(function(response){
        listen = false;
        var dataS = JSON.stringify({method:"plantmine", url:response[0].url, num:nummines, userinfo:userinfo}); //convert array to JSON (str to send)
        $.post(
          codelumpurl,
          dataS,
          function (res){
            res = JSON.parse(res);
            scorelabel.innerHTML = res.userinfo.points;
            minesdisp.innerHTML = res.userinfo.items.mines;
            cratesdisp.innerHTML = res.userinfo.items.crates;
            postsdisp.innerHTML = res.userinfo.items.posts;
            return(0);
          }
        );
      });
    }
  }
  cratebutton.onclick = function() {
    var numcrates = 1*(prompt("Please enter the number of posts you wish to add:", "1234"))
    if (numcrates==NaN) {
      alert("Please enter a number.");
    }else{
      port.postMessage({greeting:"OHaiThere", method: "gettab"});
      var listen = true;
      port.onMessage.addListener(function(response){
        listen = false;
        var dataS = JSON.stringify({method:"plantcrate", url:response[0].url, num:numcrates, userinfo:userinfo}); //convert array to JSON (str to send)
        $.post(
          codelumpurl,
          dataS,
          function (res){
            res = JSON.parse(res);
            scorelabel.innerHTML = res.userinfo.points;
            minesdisp.innerHTML = res.userinfo.items.mines;
            cratesdisp.innerHTML = res.userinfo.items.crates;
            postsdisp.innerHTML = res.userinfo.items.posts;
            return(0);
          }
        );
      });
    }
  }
  postbutton.onclick = function() {
    //reduce points by 1
    //prompt for address and text to go to
    var posturl = prompt("Please enter full URL of webpage for post to lead to:", "http://codelump.com/");
    var posttext = prompt("Please enter to display on post:", "A Passively Multiplayer Online Game!");
    var numposts = 1*(prompt("Please enter the number of posts you wish to add:", "1234"))
    if (numposts==NaN) {
      alert("Please enter a number.");
    }else{
      port.postMessage({greeting:"OHaiThere", method: "gettab"});
      var listen = true;
      port.onMessage.addListener(function(response){
        listen = false;
        var dataS = JSON.stringify({method: "makeposts", url: response[0].url, posts: [{
          address: posturl,
          posttext: posttext,
          RemainingHits: numposts
        }], userinfo:userinfo}); //convert array to JSON (str to send)
        $.post(
          codelumpurl,
          dataS,
          function (res){
            res = JSON.parse(res);
            scorelabel.innerHTML = res.userinfo.points;
            minesdisp.innerHTML = res.userinfo.items.mines;
            cratesdisp.innerHTML = res.userinfo.items.crates;
            postsdisp.innerHTML = res.userinfo.items.posts;
            return(0);
          }
        );
      });
    }
  }
  loginbtn.onclick = function () {
    var dataS = JSON.stringify({method: "login", username: userin.value, pwd: pwdin.value}); //convert array to JSON (str to send)
    console.log(dataS);
    $.post(
      codelumpurl,
      dataS,
      function (res){
        res = JSON.parse(res);
        if (res.status=="true"){
          $.cookie('codelumpusr', JSON.stringify({
            username: res.userinfo.username,
            pwd: pwdin.value,
            email: res.userinfo.email
          }), {expires: 30, path: "/"});
          console.log('logged in!');
          console.log("cred info: "+ $.cookie('codelumpusr'));
        } else {
          alert("Error logging in: Double-check your credentials");
        }
        window.location.reload();
        //res = JSON.parse(res); //convert JSON to array
        //console.log("response from node server: "+res);
        return(0);
      }
    );
  }
  logoutbtn.onclick = function () {
    console.log("removing: "+$.cookie('codelumpusr'));
    $.removeCookie('codelumpusr');
    window.location.reload();
  }



  //regulate which set of inputs is shown:
  if ($.cookie('codelumpusr') == undefined){
    document.getElementById("login").style.display = 'block';
    document.getElementById("buttons").style.display = 'none';
  }else {
    document.getElementById("login").style.display = 'none';
    document.getElementById("buttons").style.display = 'block';
    userinfo = JSON.parse($.cookie('codelumpusr'));
  }

  ////onload func
  var email = JSON.parse($.cookie('codelumpusr')).email;
  $('#gravatar').append($.gravatar(email, {size: '40'}));
  port.postMessage({greeting:"OHaiThere", method: "gettab"});
  var listenonload = true;
  port.onMessage.addListener(function(response){
    listenonload = false;
    //alert(response);
    var dataS = JSON.stringify({method: "onload", url: response[0].url, userinfo: userinfo}); //convert array to JSON (str to send)
    console.log(dataS);
    //alert('onload ping');
    $.post(
      codelumpurl,
      dataS,
      function (res){
        res = JSON.parse(res);
        scorelabel.innerHTML = res.userinfo.points;
        minesdisp.innerHTML = res.userinfo.items.mines;
        cratesdisp.innerHTML = res.userinfo.items.crates;
        postsdisp.innerHTML = res.userinfo.items.posts;

        //res = JSON.parse(res); //convert JSON to array
        console.log("response from node server: "+res);
        //console.log(res);
        var alertS = "";
        //define alert string
        if (res.crates){
          alertS+="You found a crate and gained 10 points!\n";
        }
        if (res.mines){
          alertS+="You stepped on a mine and lost 5 points!\n";
        }
        if (res.posts[0]){
          alertS+="Posts:\n";
          for (var i = 0; i < res.posts.length; i++) {
            alertS+=((i+1)+"\n");
            alertS+=(" URL: "+res.posts[i].address+"\n");
            alertS+=(" Text: "+res.posts[i].posttext+"\n");
          };
        }
        //display alert string
        if (alertS){
          //alert(alertS);
          port.postMessage({method: "notif", alertS: alertS}, function(response) {});
        }
      }
    );
  });
});