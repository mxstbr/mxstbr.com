import BlogPost from "../../components/BlogPost";
import Browser from "../../components/BrowserDemo";
import Lesson from "../../components/Lesson";

export const meta = {
  published: true,
  publishedAt: "2020-03-24",
  title: "Margin considered harmful",
  summary:
    "We should ban margin from our React components. Hear me out.",
  image: "/static/images/margin.png",
  likes: 1711
};

export default BlogPost

We should ban margin from our components. Hear me out.

Margin breaks component encapsulation. A well-built component should not affect anything outside itself.

Margin makes reusability harder. Good components are usable in any context or layout.

Margin conflicts with how designers think. Designers think about space in relation and context. They define how far a component should be from another component in a specific instance.

By banning margin from all components you have to build more reusable and encapsulated components.

### Moving responsibility

Instead of margin I have started using spacer components, which move the responsibility of managing space to the parent-level.

For example, the Braid design system popularized the [`Stack` component](https://seek-oss.github.io/braid-design-system/components/Stack):

```jsx
<Stack space={3}>
  <Item />
  <Item />
  <Item />
</Stack>
```

Using spacer components has implications that are not obvious _a priori_.

Spacer components (such as `Stack` above) can restrict spacing values to steps on a scale. That way, all spacing automatically aligns to the grid.

Spacer components define how far a component should be from another component in a specific instance. You have to define space in relation and context.

Who else thinks about space in relation and context? Designers.

Spacer components bring us closer to how designers think. They make our designs more consistent and they force us to build more reusable and encapsulated components.

Use spacer components. Ban margin.

----

_I am not the first one to realize this. Thanks to [@markdalgleish](https://twitter.com/markdalgleish), [@michaeltaranto](https://twitter.com/michaeltaranto) and [@mattcompiles](https://twitter.com/mattcompiles) at Seek, as well as my good friend [@okonetchnikov](https://twitter.com/okonetchnikov) for paving the way and prompting me to think about it._

