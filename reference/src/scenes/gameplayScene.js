var GamePlayScene = function(game, stage)
{
  var self = this;

  self.dragger;
  self.hoverer;
  self.presser;
  self.keyer;
  self.blurer;

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
    for(var i = 0; i < w*h; i++) self.buffs[0][i] = self.buffs[1][i] = 0.5+Math.random()*0.5;
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
          self.buffs[newb][index] += self.buffs[oldb][self.iFor(decw(x,w),y)];
          self.buffs[newb][index] += self.buffs[oldb][self.iFor(incw(x,w),y)];
          self.buffs[newb][index] += self.buffs[oldb][self.iFor(x,decw(y,h))];
          self.buffs[newb][index] += self.buffs[oldb][self.iFor(x,incw(y,h))];
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
          self.data[index] = hmap.sample(indexToSampleW(x,self.w),indexToSampleW(y,self.h));
        }
      }
    }
  }
  var VecField2d = function(w,h)
  {
    var self = this;
    self.w = w;
    self.h = h;
    self.x_map = new HeightMap(w,h);
    self.y_map = new HeightMap(w,h);

    self.sample = function(x,y)
    {
      return {x:self.x_map.sample(x,y),y:self.y_map.sample(x,y)};
    }
    self.samplePolar = function(x,y)
    {
      var x_val = self.x_map.sample(x,y);
      var y_val = self.y_map.sample(x,y);

      var ret = {dir:0,len:0};
      ret.len = Math.sqrt(x_val*x_val+y_val*y_val);
      x_val /= ret.len;
      y_val /= ret.len;
      if(ret.len < 0.001) ret.dir = 0;
      else ret.dir = Math.atan2(y_val,x_val);

      return ret;
    }
    self.polarAtIndex = function(i)
    {
      var x_val = self.x_map.data[i];
      var y_val = self.y_map.data[i];

      var ret = {dir:0,len:0};
      ret.len = Math.sqrt(x_val*x_val+y_val*y_val);
      x_val /= ret.len;
      y_val /= ret.len;
      if(ret.len < 0.001) ret.dir = 0;
      else ret.dir = Math.atan2(y_val,x_val);

      return ret;
    }

    self.iFor = self.x_map.iFor;
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
    self.sx = x;
    self.sy = y;
    self.r = r;
    self.w = 20;
    self.h = 20;
    self.x = self.sx*stage.dispCanv.canvas.width-(self.w/2);
    self.y = self.sy*stage.dispCanv.canvas.height-(self.h/2);
    self.dragging = false;
    self.hovering = false;

    self.hover = function()
    {
      self.hovering = true;
    }
    self.unhover = function()
    {
      self.hovering = false;
    }
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
  var PressureSystem = function(x,y,r,delta,label,color_in,color_out,pmap,killCallback)
  {
    var self = new MapDragger(x,y,r,pmap);
    self.delta = delta;

    self.draw = function(canv)
    {
      stage.drawCanv.context.font = "30px arial";
      canv.outlineText(label,self.x+self.w/2-10,self.y+self.h/2+10,color_in,color_out);

      if(self.hovering || self.dragging)
      {
        canv.context.lineWidth = 3;
        canv.context.strokeStyle = color_in;
        canv.context.strokeRect(self.x-5,self.y-5,self.w+10,self.h+10);
      }
    }
    self.dragFinish = function(evt)
    {
      self.dragging = false;
      if(self.sx < 0.1 && self.sy > 0.9) killCallback();
    }
    return self;
  }

  var PressureCooker = function()
  {
    var self = this;

    self.cook = function(type,strength,radius,map,sys,drag,hover)
    {
      if(type)     self.delta = 0.005; else self.delta = -0.005;
      if(strength) self.delta *= 5;
      if(radius)   self.r = 0.2;       else self.r = 0.1;

      if(self.r < 0) self.r *= -1;
      var color_in  = self.delta > 0 ? "#000000" : "#FFFFFF";
      var color_out = self.delta > 0 ? "#FFFFFF" : "#000000";
      var label = self.delta > 0 ? "H" : "L";
      var p = new PressureSystem(.5, .5, self.r, self.delta, label, color_in, color_out, map,
        function()
        {
          drag.unregister(p);
          hover.unregister(p);
          sys[p.index] = sys[sys.length-1];
          sys[p.index].index = p.index;
          sys.pop();
        }
      );
      p.index = sys.length;
      sys[sys.length] = p;
      drag.register(p);
      hover.register(p);
    }
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
    self.goal_ticks = 0;
  }

  self.pmap;
  self.vfield;
  self.air;

  self.psys = [];
  self.levels = [];
  self.known_level;
  self.ticks_on_level;
  self.current_level;

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
    self.hoverer = new Hoverer({source:stage.dispCanv.canvas});
    self.presser = new Presser({source:stage.dispCanv.canvas});
    self.keyer = new Keyer({source:stage.dispCanv.canvas});
    self.blurer = new Blurer({source:stage.dispCanv.canvas});

    self.draw_pressure_map     = true; self.draw_pressure_map_t     = new ToggleBox(10, 25,20,20,1,function(o){ self.draw_pressure_map = o; });
    self.draw_pressure_contour = true; self.draw_pressure_contour_t = new ToggleBox(10, 55,20,20,1,function(o){ self.draw_pressure_contour = o; });
    self.draw_wind_vectors     = true; self.draw_wind_vectors_t     = new ToggleBox(10, 85,20,20,1,function(o){ self.draw_wind_vectors = o; });
    self.draw_pressure_systems = true; self.draw_pressure_systems_t = new ToggleBox(10,115,20,20,1,function(o){ self.draw_pressure_systems = o; });
    self.draw_air_particles    = true; self.draw_air_particles_t    = new ToggleBox(10,145,20,20,1,function(o){ self.draw_air_particles = o; });
    self.presser.register(self.draw_pressure_map_t);
    self.presser.register(self.draw_pressure_contour_t);
    self.presser.register(self.draw_wind_vectors_t);
    self.presser.register(self.draw_pressure_systems_t);
    self.presser.register(self.draw_air_particles_t);

    self.tick_pressure_map     = true; self.tick_pressure_map_t     = new ToggleBox(40, 25,20,20,1,function(o){ self.tick_pressure_map = o; });
    self.tick_pressure_contour = true; self.tick_pressure_contour_t = new ToggleBox(40, 55,20,20,1,function(o){ self.tick_pressure_contour = o; });
    self.tick_wind_vectors     = true; self.tick_wind_vectors_t     = new ToggleBox(40, 85,20,20,1,function(o){ self.tick_wind_vectors = o; });
    self.tick_pressure_systems = true; self.tick_pressure_systems_t = new ToggleBox(40,115,20,20,1,function(o){ self.tick_pressure_systems = o; });
    self.tick_air_particles    = true; self.tick_air_particles_t    = new ToggleBox(40,145,20,20,1,function(o){ self.tick_air_particles = o; });
    self.presser.register(self.tick_pressure_map_t);
    self.presser.register(self.tick_pressure_contour_t);
    self.presser.register(self.tick_wind_vectors_t);
    self.presser.register(self.tick_pressure_systems_t);
    self.presser.register(self.tick_air_particles_t);

    self.p_type = 0;
    self.p_type_b_t = new ToggleBox(10,200,20,20,1, function(o) { self.p_type = !o; self.p_type_s_t.on = self.p_type; });
    self.p_type_b_t.on = !self.p_type;
    self.p_type_s_t = new ToggleBox(40,200,20,20,1, function(o) { self.p_type = o; self.p_type_b_t.on = !self.p_type; });
    self.p_type_s_t.on = self.p_type;
    self.presser.register(self.p_type_b_t)
    self.presser.register(self.p_type_s_t)

    self.p_delta = 0;
    self.p_delta_b_t = new ToggleBox(10,230,20,20,1, function(o) { self.p_delta = !o; self.p_delta_s_t.on = self.p_delta; });
    self.p_delta_b_t.on = !self.p_delta;
    self.p_delta_s_t = new ToggleBox(40,230,20,20,1, function(o) { self.p_delta = o; self.p_delta_b_t.on = !self.p_delta; });
    self.p_delta_s_t.on = self.p_delta;
    self.presser.register(self.p_delta_b_t)
    self.presser.register(self.p_delta_s_t)

    self.p_r = 0;
    self.p_r_b_t = new ToggleBox(10,260,20,20,1, function(o) { self.p_r = !o; self.p_r_s_t.on = self.p_r; });
    self.p_r_b_t.on = !self.p_r;
    self.p_r_s_t = new ToggleBox(40,260,20,20,1, function(o) { self.p_r = o; self.p_r_b_t.on = !self.p_r; });
    self.p_r_s_t.on = self.p_r;
    self.presser.register(self.p_r_b_t)
    self.presser.register(self.p_r_s_t)

    self.p_cook_b = new ButtonBox(10,290,20,20,function() { self.pcooker.cook(self.p_type, self.p_delta, self.p_r, self.pmap, self.psys, self.dragger, self.hoverer); });
    self.presser.register(self.p_cook_b);

    self.p_begin_b = new ButtonBox(stage.drawCanv.canvas.width-30,stage.drawCanv.canvas.height-30,20,20, function() { if(self.current_level == 0) self.current_level++; });
    self.presser.register(self.p_begin_b);

    self.pcooker = new PressureCooker();
    self.pcooker.cook(self.p_type, self.p_delta, self.p_r, self.pmap, self.psys, self.dragger, self.hoverer);

    self.pmap = new HeightMap(cells_w,cells_h);
    self.vfield = new VecField2d(25,25);
    self.air = new Air(5000);

    var colors = [];
    var i = 0;
    //colors[i] = "#0000FF"; i++; //blue too similar to vectors/particles
    //colors[i] = "#00FF00"; i++; //green too similar to goal state
    colors[i] = "#00FFFF"; i++;
    colors[i] = "#FF0000"; i++;
    colors[i] = "#FF00FF"; i++;
    colors[i] = "#FFFF00"; i++;
    colors[i] = "#FFFFFF"; i++;
    //for(var i = 0; i < 3; i++)
      //self.flags[i] = new Flag(0.2+(Math.random()*0.6),0.2+(Math.random()*0.6),Math.random()*2*Math.PI,1+Math.random(),colors[i%colors.length]);

    self.known_level = 0;
    self.ticks_on_level = 0;
    self.current_level = 0;
    var level = 0;
    self.levels[level] = []; //level 0 is nothing
    level++;
    self.levels[level] = [];
    self.levels[level].push(new Flag(0.7,0.5,3*Math.PI/2,1.5,colors[self.levels[level].length%colors.length]));
    level++;
    self.levels[level] = [];
    self.levels[level].push(new Flag(0.5,0.5,0,2,colors[self.levels[level].length%colors.length]));
    level++;
    self.levels[level] = [];
    self.levels[level].push(new Flag(0.4,0.5,Math.PI/2,2,colors[self.levels[level].length%colors.length]));
    self.levels[level].push(new Flag(0.6,0.5,3*Math.PI/2,2,colors[self.levels[level].length%colors.length]));
    level++;
    self.levels[level] = [];
    self.levels[level].push(new Flag(0.5,0.4,0,2,colors[self.levels[level].length%colors.length]));
    self.levels[level].push(new Flag(0.5,0.6,Math.PI,2,colors[self.levels[level].length%colors.length]));
    /*
    //copy and paste to add new level
    level++;
    self.levels[level] = [];
    self.levels[level].push(new Flag(0.2,0.5,Math.PI/2,2,colors[self.levels[level].length%colors.length]));
    self.levels[level].push(new Flag(0.8,0.5,3*Math.PI/2,2,colors[self.levels[level].length%colors.length]));
    */

    self.pmap.anneal(1);
    self.pmap.anneal(1);
    self.pmap.anneal(1);
    self.pmap.anneal(1);
  };

  self.ticks = 0;
  self.tick = function()
  {
    if(self.current_level != self.known_level)
    {
      self.known_level = self.current_level;
      self.ticks_on_level = 0;
    }

    var index;
    var ti;
    var bi;
    var li;
    var ri;

    //Emit Pressure
    if(self.tick_pressure_systems)
    {
      index = 0;
      for(var i = 0; i < self.pmap.h; i++)
      {
        for(var j = 0; j < self.pmap.w; j++)
        {
          for(var k = 0; k < self.psys.length; k++)
          {
            var xd = (j/self.pmap.w)-self.psys[k].sx;
            var yd = (i/self.pmap.h)-self.psys[k].sy;
            var d = (xd*xd + yd*yd) / (self.psys[k].r*self.psys[k].r);
            if(d < 1) self.pmap.data[index] += (1-(d*d*d*d))*self.psys[k].delta;
          }

          if(self.pmap.data[index] > 1) self.pmap.data[index] = 1;
          if(self.pmap.data[index] < 0) self.pmap.data[index] = 0;

          index++;
        }
      }
    }

    if(self.tick_pressure_map)
      self.pmap.anneal(0.2);

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

          theta = self.vfield.polarAtIndex(index).dir;

          //rotate slightly ccw
          lowest_t -= 0.4;
          highest_t -= 0.4;

          var t = lerp(lowest_t,highest_t,0.5);
          var lx = Math.cos(lowest_t);
          var ly = Math.sin(lowest_t);
          var x = Math.cos(t);
          var y = Math.sin(t);
          if((-lx)*(y-ly) - (-ly)*(x-lx) > 0) t = (t+Math.PI)%(2*Math.PI);

          var new_t = clerp(theta,t,0.1);
          var new_l = Math.abs(highest_p-lowest_p)*(1-lowest_p)*5;

          self.vfield.x_map.data[index] = Math.cos(new_t)*new_l;
          self.vfield.y_map.data[index] = Math.sin(new_t)*new_l;
        }
      }
    }

    //update particles
    var x;
    var y;
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
          x = self.vfield.x_map.sample(self.air.partxs[i],self.air.partys[i]);
          y = self.vfield.y_map.sample(self.air.partxs[i],self.air.partys[i]);
          self.air.partxs[i] += x/100 + ((Math.random()-0.5)/200);
          self.air.partys[i] += y/100 + ((Math.random()-0.5)/200);
          if(self.air.partxs[i] < 0 || self.air.partxs[i] > 1) self.air.partts[i] = 0;
          if(self.air.partys[i] < 0 || self.air.partys[i] > 1) self.air.partts[i] = 0;
        }
      }
    }

    /*
    // flags
    */
    var polar;
    for(var i = 0; i < self.levels[self.current_level].length; i++)
    {
      var f = self.levels[self.current_level][i];
      polar = self.vfield.samplePolar(f.x,f.y);

      f.t = polar.dir;
      f.l = polar.len;
      console.log(f.t+","+f.l);
    }

    self.dragger.flush();
    var any_dragging = false;
    for(var i = 0; i < self.psys.length; i++)
    {
      if(any_dragging) self.psys[i].dragging = false;
      if(self.psys[i].dragging) any_dragging = true;
    }
    self.hoverer.flush();
    self.presser.flush();
    self.keyer.flush();
    self.blurer.flush();

    self.ticks++;
    self.ticks_on_level++;
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
          canv.drawLine(x,y,x+self.vfield.x_map.data[index]*10,y+self.vfield.y_map.data[index]*10);
        }
      }
    }

    /*
    // pressure systems
    */
    if(self.draw_pressure_systems)
    {
      for(var i = 0; i < self.psys.length; i++)
        self.psys[i].draw(canv);
    }

    /*
    // flags
    */
    if(self.current_level > 0)
    {
      var x;
      var y;
      var goal_marker_y = 10;
      var goal_met;
      var needed_goal_ticks = 40;
      var most_ticks_needed = 0;
      canv.context.lineWidth = 3;
      for(var i = 0; i < self.levels[self.current_level].length; i++)
      {
        var f = self.levels[self.current_level][i];
        goal_met = (f.l >= f.goal_l && cdist(f.t,f.goal_t) < 0.4);
        if(goal_met) f.goal_ticks++;
        else         f.goal_ticks = 0;
        if(needed_goal_ticks - f.goal_ticks > most_ticks_needed) most_ticks_needed = needed_goal_ticks-f.goal_ticks;

        x = f.x * canv.canvas.width;
        y = f.y * canv.canvas.height;

        //goal state
        if(self.ticks%10 < 5)
        {
          canv.context.strokeStyle = "#22FF55";
          var len = f.goal_l*20;
          canv.drawLine(x,y,x+Math.cos(f.goal_t)*len,y+Math.sin(f.goal_t)*len);
          canv.context.fillRect(x-3,y-3,6,6);
        }

        //current state
        if(goal_met) canv.context.strokeStyle = "#22FF55";
        else         canv.context.strokeStyle = f.color;
        var len = f.l*20;
        if(len < 20) len = 20;
        canv.drawLine(x,y,x+Math.cos(f.t)*len,y+Math.sin(f.t)*len);
        canv.context.fillRect(x-3,y-3,6,6);

        //goal marker
        if(goal_met) canv.context.strokeStyle = "#22FF55";
        else         canv.context.strokeStyle = "#000000";
        canv.context.fillStyle = f.color;
        canv.context.fillRect(canv.canvas.width-30,goal_marker_y,20,20);
        canv.context.strokeRect(canv.canvas.width-30,goal_marker_y,20,20);
        goal_marker_y += 30;

      }
      stage.drawCanv.context.font = "15px arial";
      if(most_ticks_needed < needed_goal_ticks) canv.outlineText(Math.ceil(3*(most_ticks_needed/needed_goal_ticks))+"...",canv.canvas.width-55,goal_marker_y-15);
      if(most_ticks_needed <= 0) { self.current_level = (self.current_level+1)%self.levels.length; console.log(self.current_level); }
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

    stage.drawCanv.context.font = "15px arial";
    //self.p_r_nb.draw(canv);
    //self.p_delta_nb.draw(canv);
    self.p_r_b_t.draw(canv);
    self.p_r_s_t.draw(canv);
    self.p_delta_b_t.draw(canv);
    self.p_delta_s_t.draw(canv);
    self.p_type_b_t.draw(canv);
    self.p_type_s_t.draw(canv);
    self.p_cook_b.draw(canv);

    canv.context.font = "12px arial";
    canv.outlineText("draw",               8, 20);
    canv.outlineText("sim",               42, 20);
    canv.outlineText("pressure map",      70, 45);
    canv.outlineText("pressure contours", 70, 75);
    canv.outlineText("wind vectors",      70,105);
    canv.outlineText("pressure systems",  70,135);
    canv.outlineText("air particles",     70,165);

    canv.outlineText("pressure system", 10,190);
    canv.outlineText("type",            70,220);
    canv.outlineText("strength",        70,250);
    canv.outlineText("radius",          70,280);
    canv.outlineText("create new (drag to destroy)", 70,310);
    canv.context.strokeRect(40,290,20,20);

    if(self.current_level == 0)
    {
      canv.context.font = "16px arial";
      canv.outlineText("Blow the colored flags in the indicated speed+direction", canv.canvas.width-398, canv.canvas.height-40);
      canv.outlineText("Begin", canv.canvas.width-80, canv.canvas.height-15);
      self.p_begin_b.draw(canv);
    }
    else
    {
      canv.context.font = "12px arial";
      canv.outlineText("Blow the colored flags in the indicated speed+direction", canv.canvas.width-300, canv.canvas.height-10);
    }

    canv.context.font = "12px arial";
    canv.outlineText("L", 16,215);
    canv.outlineText("H", 46,215);
    canv.outlineText("weak",    5,245);
    canv.outlineText("strong", 33,245);
    canv.outlineText("small",  5,275);
    canv.outlineText("big",   42,275);
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

