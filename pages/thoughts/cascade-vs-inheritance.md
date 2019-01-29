import BlogPost from '../../components/BlogPost';

export const meta = {
  published: false,
  publishedAt: '2019-01-30',
  title: 'The Cascade',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

57% of frontend developers do not understand the CSS cascade. Do you? Given these classes, which color would the divs be?

```html
<style>
.red {
  color: red;
}

.blue {
  color: blue;
}
</style>

<div class="red blue" />
<div class="blue red" />
```
