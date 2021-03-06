/**
 * @fileoverview Description of this file.
 * @author sharvil.nanavati@gmail.com (Sharvil Nanavati)
 */

goog.provide('dotprod.Camera');

/**
 * @constructor
 * @param {!dotprod.Game} game
 * @param {!CanvasRenderingContext2D} context
 */
dotprod.Camera = function(game, context) {
  /**
   * @type {number}
   * @private
   */
  this.x_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.y_ = 0;

  /**
   * @type {!CanvasRenderingContext2D}
   * @private
   */
  this.context_ = context;
};

/**
 * @param {number} x
 * @param {number} y
 */
dotprod.Camera.prototype.setPosition = function(x, y) {
  // TODO(sharvil): set a max bound for camera position.
  this.x_ = Math.max(x, 0);
  this.y_ = Math.max(y, 0);
};

/**
 * @return {!Object}
 */
dotprod.Camera.prototype.getDimensions = function() {
  return {
    x: this.x_,
    y: this.y_,
    width: this.context_.canvas.width,
    height: this.context_.canvas.height,
    left: this.x_ - Math.floor(this.context_.canvas.width / 2),
    right: this.x_ + Math.floor(this.context_.canvas.width / 2),
    top: this.y_ - Math.floor(this.context_.canvas.height / 2),
    bottom: this.y_ + Math.floor(this.context_.canvas.height / 2)
  };
};

/**
 * @return {!CanvasRenderingContext2D}
 */
dotprod.Camera.prototype.getContext = function() {
  return this.context_;
};
