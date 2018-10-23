import PageHeader from '../../../../components/PageHeader'

export const frontmatter = {
  "published": true,
  "hidden": false,
  "title": "Build your first Node.js microservice",
  "tags": "node micro zeit",
  "twitter_large": true,
  "image": "micro-meta-image.png",
  "custom_excerpt": "A microservice is a single, self-contained unit which, together with many others, makes up a large application. Let's write our first microservice in JavaScript!"
};

<PageHeader title="Build your first Node.js microservice" />

A microservice is a single self-contained unit which, together with many others, makes up a large application. By splitting your app into small units every part of it is independently deployable and scalable, can be written by different teams and in different programming languages and can be tested individually.

[`micro`](https://github.com/zeit/micro) is a tiny (~100 LoC) module that makes writing a microservice in Node.js a joy. It's easy to use and super fast. No matter if you've used Node.js before or not, after this post you'll be able to write your own microservices!

### The Setup

There are two tiny steps needed for the setup, first we need to install `micro`:

```
npm install -g micro
```

> I'm installing it globally to make sure we get access to the `micro` command. If you know how to use [npm scripts](/2016/01/npm-scripts/), feel free to use those instead!

And second we need to create a file that will contain our microservice. Let's call it `index.js`:

```
touch index.js
```

### The First Steps

Our `index.js` file needs to export a single function, which `micro` will pass the incoming request and a response object to:

```javascript
module.exports = function (request, response) {
  // Your microservice here
}
```

The main function we'll use from `micro` is `send`, which allows us to send a response back to the client. Let's `require` it and send a simple "Hello World", no matter what the request is:

```javascript
const { send } = require('micro')

module.exports = function (request, response) {
  send(response, 200, 'Hello World! 👋')
}
```

`send` takes the response we want to send as the first argument, the HTTP status code the response should have as the second argument and some body (can also be JSON) as the third argument.

Starting our microservice is just one command away:

```
$ micro index.js

  Ready! Listening on http://0.0.0.0:3000
```

Open the page in your browser and this is what you'll see:

![A browser page showing "Hello World! 👋"](/static/images/micro-hello-world.png)

### Building something useful

Since that's quite boring, let's build something useful! We want to make a microservice which remembers how many times a certain path has been requested. So when the first request to `/foo` comes in, it should return `1`. When another request to `/foo` comes in, it should return `2`, and so on.

The first thing we need is the pathname of the requested URL. We get the URL from `request.url`, and we'll use Node.js core `url` module (so you don't need to install it) to parse it.

Let's require the `url` module and parse the requested URL to get the `pathname`:

```javascript
const { send } = require('micro')
const url = require('url')

module.exports = function (request, response) {
  const { pathname } = url.parse(request.url)
  console.log(pathname)
  send(response, 200, 'Hello World! 👋')
}
```

Restart the microservice (press `CTRL+C`, then enter `micro index.js` again) and try it out. Requesting `localhost:3000/foo` logs `/foo` to the terminal, and requesting `localhost:3000/bar` logs `/bar`.

Now that we have the pathname, the last step is to save the number of requests to that specific pathname. Let's create a global object called `visits`, which will be responsible for saving all the visits:

```javascript
const { send } = require('micro')
const url = require('url')

const visits = {}

module.exports = function (request, response) {
  const { pathname } = url.parse(request.url)
  send(response, 200, 'Hello World! 👋')
}
```

Every time a request comes in we check if `visits[pathname]` already exists. If it does, we increment the views and send them back to the client. If it doesn't, we set it to `1` and send that back to the client.

```javascript
const { send } = require('micro')
const url = require('url')

const visits = {}

module.exports = function (request, response) {
  const { pathname } = url.parse(request.url)

  if (visits[pathname]) {
    visits[pathname] = visits[pathname] + 1
  } else {
    visits[pathname] = 1
  }

  send(response, 200, `This page has ${visits[pathname]} visits!`)
}
```

Restart the service again, open `localhost:3000/foo` in your browser and refresh a bunch of times. This what you'll see:

![A webpage showing "This page has 5 visits!"](/static/images/micro-visit-counter.png)

> This is basically how I ended up building [`micro-analytics`](https://github.com/mxstbr/micro-analytics) in a few hours. It's the same concept, with a few more features, and once I knew what I was building the code to build it was easy.

### Persisting Data

Something you might notice about our service is that the data is deleted whenever we restart the server. We don't save the visits to a database, they solely exists in memory. Let's fix that!

We'll use `level`, a simple file-based key-value storage, to persist data across server restarts. `micro` has built-in support for `async/await`, which makes asynchronous code look beautiful. The issue is that `level` is callback based, not Promise based. 😕

As always, `npm` has the modules we need. [Forbes Lindesay](https://twitter.com/ForbesLindesay) wrote `then-levelup`, which allows us to promisify `level`. Don't worry if you don't understand all that, you'll see what it looks like very soon!

Let's install these modules:

```
npm install level then-levelup
```

To create our database we require `level` and tell it where to save the database and that we want the value storage to be JSON encoded. (so we can store numbers) We wrap that database in the function exported by `then-levelup` to promisify it and export an `async` function instead of a normal one so we can use the `await` keyword:

```javascript
const { send } = require('micro')
const url = require('url')
const level = require('level')
const promisify = require('then-levelup')

const db = promisify(level('visits.db', {
  valueEncoding: 'json'
}))

module.exports = async function (request, response) {
  /* ... */
}
```

The two functions we'll need from our database are `db.put(key, value)` to save some data (that's kinda like `visits[pathname] = x`) and `db.get(key)` to get the data back out again! (that's kinda like `const x = visits[pathname]`)

First, we want to see if there are current visits for that pathname in the database. We do this with `db.get(pathname)` and wait for that to finish with the `await` keyword:

```javascript
module.exports = async function (request, response) {
  const { pathname } = url.parse(request.url)

  const currentVisits = await db.get(pathname)
}
```

> If we didn't put `await` there, `currentVisits` would be a Promise and the function would go on before we have the value from the database — not what we want!

Contrary to before, if there are no current visits `db.get` will throw a "NotFoundError". We have to catch that with a `try/catch` blockand `db.put` the initial value for a path, which is `1`, if that happens:

```javascript
/* ... */

module.exports = async function (request, response) {
  const { pathname } = url.parse(request.url)

  try {
    const currentVisits = await db.get(pathname)
  } catch (error) {
    if (error.notFound) await db.put(pathname, 1)
  }
}
```

To finish it off we need to increment the current visits when we already have visits and send back a response:

```javascript
/* ... */

module.exports = async function (request, response) {
  const { pathname } = url.parse(request.url)

  try {
    const currentVisits = await db.get(pathname)
    await db.put(pathname, currentVisits + 1)
  } catch (error) {
    if (error.notFound) await db.put(pathname, 1)
  }

  send(response, 200, `This page has ${await db.get(pathname)} visits!`)
}
```

That's everything we need to do! Now the visits of a page are persisted across server restarts, and written to the `vists.db` file. Try it out by restarting the service, opening `localhost:3000/foo` a bunch of times, then restarting the service again and going to the same page. You'll see that your previous visits are still counted, even though you restarted the service.

Congratulations, you just built a page counter in 10 minutes flat! 🎉

**That's the power of small, focussed modules in Node.js: Instead of having to mess around with primitives directly, we just write our app.**
