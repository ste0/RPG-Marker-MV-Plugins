//==============================================================================
// ShakeScreenEx.js
//==============================================================================
// Copyright (c) 2020 jp_asty
// This software is released under the MIT License, see LICENSE.
//==============================================================================

/*:
 * @plugindesc 手ブレのようなゆらゆらとした画面揺れの機能を追加します。
 * @author jp_asty
 *
 * @help
 * v1.2.0 2020/05/27 遠景画像にシェイク効果が適用されないように変更。
 *
 * ○振動の開始
 * START_SHAKE_SCREEN_EX width height strong
 * width : 横方向の揺れ幅 0～100の数値を指定します。(0のとき横揺れがなくなります)
 * height : 縦方向の揺れ幅 0～100の数値を指定します。(0のとき縦揺れがなくなります)
 * strong : 揺れの強さ 1～10の数値を指定します。値が大きい程、揺れが強くなります。
 * 例）横方向揺れ幅50、縦方向揺れ幅50、強さ6で振動を開始
 * START_SHAKE_SCREEN_EX 50 50 6
 *
 * ○振動の停止
 * STOP_SHAKE_SCREEN_EX
 *
 * ・振動を開始すると停止するまで揺れ続けます。
 * ・振動の停止は指定した瞬間に停止するわけではなく徐々に揺れが小さくなり
 *   十分に揺れが小さくなったタイミングで停止扱いになります。
 * ・画面外のタイルの描画数は通常2マス分ですが、振動を開始すると6マス分描画するようになります。
 *   振動を停止すると2マス分の描画に戻ります。
 *
 * 利用規約 ---------------------------------------------------------------------
 * This plugin is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 *
 * parin.js部分はパプリックドメイン。
 * https://github.com/josephg/noisejs#readme
 * -----------------------------------------------------------------------------
 */

