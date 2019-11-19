import express from "../../../utils/express";
import graphql from "../../../utils/graphql";

const app = express();

app.use(async (req, res) => {
  const result = await graphql(`
    {
      questions(
        order_by: { votes_aggregate: { count: desc }, created_at: asc }
      ) {
        id
        content
        user
        answered_in_episode
        votes {
          user
        }
        votes_aggregate {
          aggregate {
            count
          }
        }
      }
    }
  `);
  res.send(result.data.questions);
});

export default app;
