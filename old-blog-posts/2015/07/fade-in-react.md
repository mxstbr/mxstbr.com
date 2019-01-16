export const frontmatter = {
  "published": true,
  "title": "Fade in a React.js component",
  "tags": "react.js snippet jquery"
};



While making [sharingbuttons.io](http://sharingbuttons.io), I was searching for a way to fade in a component once it has finished loading. Thankfully, React calls the `componentDidMount` function after the initial render, so this is what I ended up hooking into.

```JavaScript
[…]
componentDidMount: function() {
	// Get the components DOM node
	var elem = this.getDOMNode();
	// Set the opacity of the element to 0
	elem.style.opacity = 0;
	window.requestAnimationFrame(function() {
		// Now set a transition on the opacity
		elem.style.transition = "opacity 250ms";
		// and set the opacity to 1
		elem.style.opacity = 1;
	});
}
[…]
```

*NOTE: I omitted vendor prefixes in favour of code clarity, do add them in production use.*

Notice the `requestAnimationFrame` on line 6 — without it, JavaScript would set the `transition` to `opacity 250ms` at the same time as the `opacity` to `0`, so the component would fade out first and fade back in afterwards, which is not intended. 