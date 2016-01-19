var Game = function(init)
{
  var default_init =
  {
    width:640,
    height:320,
    container:"stage_container"
  }

  var self = this;
  doMapInitDefaults(init,init,default_init);

  var stage = new Stage({width:init.width,height:init.height,container:init.container});
  var scenes = [new NullScene(self, stage), new LoadingScene(self, stage), new GamePlayScene(self, stage)];
  var currentScene = 0;

  self.begin = function()
  {
    self.nextScene();
    tick();
  };

  var tick = function()
  {
    requestAnimFrame(tick,stage.dispCanv.canvas);
    stage.clear();
    scenes[currentScene].tick();
    scenes[currentScene].draw();
    stage.draw(); //blits from offscreen canvas to on screen one

    if(currentScene == 2)
    {
      document.getElementById("side_a").style.backgroundColor = "rgba(0,0,0,"+global_bg_alpha+")";
      document.getElementById("side_b").style.backgroundColor = "rgba(0,0,0,"+global_bg_alpha+")";
    }
  };

  self.nextScene = function()
  {
    scenes[currentScene].cleanup();
    currentScene++;
    scenes[currentScene].ready();
  };
};

