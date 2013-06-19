$(document).ready(function(){ //when DOM ready
  var port = chrome.runtime.connect({name: "OHaiThere"});
  //define item labels
  var regbtn = document.getElementById('regbtn');
  var buybtn = document.getElementById('buyitems');
  var visbtn = document.getElementById('togglevis');
  //var disp = document.getElementById('page');

  regbtn.onclick = function() {
    $("#page")[0].src = "usercontrol.html";
  }
  buybtn.onclick = function() {
    $("#page")[0].src = "buyitems.html";
  }
  visbtn.onclick = function () {
    port.postMessage({method: "togglevis"});
  }
});