$(document).ready(function() {
  $('body').append(location.hash.substr(1,location.hash.length-1));
});