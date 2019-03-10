import BlogPost from "../../components/BlogPost";

export const meta = {
  published: false,
  publishedAt: "2019-01-20",
  title: "Spectrum in Hindsight: Good Tech Decisions",
  summary:
    "Spectrum is an open source chat app for large online communities. With the benefit of hindsight after two years, here are the great technical decisions we made"
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

### React

Well duh

### GraphQL

When we started building our API, we made the decision to use GraphQL rather than going with a standard RESTful setup. None of us had much backend experience, so the strictness of GraphQL allowed us to avoid many pitfalls, while the simple deprecation and evolution meant we could mess up and would still be fine.

### bull

We knew our API server would need to stay as nimble as possible, so a background job queue was a must. We investigated various technologies (LINK TO PR/ISSUE) and eventually settled on bull due to being based on rock-solid infra (Redis) and its great Node.js API. It has never let us down throughout the many millions of jobs its processed. (a more detailed post about our backend infrastructure will come)

### Prettier

Nothing grinds my gears like code style discussions. Prettier makes it possible to write code in whatever style you prefer, and then have it formatted to the codebase common style on commit. (lint-staged is awesome)

### Static type system

Using a static type system on top of JavaScript has saved us from many bugs. It seems like it should slow down your development, but in fact after a short upfront trudge you speed up and churn out code faster than before.

There are two projects that allow you to add static types to JavaScript, both of which work equally well. We went with Flow due to it having better React support at the time, but I'm sure TypeScript would've worked too.

### Cypress

Integration tests are the bane of many developers existance. They are finnicky, slow and tend to fail to catch bugs. Cypress aims to change that by redefining how browser integration tests are ran. It allows us to test our entire application, front to back, in one swoop and get feedback for every code change whether something fundamental broke.

They still aren't fast, but Cypress tests are much less finnicky and prone to unnecessary failure, making for a much nicer experience using them.
