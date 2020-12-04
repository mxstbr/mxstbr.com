import BlogPost from "../../../components/BlogPost";
import Lesson from "../../../components/Lesson";
import TwinMacroExample from "../../../components/TwinMacroExample";

export const meta = {
  published: false,
  publishedAt: "2020-05-28",
  title: "Why I Think Tailwind is marvelous",
  summary: "",
  image: ""
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

[Tailwind.css](https://tailwindcss.com) is an atomic CSS framework that gives developers the ability to build visually gorgeous, modern UIs without requiring a deep understanding of visual design. It enables developers to cross ["The Gap"](https://vimeo.com/85040589) and build beautiful apps without needing a designer.

Tailwind.css has taken the frontend world by storm. If you have not seen it before, here is the canonical example from the Tailwind.css homepage:

```html
<div class="shadow-lg md:flex bg-white rounded-lg p-6 leading-normal">
  <img class="h-16 w-16 md:h-24 md:w-24 rounded-full mx-auto md:mx-0 md:mr-6" src="avatar.jpg" />
  <div class="text-center md:text-left">
    <h2 class="text-lg">Erin Lindford</h2>
    <div class="text-purple-500">Customer Support</div>
    <div class="text-gray-600">erinlindford@example.com</div>
    <div class="text-gray-600">(555) 765-4321</div>
  </div>
</div>
```

<link href="https://unpkg.com/tailwindcss@^1.0/dist/tailwind.min.css" rel="stylesheet"/>

<div className="shadow-lg md:flex bg-white rounded-lg p-6 leading-normal">
  <img
    className="h-16 w-16 md:h-24 md:w-24 rounded-full mx-auto md:mx-0 md:mr-6" 
    src="https://randomuser.me/api/portraits/women/17.jpg"
  />
  <div className="text-center md:text-left">
    <div className="text-lg">Erin Lindford</div>
    <div className="text-purple-500">Customer Support</div>
    <div className="text-gray-600">erinlindford@example.com</div>
    <div className="text-gray-600">(555) 765-4321</div>
  </div>
</div>

<br />

I have heard many people say that Tailwind.css is cool because it uses atomic CSS. Here is the thing though: **Tailwind.css is awesome _despite_ using atomic CSS, not because of it**.

Hear me out.

### The key to Tailwind.css is its system

We have had [atomic](https://github.com/basscss/basscss/commit/ed65eec980c4899d930f2c293f70bc619573456f) [CSS](https://github.com/tachyons-css/tachyons/commit/7f27af8d52d8ed03615e23a9db5ff33fc8153729) [frameworks](https://medium.com/buzzfeed-design/introducing-solid-1c16b1bf4868) for years, but none of them have blown up quite like Tailwind.css has over the past year.

**The reason for Tailwind.css's popularity is the painstakingly constructed system of design tokens at the core of the framework.** Tailwind (the system) has _just_ the right constraints that give developers the ability to "design" user interfaces that look visually gorgeous.

Tailwind (the system) is an absolute masterpiece and rightfully developers all around the world are falling in love with it.

### The problem with Tailwind.css

Tailwind.css (the atomic CSS framework) is simply a delivery mechanism for the system to allow developers to apply it to their UIs. However, as we've learned over the past decade [atomic CSS has many downsides](https://jxnblk.com/blog/two-steps-forward/):

- It requires users to memorize a whole vocabulary. "How do I set the line-height? Ah, with... `.leading-normal`? Alright, now let me use the normal border radius. For that, I have to use... `.rounded`?! Without `-normal`?!"
- Users have use a separate setup for all the [custom CSS they inevitably need](https://twitter.com/kentcdodds/status/1240868842361913347) (["bailwind"](https://twitter.com/samselikoff/status/1251637275412357121)). There is also no way to use keyframes, pseudo-selectors, etc. without dropping out of the atomic CSS framework.
- Atomic CSS also does not scale well performance-wise as there is no tooling that can extract the _per-page_ critical CSS. Developers are always shipping more CSS to the browser than necessary, particularly the bigger and more dynamic their app becomes.

### Tailwind without the downsides

Now, here is the thing: if you are using React, you can have your cake and eat it too. You can use the fine-tuned system that makes it simple to build beautiful UIs _and_ avoid the downsides of atomic CSS at the same time!

How? [twin.macro](https://github.com/ben-rogerson/twin.macro).

Let me illustrate. Here is the canonical Tailwind example built with twin.macro and React:

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

Unsurprisingly, the UI comes out looking the exact same — it is using the same underlying system after all. Even the code looks identical except that we use the `tw` prop instead of the `class` attribute.

However, important is what's happening under the hood. This is not shipping a CSS file with all the classes used throughout your app to the client. Instead, this automatically compiles to CSS-in-JS with [the css prop](https://medium.com/styled-components/announcing-native-support-for-the-css-prop-in-styled-components-245ca5252feb) like this:

```js
import "twin.macro"

<div tw="text-center md:text-left" />

// ↓↓↓↓↓ is turned into ↓↓↓↓↓

<div 
  css={{
    textAlign: "center",
    "@media (min-width: 768px)": {
      "textAlign":"left"
    }
  }}
/>
```

Note how it transpiles to the actual CSS rules the Tailwind.css classes refer to. Since this is CSS-in-JS this has [all the advantages CSS-in-JS has to offer](/thoughts/css-in-js):

- Fully automatic critical CSS extraction and code splitting
- No need for custom vocabulary or magic, it's Just CSS™ (authored in JS)
- You can bail on the system whenever you need to
- Easy extending without specificity issues
- No build setup necessary
- Critical CSS extraction is fully automatic (!)

With twin.macro you can **leverage Tailwind's marvelous system without the downsides of atomic CSS**. Smart people have recognized and solved these downsides a long time ago. Let's take advantage of their work and the marvelous Tailwind system together. Let's take three steps forward.