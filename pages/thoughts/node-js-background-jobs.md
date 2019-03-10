import BlogPost from "../../components/BlogPost";

export const meta = {
  published: false,
  publishedAt: "2019-02-28",
  title: "How We Handle 12 Million Monthly Background Jobs With Node.js",
  summary: ""
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

👋 I am Max, the technical co-founder of [Spectrum](https://spectrum.chat). Spectrum is an [open source](https://github.com/withspectrum/spectrum) chat app for large online communities and was recently acquired by GitHub. We are a team of three with a predominantly frontend and design background and have worked on it for close to two years.

Our Node.js servers handled over 12 million background jobs last month, varying from sending an email to processing notifications. Let's dive into how we handle that scale!

### Why Do We Need Background Jobs?

Some user actions trigger complex processes, like sending notification emails and spam checking when users post new messages. We do not want our users to wait long for responses, so we run these tasks asynchronously in the background.

### What Does The Architecture Look Like?

We set up six worker servers that are solely responsible for background processing, and split our ~70 queues between them based on type. For example, one worker ("hermes") sends emails and another ("athena") handles notifications. Each worker is scaled to many instances that share the load.

Our web servers add jobs to the queues and then respond to the users without waiting for the result. Our workers process them asynchronously in the background as they have time.

### Where Are The Job Queues Stored?

To handle that we chose a package called [bull](https://github.com/optimalbits/bull), which uses Redis under the hood. We initially selected it over the alternatives due to its intuitive API, but it has also proven to be the most stable part of our entire infrastructure.

Here is a real-world example of a job from our codebase:

```javascript
// API server
import Queue from "bull";

const messageNotificationsQueue = new Queue("message-notifications");

messageNotificationsQueue.add({
  messageId: message.id
});
```

```javascript
// Worker server
import Queue from "bull";

const messageNotificationsQueue = new Queue("message-notifications");

messageNotificationsQueue.process(job => {
  // ...send message notifications for job.data.messageId...
});
```

### Would We Use Bull Again?
