//=============================================================================
// ControlMovableRegion.js
//=============================================================================
// Copyright (c) 2020 jp_asty
// This software is released under the MIT License, see LICENSE.
//=============================================================================

/*:
 * @plugindesc ある領域を移動不可にする機能を追加します。
 * @author jp_asty
 *
 * @param useRegionIds
 * @text リージョン番号
 * @type number[]
 * @min 1
 * @max 255
 * @default []
 * @desc ゲーム起動時に移動を制限したいリージョン番号のみを指定します。追加と削除はプラグインコマンドで行います。
 *
 * @help
 * プラグインコマンド
 * CMR ADD n #n番のリージョンを移動不可にします。
 * CMR DEL n #n番のリージョンを移動可能にします。
 * n:リージョン番号(1～255)
 *
 * 利用規約
 * This plugin is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 */
(function() {

  'use strict';
  const pluginName = document.currentScript.src.split("/").pop().replace(/.js$/, "");
  const inParams = PluginManager.parameters(pluginName);
  const useRegionIds = JSON.parse(inParams["useRegionIds"]).map(Number);

  //-----------------------------------------------------------------------------
  // Game_System
  //
  const _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    this._imMovableRegionIds = Array.from(new Set(useRegionIds));
  };

  Game_System.prototype.addImMovableRegionId = function(id) {
    if(!this._imMovableRegionIds.contains(id)) {
      this._imMovableRegionIds.push(id);
    }
  };

  Game_System.prototype.delImMovableRegionId = function(id) {
    const index = this._imMovableRegionIds.indexOf(id);
    if(index >= 0) {
      this._imMovableRegionIds.splice(index, 1);
    }
  };

  Game_System.prototype.imMovableRegionId = function(id) {
    return this._imMovableRegionIds.contains(id);
  };

  //-----------------------------------------------------------------------------
  // Game_CharacterBase
  //
  const _Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
  Game_CharacterBase.prototype.canPass = function(x, y, d) {
    const x2 = $gameMap.roundXWithDirection(x, d);
    const y2 = $gameMap.roundYWithDirection(y, d);
    const id = $gameMap.regionId(x2, y2);
    if($gameSystem.imMovableRegionId(id)) {
      return false;
    }
    return _Game_CharacterBase_canPass.call(this, x, y, d);
  };

  //-----------------------------------------------------------------------------
  // Game_Interpreter
  //
  const _Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
  Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _Game_Interpreter_pluginCommand.call(this, command, args);

    const upCommand = command ? command.toUpperCase() : undefined;
    const upOrder = args[0] ? args[0].toUpperCase() : undefined;
    const numId = args[1] ? Number(args[1]) : undefined;
    if(upCommand === "CMR" && upOrder && numId) {
      switch(upOrder) {
        case "ADD": $gameSystem.addImMovableRegionId(numId); break;
        case "DEL": $gameSystem.delImMovableRegionId(numId); break;
      }
    }
  };

})();
