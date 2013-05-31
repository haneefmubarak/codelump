/*
TODO:
Toolbar UI

Major Bugs:



*/
var genbar = true;
//code to execute when browser button clicked
/*chrome.browserAction.onClicked.addListener(function(tab) {
  if (genbar == false){
    genbar = true;
  } else if (genbar == true){
    genbar = false;
  }
  chrome.tabs.reload(); //reload active tab
});*/

/*setInterval(function() { //popup URL notifier script
	var notification = webkitNotifications.createHTMLNotification(
  'notification.html'
  );
  notification.show();
  setTimeout(function(){ //timeout script for popup
    notification.cancel();
  }, 2475); //time in ms
  //console.log("90s");
}, 90000);*/
//var port = chrome.runtime.connect({name: "OHaiThere"});
chrome.runtime.onConnect.addListener(function(port) {
  console.assert(port.name == "OHaiThere");
  port.onMessage.addListener(function(request) {
    if (request.method == "gettab"){
      chrome.tabs.query({
          'active': true,
          'currentWindow': true
        }, function (tabs) { //select the active tab
          port.postMessage(tabs); //and send it back as an array
          //console.log(tabs);
      });
    }
    if (request.method == "togglevis"){
      if (genbar == false){
        genbar = true;
      } else if (genbar == true){
        genbar = false;
      }
      console.log(genbar);
      chrome.tabs.reload();
    }
    if (request.method == "checkgenbar"){
      port.postMessage(genbar);
    }
    if (request.method == "notif"){
      var alertS = request.alertS;
      var notif = webkitNotifications.createNotification(
        "icon.png",
        "Page info from CodeLump",
        alertS
      );
      notif.show();
      setTimeout(function(){
        notif.close();
      }, 4000); //close notification  after 4 sec
    }
  });
});
/*chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
    //when pinged, execute desired code
    if(request.greeting == "OHaiThere"){
      if (request.method == "gettab"){
        chrome.tabs.query({
            'active': true,
            'currentWindow': true
          }, function (tabs) { //select the active tab
            sendResponse(tabs); //and send it back as an array
            //console.log(tabs);
        });
      }
      if (request.method == "togglevis"){
        if (genbar == false){
          genbar = true;
        } else if (genbar == true){
          genbar = false;
        }
        console.log(genbar);
        chrome.tabs.reload();
      }
      if (request.method == "checkgenbar"){
        sendResponse(genbar);
      }
      if (request.method == "notif"){
        var alertS = request.alertS;
        var notif = webkitNotifications.createNotification(
          "icon.png",
          "Page info from CodeLump",
          alertS
        );
        notif.show();
        setTimeout(function(){
          notif.close();
        }, 4000); //close notification  after 4 sec
      }
    }
});*/