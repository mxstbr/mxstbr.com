import BlogPost from "../../../components/BlogPost";
import Lesson from "../../../components/Lesson";
import TwinMacroExample from "../../../components/TwinMacroExample";

export const meta = {
  published: false,
  publishedAt: "2020-05-28",
  title: "Why I Love Tailwind",
  summary: "Why Tailwind is blowing up, why I (the creator of styled-components) love it and how I avoid the downsides of atomic CSS.",
  image: "/static/images/tailwind.jpeg"
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

[Tailwind.css](https://tailwindcss.com) is an atomic CSS framework that has taken the frontend world by storm. It gives developers without a deep understanding of design the ability to build visually gorgeous, modern user interfaces. 

If you have not seen it before, here is the canonical Tailwind.css example from their original homepage:

```html
<div class="shadow-lg flex bg-white rounded-lg p-6 leading-normal">
  <img class="h-24 w-24 rounded-full mx-auto mx-0 mr-6" src="avatar.jpg" />
  <div class="text-center text-left">
    <div class="text-lg">Erin Lindford</div>
    <div class="text-purple-500">Customer Support</div>
    <div class="text-gray-600">erinlindford@example.com</div>
    <div class="text-gray-600">(555) 765-4321</div>
  </div>
</div>
```

<style>{`
sup {   font-size: 75%;   line-height: 0;   position: relative;   vertical-align: baseline;   top: -0.5em }
.footnotes * { font-size: inherit!important; }
.footnotes { font-size: 0.9em; }
.footnotes li { max-width: 100%; }
.shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05); }
.p-6 { padding: 1.5rem; }
.leading-normal { line-height: 1.5; }
.rounded-lg { border-radius: .5rem; }
.bg-white { background-color: #fff; }
.h-16 { height: 4rem; }
.w-16 { width: 4rem; }
.rounded-full { border-radius: 9999px; }
.mx-auto { margin-left: auto; margin-right: auto; }
.text-center { text-align: center; }
.text-lg { font-size: 1.125rem; }
.text-purple-500 { color: #9f7aea; }
.text-gray-600 { color: #718096; }
.flex { display: flex; }
.h-24 { height: 6rem; }
.w-24 { width: 6rem; }
.mx-0 { margin-left: 0; margin-right: 0; }
.mr-6 { margin-right: 1.5rem; }
.text-left { text-align: left; }
`}</style>

<div className="shadow-lg flex bg-white rounded-lg p-6 leading-normal" style={{ fontFamily: "sans-serif" }}>
  <img
    className="h-24 w-24 rounded-full mx-auto mx-0 mr-6" 
    src="https://randomuser.me/api/portraits/women/17.jpg"
  />
  <div className="text-center text-left">
    <div className="text-lg">Erin Lindford</div>
    <div className="text-purple-500">Customer Support</div>
    <div className="text-gray-600">erinlindford@example.com</div>
    <div className="text-gray-600">(555) 765-4321</div>
  </div>
</div>

<br />
<br />

Many people think Tailwind.css is cool because it uses atomic CSS. Here is the thing though: **Tailwind.css is awesome _despite_ using atomic CSS, not because of it**.

Hear me out.

### The key to Tailwind.css

We have had [atomic](https://github.com/basscss/basscss/commit/ed65eec980c4899d930f2c293f70bc619573456f) [CSS](https://github.com/tachyons-css/tachyons/commit/7f27af8d52d8ed03615e23a9db5ff33fc8153729) [frameworks](https://medium.com/buzzfeed-design/introducing-solid-1c16b1bf4868) for almost a decade but none of them have been as critically acclaimed as Tailwind.css. What makes it different?

**The key to Tailwind.css's popularity is the painstakingly constructed system of design tokens at the core of the framework.** The system's carefully selected constraints give developers _just_ the right guardrails. They make it obvious whether a choice is good or bad by offering only discrete steps.

This does require some design _taste_, but all engineers I know have developed that over the years of building user interface. Tailwind's sytem lets them turn that taste into implementation without requiring a lot of design _skill_ — it helps them cross ["the gap"](https://vimeo.com/85040589).

Tailwind's system is a masterpiece of design. I and many other developers all around the world feel empowered by and love it.

### The problem with Tailwind.css

Tailwind.css (the atomic CSS framework) is simply a delivery mechanism for the system that allows developers to apply it to their UIs. However, we have learned over the past decade that [atomic CSS has downsides](https://jxnblk.com/blog/two-steps-forward/):

- Users still have to add a separate setup for the [custom CSS they inevitably need](https://twitter.com/kentcdodds/status/1240868842361913347) (coined ["bailwind"](https://twitter.com/samselikoff/status/1251637275412357121)). You cannot get by on _just_ Tailwind.css in the real world.
- More importantly, atomic CSS does not scale as well as it should. No tooling can extract the _per-page_ critical CSS, so developers are shipping more CSS to the browser than necessary. The bigger and more dynamic the app, the more noticeable the unnecessary bundle size.[^1]

At the same time, it's undeniable that the developer experience of Tailwind.css is fantastic. It does require learning a custom vocabulary, but once you get used to it you feel like you are flying!

### Tailwind without the downsides

Now, here is the thing: if you are using a JavaScript framework you can have your cake and eat it too. You can use Tailwind's marvelous system and fantastic developer experience without the downsides of atomic CSS.

How? [twin.macro](https://github.com/ben-rogerson/twin.macro)!

Let me illustrate. Here is the canonical Tailwind example built with [twin.macro](https://github.com/ben-rogerson/twin.macro) and React:

```jsx
import "twin.macro"

const Card = () => (
  <div tw="shadow-lg md:flex bg-white rounded-lg p-6 leading-normal">
    <img tw="h-16 w-16 md:h-24 md:w-24 rounded-full mx-auto md:mx-0 md:mr-6" src="avatar.jpg" />
    <div tw="text-center md:text-left">
      <h2 tw="text-lg">Erin Lindford</h2>
      <div tw="text-purple-500">Customer Support</div>
      <div tw="text-gray-600">erinlindford@example.com</div>
      <div tw="text-gray-600">(555) 765-4321</div>
    </div>
  </div>
)
```

<TwinMacroExample />

<br />

Unsurprisingly, the result looks identical — we are still using the same system after all. Even the code looks the same, except that we use the `tw` prop instead of the `class` attribute!

However, under the hood this automatically compiles to CSS-in-JS with [the css prop](https://medium.com/styled-components/announcing-native-support-for-the-css-prop-in-styled-components-245ca5252feb):

```jsx
import "twin.macro"

<div tw="text-center md:text-left" />

// ↓↓↓↓↓ turns into ↓↓↓↓↓

import "styled-components/macro"

<div 
  css={{
    textAlign: "center",
    "@media (min-width: 768px)": {
      "textAlign":"left"
    }
  }}
/>
```

This transpiles to the actual CSS rules the Tailwind.css classes refer to, which means it has [all the advantages of CSS-in-JS](/thoughts/css-in-js):

- Extending your elements with custom styles is as simple as using the css prop, no extra setup required to "bailwind":

  ```jsx
  import "twin.macro"

  <div
    tw="text-center md:text-left"
    css={{ `&:hover`: { backgroundImage: `url("/bg.png")` } }}
  />
  ```

- Most importantly, this does fully automatic critical CSS extraction and code splitting: users will only load exactly the styles they need for the page they see — nothing more and nothing less!

The ideal setup for both developer _and_ user experience!

<Lesson title="Lesson" body={<>use <a href="https://github.com/ben-rogerson/twin.macro" target="_blank">twin.macro</a> to leverage Tailwind's marvelous system and developer experience without the downsides of atomic CSS.</>} />

Rather than taking two steps forward with Tailwind's system and one step backward with atomic CSS, let's take five steps forward. Together.

[^1]: As always with performance there is a lot of nuance to this point. The first-paint with CSS-in-JS will always be faster as the critical CSS for the requested page is inlined into a `<style>` tag. This saves both an extra network request for the `.css` file as well as not shipping any CSS not used on that specific page. However, the JavaScript bundle includes the CSS-in-JS library, so the Time To Interactive might be slightly slower for small apps. However, at some point the size of the Tailwind-generated CSS file will outweigh any CSS-in-JS library, which doesn't grow in size.&nbsp;