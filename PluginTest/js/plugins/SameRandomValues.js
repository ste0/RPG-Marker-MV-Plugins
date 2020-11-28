//=============================================================================
// SameRandomValues.js
//=============================================================================
// Copyright (c) 2020 jp_asty
// This software is released under the MIT License, see LICENSE.
//=============================================================================

/*:
 * @plugindesc セーブからやり直しても同じ乱数を返すようになります。
 * @author jp_asty
 *
 * @help
 * 「変数の操作」の「乱数」で取得する値が再現性のある値になります。
 *
 * 利用規約
 * This plugin is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 */
(function() {

  'use strict';
  let randGenerater = null;

  class Random {
    constructor(seed = Date.now()) {
      this.x = 123456789;
      this.y = 362436069;
      this.z = 521288629;
      this.w = seed;
    }
    next() {
      const t = this.x ^ (this.x << 11);
      this.x = this.y;
      this.y = this.z;
      this.z = this.w;
      return this.w = (this.w ^ (this.w >>> 19)) ^ (t ^ (t >>> 8));
    }
    nextInt(min, max) {
      const r = Math.abs(this.next());
      return min + (r % (max + 1 - min));
    }
  }
  window[Random.name] = Random;//グローバルにコピーしてJsonEx._decodeから見えるようにする。

  //-----------------------------------------------------------------------------
  // DataManager
  //
  const _DataManager_createGameObjects = DataManager.createGameObjects;
  DataManager.createGameObjects = function() {
    _DataManager_createGameObjects.call(this);
    randGenerater = new Random();
  };

  const _DataManager_makeSaveContents = DataManager.makeSaveContents;
  DataManager.makeSaveContents = function() {
    const contents = _DataManager_makeSaveContents.call(this);
    contents.randGenerater = randGenerater;
    return contents;
  };

  const _DataManager_extractSaveContents = DataManager.extractSaveContents;
  DataManager.extractSaveContents = function(contents) {
    _DataManager_extractSaveContents.call(this, contents);
    randGenerater = contents.randGenerater;
  };

  //-----------------------------------------------------------------------------
  // Game_Interpreter
  //
  const _Game_Interpreter_command122 = Game_Interpreter.prototype.command122;
  Game_Interpreter.prototype.command122 = function() {// Control Variables
    const [startVarId, endVarId, operate, operand, min, max] = this._params;
    if(operand === 2) {//Random
      for(let i=startVarId; i<=endVarId; i++) {
        const value = randGenerater.nextInt(min, max);
        this.operateVariable(i, operate, value);
      }
      return true;
    } else {
      return _Game_Interpreter_command122.call(this);
    }
  };

})();
