  //TODO: round buys to whole numbers
$(document).ready( function() { //when DOM ready

  var serverurl = "https://codelump.com:8080"
  //assign elements to variables
  var signinbtn = document.getElementById("getusrinfo");
  var buybtn = document.getElementById("buybtn");
  var userin = document.getElementById("userin");
  var pwdin = document.getElementById("pwdin");
  var pointsdisp = document.getElementById("points");
  var priceout = document.getElementById("price");
  
  signinbtn.onclick = function (){
    var dataS = JSON.stringify({
      method: "getusrinfo",
      username: userin.value,
      pwd: pwdin.value
    });
    $.post(
      serverurl,
      dataS,
      function (res){
        res = JSON.parse(res);
        //alert(res.userinfo.points);
        minesdisp.innerHTML = res.userinfo.items.mines;
        cratesdisp.innerHTML = res.userinfo.items.crates;
        postsdisp.innerHTML = res.userinfo.items.posts;
        pointsdisp.innerHTML = res.userinfo.points;
        $("#stats").attr('style', 'display: block;');
        $("#login").attr('style', 'display: none;');
        return(0);
      }
    );
  }
  buybtn.onclick = function(){
    var dataS = JSON.stringify({
      method: "buyitems",
      username: userin.value,
      pwd: pwdin.value,
      items: {
        crates: $("#cratesin")[0].value,
        mines: $("#minesin")[0].value,
        posts: $("#postsin")[0].value
      },
      cost: (($("#cratesin")[0].value)*10+($("#minesin")[0].value)*10+($("#postsin")[0].value)*10)
    });
    console.log(dataS);
    $.post(
      serverurl,
      dataS,
      function (res){
        res = JSON.parse(res);
        //alert(res.userinfo.points);
        minesdisp.innerHTML = res.userinfo.items.mines;
        cratesdisp.innerHTML = res.userinfo.items.crates;
        postsdisp.innerHTML = res.userinfo.items.posts;
        pointsdisp.innerHTML = res.userinfo.points;
        $("#stats").attr('style', 'display: block;');
        $("#login").attr('style', 'display: none;');
        console.log(res);
        return(0);
      }
    );
  }
  //whenever input changes recalculate price
  $(".itemsin").change(function(){
    var cratecost = ($("#cratesin")[0].value)*10;
    var minecost = ($("#minesin")[0].value)*10;
    var postcost = ($("#postsin")[0].value)*10;
    console.log(cratecost+"\n"+minecost+"\n"+postcost);
    if (isNaN(cratecost) || isNaN(postcost) || isNaN(minecost)){
      alert ("Please enter only numbers for your quantities");
      if (isNaN(cratecost)){
        ($("#cratesin")[0].value) = "";
      }
      if (isNaN(minecost)){
        ($("#minesin")[0].value) = "";
      }
      if (isNaN(postcost)){
        ($("#postsin")[0].value) = "";
      }
      $(buybtn).attr('style', 'display: none;');
    }else {
      priceout.innerHTML = ("$"+(cratecost+postcost+minecost));
      $(buybtn).attr('style', 'display: inline-block;');
    }
  });
});