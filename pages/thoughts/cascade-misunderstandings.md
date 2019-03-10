import BlogPost from "../../components/BlogPost";
import Paragraph from "../../components/Paragraph";
import Browser from "../../components/BrowserDemo";

export const meta = {
  published: false,
  publishedAt: "2019-01-30",
  title: "57% of Developers Misunderstand the Cascade in CSS",
  summary: ""
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

57% of frontend developers misunderstand the "Cascade" in Cascading Style Sheets (CSS). Do you?

Given these classes, which color would the divs be?

```html
<style>
  .red {
    background: red;
  }

  .blue {
    background: blue;
  }
</style>

<div class="red blue" />
<div class="blue red" />
```

Possible answers:

1. First red, second blue
2. First blue, second red
3. Both blue
4. Both red

What do you think?

---

<details>
  <Paragraph style={{ display: 'inline-block' }} as="summary">Click to see the correct answer</Paragraph>

<Paragraph>Both will be blue! Here is a live demo:</Paragraph>

<Browser
  html={`
    <style>
      .box {
        width: 50px;
        height: 50px;
        margin: 8px;
        color: white;
        font-family: sans-serif;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .wrapper {
        display: flex;
        flex-direction: row;
      }
      .red {
        background: red;
      }
      .blue {
        background: blue;
      }
    </style>
    <div class="wrapper">
      <div class="box red blue">1</div>
      <div class="box blue red">2</div>
    </div>
    `}
/>

</details>

If that surprises you, do not worry. [Only 43% out of 13,000 developers answered correctly](https://twitter.com/mxstbr/status/1038416725182697472) in an informal Twitter poll.
