import BlogPost from "../../../components/BlogPost";
import Browser from "../../../components/BrowserDemo";
import Lesson from "../../../components/Lesson";
import Card from "../../../components/Card";

export const meta = {
  published: false,
  publishedAt: "2020-12-14",
  title: "On the Inertia of Decisions",
  summary: "Decisions have different inertia, or resistance to change.",
  image: "https://cdn.splitbee.io/og/08763fac65?headline=On%20the%20Inertia%20of%20Decisions&url=mxstbr.com%2Fthoughts%2Finertia",
  likes: 0
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

Different decisions have different resistance to change or "inertia".

<div style={{ borderLeft: `4px solid #DDD`, paddingLeft: `16px` }}>

**Inertia** /ɪˈnəːʃə/: a tendency to do nothing or to remain unchanged.

</div>

I have found this to be a helpful mental model over the past years. The higher the inertia of a decision, the more time I need to spend on it. The lower the inertia of a decision, the less time I should spend on it.

For example:

- Choosing a framework has high inertia: switching to a different framework would mean rewriting large parts of my app, so I consider my choice carefully. (I [learned that the hard way](/thoughts/tech-choice-regrets-at-spectrum))
- Choosing a `_.defaults` method has little inertia: switching between lodash's and underscore's implementation takes less than a minute, so I simply make any choice and move on.

I now always consider the inertia of a decision beforehand and act accordingly. I don't want to waste time on irrelevant decisions or rush important ones.

<Lesson title="Lesson 1" body="Consider the inertia of your decisions and spend your time accordingly." />

I have also realised that it is very common to spend too much time on decisions with low inertia. Particularly in teams people like to add their two cents to every tiny decision.

It is often better to make a choice, any choice, than to think about or debate what the best option is — particularly for startups.

<Lesson title="Lesson 2" body="Always keep moving. Bias towards action." />
