/**
 * @fileoverview Description of this file.
 * @author sharvil.nanavati@gmail.com (Sharvil Nanavati)
 */

goog.provide('dotprod.entities.Projectile');

goog.require('dotprod.entities.Entity');
goog.require('dotprod.entities.Player');

/**
 * @constructor
 * @extends {dotprod.entities.Entity}
 * @param {!dotprod.Game} game
 * @param {!dotprod.entities.Player} owner
 * @param {number} lifetime
 * @param {number} damage
 */
dotprod.entities.Projectile = function(game, owner, lifetime, damage) {
  dotprod.entities.Entity.call(this);

  /**
   * @type {!dotprod.Game}
   * @protected
   */
  this.game_ = game;

  /**
   * @type {!dotprod.entities.Player}
   * @protected
   */
  this.owner_ = owner;

  /**
   * @type {number}
   * @protected
   */
  this.lifetime_ = lifetime;

  /**
   * @type {number}
   * @protected
   */
  this.damage_ = damage;
};
goog.inherits(dotprod.entities.Projectile, dotprod.entities.Entity);

/**
 * @return {boolean}
 */
dotprod.entities.Projectile.prototype.isAlive = function() {
  return this.lifetime_ >= 0;
};