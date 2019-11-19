import graphql from "../../../utils/graphql";
import express from "../../../utils/express";

const app = express();

app.use(async (req, res) => {
  if (typeof req.user !== "string")
    return res
      .status(401)
      .send(
        "Unauthenticated. Go to https://mxstbr.com/api/auth/twitter to authenticate."
      );

  if (!req.body || !req.body.content)
    return res.status(400).send(`Missing question.`);

  if (req.body.content.length > 280)
    return res.status(413).send(`Question too long, 280 character maximum.`);

  const { data } = await graphql(`
    {
      questions_aggregate(
        where: {
          user: { _eq: "${req.user}" }
          answered_in_episode: { _is_null: true }
        }
      ) {
        aggregate {
          count
        }
      }
    }
  `);

  if (data.questions_aggregate.aggregate.count >= 5) {
    res.status(400).send(`You cannot ask more than 5 questions at a time.`);
    return;
  }

  const result = await graphql(`
    mutation {
      insert_questions(objects: [{
        content: "${req.body.content}",
        user: "${req.user}",
        votes: {
          data: {
            user: "${req.user}"
          }
        }
      }]) {
        returning {
          id
          user
          content
        }
      }
    }
  `);

  return res.send(result.data);
});

export default app;
