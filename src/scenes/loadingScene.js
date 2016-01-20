var LoadingScene = function(game, stage)
{
  var self = this;
  var pad;
  var barw;
  var progress;
  var canv = stage.drawCanv;

  var imagesloaded = 0;
  var img_srcs = [];
  var images = [];

  var imageLoaded = function()
  {
    imagesloaded++;
  };

  self.ready = function()
  {
    pad = 20;
    barw = (canv.canvas.width-(2*pad));
    progress = 0;
    canv.context.fillStyle = "#000000";
    canv.context.font = "25px Open Sans";
    canv.context.fillText(".",0,0);// funky way to encourage any custom font to load
    canv.context.font = "25px stump";
    canv.context.fillText(".",0,0);// funky way to encourage any custom font to load

    //put strings in 'img_srcs' as separate array to get "static" count
    img_srcs.push("assets/theyard-logo.png");
    img_srcs.push("assets/icon-menu.png");
    img_srcs.push("assets/main-screen.png");
    img_srcs.push("assets/main-screen_cover.png");
    img_srcs.push("assets/button-h.png");
    img_srcs.push("assets/button-l.png");
    img_srcs.push("assets/icon-checkbox.png");
    img_srcs.push("assets/icon-close.png");
    img_srcs.push("assets/icon-eye.png");
    img_srcs.push("assets/icon-checkbox-selected.png");
    img_srcs.push("assets/icon-h.png");
    img_srcs.push("assets/icon-l.png");
    img_srcs.push("assets/icon-trash-open.png");
    img_srcs.push("assets/icon-trash.png");
    img_srcs.push("assets/scout.png");
    img_srcs.push("assets/level-bg.png");
    img_srcs.push("assets/fade-level-bg.png");
    img_srcs.push("assets/level-bg-outline.png");
    img_srcs.push("assets/icon-locked.png");
    img_srcs.push("assets/icon-check.png");
    img_srcs.push("assets/vane-tip.png");
    img_srcs.push("assets/vane-tail.png");
    img_srcs.push("assets/vane-tip-green.png");
    img_srcs.push("assets/vane-tail-green.png");
    img_srcs.push("assets/dotted-vane-tip.png");
    img_srcs.push("assets/dotted-vane-tail.png");
    for(var i = 0; i < img_srcs.length; i++)
    {
      images[i] = new Image();
      images[i].onload = imageLoaded; 
      images[i].src = img_srcs[i];
    }
    imageLoaded(); //call once to prevent 0/0 != 100% bug
  };

  self.tick = function()
  {
    if(progress <= imagesloaded/(img_srcs.length+1)) progress += 0.03;
    if(progress >= 1.0) game.nextScene();
  };

  self.draw = function()
  {
    canv.context.fillRect(pad,canv.canvas.height/2,progress*barw,1);
    canv.context.strokeRect(pad-1,(canv.canvas.height/2)-1,barw+2,3);
  };

  self.cleanup = function()
  {
    progress = 0;
    imagesloaded = 0;
    images = [];//just used them to cache assets in browser; let garbage collector handle 'em.
    canv.context.fillStyle = "#FFFFFF";
    canv.context.fillRect(0,0,canv.canvas.width,canv.canvas.height);
  };
};

