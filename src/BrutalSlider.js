export class BrutalSlider {

  /* Config */

  /**
   * DTO object with slider settings.
   * @property {String}  targetSelector Selector to make the slider from.
   * @property {String}  leftSelector Selector for left movement event handler.
   * @property {String}  rightSelector Selector for right movement event handler.
   * @property {Array}   relatedSliders Selectors for sliders moved by the current.

   * @property {Number}  loadLatency (ms) Delay for constructor call.
   * @property {Boolean} centering true, for centering slider horizontally in container, otherwise false.

   * @property {Number}  moveCount Slides to move at once.
   * @property {Number}  showCount Slides to show.
   * @property {Number}  startPosition Which slide to move to when initializing.
   * @property {Number}  slidesSpacing Distance between slides.
   * @property {Number}  neighborsVisibleWidth View limiter extra width to display sibling sides.

   * @property {Number}  movementSmooth (ms) Movement animation delay.
   * @property {Number}  resizingLatencyY (ms) Height resizing animation delay.
   * @property {Number}  resizingLatencyX (ms) Width resizing animation delay.

   * @property {Boolean} swipes true, to enable pointer event handlers, otherwise false.
   * @property {Boolean} draggable true, to make slider follow pointer, otherwise false.
   * @property {Boolean} dragAutoFinishing true, for adding extra offset to reach next slide after drag,
   * otherwise false.
   * @property {Number}  pointerTrackingInterval (ms) Pointer move event handler response delay.
   * @property {Number}  swipeSensitivity The part of the visible area
   * that the pointer should pass for swipe processing.
   * @property {Boolean} increasedTrackingArea true, to process pointer moves outside the slider, otherwise false.
   * @property {Boolean} swipesInterruption true, to process a new swipe before the previous swipe animation ends,
   * otherwise false.
   * @property {Number}  swipeEndWaitingReduce How many times earlier, the swipe animation is *considered* complete.

   * @property {Boolean} selectableContent true, to make slider content selectable, otherwise false.
   * @property {Number}  timeToSelect (ms) Drag logic pause time.

   * @property {Boolean} autoplay true, for auto movement.
   * @property {Number}  autoplayDelay (ms) Auto movement delay.
   * @property {String}  autoplayDirection Auto movement direction.
   * @private
   */
  _settings  = {

    targetSelector:          null,
    leftSelector:            null,
    rightSelector:           null,
    relatedSlidersSelectors: [],

    loadLatency:             100,
    centering:               true,

    moveCount:               1,
    showCount:               1,
    startPosition:           1,
    slidesSpacing:           0,
    neighborsVisibleWidth:   0,

    movementSmooth:          500,
    resizingLatencyY:        100,
    resizingLatencyX:        100,

    swipes:                  false,
    draggable:               false,
    dragAutoFinishing:       false,
    pointerTrackingInterval: 0,
    swipeSensitivity:        4,
    increasedTrackingArea:   false,
    swipesInterruption:      false,

    swipeEndWaitingReduce:   1,
    selectableContent:       false,
    timeToSelect:            0,

    autoplay:                false,
    autoplayDelay:           2000,
    autoplayDirection:       'right',

    infinity:                false,
    oppositeSideAppearDelay: 0,
    oppositeSideAppearShift: 0,
  };

  /**
   * DTO object with class names set by BrutalSlider.
   * @property {String} viewLimiter Class for view limiting wrap.
   * @property {String} displayedItems Class for displayed items.
   * @property {String} itemsHolder Class for slider items holder.
   * @private
   */
  _classFor = {
    viewLimiter:            '_brutal-view',
    displayedItems:         '_brutal-displayed',
    itemsHolder:            '_brutal-holder',
  }

  /* Data */

  _container                = null;
  _items                    = [];
  _relatedSliders           = [];
  _itemsHolder              = null;
  _viewLimiter              = null;
  _leftControl              = null;
  _rightControl             = null;

  /* Computed */

  _currentPosition          = 0;
  _offset                   = 0;
  _shift                    = 0;
  _isSwiping                = false;
  _swipeStartX              = 0;
  _swipeCurrentX            = 0;
  _isPointerDelayPassed     = true;

  /**
   * Expands BrutalSlider structure, according to the specified settings.
   * @param {Object} settings Slider settings object.
   * @constructor
   */
  constructor(settings) {
    Object.assign(this._settings, settings);

    try {
      this._findSelectors();
    } catch { return; }

    this._waitLoadDelay()
      .then(() => {
        this._createSliderStructure();
        this._expandSlider();
        this._createControls();
        this._moveToStart();
        this._adaptViewWrapSizes();
        this._startAutoplay();
      });
  }

  /**
   * Finds elements by selectors.
   * @private
   */
  _findSelectors() {
    this._container = document.querySelector(this._settings.targetSelector);
    this._items = Array.from(
      document.querySelectorAll(`.${this._container.firstElementChild.className}`)
    );
    this._relatedSliders = this._settings.relatedSlidersSelectors
      .map(selector => document.querySelector(selector));
    this._leftControl = document.querySelector(this._settings.leftSelector);
    this._rightControl = document.querySelector(this._settings.rightSelector);
  }

  /**
   * Makes constructor wait for load delay.
   * @private
   */
  _waitLoadDelay() {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, this._settings.loadLatency);
    });
  }

  /**
   * Creates an HTML structure.
   * @private
   */
  _createSliderStructure() {
    this._viewLimiter = this._createViewLimiter();
    this._itemsHolder = this._createItemsHolder();
  }

  /**
   * Creates view limiting wrap.
   * @returns {HTMLDivElement}
   * @private
   */
  _createViewLimiter() {
    const div = document.createElement('div');

    if (this._settings.centering) {
      div.style.margin = '0 auto';
    }

    div.className      = this._classFor.viewLimiter;
    div.style.overflow = 'hidden';

    const delayY = this._settings.resizingLatencyY;
    const delayX = this._settings.resizingLatencyX;
    div.style.transition = `height ${ delayY }ms, width ${ delayX }ms`;

    return div;
  }

  /**
   * Creates items holder.
   * @returns {HTMLUListElement}
   * @private
   */
  _createItemsHolder() {
    const ul = document.createElement('ul');

    ul.className         = this._classFor.itemsHolder;
    ul.style.whiteSpace  = 'nowrap';
    ul.style.listStyle   = 'none';
    ul.style.touchAction = 'none';
    ul.style.transform   = 'translateX(0)';
    ul.style.transition = `transform ${ this._settings.movementSmooth }ms`;

    ul.style.width = this._calcItemsHolderWidth() + 'px';

    return ul;
  }

  /**
   * Calculates items total width.
   * @returns {Number}
   * @private
   */
  _calcItemsHolderWidth() {
    const margin = this._settings.slidesSpacing;
    return this._items.reduce((width, item) => width + (item.offsetWidth + margin), 0);
  }

  /**
   * Ads created structure to the document and sets startup settings.
   * @private
   */
  _expandSlider() {
    for (const item of this._items) {
      const li = this._createItemWrap();
      this._itemsHolder.append(li);
      li.append(item);
    }
    this._addItemsSpacing();
    this._setDisplayedItemsClasses();
    this._viewLimiter.append(this._itemsHolder);
    this._container.append(this._viewLimiter);
  }

  /**
   * Creates item wrap.
   * @returns {HTMLLIElement}
   * @private
   */
  _createItemWrap() {
    const li = document.createElement('li');
    li.style.display    = 'inline-block';
    li.style.whiteSpace = 'normal';
    return li;
  }

  /**
   * Sets displayed items class names.
   * @private
   */
  _setDisplayedItemsClasses() {
    this._removeNotDisplayedItemsClasses();
    for (let shift = 0; shift < this._settings.showCount; shift++) {
      const shiftedIdx = this._currentPosition + shift;
      if (shiftedIdx >= this._items.length) break;

      this._items[shiftedIdx].classList.add(this._classFor.displayedItems);
    }
  }

  /**
   * Removes not displayed slides classes.
   * @private
   */
  _removeNotDisplayedItemsClasses() {
    this._items.forEach(item => item.classList.remove(this._classFor.displayedItems));
  }

  /**
   * Sets spacing for items wrap.
   * @private
   */
  _addItemsSpacing() {
    // Not last child.
    for (let item = 0; item < this._items.length - 1; item++) {
      const sliderItemWrap = this._items[item].parentElement;
      sliderItemWrap.style.marginRight = this._settings.slidesSpacing + 'px';
    }
  }

  /**
   * Automatically moves slider in specified direction with specified delay.
   * @private
   */
  _startAutoplay() {
    if (!this._settings.autoplay) return;

    const delay = this._settings.autoplayDelay;
    setTimeout((function play() {
      if (this._settings.autoplayDirection === 'left') {
        this._leftMoveHandler();
      } else if (this._settings.autoplayDirection === 'right') {
        this._rightMoveHandler();
      }
      setTimeout(play.bind(this), delay);
    }).bind(this), delay);
  }

  /**
   * Hangs listeners on elements according to the settings.
   * @private
   */
  _createControls() {
    if (this._leftControl) {
      this._leftControl
        .addEventListener('click', () => this._leftMoveHandler());
    }
    if (this._rightControl) {
      this._rightControl
        .addEventListener('click', () => this._rightMoveHandler());
    }
    if (this._settings.swipes) {
      this._itemsHolder
        .addEventListener('pointerdown', event => this._pointerDownHandler(event));
    }
    if (this._relatedSliders.length > 0) {
      this._container.addEventListener('moveRelatedLeft', () => this._moveRelatedLeftHandler());
      this._container.addEventListener('moveRelatedRight', () => this._moveRelatedRightHandler());
    }
  }

  /**
   * Implements items holder left movement logic.
   * @private
   */
  _leftMoveHandler() {
    this._moveLeft();
    const detail = 'Generates when related slider moved.';
    const event = new CustomEvent('moveRelatedLeft', { detail: detail });
    this._relatedSliders.forEach(elem => elem.dispatchEvent(event));
  }

  /**
   * Moves items holder to the left according to the settings.
   * @private
   */
  _moveLeft() {
    if (this._currentPosition < 2 && this._settings.infinity) {
      this._moveLeftInfinity();
      return;
    }
    for (let moved = 0; moved < this._settings.moveCount; moved++) {
      if (this._currentPosition < 1) break;

      this._itemsHolder.style.transition = `transform ${ this._settings.movementSmooth }ms`;

      const targetItem = this._items[this._currentPosition - 1];
      this._offset += targetItem.offsetWidth + this._settings.slidesSpacing;

      this._itemsHolder.style.transform = `translateX(${ this._offset + this._calcTowardsLeft() }px)`;

      this._currentPosition -= 1;
    }
    this._adaptViewWrapSizes();
    this._setDisplayedItemsClasses();
  }

  /**
   * After left border reached moves items holder to start position.
   * @private
   */
  _moveLeftInfinity() {
    if (!this._settings.infinity) return;

    this._currentPosition = this._items.length;
    this._itemsHolder.style.transition = `transform ${ 0 }ms`;

    this._offset = -(this._calcShiftMaxLength() + this._calcTowardsLeft() );
    this._itemsHolder.style.transform = `translateX(${ this._offset - this._settings.oppositeSideAppearShift }px)`;
    setTimeout(() => this._moveLeft(), this._settings.oppositeSideAppearDelay);
  }

  /**
   * Calculates opposite movement direction shift to center the displayed item(s) in view limiter.
   * @returns {Number}
   * @private
   */
  _calcTowardsLeft() {
    const isNeighborsDisplayed = this._settings.neighborsVisibleWidth > 0;
    const currentItemMargin = isNeighborsDisplayed > 0 ? this._settings.slidesSpacing : 0;

    return this._currentPosition > 1 ? this._settings.neighborsVisibleWidth + currentItemMargin : 0;
  }

  /**
   * Implements items holder right movement logic.
   * @private
   */
  _rightMoveHandler() {
    this._moveRight();
    const detail = 'Generates when related slider moved.';
    const event = new CustomEvent('moveRelatedRight', { detail: detail });
    this._relatedSliders.forEach(elem => elem.dispatchEvent(event));
  }

  /**
   * Moves items holder to the right according to the settings.
   * @private
   */
  _moveRight() {
    const reservedWidth = Math.max(this._settings.showCount, this._settings.moveCount);
    const isEnoughSpace = this._currentPosition + reservedWidth < this._items.length;

    if (!isEnoughSpace) {
      this._moveRightInfinity();
      return;
    }

    for (let moved = 0; moved < this._settings.moveCount; moved++) {
      const isEnoughSpace = (this._currentPosition + this._settings.showCount) < this._items.length;
      if (!isEnoughSpace) break;

      this._itemsHolder.style.transition = `transform ${ this._settings.movementSmooth }ms`;

      const currentItem = this._items[this._currentPosition];
      this._offset -= currentItem.offsetWidth + this._settings.slidesSpacing;

      this._itemsHolder.style.transform = `translateX(${ this._offset - this._calcOppositeRight() }px)`;

      this._currentPosition += 1;
    }
    this._adaptViewWrapSizes();
    this._setDisplayedItemsClasses();
  }

  /**
   * After right border reached moves items holder to start position.
   * @private
   */
  _moveRightInfinity() {
    if (!this._settings.infinity) return;

    this._currentPosition = 0;
    this._itemsHolder.style.transition = `transform ${ 0 }ms`;
    this._offset = this._calcDisplayedItemsTotalWidth() -
      (this._settings.neighborsVisibleWidth + this._calcOppositeRight());
    this._itemsHolder.style.transform = `translateX(${ this._offset + this._settings.oppositeSideAppearShift }px)`;
    setTimeout(() => this._moveRight(), this._settings.oppositeSideAppearDelay);
  }

  /**
   * Calculates opposite movement direction shift to center the displayed item(s) in view limiter.
   * @returns {Number}
   * @private
   */
  _calcOppositeRight() {
    const isNeighborsDisplayed = this._settings.neighborsVisibleWidth > 0;
    const prevItemMargin = isNeighborsDisplayed ? this._settings.slidesSpacing : 0;

    return -(this._settings.neighborsVisibleWidth + prevItemMargin);
  }

  /**
   * Moves the items holder for the specified number of times.
   * @private
   */
  _moveToStart() {
    // moveCount can disturb the method logic.
    const initialMoveCount = this._settings.moveCount;
    this._settings.moveCount = 1;

    for (let pos = 1; pos < this._settings.startPosition; pos++) {
      this._rightMoveHandler();
    }
    this._settings.moveCount = initialMoveCount;
  }

  /**
   * Delegates the corresponding functions adjustment of slider visible part sizes.
   * @private
   */
  _adaptViewWrapSizes() {
    this._adaptViewWidth();
    this._adaptViewHeight();
  }

  /**
   * Adjusts the width of slider wrap to fit the number of slides specified in the settings.
   * @private
   */
  _adaptViewWidth() {
    let actualViewWidth = this._calcDisplayedItemsTotalWidth() + this._calcViewExtraWidth();
    this._viewLimiter.style.width = actualViewWidth + 'px';
  }

  /**
   * Calculates the total width of the displayed slides.
   * @returns {Number}
   * @private
   */
  _calcDisplayedItemsTotalWidth() {
    let totalWidth = 0;

    for (let displayed = 0; displayed < this._settings.showCount; displayed++) {
      const displayedItemIdx = this._currentPosition + displayed;
      const isEnoughSlides = displayedItemIdx < this._items.length;

      if (!isEnoughSlides) break;

      const itemWidth = this._items[displayedItemIdx].offsetWidth;
      const margin = this._settings.slidesSpacing;

      const isLastDisplayed = (displayed < this._settings.showCount - 1) || this._settings.showCount < 2;
      totalWidth += isLastDisplayed ? itemWidth : itemWidth + margin;
    }
    return totalWidth;
  }

  /**
   * Calculates additional width for view limiter based on settings.
   * @returns {Number}
   * @private
   */
  _calcViewExtraWidth() {
    const isEnoughItems = this._items.length >= 2;
    if (!isEnoughItems) return 0;

    const isNearTheBoarders = (
      this._currentPosition === 0 ||
      (this._currentPosition + this._settings.showCount) >= this._items.length
    );

    const isNeighborsDisplayed = this._settings.neighborsVisibleWidth > 0;
    const prevNeighborMargin = isNeighborsDisplayed ? this._settings.slidesSpacing : 0;

    const neighborVisibleWidth = this._settings.neighborsVisibleWidth + prevNeighborMargin;

    return isNearTheBoarders ? neighborVisibleWidth : neighborVisibleWidth * 2;
  }

  /**
   * Adjusts the height of slider wrap depending on displayed slides max height.
   * @private
   */
  _adaptViewHeight() {
    let actualHeight = this._calcDisplayedItemsMaxHeight();
    this._viewLimiter.style.height = actualHeight + 'px';
  }

  /**
   * Calculates the max height of displayed items.
   * @returns {number}
   * @private
   */
  _calcDisplayedItemsMaxHeight() {
    let maxHeight = 0;

    for (let counter = 0; counter < this._settings.showCount; counter++) {
      const displayedItemIdx = this._currentPosition + counter;
      const isEnoughItems = displayedItemIdx < this._items.length;

      if (!isEnoughItems) break;

      const itemHeight = this._items[displayedItemIdx].offsetHeight;
      maxHeight = (maxHeight < itemHeight) ? itemHeight : maxHeight;
    }
    return maxHeight;
  }

  /**
   * Adds some logic and event handlers to support swipes and drags.
   * @param {PointerEvent} event
   * @private
   */
  _pointerDownHandler(event) {
    const isWaitingPrevSwipe = this._isSwiping && !this._settings.swipesInterruption;
    if (isWaitingPrevSwipe) return;

    if (this._settings.increasedTrackingArea) {
      this._itemsHolder.setPointerCapture(event.pointerId);
    }
    if (this._settings.draggable) {
      const shiftedBefore = this._itemsHolder.style.transform.match(/\d+/)[0];
      this._shift = -(Number.parseFloat(shiftedBefore));
    }

    this._itemsHolder.ondragstart = () => false;
    this._swipeStartX = event.clientX;

    const pointerMoveHandler = event => {
      this._pointerMoveHandler(event);
      this._dragHandler();
    };

    const pointerUpHandler = () => {
      this._finishDrag();
      if (this._settings.dragAutoFinishing) {
        this._processSwipe();
      }
      this._itemsHolder.removeEventListener('pointermove', pointerMoveHandler);
      document.removeEventListener('pointerup', pointerUpHandler);
    };

    this._itemsHolder.addEventListener('pointermove', pointerMoveHandler);
    document.addEventListener('pointerup', pointerUpHandler);
  }

  /**
   * Remembers the pointer current coordinate with specified in the settings delay.
   * @param {PointerEvent} event
   * @private
   */
  _pointerMoveHandler(event) {
    if (!this._isPointerDelayPassed) return;

    this._isPointerDelayPassed = false;
    setTimeout(() => this._isPointerDelayPassed = true, this._settings.pointerTrackingInterval);

    this._isSwiping = true;
    this._swipeCurrentX = event.clientX;
  }

  /**
   * Implements the drag logic, waits selection according to the settings.
   * @private
   */
  _dragHandler() {
    if (!this._settings.draggable) return;

    if (!this._settings.selectableContent) {
      this._startDrag();
    } else {
      setTimeout(() => this._startDrag(), this._settings.timeToSelect);
    }
  }

  /**
   * Starts drag, if selecting - prevents.
   * @private
   */
  _startDrag() {
    if (this._checkSelection()) return;

    this._itemsHolder.style.transition = `transform ${ 0 }ms`;

    const shiftLength = this._swipeCurrentX - this._swipeStartX;
    let shift = this._shift + shiftLength;

    const shiftMaxX = this._calcShiftMaxLength();

    const isLeftLimitReached  = shift >= 0;
    const isRightLimitReached = Math.abs(shift) > shiftMaxX;

    shift = isLeftLimitReached ? 0 : isRightLimitReached ? -(shiftMaxX) : shift;

    const itemWidth = this._items[this._currentPosition].offsetWidth + this._settings.slidesSpacing;
    this._currentPosition = Math.ceil(Math.abs(shift) / itemWidth);

    this._adaptViewWrapSizes();
    this._itemsHolder.style.transform = `translateX(${ shift }px)`;

    document.getSelection().removeAllRanges();
  }

  /**
   * Calculates max X shift.
   * @returns {Number}
   * @private
   */
  _calcShiftMaxLength() {
    const holderWidth = Number.parseFloat(this._itemsHolder.style.width);

    let spaceForDisplayedItems = 0;

    for (let displayed = 0; displayed < this._settings.showCount; displayed++) {
      const displayedItemIdx = this._currentPosition + displayed;
      if (displayedItemIdx >= this._items.length) break;

      spaceForDisplayedItems += this._items[displayedItemIdx].offsetWidth + this._settings.slidesSpacing;
    }
    return holderWidth - (spaceForDisplayedItems - this._calcOppositeRight());
  }

  /**
   * Checks if selecting content.
   * @returns {Boolean}
   * @private
   */
  _checkSelection() {
    return this._settings.selectableContent && !document.getSelection().isCollapsed;
  }

  /**
   * Finishes drag correctly.
   * @private
   */
  _finishDrag() {
    if (!this._settings.draggable || !this._isSwiping) return;

    if (this._settings.dragAutoFinishing) {
      const shift = this._offset > 0 ? this._shift - this._calcOppositeRight : this._shift;
      this._itemsHolder.style.transform = `translateX(${ shift }px)`;
    } else {
      this._offset = -(this._calcShiftedItemsTotalWidth());
    }

    this._shift = 0;
    if (!this._settings.dragAutoFinishing) {
      this._swipeStartX   = 0;
      this._swipeCurrentX = 0;
    }

    this._itemsHolder.style.transition = `transform ${ this._settings.movementSmooth }ms`;
  }

  /**
   * Calculates total width of shifted items.
   * @returns {number}
   * @private
   */
  _calcShiftedItemsTotalWidth() {
    let shiftedItemsTotalWidth = 0
    for (let item = 0; item < this._currentPosition; item++) {
      shiftedItemsTotalWidth += this._items[item].offsetWidth + this._settings.slidesSpacing;
    }
    return shiftedItemsTotalWidth;
  }

  /**
   * Implements the swipes logic.
   * @private
   */
  _processSwipe() {
    if (!this._isSwiping) return;

    this._makeSwipe();
    this._waitSwipeEnd();

    this._swipeStartX   = 0;
    this._swipeCurrentX = 0;
  }

  /**
   * Prevent new swipes before the animation end of the last.
   * @private
   */
  _waitSwipeEnd() {
    if (!this._settings.swipesInterruption && this._settings.dragAutoFinishing) {
      const delay = this._settings.movementSmooth / this._settings.swipeEndWaitingReduce;
      setTimeout(() => this._isSwiping = false, delay);
    } else {
      this._isSwiping = false;
    }
  }

  /**
   * Implements the logic of items holder movement.
   * @private
   */
  _makeSwipe() {
    if (this._checkSelection()) return;

    const swipeLength  = this._swipeStartX - this._swipeCurrentX;
    const isEnoughSensitive = this._checkSwipeSensitivity();

    if (isEnoughSensitive) {
      swipeLength > 0 ? this._rightMoveHandler() : this._leftMoveHandler();
    }
  }

  /**
   * Checks if swipe length is enough long to satisfy a condition.
   * @returns {Boolean}
   * @private
   */
  _checkSwipeSensitivity() {
    const swipeLength  = this._swipeStartX - this._swipeCurrentX;

    const visibleWidth = Number.parseFloat(this._viewLimiter.style.width);
    const sensitivity  = this._settings.swipeSensitivity;

    return (
      swipeLength > visibleWidth / sensitivity ||
      Math.abs(swipeLength) > visibleWidth / sensitivity
    );
  }

  /**
   * Moves slider to the left if parent asked it to.
   * @private
   */
  _moveRelatedLeftHandler() {
    this._moveLeft();
  }

  /**
   * Moves slider to the right if parent asked it to.
   * @private
   */
  _moveRelatedRightHandler() {
    this._moveRight();
  }
}

