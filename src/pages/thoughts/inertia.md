import BlogPost from "../../../components/BlogPost";
import Browser from "../../../components/BrowserDemo";
import Lesson from "../../../components/Lesson";
import Card from "../../../components/Card";
import Blockquote, { Cite } from "../../../components/Blockquote";

export const meta = {
  published: false,
  publishedAt: "2020-12-14",
  title: "How Inertia Influences My Technical Decisions",
  summary: "One of my most used mental models is considering my decisions' inertia, or resistance to change, before making a choice. Why and how is that helpful?",
  image: "https://cdn.splitbee.io/og/08763fac65?headline=The%20Inertia%20of%20Decisions&url=mxstbr.com%2Fthoughts%2Finertia",
  likes: 0
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

It takes a lot more energy to change the direction of a cruise ship than to change the direction of a pontoon boat, even when they're going to same speed and direction. This is called _inertia_: cruise ships have higher inertia, resistance to change, than pontoon boats.

<em style={{ display: `block`, borderLeft: `4px solid #DDD`, paddingLeft: `16px` }}>

**Inertia** /ɪˈnəːʃə/: a property of matter by which it retains its velocity along a straight line unless acted upon by some external force.

</em>

Decisions also have inertia: some of them are harder to change than others. I [learned the hard way](/thoughts/tech-choice-regrets-at-spectrum) to consider this before every choice I make. I wasted a lot of time on reversible decisions but also rushed through lasting ones.

<Lesson title="Remember" body="Consider the inertia of your decisions. Spend your time accordingly." />

For example:

- Choosing a framework has high inertia: switching between different frameworks means rewriting large parts of my app, so I have to consider my choice carefully.
- Choosing a `_.defaults` method has little inertia: switching between lodash's and underscore's implementation takes less than a minute, so I quickly install either one and move on.

Particularly, I noticed that we developers spend more time than we should on low inertia decisions. We often think our choices are harder to reverse than they actually are. This is very counterproductive, as it's faster to undo a low inertia decision than to scrutinize it.

Now, I consider whether a decision _really_ has high inertia and bias towards action. This is particularly relevant for tech startups, as [momentum is their lifeblood](https://youtu.be/CVfnkM44Urs?t=2490).

Always keep moving.
