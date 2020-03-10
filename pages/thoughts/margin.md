import BlogPost from "../../components/BlogPost";
import Browser from "../../components/BrowserDemo";
import Lesson from "../../components/Lesson";

export const meta = {
  published: false,
  publishedAt: "2019-03-15",
  title: "Margin considered harmful",
  summary:
    "",
  image: ""
};

export default BlogPost

We should ban margin from our components. Hear me out.

Margin breaks component encapsulation. A well-built component should not affect anything outside itself.

Margin makes reusability harder. Good components are usable in any context.

Margin conflicts with how designers think. Designers think about space in relation and context. They define how far a component should be from another component in a specific instance.

By banning margin from all components you have to build more reusable and encapsuled components.

### Spacer components

Instead of margin I recommend you use spacer components. For example, [Seek's design system](https://seek-oss.github.io/braid-design-system) popularized the `Stack` component:

```jsx
<Stack space={3}>
  <Item />
  <Item />
  <Item />
</Stack>
```

Using spacer components has another implication that is not obvious _a priori_.

By using spacer components, you specify the space between components in a specific instance. You have to define space in relation and context.

Who else thinks about space in relation and context? Designers.

Spacer components bring us closer to how designers think. They also force us to build more reusable and encapsulated components.

Use spacer components. Ban margin.

----

_I am not the first one to realize this. Thanks to [@markdalgleish](https://twitter.com/markdalgleish) and [@michaeltaranto](https://twitter.com/michaeltaranto) at Seek for paving the way and prompting me to think about it._

