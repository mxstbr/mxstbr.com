import BlogPost from "../../../components/BlogPost";
import Browser from "../../../components/BrowserDemo";
import Lesson from "../../../components/Lesson";
import Card from "../../../components/Card";
import Blockquote, { Cite } from "../../../components/Blockquote";

export const meta = {
  published: false,
  publishedAt: "2020-12-14",
  title: "The Inertia of Decisions",
  summary: "One of my most useful mental models is considering any decisions' inertia before making a choice. What does that even mean though?",
  image: "https://cdn.splitbee.io/og/08763fac65?headline=The%20Inertia%20of%20Decisions&url=mxstbr.com%2Fthoughts%2Finertia",
  likes: 0
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

Different decisions have different resistance to change or "inertia".

<div style={{ borderLeft: `4px solid #DDD`, paddingLeft: `16px` }}>

**Inertia** /ɪˈnəːʃə/: a tendency to do nothing or to remain unchanged.

</div>

The higher the inertia of a decision, the more time I need to spend on it. The lower the inertia of a decision, the less time I should spend on it. For example:

- Choosing a framework has high inertia: switching to a different framework would mean rewriting large parts of my app, so I consider my choice carefully. (I [learned that the hard way](/thoughts/tech-choice-regrets-at-spectrum))
- Choosing a `_.defaults` method has little inertia: switching between lodash's and underscore's implementation takes less than a minute, so I quickly install either one and move on.

I now always consider the inertia of my decisions beforehand and act accordingly. I don't want to waste time on reversible decisions or rush important ones.

<Lesson title="Lesson 1" body="Consider the inertia of your decisions and spend your time accordingly." />

I noticed specifically that I often spend more time than I should on low inertia decisions. Particularly in teams it can feel like everyone always has to add their two cents.

This is very counterproductive, as it's faster to undo a low inertia decision than to think about and/or debate it. Now, as soon as I realise I'm looking at a low inertia decision I make an immediate gut call and move on.

<Lesson title="Lesson 2" body="Always keep moving. Bias towards action." />