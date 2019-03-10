import BlogPost from "../../components/BlogPost";
import Lesson from "../../components/Lesson";

export const meta = {
  published: false,
  publishedAt: "2019-01-16",
  title: "The Future is Server-Side",
  summary: ""
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;
