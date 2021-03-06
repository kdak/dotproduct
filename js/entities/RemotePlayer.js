/**
 * @fileoverview Description of this file.
 * @author sharvil.nanavati@gmail.com (Sharvil Nanavati)
 */

goog.provide('dotprod.entities.RemotePlayer');

goog.require('dotprod.Camera');
goog.require('dotprod.EffectIndex');
goog.require('dotprod.entities.Player');
goog.require('dotprod.Map');
goog.require('dotprod.Timer');
goog.require('dotprod.Vector');

/**
 * @constructor
 * @extends {dotprod.entities.Player}
 * @param {!dotprod.Game} game
 * @param {string} id
 * @param {string} name
 * @param {number} ship
 */
dotprod.entities.RemotePlayer = function(game, id, name, ship, bounty) {
  dotprod.entities.Player.call(this, game, id, name, ship, bounty);

  /**
   * The timestamp, in millseconds, when we last interpolated a bounce off a wall.
   * We use this to ignore received position packets before the last bounce. It's
   * important to do so otherwise we would set the velocity to the pre-bounce velocity
   * resulting in another bounce into the wall.
   *
   * @type {number}
   * @private
   */
  this.bounceTimestamp_ = 0;

  /**
   * This is only used by RemotePlayer when we're adjusting the player's velocity
   * to interpolate to the correct location. It's defined here because we need to
   * bounce the velocity vector during collision detection.
   *
   * @type {!dotprod.Vector}
   * @protected
   */
  this.originalVelocity_ = new dotprod.Vector(0, 0);

  /**
   * @type {number}
   * @private
   */
  this.velocityAdjustTimer_ = 0;

  // The remote player isn't alive until we receive a position packet telling
  // us otherwise.
  this.energy_ = 0;
};
goog.inherits(dotprod.entities.RemotePlayer, dotprod.entities.Player);

/**
 * @type {number}
 * @private
 * @const
 */
dotprod.entities.RemotePlayer.MAX_DRIFT_PIXELS_ = 64;

/**
 * @type {number}
 * @private
 * @const
 */
dotprod.entities.RemotePlayer.VELOCITY_ADJUST_PERIOD_ = 20;

/**
 * @param {number} timeDiff
 * @param {number} angle
 * @param {!dotprod.Vector} position
 * @param {!dotprod.Vector} velocity
 */
dotprod.entities.RemotePlayer.prototype.onPositionUpdate = function(timeDiff, angle, position, velocity) {
  if (!this.isAlive()) {
    this.energy_ = 1;
    this.bounty_ = 0;
    this.angleInRadians_ = angle;
    this.position_ = position;
    this.velocity_ = velocity;
    this.originalVelocity_ = velocity;
    this.warpFlash();
    return;
  }

  // Ignore position updates from before the last wall bounce.
  if(goog.now() - dotprod.Timer.ticksToMillis(timeDiff) < this.bounceTimestamp_) {
    return;
  }

  var finalPosition = this.extrapolatePosition_(timeDiff, position, velocity);
  var distance = finalPosition.subtract(this.position_);

  this.angleInRadians_ = angle;
  this.velocity_ = velocity;
  this.originalVelocity_ = velocity;
  this.velocityAdjustTimer_ = dotprod.entities.RemotePlayer.VELOCITY_ADJUST_PERIOD_;

  if (Math.abs(distance.getX()) >= dotprod.entities.RemotePlayer.MAX_DRIFT_PIXELS_) {
    this.position_ = new dotprod.Vector(finalPosition.getX(), this.position_.getY());
  } else {
    this.velocity_ = this.velocity_.add(new dotprod.Vector(distance.getX(), 0).scale(1 / dotprod.entities.RemotePlayer.VELOCITY_ADJUST_PERIOD_));
  }

  if (Math.abs(distance.getY()) >= dotprod.entities.RemotePlayer.MAX_DRIFT_PIXELS_) {
    this.position_ = new dotprod.Vector(this.position_.getX(), finalPosition.getY());
  } else {
    this.velocity_ = this.velocity_.add(new dotprod.Vector(0, distance.getY()).scale(1 / dotprod.entities.RemotePlayer.VELOCITY_ADJUST_PERIOD_));
  }
};

dotprod.entities.RemotePlayer.prototype.update = function() {
  var bounceFactor = this.game_.getSettings()['ships'][this.ship_]['bounceFactor'];
  --this.velocityAdjustTimer_;
  if (this.velocityAdjustTimer_ == 0) {
    this.velocity_ = this.originalVelocity_;
  }

  this.updatePosition_(bounceFactor);
};

/**
 * @param {number} timeDiff
 * @param {!dotprod.Vector} startPosition
 * @param {!dotprod.Vector} startVelocity
 * @return {!dotprod.Vector}
 * @private
 */
dotprod.entities.RemotePlayer.prototype.extrapolatePosition_ = function(timeDiff, startPosition, startVelocity) {
  var bounceFactor = this.game_.getSettings()['ships'][this.ship_]['bounceFactor'];
  var savedPosition = this.position_;
  var savedVelocity = this.velocity_;

  this.position_ = startPosition;
  this.velocity_ = startVelocity;
  for (var i = 0; i < timeDiff; ++i) {
    this.updatePosition_(bounceFactor);
  }

  var extrapolatedPosition = this.position_;

  this.position_ = savedPosition;
  this.velocity_ = savedVelocity;

  return extrapolatedPosition;
};

/**
 * @override
 */
dotprod.entities.RemotePlayer.prototype.collectPrize_ = function(prize) {
  goog.base(this, 'collectPrize_', prize);
  return true;
};

/**
 * @override
 */
dotprod.entities.RemotePlayer.prototype.bounce_ = function() {
  this.velocityAdjustTimer_ = 0;
  this.bounceTimestamp_ = goog.now();
};
