/**
 * @fileoverview Description of this file.
 * @author sharvil.nanavati@gmail.com (Sharvil Nanavati)
 */

goog.provide('dotprod.views.ChatView');

goog.require('goog.dom');
goog.require('goog.events.BrowserEvent');
goog.require('goog.events.Event');
goog.require('goog.events.EventType');
goog.require('dotprod.Protocol');
goog.require('dotprod.views.View');

/**
 * @constructor
 * @extends {dotprod.views.View}
 * @param {!dotprod.Game} game
 */
dotprod.views.ChatView = function(game) {
  dotprod.views.View.call(this);

  /**
   * @type {dotprod.PlayerIndex}
   * @private
   */
  this.playerIndex_ = game.getPlayerIndex();

  /**
   * @type {!Object}
   * @private
   */
  this.settings_ = game.getSettings();

  /**
   * @type {!dotprod.Protocol}
   * @private
   */
  this.protocol_ = game.getProtocol();

  /**
   * @type {!Object.<string, !Array.<function(string)>>}
   * @private
   */
  this.handlers_ = {};

  /**
   * @type {!HTMLDivElement}
   * @private
   */
  this.view_ = /** @type {!HTMLDivElement} */ (goog.dom.createElement('div'));
  this.view_.classList.add(dotprod.views.ChatView.CHAT_VIEW_CLASS_NAME_);

  /**
   * @type {!HTMLDivElement}
   * @private
   */
  this.text_ = /** @type {!HTMLDivElement} */ (goog.dom.createElement('div'));
  this.text_.classList.add(dotprod.views.ChatView.TEXT_CLASS_NAME_);

  /**
   * @type {!HTMLInputElement}
   * @private
   */
  this.chatBox_ = /** @type {!HTMLInputElement} */ (goog.dom.createElement('input'));
  this.chatBox_.type = 'text';
  this.chatBox_.classList.add(dotprod.views.ChatView.CHAT_BOX_CLASS_NAME_);

  goog.events.listen(window, goog.events.EventType.KEYPRESS, goog.bind(this.onGlobalKeyPress_, this));
  goog.events.listen(this.chatBox_, goog.events.EventType.KEYPRESS, goog.bind(this.onChatKeyPress_, this));
  goog.events.listen(this.chatBox_, goog.events.EventType.KEYDOWN, goog.bind(this.keyFilter_, this));
  goog.events.listen(this.chatBox_, goog.events.EventType.KEYUP, goog.bind(this.keyFilter_, this));
};
goog.inherits(dotprod.views.ChatView, dotprod.views.View);

/**
 * @type {string}
 * @private
 * @const
 */
dotprod.views.ChatView.CHAT_VIEW_CLASS_NAME_ = 'cv';

/**
 * @type {string}
 * @private
 * @const
 */
dotprod.views.ChatView.TEXT_CLASS_NAME_ = 'cv-text';

/**
 * @type {string}
 * @private
 * @const
 */
dotprod.views.ChatView.TEXT_NAME_CLASS_NAME_ = 'cv-text-name';

/**
 * @type {string}
 * @private
 * @const
 */
dotprod.views.ChatView.TEXT_MESSAGE_CLASS_NAME_ = 'cv-text-message';

/**
 * @type {string}
 * @private
 * @const
 */
dotprod.views.ChatView.CHAT_BOX_CLASS_NAME_ = 'cv-input';

/**
 * @type {string}
 * @private
 * @const
 */
dotprod.views.ChatView.CHAT_BOX_VISIBLE_CLASS_NAME_ = 'cv-visible';

dotprod.views.ChatView.prototype.renderDom = function(rootNode) {
  goog.base(this, 'renderDom', rootNode);

  this.view_.appendChild(this.text_);
  this.view_.appendChild(this.chatBox_);
  rootNode.appendChild(this.view_);
};

/**
 * @param {!dotprod.entities.Player} player
 * @param {string} message
 */
dotprod.views.ChatView.prototype.addMessage = function(player, message) {
  var isAtBottom = this.view_.scrollTop + this.view_.offsetHeight >= this.view_.scrollHeight;

  var messageNode = goog.dom.createElement('div');

  var nameNode = goog.dom.createElement('span');
  nameNode.classList.add(dotprod.views.ChatView.TEXT_NAME_CLASS_NAME_);
  nameNode.textContent = player.getName() + ': ';
  goog.events.listen(nameNode, goog.events.EventType.CLICK, goog.bind(this.onNameClicked_, this, player));

  var textNode = goog.dom.createElement('span');
  textNode.classList.add(dotprod.views.ChatView.TEXT_MESSAGE_CLASS_NAME_);
  textNode.textContent = message;
  textNode.innerHTML = window.linkify(textNode.innerHTML);

  messageNode.appendChild(nameNode);
  messageNode.appendChild(textNode);

  this.text_.appendChild(messageNode);
  if (isAtBottom) {
    this.view_.scrollTop = this.view_.scrollHeight;
  }
};

dotprod.views.ChatView.prototype.onGlobalKeyPress_ = function(event) {
  if (event.keyCode == goog.events.KeyCodes.NUM_ZERO) {
    this.view_.classList.toggle('cv-expanded');
  }

  if (event.keyCode != goog.events.KeyCodes.ENTER) {
    return;
  }

  this.chatBox_.classList.add(dotprod.views.ChatView.CHAT_BOX_VISIBLE_CLASS_NAME_);
  this.chatBox_.focus();
};

dotprod.views.ChatView.prototype.onChatKeyPress_ = function(event) {
  if (event.keyCode != goog.events.KeyCodes.ENTER) {
    return;
  }

  var message = this.chatBox_.value.trim();
  if (message != '') {
    var command = message.split(' ')[0];
    if (this.handlers_[command]) {
      for (var i in this.handlers_[command]) {
        this.handlers_[command][i](message);
      }
    } else {
      this.protocol_.sendChat(message);
      this.addMessage(this.playerIndex_.getLocalPlayer(), message);
    }
  }

  this.chatBox_.value = '';
  this.chatBox_.blur();
  this.chatBox_.classList.remove(dotprod.views.ChatView.CHAT_BOX_VISIBLE_CLASS_NAME_);
  event.stopPropagation();
};

/**
 * @param {!goog.events.BrowserEvent} event
 * @private
 */
dotprod.views.ChatView.prototype.keyFilter_ = function(event) {
  // Chrome doesn't fire keypress events for the escape key so we have to handle it here instead.
  if (event.keyCode == goog.events.KeyCodes.ESC) {
    this.chatBox_.value = '';
    this.chatBox_.blur();
    this.chatBox_.classList.remove(dotprod.views.ChatView.CHAT_BOX_VISIBLE_CLASS_NAME_);
    return;
  }

  if (this.isChatBoxVisible_()) {
    event.stopPropagation();
  }
};

/**
 * @param {!dotprod.entities.Player} player
 * @private
 */
dotprod.views.ChatView.prototype.onNameClicked_ = function(player) {
  this.chatBox_.classList.add(dotprod.views.ChatView.CHAT_BOX_VISIBLE_CLASS_NAME_);
  this.chatBox_.focus();
  this.chatBox_.value += '@' + player.getName();
};

/**
 * @return {boolean}
 * @private
 */
dotprod.views.ChatView.prototype.isChatBoxVisible_ = function() {
  return this.chatBox_.classList.contains(dotprod.views.ChatView.CHAT_BOX_VISIBLE_CLASS_NAME_);
};
