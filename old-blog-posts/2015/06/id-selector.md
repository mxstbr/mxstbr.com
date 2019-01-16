export const frontmatter = {
  "published": true,
  "title": "A little known way to escape CSS ID selector hell",
  "tags": "css specificity"
};



Specificity in CSS is a b*tch. If you have ever had to fix a nasty styling bug caused by an ID selector or unhealthy amounts of nesting, my heartfelt sympathy.

This blog post will demonstrate an alternative way to select elements by ID in CSS to keep our DOM clean. So, how does CSS select which style gets applied?

## Specificity

CSS uses a base–255 number system to calculate the specificity of a particular selector, and IDs have an infinitely higher specificity value than class, pseudo–class and attribute selectors.

In practice, this means that no amount of classes can outweigh an ID selector, even if they appear after the ID selector in the stylesheet.[^1] This is one of the main reasons why many, very smart people advocate against the use of IDs.[^2]

And I agree with them. 

Sometimes, you have to use IDs though, for example to deep link to headings for URL access. Also, `document.getElementById('id');` has better browser support than  `document.querySelector('class')`[^3], which is why people still resort to adding IDs to elements.

I do not want to style those elements via an ID selector to avoid styling bugs though, so I add a class to them and end up with elements like this:

```HTML
<div id="wrapper" class="wrapper"></div>
```

While this might not look like a big deal, it is non–optimal for DOM cleanliness. While combing through the [CSS selector specification](http://www.w3.org/TR/CSS21/selector.html#id-selectors) one day, I found a great and simple solution for this problem by accident.

## The selector

The trick is to use an attribute selector, but selecting the ID "attribute"! For the above example, the selector would look like this:

```CSS
div[id="wrapper"] { styles: here; }
```

This selector has the same specificity as a class selector, avoids weird CSS bugs and keeps your DOM clean. A win win win situation!

[^1]: For a great explanation how CSS specificity values are calculated, have a look at this [CSS-Tricks post](https://css-tricks.com/specifics-on-css-specificity/) and this [post](http://www.stuffandnonsense.co.uk/archives/css_specificity_wars.html) by Andy Clarke!

[^2]: Here are a [few](http://screwlewse.com/2010/07/dont-use-id-selectors-in-css/) [posts](https://www.quora.com/Why-is-it-considered-bad-form-to-use-an-ID-selector-in-a-CSS-stylesheet?share=1) [about](http://www.atozcss.com/the-id-selector/) [this](http://blog.dmbcllc.com/why-css-rules-are-evil-in-aspnet/) [topic](http://oli.jp/2011/ids/).     

[^3]: Specifically, `document.querySelector` is not supported in IE6 and 7, and only partially in IE8, where `document.getElementById` is fully supported. (See [here](http://caniuse.com/#search=getElementById) and [here](http://caniuse.com/#feat=queryselector))