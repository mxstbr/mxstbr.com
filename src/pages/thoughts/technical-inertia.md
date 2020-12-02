import BlogPost from "../../../components/BlogPost";
import Browser from "../../../components/BrowserDemo";
import Lesson from "../../../components/Lesson";

export const meta = {
  published: false,
  publishedAt: "2020-12-14",
  title: "Technical Inertia",
  summary: "",
  image: "",
  likes: 0
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

> **inertia** /ɪˈnəːʃə/: a tendency to do nothing or to remain unchanged.

Different technical choices have different inertia, or resistance to change. For example, choosing a framework has high inertia. If you want to use a different framework you will likely have to rewrite large swaths of your app. On the other hand, choosing between lodash's `_.defaults` method and underscore's `_.defaults` method has very little inertia. You could switch between them or even write your own implementation in a minute.

The higher the inertia of a technical choice, the more time you should spend deciding. Corollary, the lower the inertia of a technical choice, the less time you should spend deciding.
