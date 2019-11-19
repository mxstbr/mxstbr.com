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

  if (!req.body || !req.body.questionId)
    return res.status(400).send(`Missing questionId.`);

  const { data } = await graphql(`
    {
      votes(where: {
        user: {
          _eq: "${req.user}"
        },
        questionId: {
          _eq: ${req.body.questionId}
        }
      }) {
        id
        questionId
        user
      }
    }
  `);

  if (data.votes.length > 0) {
    const result = await graphql(`
      mutation {
        delete_votes(where: {
          id: {
            _eq: "${data.votes[0].id}"
          }
        }) {
          returning {
            id
            questionId
            user
          }
        }
      }
    `);
    return res.send(result.data);
  }

  const result = await graphql(`
    mutation {
      insert_votes(objects:[{
        questionId: ${req.body.questionId},
        user: "${req.user}"
      }]) {
        returning {
          id
          questionId
          user
        }
      }
    }
  `);

  return res.send(result.data);
});

export default app;
