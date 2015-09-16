var GamePlayScene = function(game, stage)
{
  var self = this;

  self.dragger;
  self.presser;

  //index:  0 refers to first, 1 refers to second, 0.5 refers to "the value between first and second"
  //sample: both 0 AND 1 refer to, identically, "the value between last and first", 0.5 refers to "the value between first and last"
  function indexToSample (i,n) { return   (i+0.5)/n;       }
  function indexToSampleW(i,n) { return (((i+0.5)/n)+1)%1; }
  function sampleToIndex (s,n) { return   (s*n)-0.5;       }
  function sampleToIndexW(s,n) { return (((s*n)-0.5)+n)%n; }

  function decw(i,n) { return ((i-1)+n)%n; };
  function incw(i,n) { return (i+1)%n; };

  var HeightMap = function(w,h)
  {
    var self = this;
    self.w = w;
    self.h = h;
    self.buffs = [];
    self.buffs[0] = [];
    self.buffs[1] = [];
    for(var i = 0; i < w*h; i++) self.buffs[0][i] = self.buffs[1][i] = Math.random();
    self.buff = 0;
    self.data = self.buffs[self.buff];

    self.iFor = function(x,y) { return (y*w)+x; }
    self.anneal = function(t)
    {
      var oldb = self.buff;
      var newb = (self.buff+1)%2;
      for(var y = 0; y < h; y++)
      {
        for(var x = 0; x < w; x++)
        {
          var index = self.iFor(x,y);
          self.buffs[newb][index] = self.buffs[oldb][index];
          self.buffs[newb][index] += self.buffs[oldb][self.iFor(((x-1)+w)%w,y)];
          self.buffs[newb][index] += self.buffs[oldb][self.iFor(((x+1)+w)%w,y)];
          self.buffs[newb][index] += self.buffs[oldb][self.iFor(x,((y-1)+h)%h)];
          self.buffs[newb][index] += self.buffs[oldb][self.iFor(x,((y+1)+h)%h)];
          self.buffs[newb][index] /= 5;
          self.buffs[newb][index] = lerp(self.buffs[oldb][index],self.buffs[newb][index],t);
        }
      }
      self.buff = (self.buff+1)%2;
      self.data = self.buffs[self.buff];
    }
    self.sample = function(x,y)
    {
      x = sampleToIndexW(x,self.w);
      y = sampleToIndexW(y,self.h);
      var low_x  = Math.floor(x);
      var high_x = Math.ceil (x);
      var low_y  = Math.floor(y);
      var high_y = Math.ceil (y);

      var tl = self.data[self.iFor( low_x, low_y)];
      var tr = self.data[self.iFor(high_x, low_y)];
      var bl = self.data[self.iFor( low_x,high_y)];
      var br = self.data[self.iFor(high_x,high_y)];

      var t = lerp(tl,tr,x%1);
      var b = lerp(bl,br,x%1);
      return lerp(t,b,y%1);
    }
    self.takeValsFromHmap = function(hmap)
    {
      for(var y = 0; y < self.h; y++)
      {
        for(var x = 0; x < self.w; x++)
        {
          var index = self.iFor(x,y);
          self.data[index] = hmap.sample((x/self.w)+0.5,(y/self.h)+0.5);
        }
      }
    }
  }
  var VecField2d = function(w,h)
  {
    var self = this;
    self.w = w;
    self.h = h;
    self.dir_map = new HeightMap(w,h);
    var dm = self.dir_map;
    self.dir_map.sample = function(x,y) //overwrite to slerp (er, 'clerp'...)
    {
      var self = dm;
      x = sampleToIndexW(x,self.w);
      y = sampleToIndexW(y,self.h);
      var low_x  = Math.floor(x);
      var high_x = Math.ceil (x);
      var low_y  = Math.floor(y);
      var high_y = Math.ceil (y);

      var tl = self.data[self.iFor( low_x, low_y)];
      var tr = self.data[self.iFor(high_x, low_y)];
      var bl = self.data[self.iFor( low_x,high_y)];
      var br = self.data[self.iFor(high_x,high_y)];

      var t = clerp(tr,tl,x%1);
      var b = clerp(br,bl,x%1);
      return clerp(t,b,y%1);
    }
    self.len_map = new HeightMap(w,h);
    for(var i = 0; i < w*h; i++)
    {
      self.dir_map.data[i] = 0;
      self.len_map.data[i] = 1;
    }

    self.iFor = self.dir_map.iFor;
  }
  var Air = function(n)
  {
    var self = this;
    self.partxs = [];
    self.partys = [];
    self.partts = [];
    self.n = n;
    for(var i = 0; i < self.n; i++)
    {
      self.partxs[i] = Math.random();
      self.partys[i] = Math.random();
      self.partts[i] = Math.random();
    }
  }

  var MapDragger = function(x,y,r,hmap)
  {
    var self = this;
    self.sx = indexToSample(x,hmap.w);
    self.sy = indexToSample(y,hmap.h);
    self.r = r;
    self.w = r*stage.dispCanv.canvas.width;
    self.h = r*stage.dispCanv.canvas.height;
    self.x = self.sx*stage.dispCanv.canvas.width-(self.w/2);
    self.y = self.sy*stage.dispCanv.canvas.height-(self.h/2);
    self.dragging = false;

    self.dragStart = function(evt)
    {
      self.dragging = true;
    }
    self.drag = function(evt)
    {
      if(self.dragging)
      {
        self.sx = evt.doX/stage.dispCanv.canvas.width;
        self.sy = evt.doY/stage.dispCanv.canvas.height;
        self.x = evt.doX-(self.w/2);
        self.y = evt.doY-(self.h/2);
      }
    }
    self.dragFinish = function(evt)
    {
      self.dragging = false;
    }
  }
  var PressureSystem = function(x,y,r,delta,label,color,pmap)
  {
    var self = new MapDragger(x,y,r,pmap);
    self.delta = delta;

    self.draw = function(canv)
    {
      stage.drawCanv.context.font = "30px arial";
      canv.context.fillStyle = color;
      canv.context.fillText(label,self.x+self.w/2-10,self.y+self.h/2+10);
    }
    return self;
  }
  var TempEmitter = function(x,y,r,delta,label,color,tmap)
  {
    var self = new MapDragger(x,y,r,tmap);
    self.delta = delta;

    self.draw = function(canv)
    {
      stage.drawCanv.context.font = "30px arial";
      canv.context.fillStyle = color;
      canv.context.fillText(label,self.x+self.w/2-10,self.y+self.h/2+10);
    }
    return self;
  }

  var Flag = function(x,y,t,l,color)
  {
    var self = this;
    self.x = x;
    self.y = y;
    self.goal_t = t;
    self.goal_l = l;
    self.color = color;
    self.t = 0;
    self.l = 0;
  }

  self.tmap;
  self.temit;
  self.pmap;
  self.hpsys;
  self.lpsys;
  self.vfield;
  self.air;

  self.flags = [];

  self.draw_pressure_map;
  self.draw_pressure_contour;
  self.draw_wind_vectors;
  self.draw_pressure_systems;
  self.draw_air_particles;

  self.tick_pressure_map;
  self.tick_pressure_contour;
  self.tick_wind_vectors;
  self.tick_pressure_systems;
  self.tick_air_particles;

  self.ready = function()
  {
    var cells_w = 50;
    var cells_h = 50;

    self.dragger = new Dragger({source:stage.dispCanv.canvas});
    self.presser = new Presser({source:stage.dispCanv.canvas});

    self.draw_pressure_map = true; self.draw_pressure_map_t = new ToggleBox(10, 10,20,20,1,function(o){ self.draw_pressure_map = o; });
    self.draw_pressure_contour = true; self.draw_pressure_contour_t = new ToggleBox(10, 40,20,20,1,function(o){ self.draw_pressure_contour = o; });
    self.draw_wind_vectors = true; self.draw_wind_vectors_t = new ToggleBox(10, 70,20,20,1,function(o){ self.draw_wind_vectors = o; });
    self.draw_pressure_systems = true; self.draw_pressure_systems_t = new ToggleBox(10,100,20,20,1,function(o){ self.draw_pressure_systems = o; });
    self.draw_air_particles = true; self.draw_air_particles_t = new ToggleBox(10,130,20,20,1,function(o){ self.draw_air_particles = o; });
    self.presser.register(self.draw_pressure_map_t);
    self.presser.register(self.draw_pressure_contour_t);
    self.presser.register(self.draw_wind_vectors_t);
    self.presser.register(self.draw_pressure_systems_t);
    self.presser.register(self.draw_air_particles_t);

    self.tick_pressure_map = true; self.tick_pressure_map_t = new ToggleBox(40, 10,20,20,1,function(o){ self.tick_pressure_map = o; });
    self.tick_pressure_contour = true; self.tick_pressure_contour_t = new ToggleBox(40, 40,20,20,1,function(o){ self.tick_pressure_contour = o; });
    self.tick_wind_vectors = true; self.tick_wind_vectors_t = new ToggleBox(40, 70,20,20,1,function(o){ self.tick_wind_vectors = o; });
    self.tick_pressure_systems = true; self.tick_pressure_systems_t = new ToggleBox(40,100,20,20,1,function(o){ self.tick_pressure_systems = o; });
    self.tick_air_particles = true; self.tick_air_particles_t = new ToggleBox(40,130,20,20,1,function(o){ self.tick_air_particles = o; });
    self.presser.register(self.tick_pressure_map_t);
    self.presser.register(self.tick_pressure_contour_t);
    self.presser.register(self.tick_wind_vectors_t);
    self.presser.register(self.tick_pressure_systems_t);
    self.presser.register(self.tick_air_particles_t);

    self.tmap = new HeightMap(cells_w,cells_h);
    self.pmap = new HeightMap(cells_w,cells_h);
    self.vfield = new VecField2d(25,25);
    self.air = new Air(10000);

    self.temit = new TempEmitter(self.tmap.w*.2,self.tmap.h*.2,100,5,"T","#FF3333",self.tmap);
    self.dragger.register(self.temit);

    self.hpsys = new PressureSystem(self.pmap.w*.2,self.pmap.h*.2,0.1, 0.03,"H","#000000",self.pmap);
    self.lpsys = new PressureSystem(self.pmap.w*.6,self.pmap.h*.6,0.1,-0.03,"L","#FFFFFF",self.pmap);
    self.dragger.register(self.hpsys);
    self.dragger.register(self.lpsys);

    var colors = [];
    colors[0] = "#0000FF";
    colors[1] = "#00FF00";
    colors[2] = "#00FFFF";
    colors[3] = "#FF0000";
    colors[4] = "#FF00FF";
    colors[5] = "#FFFF00";
    colors[6] = "#FFFFFF";
    for(var i = 0; i < 1; i++)
      self.flags[i] = new Flag(0.2+(Math.random()*0.6),0.2+(Math.random()*0.6),Math.random()*2*Math.PI,1,colors[i%colors.length]);

    self.pmap.anneal(1);
    self.pmap.anneal(1);
    self.pmap.anneal(1);
    self.pmap.anneal(1);
  };

  self.ticks = 0;
  self.tick = function()
  {
    var index;
    var ti;
    var bi;
    var li;
    var ri;

/*
    //Emit Temp
    index = 0;
    for(var i = 0; i < self.tmap.h; i++)
    {
      for(var j = 0; j < self.tmap.w; j++)
      {
        var xd = (j/self.tmap.w)-self.temit.sx;
        var yd = (i/self.tmap.h)-self.temit.sy;
        var d = (xd*xd + yd*yd) / (self.temit.r*self.temit.r);
        if(d < 1)
        {
          self.tmap.data[index] += (1-(d*d*d*d))*self.temit.delta;

          if(self.tmap.data[index] > 1) self.tmap.data[index] = 1;
          if(self.tmap.data[index] < 0) self.tmap.data[index] = 0;
        }

        index++;
      }
    }

    //Flow Temp
    index = 0;
    for(var i = 0; i < self.tmap.h; i++)
    {
      for(var j = 0; j < self.tmap.w; j++)
      {
        ti = self.tmap.iFor(j,incw(i,self.tmap.h));
        bi = self.tmap.iFor(j,decw(i,self.tmap.h));
        li = self.tmap.iFor(decw(j,self.tmap.w),i);
        ri = self.tmap.iFor(incw(j,self.tmap.w),i);

        if(self.tmap.data[index] > 1) self.tmap.data[index] = 1;
        if(self.tmap.data[index] < 0) self.tmap.data[index] = 0;

        index++;
      }
    }
*/

    //Emit Pressure
    if(self.tick_pressure_systems)
    {
      index = 0;
      for(var i = 0; i < self.pmap.h; i++)
      {
        for(var j = 0; j < self.pmap.w; j++)
        {
          var xd = (j/self.pmap.w)-self.hpsys.sx;
          var yd = (i/self.pmap.h)-self.hpsys.sy;
          var d = (xd*xd + yd*yd) / (self.hpsys.r*self.hpsys.r);
          if(d < 1) self.pmap.data[index] += (1-(d*d*d*d))*self.hpsys.delta;

          var xd = (j/self.pmap.w)-self.lpsys.sx;
          var yd = (i/self.pmap.h)-self.lpsys.sy;
          var d = (xd*xd + yd*yd) / (self.lpsys.r*self.lpsys.r);
          if(d < 1) self.pmap.data[index] += (1-(d*d*d*d))*self.lpsys.delta;

          if(self.pmap.data[index] > 1) self.pmap.data[index] = 1;
          if(self.pmap.data[index] < 0) self.pmap.data[index] = 0;

          index++;
        }
      }
    }

    if(self.tick_pressure_map)
    {
  /*
      //Flow Pressure
      index = 0;
      for(var i = 0; i < self.pmap.h; i++)
      {
        for(var j = 0; j < self.pmap.w; j++)
        {
          ti = self.pmap.iFor(j,incw(i,self.pmap.h));
          bi = self.pmap.iFor(j,decw(i,self.pmap.h));
          li = self.pmap.iFor(decw(j,self.pmap.w),i);
          ri = self.pmap.iFor(incw(j,self.pmap.w),i);

          if(self.pmap.data[index] > 1) self.pmap.data[index] = 1;
          if(self.pmap.data[index] < 0) self.pmap.data[index] = 0;

          index++;
        }
      }
  */
      self.pmap.anneal(0.2);
    }

    //calculate wind
    if(self.tick_wind_vectors)
    {
      for(var i = 0; i < self.vfield.h; i++)
      {
        for(var j = 0; j < self.vfield.w; j++)
        {
          var lowest_t  = 0; var lowest_p  = 1;
          var highest_t = 0; var highest_p = 0;
          var x = indexToSampleW(j,self.vfield.w);
          var y = indexToSampleW(i,self.vfield.h);
          var d = 0.05;
          var p = 0;
          for(var t = 0; t < Math.PI*2; t += 0.1)
          {
            p = self.pmap.sample(x+Math.cos(t)*d,y+Math.sin(t)*d);
            if(p < lowest_p)  { lowest_t  = t; lowest_p  = p; }
            if(p > highest_p) { highest_t = t; highest_p = p; }
          }

          var index = self.vfield.iFor(j,i);
          theta = self.vfield.dir_map.data[index];

          //rotate slightly ccw
          lowest_t -= 0.4;
          highest_t -= 0.4;

          var t = lerp(lowest_t,highest_t,0.5);
          var lx = Math.cos(lowest_t);
          var ly = Math.sin(lowest_t);
          var x = Math.cos(t);
          var y = Math.sin(t);
          if((-lx)*(y-ly) - (-ly)*(x-lx) > 0) t = (t+Math.PI)%(2*Math.PI);

          self.vfield.dir_map.data[index] = clerp(theta,t,0.1);
          self.vfield.len_map.data[index] = Math.abs(highest_p-lowest_p)*(1-lowest_p)*5;
        }
      }
    }

    //update parts
    var dir;
    var len;
    if(self.tick_air_particles)
    {
      for(var i = 0; i < self.air.n; i++)
      {
        self.air.partts[i] -= 0.01;
        if(self.air.partts[i] <= 0)
        {
          self.air.partts[i] = 1;
          self.air.partxs[i] = Math.random();
          self.air.partys[i] = Math.random();
        }
        else
        {
          dir = self.vfield.dir_map.sample(self.air.partxs[i],self.air.partys[i]);
          len = self.vfield.len_map.sample(self.air.partxs[i],self.air.partys[i]);
          self.air.partxs[i] += Math.cos(dir)*len/100 + ((Math.random()-0.5)/200);
          self.air.partys[i] += Math.sin(dir)*len/100 + ((Math.random()-0.5)/200);
          if(self.air.partxs[i] < 0 || self.air.partxs[i] > 1) self.air.partts[i] = 0;
          if(self.air.partys[i] < 0 || self.air.partys[i] > 1) self.air.partts[i] = 0;
        }
      }
    }

    /*
    // flags
    */
    var x;
    var y;
    for(var i = 0; i < self.flags.length; i++)
    {
      var f = self.flags[i];
      f.t = self.vfield.dir_map.sample(f.x,f.y);
      f.l = self.vfield.len_map.sample(f.x,f.y);
    }

    self.dragger.flush();
    self.presser.flush();
    if(self.lpsys.dragging) self.hpsys.dragging = false;
    self.ticks++;
  };

  self.draw = function()
  {
    var canv = stage.drawCanv;
    canv.context.lineWidth = 0.5;

    var x_space;
    var y_space;
    var x;
    var y;
    var index;
    /*
    // pressure height map
    */
    x_space = canv.canvas.width / self.pmap.w;
    y_space = canv.canvas.height / self.pmap.h;
    if(self.draw_pressure_map)
    {
      for(var i = 0; i < self.pmap.h; i++)
      {
        for(var j = 0; j < self.pmap.w; j++)
        {
          y = y_space*i;
          x = x_space*j;
          index = self.pmap.iFor(j,i);
          var color = Math.round(self.pmap.data[index]*255);
          canv.context.fillStyle = "rgba("+color+","+color+","+color+",1)";
          canv.context.fillRect(x,y,x_space+1,y_space+1);
          //canv.context.strokeStyle = "#ff0000";
          //canv.context.strokeRect(x,y,x_space,y_space);
        }
      }
    }

    /*
    // air
    */
    if(self.draw_air_particles)
    {
      canv.context.fillStyle = "#8888FF";
      for(var i = 0; i < self.air.n; i++)
        canv.context.fillRect(self.air.partxs[i]*canv.canvas.width-1,self.air.partys[i]*canv.canvas.height-1,2,2);
    }

    var tl;
    var tr;
    var bl;
    var br;
    /*
    // contour lines
    */
    canv.context.strokeStyle = "#000000";
    if(self.draw_pressure_contour)
    {
      for(var l = 0; l < 1; l+=0.1)
      {
        for(var i = 0; i < self.pmap.h; i++)
        {
          for(var j = 0; j < self.pmap.w; j++)
          {
            y = y_space*i;
            x = x_space*j;
            tl = self.pmap.data[self.pmap.iFor(j  ,i  )] < l;
            tr = self.pmap.data[self.pmap.iFor(j+1,i  )] < l;
            bl = self.pmap.data[self.pmap.iFor(j  ,i+1)] < l;
            br = self.pmap.data[self.pmap.iFor(j+1,i+1)] < l;
            self.squareMarch(tl,tr,bl,br,x+x_space/2,y+y_space/2,x_space,y_space,canv);
          }
        }
      }
    }

    /*
    // vectors
    */
    if(self.draw_wind_vectors)
    {
      canv.context.fillStyle = "#555599";
      canv.context.strokeStyle = "#0000FF";
      x_space = canv.canvas.width / self.vfield.w;
      y_space = canv.canvas.height / self.vfield.h;
      for(var i = 0; i < self.vfield.h; i++)
      {
        for(var j = 0; j < self.vfield.w; j++)
        {
          y = y_space*i+(y_space/2);
          x = x_space*j+(x_space/2);
          index = self.vfield.iFor(j,i);
          canv.context.fillRect(x-1,y-1,2,2);
          canv.drawLine(x,y,x+Math.cos(self.vfield.dir_map.data[index])*self.vfield.len_map.data[index]*10,y+Math.sin(self.vfield.dir_map.data[index])*self.vfield.len_map.data[index]*10);
        }
      }
    }

    /*
    // pressure systems
    */
    if(self.draw_pressure_systems)
    {
      self.hpsys.draw(canv);
      self.lpsys.draw(canv);
    }

    /*
    // flags
    */
    var x;
    var y;
    canv.context.lineWidth = 3;
    for(var i = 0; i < self.flags.length; i++)
    {
      var f = self.flags[i];
      x = f.x * canv.canvas.width;
      y = f.y * canv.canvas.height;

      canv.context.strokeStyle= f.color;
      var len = f.l*10;
      if(len < 10) len = 10;
      canv.drawLine(x,y,x+Math.cos(f.t)*len,y+Math.sin(f.t)*len);
      canv.context.fillRect(x-3,y-3,6,6);
    }

    canv.context.lineWidth = 1;
    self.draw_pressure_map_t.draw(canv);
    self.draw_pressure_contour_t.draw(canv);
    self.draw_wind_vectors_t.draw(canv);
    self.draw_pressure_systems_t.draw(canv);
    self.draw_air_particles_t.draw(canv);

    self.tick_pressure_map_t.draw(canv);
    self.tick_pressure_contour_t.draw(canv);
    self.tick_wind_vectors_t.draw(canv);
    self.tick_pressure_systems_t.draw(canv);
    self.tick_air_particles_t.draw(canv);

    canv.context.font = "12px arial";
    canv.context.fillStyle = "#000000";
    canv.context.fillText("pressure map",      69, 29);
    canv.context.fillText("pressure contours", 69, 59);
    canv.context.fillText("wind vectors",      69, 89);
    canv.context.fillText("pressure systems",  69,119);
    canv.context.fillText("air particles",     69,149);
    canv.context.fillText("pressure map",      71, 29);
    canv.context.fillText("pressure contours", 71, 59);
    canv.context.fillText("wind vectors",      71, 89);
    canv.context.fillText("pressure systems",  71,119);
    canv.context.fillText("air particles",     71,149);
    canv.context.fillText("pressure map",      71, 31);
    canv.context.fillText("pressure contours", 71, 61);
    canv.context.fillText("wind vectors",      71, 91);
    canv.context.fillText("pressure systems",  71,121);
    canv.context.fillText("air particles",     71,151);
    canv.context.fillText("pressure map",      69, 31);
    canv.context.fillText("pressure contours", 69, 61);
    canv.context.fillText("wind vectors",      69, 91);
    canv.context.fillText("pressure systems",  69,121);
    canv.context.fillText("air particles",     69,151);
    canv.context.font = "12px arial";
    canv.context.fillStyle = "#FFFFFF";
    canv.context.fillText("pressure map",      70, 30);
    canv.context.fillText("pressure contours", 70, 60);
    canv.context.fillText("wind vectors",      70, 90);
    canv.context.fillText("pressure systems",  70,120);
    canv.context.fillText("air particles",     70,150);
  };

  self.cleanup = function()
  {
  };

  //holy ugly
  self.squareMarch = function(tl,tr,bl,br,x,y,w,h,canv)
  {
    if(tl) //reverse all, cuts if's in half
    {
      if(!tr && !bl && br) //only non-reversable case
      {
        canv.drawLine(x,y+h/2,x+w/2,y); //1001
        canv.drawLine(x+w/2,y+h,x+w,y+h/2);
        return;
      }
      tl = !tl;
      tr = !tr;
      bl = !bl;
      br = !br;
    }

    if(!tr)
    {
      if(!bl)
      {
        if(!br) {} //0000
        else canv.drawLine(x+w/2,y+h,x+w,y+h/2); //0001
      }
      else
      {
        if(!br) canv.drawLine(x,y+h/2,x+w/2,y+h); //0010
        else    canv.drawLine(x,y+h/2,x+w,y+h/2); //0011
      }
    }
    else
    {
      if(!bl)
      {
        if(!br) canv.drawLine(x+w/2,y,x+w,y+h/2); //0100
        else canv.drawLine(x+w/2,y,x+w/2,y+h); //0101
      }
      else
      {
        if(!br)
        {
          canv.drawLine(x+w/2,y,x+w,y+h/2); //0110
          canv.drawLine(x,y+h/2,x+w/2,y+h);
        }
        else canv.drawLine(x,y+h/2,x+w/2,y); //0111
      }
    }

  }

};

