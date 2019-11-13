import BlogPost from "../../components/BlogPost";
import Browser from "../../components/BrowserDemo";
import Lesson from "../../components/Lesson";

export const meta = {
  published: false,
  publishedAt: "2019-12-01",
  title: "Why We Open Sourced Our Product",
  summary: "THIS IS MISSING",
  // image: "/static/images/css-in-js.png"
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

👋 I am Max, the technical co-founder of [Spectrum](https://spectrum.chat). Spectrum is a chat app for large online communities which GitHub acquired a year ago. We are a team of three with a predominantly frontend and design background and worked on it for three years.

Spectrum was a standard closed source product until 3rd of April, 2018, when we announced that we had [open sourced the entire codebase](https://spectrum.chat/spectrum/general/announcement-spectrum-goes-open-source~556b4915-7269-46a7-96e6-f38446d14146). Why did we decide to open source our entire product?

## The Benefits

The two big reasons for open sourcing our product were feeling good and marketing. 