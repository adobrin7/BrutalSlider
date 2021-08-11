# BrutalSlider

BrutalSlider is a module of small slider that can respond many needs.

## Installation

Go to /src directory and copy code from BrutalSlider.js to your project.

## Usage

In main.js import BrutalSlider from path you copied the code.

```javascript
import { BrutalSlider } from "/yourPath";
```

Then just create class instance whenever you need to make a slider from a html container.

```javascript
new BrutalSlider({
  targetSelector: '.slider-1',
  leftSelector:   '.control-left',
  rightSelector:  '.control-right',
});
```

## Options

When you create a slider, there are lots of options, defaults are:

```javascript
new BrutalSlider({
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
});
```

[targetSelector] Selector to make the slider from.
___________________________________________________________________________________________
[leftSelector] Selector for left movement event handler.
___________________________________________________________________________________________
[rightSelector] Selector for right movement event handler.
___________________________________________________________________________________________
[relatedSliders] Selectors for sliders moved by the current.
___________________________________________________________________________________________


[loadLatency] (ms) Delay for constructor call.
___________________________________________________________________________________________
[centering] true, for centering slider horizontally in container, otherwise false.
___________________________________________________________________________________________


[moveCount] Slides to move at once.
___________________________________________________________________________________________
[showCount] Slides to show.
___________________________________________________________________________________________
[startPosition] Which slide to move to when initializing.
___________________________________________________________________________________________
[slidesSpacing] Distance between slides.
___________________________________________________________________________________________
[neighborsVisibleWidth] View limiter extra width to display sibling sides.
___________________________________________________________________________________________


[movementSmooth] (ms) Movement animation delay.
___________________________________________________________________________________________
[resizingLatencyY] (ms) Height resizing animation delay.
___________________________________________________________________________________________
[resizingLatencyX] (ms) Width resizing animation delay.
___________________________________________________________________________________________


[swipes] true, to enable pointer event handlers, otherwise false.
___________________________________________________________________________________________
[draggable] true, to make slider follow pointer, otherwise false.
___________________________________________________________________________________________
[dragAutoFinishing] true, for adding extra offset to reach next slide after drag,
otherwise false.
___________________________________________________________________________________________
[pointerTrackingInterval] (ms) Pointer move event handler response delay.
___________________________________________________________________________________________
[swipeSensitivity] The part of the visible area
that the pointer should pass for swipe processing.
___________________________________________________________________________________________
[increasedTrackingArea] true, to process pointer moves outside the slider, otherwise false.
___________________________________________________________________________________________
[swipesInterruption] true, to process a new swipe before the previous swipe animation ends,
otherwise false.
___________________________________________________________________________________________
[swipeEndWaitingReduce] How many times earlier, the swipe animation is *considered* complete.
___________________________________________________________________________________________


[selectableContent] true, to make slider content selectable, otherwise false.
___________________________________________________________________________________________
[timeToSelect] (ms) Drag logic pause time.
___________________________________________________________________________________________
[autoplay] true, for auto movement.
___________________________________________________________________________________________
[autoplayDelay] (ms) Auto movement delay.
___________________________________________________________________________________________
[autoplayDirection] Auto movement direction.
___________________________________________________________________________________________
