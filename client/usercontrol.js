$(document).ready( function() { //when DOM ready

  var serverurl = "http://codelump.com:8080"
  //assign elements to variables
  var addusrbtn = document.getElementById("addusr");
  var delusrbtn = document.getElementById("delusr");
  var userin = document.getElementById("username");
  var pwdin = document.getElementById("pwd1");
  var pwd2in = document.getElementById("pwd2");
  var emailin = document.getElementById("email");
  var ToSconf = document.getElementById("ToSconf");

  addusrbtn.onclick = function () {
    //alert(userin.value);
    if (!userin.value || !pwdin.value || !pwd2in.value || !emailin.value) {
      alert("Please fill in all fields.");
    } else if (pwd2in.value != pwdin.value) {
      alert("Passwords do not match.");
    } else if (!ToSconf.checked){
      alert("You must agree to the Terms of Service and Privacy Policy.");
    } else {
      var dataS = JSON.stringify({
        method: "addusr",
        username: userin.value,
        pwd: pwdin.value,
        email: emailin.value
      }); //user data to send to server
      $.post(
        serverurl,
        dataS,
        function (res){
          //console.log("response from node server: "+res);
          //console.log(res);
          if (res == "true"){
            
          } else {

          }
        }
      );
      console.log(dataS);
    }
    //alert("add user!");
  }
  delusrbtn.onclick = function () {
   //alert("delete user!");
  }
});