import BlogPost from "../../components/BlogPost";
import Browser from "../../components/BrowserDemo";
import { TwitterTweetEmbed } from "react-twitter-embed";

export const meta = {
  published: false,
  publishedAt: "2020-01-31",
  title: "I am joining Gatsby",
  summary:
    "",
  image: ""
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

The cat is out of the bag: I am joining [Gatsby](https://gatsbyjs.com) to work on [Blocks](https://blocks-ui.com), theme-ui and Gatsby themes. 🎉

I think Blocks is the most exciting development in the React ecosystem right now. Blocks is a visual editor for your React apps: you can drag-and-drop your own components and it will edit your actual code. 

<TwitterTweetEmbed
  tweetId="1199384410199449600"
/>

This has wide reaching implications for the development process. Rather than handing off static drawings to developers, designers can visually edit code to "design" new pages. Instead of uploading images to Dropbox they can submit pull requests with their new "designs".

A couple of years from now, visual editors will be a standard part of the React toolchain. Everybody will be using them. However, there is a lot of work left to make them great and I can't wait to be a part of that!

