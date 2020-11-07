//=============================================================================
// DashOperationEx.js
//=============================================================================
// Copyright (c) 2020 jp_asty
// This software is released under the MIT License, see LICENSE.
//=============================================================================

/*:
 * @plugindesc 方向キー２回でダッシュ。
 * @author jp_asty
 *
 * @param ダッシュが有効化されるキー間隔
 * @type number
 * @desc 1000で1秒（初期値:500）
 * @default 500
 *
 * @help
 *
 * 利用規約
 * This plugin is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 */
(function() {

  'use strict';
  const inParams = PluginManager.parameters('DashOperationEx');
  const effectiveInterval = Number(inParams["ダッシュが有効化されるキー間隔"]);
  const useKeyNames = ["left", "right", "up", "down"];

  //-----------------------------------------------------------------------------
  // Game_Player
  //
  const DashOperationEx_Game_Player_initMembers = Game_Player.prototype.initMembers;
  Game_Player.prototype.initMembers = function(sceneActive) {
    DashOperationEx_Game_Player_initMembers.call(this, sceneActive);
    this._lastPressedKeyData = null;
    this._dashingFromCursolKey = false;
  };

  const DashOperationEx_Game_Player_update = Game_Player.prototype.update;
  Game_Player.prototype.update = function(sceneActive) {
    if(Input._pressedTime == 0) {
      if(useKeyNames.indexOf(Input._latestButton) >= 0) {
        if(this._lastPressedKeyData == null) {
          this._lastPressedKeyData = {keyName:Input._latestButton, pressedTime:Input._date};
        } else {
          if(this._lastPressedKeyData.keyName == Input._latestButton) {
            const interval = Date.now() - this._lastPressedKeyData.pressedTime;
            if(interval <= effectiveInterval) {
              this._dashingFromCursolKey = true;
            }
          }
          this._lastPressedKeyData = null;
        }
      }
    }
    DashOperationEx_Game_Player_update.call(this, sceneActive);
    if(this._stopCount > 0) {
      this._lastPressedKeyData = null;
      this._dashingFromCursolKey = false;
    }
    if(this._dashingFromCursolKey) {
      this._dashing = true;
    }
  };

})();
