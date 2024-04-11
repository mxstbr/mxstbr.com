import BlogPost from "../../../components/BlogPost";

export const meta = {
  published: true,
  publishedAt: "2024-04-11",
  title: "You probably don't need GraphQL",
  summary:
    "It might be surprising to hear the co-founder of a GraphQL company say you probably don't need it. Let me explain.",
  image: "/static/images/graphql.png",
  likes: 0
};

export default ({ children }) => <BlogPost meta={meta}>{children}</BlogPost>;

I asked, [“Why are you not using GraphQL?”](https://twitter.com/mxstbr/status/1765821895742828915) on Twitter, and most of the 150+ responses were some form of “I don’t need it.”

**And they are right: they probably don’t need GraphQL!**

You might be surprised to read that from the co-founder of [a GraphQL company](https://stellate.co/).

Let me explain.

## Why you probably don’t need GraphQL

Shortly after its release by Facebook in 2015 (almost ten years ago!), GraphQL got a lot of hype because it enabled building typesafe APIs with a better developer experience than any other API. All kinds of people adopted it, including:

1. Early-stage startups with small teams
2. Indie hackers building their MVPs
3. Companies building products without a UI
4. Microservice teams for service-to-service communication
5. Even database engine teams as their query language

But GraphQL wasn’t made for those use cases.

Facebook invented GraphQL as a central intermediary layer between their many end-user-facing clients and many data sources. They made a new language (and thus toolchain) to enable it to work across microservices written in different languages.

That makes it a heavy-handed solution for the problem of “I want client-side data access to be typesafe.” Inevitably, better solutions for those use cases emerged (like tRPC) and overtook GraphQL in adoption. And, with the advent of React server components, many of these use cases are yet again poised to be even further simplified.

## So then, who even needs GraphQL?

The difficulty of answering “Who needs GraphQL?” is that GraphQL solves many different problems. When you speak with two people who use it, you will inevitably get two different answers about _why_ they’re using it.

Not only that, but GraphQL doesn’t obviously _solve_ all of these many different problems; many just kind of… disappear when you’re using GraphQL. That makes it difficult to realize that GraphQL solves them because you “have to have been there before” to see which problems quietly disappeared.

I would know: as part of my job of running a GraphQL company, I’ve spent the last three years speaking with thousands of engineers at hundreds of companies about their APIs, especially ones building with GraphQL.

Let me summarize what they’ve told me about the problems GraphQL solved for them and how it did.

### The problems that GraphQL solves

#### 1. Mobile apps break periodically after API changes

GraphQL only returns the fields the client explicitly requests, so new capabilities can be added by adding new types or fields, which is never a breaking change for existing clients.

On top of that, you can monitor which clients are using which fields because they have to specify exactly which data they need.

#### 2. Slow loading times because of request waterfalls and/or overfetching

With GraphQL, a client sends one request for all the data it needs to render the whole page/view, and the server resolves all of it and sends it back in one response—without the duplication introduced by BFFs. (the client can even ask the server to stream above-the-fold data first with the `@defer` and `@stream` directives)

#### 3. Difficult maintenance and endpoint discovery due to hundreds of duplicative one-off endpoints

GraphQL centralizes the data access of each entity/resource. When an underlying microservice or database changes how it manages its data, that change only has to be applied to the single, central place in the API layer rather than having to update many endpoints or BFFs.

Going one step further, GraphQL enables clients to specify their data needs on a component level with fragments. (e.g., a `UserAvatar` component can abstractly specify that it needs `UserType.avatarUrl`) So, even on the client, changes must be applied only to the specific components the change is related to!

#### 4. Security and performance are a game of whack-a-mole

GraphQL is the central data access layer for clients, so you can enforce security and performance SLAs at as fine-grained a level as you need. Similarly to per-endpoint for REST APIs, you can enforce limits per-operation in GraphQL, but you can also go more fine-grained and limit per-type or even per-field.

---

If your company is running into one (or more!) of these problems, you owe it to yourselves to consider adding GraphQL to your stack. Stay tuned for my next essay, which will explain the counterintuitive path that we have learned works best to adopt GraphQL successfully. (subscribe to the newsletter below if you don’t want to miss it!)

If you don’t have any of these problems today, you might wonder, “When will I hit these problems?” The answer is that it’s difficult to predict because it depends on your specific use case. Some companies scale to 50 engineers and millions of users without hitting any of these problems. Others hit multiple of these problems while building their MVPs.

To give some guidance from my experience: at the latest when you have 100+ engineers, you will likely run into at least one of these problems.

That’s why most of the responders to my tweet were right: they probably don’t need GraphQL.

One thing is for certain, though: whenever you hit any of these problems, GraphQL will be there to solve them for you.
