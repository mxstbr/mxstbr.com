
export const meta = {
  published: false,
  publishedAt: '2019-01-17',
  title: 'Prisma',
  summary: ''
}

Another reason why we chose RethinkDB is the Node.js driver, which has a beautiful query API. For example, check out this query which loads a paginated list of the threads posted by a user:

```JS
const getThreadsByUser = (id, skip, limit) => {
  return db
    .table('threads')
    .getAll(id, { index: 'userId' })
    .skip(skip || 0)
    .limit(limit || 10)
    .run();
}
```

That is one pretty API! 😍 But there is a new kid on the block and it looks even better: [Prisma](https://prisma.io).

With Prisma, you define your database schema with the GraphQL Schema Definition Language. It then automatically generates a custom database driver with type-safe queries—a phenomenal developer experience! It would also have been a natural fit for our GraphQL-based API.

Let's look at the same query again, but this time using Prisma:

```JS
const getThreadsByUser = (id, after, first) => {
  return db
    .user({ id })
    .threads({ 
      first,
      after,
    });
}
```

😍😍😍

Unfortunately Prisma didn't exist when we were starting out. It could have helped us move faster and avoid bugs at the same time.
