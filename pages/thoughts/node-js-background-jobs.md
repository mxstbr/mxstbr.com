import BlogPost from '../../components/BlogPost';

export const meta = {
  published: false,
  publishedAt: '2019-02-28',
  title: 'How We Handle 10 Million Background Jobs a Month in Node.js',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

👋 I am Max, the technical co-founder of [Spectrum](https://spectrum.chat). Spectrum is an [open source](https://github.com/withspectrum/spectrum) chat app for large online communities and was recently acquired by GitHub. We are a team of three with a predominantly frontend and design background and have worked on it for close to two years.

We wrote our servers in Node.js, and handled over 12 million background jobs last month. Our six workers (each with as many instances as necessary) share the load depending on the type of job.

### Why Do We Need Background Jobs?

Spectrums users expect everything to happen in real-time. Our API has to respond as quickly as possible to all requests. So all heavy computations have to happen asynchronously in the background.

We set up worker servers that are solely responsible for background processing. To communicate between our web servers and our workers we use queues of background jobs that need to be processed. Our web servers add jobs to the queues, and the workers pick up the newest one from the queue and process it.

### Bull

To handle that we chose a package called [bull](https://github.com/optimalbits/bull), which uses Redis under the hood. We initially selected it over the alternatives due to its intuitive API, but it has also proven to be the most stable part of our entire infrastructure.

### What Do Jobs Look Like?

Here is a real-world example of a job from our codebase:

```javascript
// API server
import Queue from 'bull'

const messageNotificationsQueue = new Queue('message-notifications')

messageNotificationsQueue.add({
  messageId: message.id
})
```

```javascript
// Worker server
import Queue from 'bull'

const messageNotificationsQueue = new Queue('message-notifications')

messageNotificationsQueue.process(job => {
  console.log(job.data.messageId)
})
```

### What Kind Of Jobs Do We Handle?

### Would We Use Bull Again?
