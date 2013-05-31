chrome.tabs.query({'active': true}, function (tabs) { //for the active tab
for (var i = 0; i <= tabs.length; i++) {
    document.write("<p>"+tabs[i].url+"</p>");
  };
  //alert(url);
  //document.getElementById('url').innerHTML = url; //set text of URL field to url
  document.getElementById('url').innerHTML = url; //set text of URL field to url
});
/*url = document.getElementById('url').innerHTML;
document.getElementById('url2').innerHTML = url;*/