(function() {
  'use strict';

  //parin.js --------------------------------------------------------------------
  /*
   * A speed-improved perlin and simplex noise algorithms for 2D.
   *
   * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
   * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
   * Better rank ordering method by Stefan Gustavson in 2012.
   * Converted to Javascript by Joseph Gentle.
   *
   * Version 2012-03-09
   *
   * This code was placed in the public domain by its original author,
   * Stefan Gustavson. You may use it as you see fit, but
   * attribution is appreciated.
   *
   */
  var module = global.noise = {};

  function Grad(x, y, z) {
    this.x = x; this.y = y; this.z = z;
  }

  Grad.prototype.dot2 = function(x, y) {
    return this.x*x + this.y*y;
  };

  Grad.prototype.dot3 = function(x, y, z) {
    return this.x*x + this.y*y + this.z*z;
  };

  var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
               new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
               new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];

  var p = [151,160,137,91,90,15,
  131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
  223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
  129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
  251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
  49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  // To remove the need for index wrapping, double the permutation table length
  var perm = new Array(512);
  var gradP = new Array(512);

  // This isn't a very good seeding function, but it works ok. It supports 2^16
  // different seed values. Write something better if you need more seeds.
  module.seed = function(seed) {
    if(seed > 0 && seed < 1) {
      // Scale the seed out
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if(seed < 256) { seed |= seed << 8; }

    for(var i = 0; i < 256; i++) {
      var v;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      } else {
        v = p[i] ^ ((seed>>8) & 255);
      }

      perm[i] = perm[i + 256] = v;
      gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
  };

  module.seed(0);

  // Skewing and unskewing factors for 2, 3, and 4 dimensions
  var F2 = 0.5*(Math.sqrt(3)-1);
  var G2 = (3-Math.sqrt(3))/6;

  // 2D simplex noise
  module.simplex2 = function(xin, yin) {
    var n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin)*F2; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var t = (i+j)*G2;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1=1; j1=0;
    } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1=0; j1=1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    var y2 = y0 - 1 + 2 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;
    var gi0 = gradP[i+perm[j]];
    var gi1 = gradP[i+i1+perm[j+j1]];
    var gi2 = gradP[i+1+perm[j+1]];
    // Calculate the contribution from the three corners
    var t0 = 0.5 - x0*x0-y0*y0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.5 - x1*x1-y1*y1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    var t2 = 0.5 - x2*x2-y2*y2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
  };
  //end of parin.js -------------------------------------------------------------

  const fileName = 'ShakeScreenEx';
  const inParams = PluginManager.parameters(fileName);

  //-----------------------------------------------------------------------------
  // Game_Screen
  //
  Game_Screen.prototype.isValidShakeEx = function() {
    return this._shakeExParams && this._shakeExParams.active;
  };

  Game_Screen.prototype.startShakeEx = function(width, height, strong) {
    if(this.isValidShakeEx()) return;
    this._shakeExParams = {
      active:true,
      requestStop:false,
      w:width,
      h:height,
      strong:strong,
      wr:0,
      hr:0,
      dx:0,
      dy:0
    };
    module.seed(Math.random());
    this.updateTilemapMargin(100);
  };

  Game_Screen.prototype.stopShakeEx = function() {
    if(this.isValidShakeEx()) {
      this._shakeExParams.requestStop = true;
    }
  };

  Game_Screen.prototype.updateTilemapMargin = function(margin) {
    SceneManager._scene._spriteset._tilemap._margin = margin;
    SceneManager._scene._spriteset._tilemap._width = Graphics.width + margin * 2;
    SceneManager._scene._spriteset._tilemap._height = Graphics.height + margin * 2;
  };

  const _Game_Screen_update = Game_Screen.prototype.update;
  Game_Screen.prototype.update = function() {
    _Game_Screen_update.call(this);
    this.updateShakeEx();
  };

  Game_Screen.prototype.updateShakeEx = function() {
    if(this.isValidShakeEx()) {
      const value = Date.now() / (10000 - (this._shakeExParams.strong-1) * 1000);
      this._shakeExParams.dx = Math.round(module.simplex2( 1, value) * this._shakeExParams.wr);
      this._shakeExParams.dy = Math.round(module.simplex2(-1, value) * this._shakeExParams.hr);

      if(this._shakeExParams.requestStop) {
        this._shakeExParams.wr = Math.max(this._shakeExParams.w/20, --this._shakeExParams.wr);
        this._shakeExParams.hr = Math.max(this._shakeExParams.h/20, --this._shakeExParams.hr);
        if(this._shakeExParams.wr <= this._shakeExParams.w/20 && this._shakeExParams.hr <= this._shakeExParams.h/20) {
          this._shakeExParams.active = false;
          this._shakeExParams.dx = 0;
          this._shakeExParams.dy = 0;
          this.updateTilemapMargin(20);
        }
      } else {
        this._shakeExParams.wr = Math.min(this._shakeExParams.w, ++this._shakeExParams.wr);
        this._shakeExParams.hr = Math.min(this._shakeExParams.h, ++this._shakeExParams.hr);
      }
    }
  };

  //-----------------------------------------------------------------------------
  // Game_Interpreter
  //
  const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);
    const COM = command.toUpperCase();
    if(COM == "START_SHAKE_SCREEN_EX") {
      let width = Number(args[0]);
      let height = Number(args[1]);
      let strong = Number(args[2]);
      if(width < 0 || width > 100) throw new Error(fileName+": widthは0～100の数値を指定して下さい。");
      if(height < 0 || height > 100) throw new Error(fileName+": heightは0～100の数値を指定して下さい。");
      if(strong < 1 || strong > 10) throw new Error(fileName+": strongは1～10の数値を指定して下さい。");
      $gameScreen.startShakeEx(width, height, strong);

    } else if(COM == "STOP_SHAKE_SCREEN_EX") {
      $gameScreen.stopShakeEx();
    }
  };

  //-----------------------------------------------------------------------------
  // Spriteset_Base
  //
  const _Spriteset_Base_updatePosition = Spriteset_Base.prototype.updatePosition;
  Spriteset_Base.prototype.updatePosition = function() {
    _Spriteset_Base_updatePosition.call(this);
    this._parallax.x = 0;
    this._parallax.y = 0;
    if($gameScreen.shake() != 0) {
      this._parallax.x = -Math.round($gameScreen.shake());
    }
    if($gameScreen.isValidShakeEx()) {
      this.x += $gameScreen._shakeExParams.dx;
      this.y += $gameScreen._shakeExParams.dy;
      this._parallax.x -= $gameScreen._shakeExParams.dx;
      this._parallax.y -= $gameScreen._shakeExParams.dy;
    }
  };

})();
