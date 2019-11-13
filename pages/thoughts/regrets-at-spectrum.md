import BlogPost from "../../components/BlogPost";
import Lesson from "../../components/Lesson";

export const meta = {
  published: false,
  publishedAt: "2019-01-16",
  title: "More Regrets",
  summary: ""
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

👋 I am Max, the technical co-founder of [Spectrum](https://spectrum.chat). Spectrum is an [open source](https://github.com/withspectrum/spectrum) chat app for large online communities and was recently acquired by GitHub. We are a team of three with a predominantly frontend and design background and have worked on it for close to two years.

### Regret 1: We Did Not Focus On Our Niche

- Wanted to build for our use case, open knowledge communities (e.g. open source)
- Needed to make money, so built business features
- Businesses were not interested, and had we focused on our core niche use case we would have grown much faster
- Easier to raise money if necessary, more satisfying, ultimately more momentum and higher chance at success

<Lesson
  title="Lesson 1"
  body="It's better to have 100 true fans who love the product than 10,000 barely interested users."
/>

### Regret 2: We Did Not Do Enough Marketing

- Spend too much time on building new, shiny features
- Should have spent more time on marketing, typical engineering mistake
- Not just social media, but also in-product growth marketing, marketing pages on the website, etc.

<Lesson 
  title="Lesson 2"
  body="Do way more marketing and sales than you think you need to do."
/>

### Regret 2.3: We Did Not Tell Our Story

- Branding was good and unique
- Brand did not have minimum viable personality https://avc.com/2011/09/minimum-viable-personality/
- It differentiates you from the "big guys" as they cannot have a story as personal as you in most cases
- The Practical Dev (dev.to) is doing a great job at this

<Lesson 
  title="Lesson 2"
  body="Tell your story, it differentiates you from the big players in a crowded market"
/>

### Regret 2.6: We Did Not Launch Often Enough

- Launches are great for marketing, every new release excites customers
- Shipped tons of stuff without ever announcing it
- Missed opportunity to showcase a new feature and get more users at the same time
- Now we are building Changefeed because it was too tedious

<Lesson 
  title="Lesson 3"
  body="Launch before you think you are ready and then again and again and again."
/>

### Regret 3: We Did Not Iterate (Quickly) Enough

- Had an early MVP built with minimal technology (Firebase)
- Saw some tiny traction, thought we needed proper setup for custom functionality

<Lesson 
  title="Lesson 4"
  body="Stick with the minimum viable technology setup until you feel product-market fit. You will know when you have it."
/>

### Regret 4: We Did Not Talk Enough With Users

- Went into a hole and built a shiny feature for months (e.g. WYSIWYG editing) without talking to users about their priorities
- Ended up wasting valuable time and adding a lot of unnessary tech debt

<Lesson 
  title="Lesson 5"
  body="Talk with your users, they should be your guiding star."
/>
