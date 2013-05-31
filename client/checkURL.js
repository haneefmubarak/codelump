//update node.js server that page has been loaded 
chrome.extension.sendMessage({greeting: "OHaiThere", method: "sendurltonode"}, function(response) {});