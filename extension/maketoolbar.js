var port = chrome.runtime.connect({name: "OHaiThere"});
port.postMessage({method: "checkgenbar"});
port.onMessage.addListener(function(response){
  if (response == true){
    //alert('making bar');
    //INJECT TOOLBAR
    
    //make space for toolbar
    //add margin for body
    $("html").append("<style>body{position: relative;top: 0px;margin-top: 40px !important;}</style>");
    if ($("body").attr('style')){
      $("body").attr('style', $("body").attr('style')+'position: relative;top: 0px;margin-top: 40px !important;');
    } else{
      $("body").attr('style', 'position: relative;top: 0px; margin-top:40px !important;');
    }
    //shift down interfering divs
    //shift all fixed divs
    var divs = $("div");
    for (var i = 0; i < divs.length; i++) {
      if(($(divs[i]).css('position')=='fixed') && ($(divs[i]).css('top').substr(($(divs[i]).css('top').length-2)) == 'px')){ //if fixed to top by pixels
        //substring number of pixels and add 40
        var shift = 0;
        shift = $(divs[i]).css('top').substring(0, $(divs[i]).css('top').length-2);
        shift += 40;
        shift = shift + 'px';
        //change position to correct shift
        $(divs[i]).attr('style', ('position: fixed; top: '+shift));
      }
    };
    //shift normal-positioned divs on top level of body
    var childdivs = $("body > div");
    for (var i = 0; i < childdivs.length; i++) {
      if(($(childdivs[i]).css('position')!='fixed') && ($(childdivs[i]).css('display')!='none')){
        $(childdivs[i]).attr('style', 'position: relative; top: 40px;');
      }
    };
    //$("body > div").attr('style', 'position: relative; top: 40px;')

    //select body
    //change style of body to allow toolbar injection
    $("body")
    //wrap the content in a div
    //.wrapInner("<div class='website' style='padding-top:60px;'></div>")
    //prepend the iframe to the body
    .prepend("<iframe id='codelumptoolbar' width='100%' frameborder='0' style='width:100%;display:block;position:fixed;visibility:visible;top:0;left:0;margin:0px;z-index:999999;height:40px;opacity:1;padding:0px;' scrolling='no' src = '"+ chrome.extension.getURL("toolbar.html") + "' >");
  }
});