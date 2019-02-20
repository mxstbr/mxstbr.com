import BlogPost from '../../components/BlogPost';

export const meta = {
  published: false,
  publishedAt: '2019-02-28',
  title: 'How We Handle 10 Million Background Jobs a Month in Node.js',
  summary: ''
}

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>

We use a package called [bull](https://github.com/optimalbits/bull), which works with Redis. We initially chose it over the alternatives due to its intuitive API, but it has also proven itself as the most stable part of our infrastructure.

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
