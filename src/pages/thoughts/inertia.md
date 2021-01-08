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

It takes a lot more energy to change the direction of a cruise ship than to change the direction of a pontoon boat, even when they're going to same speed and direction.

This is called _inertia_: cruise ships have higher inertia, resistance to change, than pontoon boats.

<em style={{ display: `block`, borderLeft: `4px solid #DDD`, paddingLeft: `16px` }}>

**Inertia** /ɪˈnəːʃə/: a property of matter by which it retains its velocity along a straight line unless acted upon by some external force.

</em>

Decisions also have inertia, some are harder to change than others. I [learned the hard way](/thoughts/tech-choice-regrets-at-spectrum) to consider this for every choice I make:

- The higher the inertia of a decision, the more time I should spend deciding.
- Correspondingly, the lower the inertia of a decision, the less time I should spend deciding.

Jeff Bezos calls these Type 1 and Type 2 decisions:

> **Type 1**: Almost impossible to reverse. Bezos calls them "one-way doors." Think selling your company. Or quitting a job. In short, figuratively jumping off a cliff. Once you make a Type 1 decision, there's no going back.
>
> **Type 2**: Easy to reverse. Bezos calls these decisions "two-way doors." Like starting a side hustle. Or offering a new service. Or introducing new pricing schemes. While Type 2 decisions might feel momentous, with a little time and effort (often a lot less than you think) they can be reversed. ([source](https://www.inc.com/jeff-haden/amazon-founder-jeff-bezos-this-is-how-successful-people-make-such-smart-decisions.html))

We developers tend to overestimate the inertia of our decisions. Most of our choices are easy to reverse, so it's often preferable to make a gut call and keep moving. This is particularly relevant for startups, as [momentum is their lifeblood](https://youtu.be/CVfnkM44Urs?t=2490).

Consider the inertia of your decisions & always keep moving.
