export const frontmatter = {
  "published": true,
  "title": "<details>",
  "tags": "html"
};



Toggling the visibility of content used to be quite tricky to do. Either you used some wonky CSS hacks with hidden checkboxes and labels, or you used JavaScript. Well, this is about to change thanks to a new HTML5 element called `details`.

## Browser support

The bad news is, browser support for this element is not perfect yet.[^1] If you are on *Firefox*, *IE* or *Opera Mini*, you will **not** see the examples below. The good news is, the `details` element degrades very nicely — on unsupported browsers, the content is simply shown and you cannot toggle it. This is not a problem for most use cases, users just have to deal with seeing the additional content by default.

There is a polyfill[^2] which supports Firefox and IE8+, but I would encourage you to have a think about simply not using it.[^3]

## Using `details`

The most basic markup for the `details` element looks like this:

```HTML
<details>
    <p>This content is hidden from view, and only visible on click.</p>
</details>
```

which renders this:

<div class="post__example">
    <div class="post__example-bar"><div class="post__example-controls"></div></div>
    <div class="post__example-content">
        <details>
            <p>This content is hidden from view, and only visible on click.</p>
        </details>
    </div>
</div>

So, what's going on here? When you click the toggle button, the browser adds an open attribute to the details element and the content is visible. The markup looks like this:

```HTML
<details open>
    <p>This content is visible.</p>
</details>
```

### The `summary` Element

Chrome renders the default text for the toggle button as “Details”. While that's an okay thing to do, you might want to change it to something a bit more descriptive. Thankfully, this is easily done with the `summary` element:

```HTML
<details>
    <summary>Show/Hide Content</summary>
    <p>This content is hidden from view, and only visible on click.</p>
</details>
```

<div class="post__example">
    <div class="post__example-bar"><div class="post__example-controls"></div></div>
    <div class="post__example-content">
        <details>
            <summary>Show/Hide Content</summary>
            <p>This content is hidden from view, and only visible on click.</p>
        </details>
    </div>
</div>

This is the details element without any CSS. Lets try enhancing it!

## CSS Shenanigans

### Dynamic Summary Text

Right now, the summary is static and always shows “Show/Hide Content” no matter if it's open or closed. Using CSS pseudo elements we can change that! First, the markup (notice the empty summary tag):

```HTML
<details>
    <summary></summary>
    <p>This content is hidden from view, and only visible on click.</p>
</details>
```

Now, the styling:

```CSS
summary:after {
    content: "Show content";
}

details[open] summary:after {
    content: "Hide content";
}
```

And the result:

<div class="post__example">
    <div class="post__example-bar"><div class="post__example-controls"></div></div>
    <div class="post__example-content">
            <details class="abc">
                <summary class="bcd"></summary>
                <p>This content is hidden from view, and only visible on click.</p>
            </details>
            <style>{`
                 .bcd:after {
                     content: "Show content";
                 }
                 .abc[open] .bcd:after {
                     content: "Hide content";
                 }
                 `}
            </style>
    </div>
</div>

Quite nice, huh?

### Animation

And to finish it off, lets add a fade in animation to the content. The markup stays the same as with the last example, but the styling changes a bit. First, the keyframe animation:

```CSS
@keyframes fadein {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}
```

Now lets add the animation to the content of the details:

```CSS
details p {
    animation: fadein 250ms ease-out;
}
```

NOTE: I am omitting browser specific prefixes here, for the sake of clarity. Please don't forget to add them in production! 

Here is the result with animation:

<div class="post__example">
    <div class="post__example-bar"><div class="post__example-controls"></div></div>
    <div class="post__example-content">
            <details class="cde">
                <summary class="def"></summary>
                <p>This content is hidden from view, and only visible on click.</p>
            </details>
            <style>
                {`
                    .cde p {
                        animation: fadein 250ms ease-out;
                        -webkit-animation: fadein 250ms ease-out;
                    }
                    .def:after {
                        content: "Show content";
                    }
                    .cde[open] .def:after {
                        content: "Hide content";
                    }
                    @-webkit-keyframes fadein {
                        from {
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }
                    @keyframes fadein {
                        from {
                            opacity: 0;
                        }
                        to {
                            opacity: 1;
                        }
                    }
                `}
            </style>
    </div>
</div>

Beautiful. I hope you enjoyed this post, if you have any questions don't hesitate to contact me on [Twitter](https://twitter.com/mxstbr)!

[^1]: http://caniuse.com/#feat=details

[^2]: https://github.com/chemerisuk/better-details-polyfill/

[^3]: Think about performance! Also, see [this conversation](https://twitter.com/rodneyrehm/status/601294047802748928) on Twitter.