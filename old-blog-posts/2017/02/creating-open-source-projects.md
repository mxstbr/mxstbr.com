import PageHeader from '../../../../components/PageHeader'

export const frontmatter = {
  "published": true,
  "hidden": false,
  "title": "How to create open source projects",
  "tags": "open-source",
  "custom_excerpt": "Have you been wondering how to create or contribute to your first open source project? This post is for you."
};

<PageHeader title="How to create open source projects" />

As the maintainer of a fair amount of [open source projects](https://github.com/mxstbr) I get asked frequently "How do I create my first open source project?".

This question seems backwards to me. The open source aspect is a byproduct of the actual thing I do every single day: solving problems.

### Solve your own god damn problems

As a developer, what you do all day long is solve problems. Some of these problems are specific to the project you're working on. For example, rendering your companies' logo on the left side of your nav bar.

But you can solve some of the problems you have more generally. For example, adding authentication with GitHub to your app. This isn’t necessarily special or specific to you or your product at all - other developers have had this problem before or will have it in the future.

This is where the "Open Source Muscle" comes in. I’m always looking out for solutions I create which could be helpful for other people and can be generalised with a limited amount of effort.

When I see one of those I extract the solution from my current project, put it into its own folder, generalise it and push it up to GitHub, like [`micro-github`](https://github.com/mxstbr/micro-github), a GitHub OAuth server. (please make sure your company allows you to do this, and that you add unit tests, document the public API, add a license etc)

### No downsides

The worst thing that can happen by pushing something to GitHub is that you've now solved your own problem and nobody else uses your solution. So what, who cares? You've solved your problem, and next time you have it again you can fall back to your ready-made solution. On top of that you've trained your refactoring skills and thought about API design to make it usable for users. 💪

Eventually you will create something that other people find valuable and use and it'll be a "real" open source project with stars, issues, pull requests and whatnot. But that’s a by-product of you solving your own problems and exercising your open source muscle.
