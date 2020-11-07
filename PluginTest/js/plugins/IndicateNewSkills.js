//=============================================================================
// IndicateNewSkills.js
//=============================================================================
// Copyright (c) 2020 jp_asty
// This software is released under the MIT License, see LICENSE.
//=============================================================================

/*:
 * @plugindesc 新しく習得したスキルを強調表示します。
 * @author jp_asty
 *
 * @param 強調表示時に使用する画像
 * @desc 新しく習得したスキルのアイコンに重ねて表示する画像です。指定なしの時は画像を表示しません。サイズは32×32推奨。
 * @default
 * @require 1
 * @dir img/system/
 * @type file
 *
 * @param 強調表示時のスキル名の色
 * @desc #000000～#ffffff までのカラーコードで指定します。色を変更しないときは空欄にして下さい。
 * @default
 * @type string
 *
 * @param 強調表示時のMPコストの色
 * @desc #000000～#ffffff までのカラーコードで指定します。色を変更しないときは空欄にして下さい。
 * @default
 * @type string
 *
 * @param 強調表示時のTPコストの色
 * @desc #000000～#ffffff までのカラーコードで指定します。色を変更しないときは空欄にして下さい。
 * @default
 * @type string
 *
 * @param 強調表示する最大数
 * @desc 習得したスキルのうち、新しい方からこの数までのスキルのみが強調表示の対象になります。
 * @default 100
 * @type number
 *
 * @param 強調表示を消すタイミング
 * @desc 1:カーソルが当たった時　2:決定操作をした時
 * @default 1
 * @type number
 *
 * @help
 * v1.1.0 20200131 強調表示を消すタイミングを選択できるように変更。
 *
 * 新しく習得したスキルが強調表示されるようになります。
 * アイコンの上に重ねる画像とフォントの色が指定可能です。
 *
 * 利用規約
 * This plugin is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 */
(function() {

  'use strict';
  const inParams = PluginManager.parameters('IndicateNewSkills');
  const indicateImage = inParams["強調表示時に使用する画像"];
  const indicateNameColor = inParams["強調表示時のスキル名の色"];
  const indicateMpCostColor = inParams["強調表示時のMPコストの色"];
  const indicateTpCostColor = inParams["強調表示時のTPコストの色"];
  const indicateMaxNum = Number(inParams["強調表示する最大数"]);
  const indicateRemoveTiming = Number(inParams["強調表示を消すタイミング"]);

  //-----------------------------------------------------------------------------
  // Function
  //
  function isEmptyString(str) {
    if(str == undefined || str == "") return true;
    return false;
  }

  //-----------------------------------------------------------------------------
  // Scene_Boot
  //
  const _Scene_Boot_loadSystemImages = Scene_Boot.loadSystemImages;
  Scene_Boot.loadSystemImages = function() {
  	_Scene_Boot_loadSystemImages.call(this);
  	ImageManager.reserveSystem(indicateImage);
  };

  //-----------------------------------------------------------------------------
  // Game_Actor
  //
  const _Game_Actor_setup = Game_Actor.prototype.setup;
  Game_Actor.prototype.setup = function(actorId) {
    this._indicateSkills = [];
    _Game_Actor_setup.call(this, actorId);
  };

  const _Game_Actor_learnSkill = Game_Actor.prototype.learnSkill;
  Game_Actor.prototype.learnSkill = function(skillId) {
    this.addIndicateSkill(skillId);
    _Game_Actor_learnSkill.call(this, skillId);
  };

  Game_Actor.prototype.addIndicateSkill = function(skillId) {
    if(!this.isLearnedSkill(skillId) && !this.isIndicateSkill(skillId)) {
      this._indicateSkills.push(skillId);
      if(this._indicateSkills.length > indicateMaxNum) {
        this._indicateSkills.shift();
      }
    }
  };

  Game_Actor.prototype.removeIndicateSkill = function(skillId) {
    const index = this._indicateSkills.indexOf(skillId);
    if(index >= 0) {
      this._indicateSkills.splice(index, 1);
    }
  };

  Game_Actor.prototype.isIndicateSkill = function(skillId) {
    return this._indicateSkills.contains(skillId);
  };

  //-----------------------------------------------------------------------------
  // Window_Base
  //
  Window_Base.prototype.drawItemName = function(item, x, y, width, nameColor) {
    width = width || 312;
    if (item) {
      var iconBoxWidth = Window_Base._iconWidth + 4;
      this.resetTextColor();
      if(!isEmptyString(nameColor)) {
        this.changeTextColor(nameColor);
      }
      this.drawIcon(item.iconIndex, x + 2, y + 2);
      this.drawText(item.name, x + iconBoxWidth, y, width - iconBoxWidth);
    }
  };

  //-----------------------------------------------------------------------------
  // Window_SkillList
  //
  Window_SkillList.prototype.drawItem = function(index) {
    var skill = this._data[index];
    if (skill) {
      var costWidth = this.costWidth();
      var rect = this.itemRect(index);
      rect.width -= this.textPadding();
      this.changePaintOpacity(this.isEnabled(skill));

      const isIndicateSkill = this._actor.isIndicateSkill(skill.id);
      if(isIndicateSkill) {
        var nameColor   = indicateNameColor;
        var tpCostColor = indicateTpCostColor;
        var mpCostColor = indicateMpCostColor;
      }
      this.drawItemName(skill, rect.x, rect.y, rect.width - costWidth, nameColor);
      this.drawSkillCost(skill, rect.x, rect.y, rect.width, tpCostColor, mpCostColor);
      this.changePaintOpacity(1);

      if(isIndicateSkill) {
        const bitmap = ImageManager.loadSystem(indicateImage);
  			this.contents.blt(bitmap, 0, 0, bitmap.width, bitmap.height, rect.x + 2, rect.y + 2);
      }
    }
  };

  Window_SkillList.prototype.drawSkillCost = function(skill, x, y, width, tpCostColor, mpCostColor) {
    if (this._actor.skillTpCost(skill) > 0) {
      const color = isEmptyString(tpCostColor) ? this.tpCostColor() : tpCostColor;
      this.changeTextColor(color);
      this.drawText(this._actor.skillTpCost(skill), x, y, width, 'right');
    } else if (this._actor.skillMpCost(skill) > 0) {
      const color = isEmptyString(mpCostColor) ? this.mpCostColor() : mpCostColor;
      this.changeTextColor(color);
      this.drawText(this._actor.skillMpCost(skill), x, y, width, 'right');
    }
  };

  const _Window_SkillList_updateHelp = Window_SkillList.prototype.updateHelp;
  Window_SkillList.prototype.updateHelp = function() {
    _Window_SkillList_updateHelp.call(this);
    if(indicateRemoveTiming == 1) {
      this.removeIndicate();
    }
  };

  Window_SkillList.prototype.processOk = function() {
    Window_Selectable.prototype.processOk.call(this);
    if(indicateRemoveTiming == 2) {
      this.removeIndicate();
    }
  };

  Window_SkillList.prototype.removeIndicate = function() {
    const skill = this.item();
    if(skill && this._actor.isIndicateSkill(skill.id)) {
      this._actor.removeIndicateSkill(skill.id);
      this.redrawCurrentItem();
    }
  };

})();
