export const meta = {
  published: false,
  publishedAt: "2019-01-17",
  title: "Prisma Is Awesome",
  summary: ""
};

We chose RethinkDB as our main datastore for Spectrum (and [regretted it](/thoughts/tech-choice-regrets-at-spectrum)). One of the reasons was the Node.js driver, which has a beautiful query API. For example, check out this query which loads a paginated list of the threads posted by a user:

```js
const getThreadsByUser = (id, skip, limit) => {
  return db
    .table("threads")
    .getAll(id, { index: "userId" })
    .skip(skip || 0)
    .limit(limit || 10)
    .run();
};
```

That is one pretty API! 😍 But there is a new kid on the block and it looks even better: [Prisma](https://prisma.io).

With Prisma, you define your database schema with the GraphQL Schema Definition Language, for example:

```graphql
type Thread {
  id: ID
  content: String
}

type User {
  id: ID
  threads: [Thread]
}
```

It then automatically generates a custom database driver with type-safe queries—a phenomenal developer experience! Let's look at the same query again, but this time using Prisma:

```js
const getThreadsByUser = (id, after, first) => {
  return db.user({ id }).threads({
    first,
    after
  });
};
```

😍😍😍

I wish Prisma had existed when we started building Spectrum. It could have helped us move faster and avoid bugs at the same time.
