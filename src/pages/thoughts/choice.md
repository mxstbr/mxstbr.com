import BlogPost from "../../../components/BlogPost";
import Browser from "../../../components/BrowserDemo";
import Lesson from "../../../components/Lesson";
import Card from "../../../components/Card";
import Blockquote, { Cite } from "../../../components/Blockquote";

export const meta = {
  published: false,
  publishedAt: "2020-12-14",
  title: "Reduce Choice, Code Faster",
  summary: "",
  image: "",
  likes: 0
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

The secret of productive coders: they make less choices.

Experience is one way to reduce your options. If you know the best way of accomplishing what you want to do, you can ignore the other options. However, experience is not the only way to reduce choice.

Conventions are another way to reduce your options. If you adopt a convention, you no longer have to worry about the other options. For example with BEM, you remove the choice of how to format your element class names.

However, while conventions can be helpful, they are usually _recommendations_ enforced through human interaction. For example, nitpicks in code reviews.

Unfortunately, these human interactions can build resentment. "Senior" engineers that flag every little code style "error" for their junior engineers, frustrating them beyond belief.

Increasingly, there is tooling that reduces choice for developers. Whether or not it matches your personal preferences is irrelevant: the combination of reducing choice _and_ avoiding resentment is more important than any choice you could make.

For example:

- ESLint & Prettier: No choice regarding code style.
- styled-components: No choice regarding globally unique names.
- Design systems: No choice regarding common components.
- Spacer components : No choice regarding spacing.

These abstractions enforce constraints while still allowing you to do everything you need to get done.

Embrace the no-choice live, focus on what matters and move faster.