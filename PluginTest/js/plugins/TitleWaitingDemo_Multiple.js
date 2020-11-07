//=============================================================================
// TitleWaitingDemo_Multiple.js
//=============================================================================
// Copyright (c) 2020 jp_asty
// This software is released under the MIT License, see LICENSE.
//=============================================================================

/*:
 * @plugindesc タイトル画面でしばらく待機したときに自動で指定したマップからゲームが開始されるようになります。
 * @author jp_asty
 *
 * @param デモ情報
 * @desc デモ情報の上から順に評価され、最初に条件を満たしたひとつのみが使用されます。
 * @default
 * @type struct<DemoInfo>[]
 *
 * @help
 * 機能的にはトリアコンタンさん作のTitleWaitingDemoにデモの複数登録とスイッチ連動機能を追加したものです。
 * プラグインパラメーターの構造を変更した都合上、別プラグインとさせて頂きました。
 *
 * 利用規約
 * This plugin is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 */

/*~struct~DemoInfo:
 * @param マップID
 * @desc 遷移先マップのID
 * @default 1
 * @type number
 *
 * @param X座標
 * @desc 遷移先マップでの初期X座標
 * @default 1
 * @type number
 *
 * @param Y座標
 * @desc 遷移先マップでの初期Y座標
 * @default 1
 * @type number
 *
 * @param 待機時間
 * @desc 待機時間（秒で指定）
 * @default 20
 * @type number
 *
 * @param キー入力で待機時間をリセット
 * @desc 有効化するとキー入力またはマウスの決定操作をしたときに待機時間がリセットされます。
 * @default true
 * @type boolean
 *
 * @param スイッチID
 * @desc 1以上が指定された場合、そのスイッチがONのときのみ処理されるようになります。
 * @default 0
 * @type switch
 */

(function() {

  'use strict';
  const inParams = PluginManager.parameters('TitleWaitingDemo_Multiple');
  const demoInfos = JSON.parse(inParams["デモ情報"]);

  //-----------------------------------------------------------------------------
  // Scene_Title
  //
  const _Scene_Title_start = Scene_Title.prototype.start;
  Scene_Title.prototype.start = function() {
    _Scene_Title_start.apply(this, arguments);
    this._demoInfo = this.getNowDemoInfo();
    this._waitingFrame = 0;
  };

  Scene_Title.prototype.getNowDemoInfo = function() {
    for(let i=0; i<demoInfos.length; i++) {
      const info = JSON.parse(demoInfos[i]);
      const switchId = Number(info["スイッチID"]);
      if(switchId == 0 || $gameSwitches.value(switchId)) {
        return info;
      }
    }
    return null;
  };

  const _Scene_Title_update = Scene_Title.prototype.update;
  Scene_Title.prototype.update = function() {
    _Scene_Title_update.apply(this, arguments);
    if(this.hasDemoInfo()) {
      this._waitingFrame++;
      if(this._demoInfo["キー入力で待機時間をリセット"] == "true") {
        if(this.isAnyKeyInputted()) {
          this._waitingFrame = 0;
        }
      }
      if(this._waitingFrame >= Number(this._demoInfo["待機時間"]) * 60) {
        this.startWaitingDemo();
      }
    }
  };

  Scene_Title.prototype.hasDemoInfo = function() {
    return this._demoInfo != null;
  };

  Scene_Title.prototype.isAnyKeyInputted = function() {
    return Input._latestButton || TouchInput.isTriggered();
  };

  Scene_Title.prototype.startWaitingDemo = function() {
    if(this._demoInfo._started) return;
    this.commandNewGame();
    const mapId = Number(this._demoInfo["マップID"]);
    const x = Number(this._demoInfo["X座標"]);
    const y = Number(this._demoInfo["Y座標"]);
    $gamePlayer.reserveTransfer(mapId, x, y);
    this._commandWindow.open();
    this._demoInfo._started = true;
  };

})();
