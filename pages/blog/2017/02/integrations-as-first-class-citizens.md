import PageHeader from '../../../../components/PageHeader'

export const frontmatter = {
  "published": true,
  "hidden": false,
  "title": "Integrations as first class citizens",
  "tags": "atom git",
  "custom_excerpt": "Why I use Atom as my editor of choice, even though other editors may be faster, simpler or better."
};

<PageHeader title="Integrations as first class citizens" />

I was a Sublime Text user until I gave Atom a try. After using it exclusively for a few weeks there was no way for me to go back to Sublime Text, mainly due to a single feature: the git tree view integration.

### The git tree view

In Atom, the tree view in the sidebar shows the git status of your files:

![The tree view in Atom with some files being normal color, some green and some yellow](https://f.cloud.github.com/assets/671378/2404228/ea43d5ac-aa38-11e3-8324-6544a433ad23.png)

If you're like me and use git for everything, this is incredibly valuable. With a single glance one can see how many files the current change is touching, which sections of the code it edits and find related files without having to read every single name.

Whenever I try a new editor (like recently VSCode or Vim) it slows me down to not have that feature, to the point where I switch back to Atom just because of that.

### Integrations

I'm telling you this story for a reason. Integrations can make your project much more valuable. Companies have realised this, and many are focussing their efforts on integrations.

The best example of such a company is Slack, who put their integrations front and center. Once you're using Slack and get notified every time somebody opens a Pull Request, CI fails, your website performance degrades or a myriad of other things that you _want_ to know, it's hard to switch away.

The cost of setting all of that up again for another service and possibly losing some features you value will (for many folks) offset any problems they have with Slack.

### Integrations as first class citizens

For your next project think about integrations from the start. For some, integrations might not make sense, but if you have them at the forefront of your thoughts all the time you'll have a good chance of spotting opportunities you might've otherwise missed.
