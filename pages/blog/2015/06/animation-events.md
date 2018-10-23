export const frontmatter = {
  "published": true,
  "title": "CSS3 Animation Events in JavaScript",
  "tags": "javascript css animation"
};

## CSS3 Animation Events in JavaScript

I first came in contact with these events while revamping my personal website, http://mxstbr.com. The loading animation is an infinite animation that gets stopped as soon as the webpage has loaded. To achieve the border—closing effect, I used the `animationiteration` event and a few `setTimout`s. 

### Basics
There are 3 CSS3 animation events you can bind in JavaScript:

1. `animationstart` — fires when the animation starts
2. `animationiteration` — fires when an animation loop starts again
3. `animationend` — fires when an animation ends (attention, never fires for infinite animations)

Even though these events are supported by most browsers, prefixes have to be included for Safari, IE and Opera. To make our life even worse, the prefixed versions are camelCased, while the normal version is not. 

### Prefixing
With help by the great [Rachel Nabors](https://twitter.com/RachelNabors), I created a handy snippet to make using those events easier. They will save the correctly prefixed version in the global `animationStart`, `animationIteration` and `animationEnd` variables, which you can then use to bind the event.

```JavaScript
// Initialise needed variables
var prefixes = ["webkit", "moz", "MS", "o"];
var elem = document.createElement('div');

// Animation Start
window.animationStart = "animationstart";
for (var i = 0; i < prefixes.length; i++) {
    if (elem.style[prefixes[i] + "AnimationStart"] !== undefined){
        window.animationStart = prefixes[i] + "AnimationStart";
        break;
    }
}

// Animation Iteration
window.animationIteration = "animationiteration";
for (var i = 0; i < prefixes.length; i++) {
    if (elem.style[prefixes[i] + "AnimationIteration"] !== undefined){
        window.animationIteration = prefixes[i] + "AnimationIteration";
        break;
    }
}

// Animation End
window.animationEnd = "animationend";
for (var i = 0; i < prefixes.length; i++) {
    if (elem.style[prefixes[i] + "AnimationEnd"] !== undefined){
        window.animationEnd = prefixes[i] + "AnimationEnd";
        break;
    }
}
```

Now we just need to bind the event, calling the `doSomething` function when it fires:

```
element.addEventListener(animationStart, doSomething, false);
element.addEventListener(animationIteration, doSomething, false);
element.addEventListener(animationEnd, doSomething, false);
```

And that's it! Have fun playing around with CSS3 animation and the events!