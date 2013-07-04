var port = chrome.runtime.connect({name: "OHaiThere"});
port.postMessage({method: "checkgenbar"});
port.onMessage.addListener(function(response){
  if (response == true){
    //alert('making bar');
    //INJECT TOOLBAR
    
    //make space for toolbar
    //add margin for body
    /*$("html").append("<style>body{position: relative;top: 0px;margin-top: 40px !important;}</style>");
    if ($("body").attr('style')){
      $("body").attr('style', $("body").attr('style')+'position: relative;top: 0px;margin-top: 40px !important;');
    } else{
      $("body").attr('style', 'position: relative;top: 0px; margin-top:40px !important;');
    }*/

    //wrap page
    /*$('body').wrapInner(
        $(document.createElement('div')).css('padding-top','40px')
    );*/
    var height = '40px';
    var iframe = document.createElement('iframe');
    iframe.src = chrome.extension.getURL('toolbar.html');
    iframe.style.height = height;
    iframe.style.width = '100%';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.zIndex = '938089'; // Some high value
    // Etc. Add your own styles if you want to
    document.documentElement.appendChild(iframe);
    // continuing add-toolbar.js
    var bodyStyle = document.body.style;
    var cssTransform = 'transform' in bodyStyle ? 'transform' : 'webkitTransform';
    bodyStyle[cssTransform] = 'translateY(' + height + ')';
    //prepend the toolbar iframe to the body
    //$('body').prepend("<iframe id='codelumptoolbar' width='100%' frameborder='0' style='width:100%;display:block;position:fixed;visibility:visible;top:0;left:0;margin:0px;z-index:999999;height:40px;opacity:1;padding:0px;' scrolling='no' src = '"+ chrome.extension.getURL("toolbar.html") + "' >");
  }
});