import fetch from "isomorphic-unfetch";

export default async query => {
  if (!process.env.HASURA_ADMIN_SECRET)
    throw new Error("Missing HASURA_ADMIN_SECRET.");

  const result = await fetch(`https://ama-podcast.herokuapp.com/v1/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET
    },
    body: JSON.stringify({
      query
    })
  });
  const json = await result.json();
  return json;
};
