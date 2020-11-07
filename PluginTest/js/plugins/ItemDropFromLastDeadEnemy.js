//=============================================================================
// ItemDropFromLastDeadEnemy.js
//=============================================================================
// Copyright (c) 2020 jp_asty
// This software is released under the MIT License, see LICENSE.
//=============================================================================

/*:
 * @plugindesc 最後に倒した敵からのみアイテムドロップの抽選を行うようになります。
 * @author jp_asty
 *
 * @param ドラ○エ式抽選
 * @type boolean
 * @desc ドラ○エ式抽選とは、アイテムの上から順に抽選していき、当選した時点でそのアイテムのみをドロップとするという方法です。
 * @default false
 *
 * @help
 * 最後に倒した敵からのみアイテムドロップの抽選を行うようになります。
 * プラグインを有効化するだけで適用されます。
 *
 * 利用規約
 * This plugin is released under the MIT License.
 * http://opensource.org/licenses/mit-license.php
 */
(function() {

  'use strict';
  const inParams = PluginManager.parameters('ItemDropFromLastDeadEnemy');
  const isDQMethod = inParams["ドラ○エ式抽選"] == "true";

  //-----------------------------------------------------------------------------
  // Game_BattlerBase
  //
  const _Game_BattlerBase_die = Game_Battler.prototype.die;
  Game_BattlerBase.prototype.die = function() {
    _Game_BattlerBase_die.call(this);
    if(this.constructor === Game_Enemy) {
      $gameTemp._lastDeadEnemy = this;
    }
  };

  //-----------------------------------------------------------------------------
  // Game_Troop
  //
  Game_Troop.prototype.makeDropItems = function() {
    let dropItems = [];
    if($gameTemp._lastDeadEnemy) {
      dropItems = $gameTemp._lastDeadEnemy.makeDropItems();
    }
    return dropItems;
  };

  //-----------------------------------------------------------------------------
  // Game_Enemy
  //
  const _Game_Enemy_makeDropItems = Game_Enemy.prototype.makeDropItems;
  Game_Enemy.prototype.makeDropItems = function() {
    if(isDQMethod) {
      return this.makeDropItemsByDQMethod();
    } else {
      return _Game_Enemy_makeDropItems.call(this);
    }
  };

  Game_Enemy.prototype.makeDropItemsByDQMethod = function() {
    const dropItems = this.enemy().dropItems;
    let result = [];
    for(let i=0; i<dropItems.length; i++) {
      const item = dropItems[i];
      if (item.kind > 0 && Math.random() * item.denominator < this.dropItemRate()) {
        result.push( this.itemObject(item.kind, item.dataId) );
        break;
      }
    }
    return result;
  };

})();
