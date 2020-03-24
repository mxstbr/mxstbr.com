import BlogPost from "../../components/BlogPost";
import Browser from "../../components/BrowserDemo";
import { TwitterTweetEmbed } from "react-twitter-embed";

export const meta = {
  published: true,
  publishedAt: "2020-02-03",
  title: "I am joining Gatsby",
  summary:
    "I am joining Gatsby to work on open source R&D projects including Blocks, the visual editor for React apps, theme-ui, mdx and Gatsby themes! 🎉",
  image: "/static/images/gatsby.png",
  likes: 2015
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

The cat is out of the bag: I am joining [Gatsby](https://gatsbyjs.com) to work on open source R&D projects, including [Blocks](https://blocks-ui.com), [theme-ui](https://theme-ui.com), [mdx](https://mdxjs.com) and Gatsby themes!

I think Blocks is one of the most exciting open source projects in the React ecosystem right now. Blocks is a visual editor for your React apps: it renders a page of your app and lets you drag-and-drop components to edit the actual underlying code. 🤯

<TwitterTweetEmbed
  tweetId="1199384410199449600"
/>

This has wide reaching implications for the design and development process. Rather than drawing a bunch of rectangles, designers can visually edit code to design new pages. Instead of handing off static images, they can submit pull requests with their new designs.

I believe that a couple of years from now, visual editors will be standard in web development. Everybody will be using them. However, there is a lot of work left to make them great and I cannot wait to be a part of that!
