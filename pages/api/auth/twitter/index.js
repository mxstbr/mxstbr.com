import passport from "passport";
import express from "../../../../utils/express";

const app = express();

app.get(
  "*",
  // Store the redirectUrl from the ?r query param
  (req, _, next) => {
    if (req.query && req.session && req.query.r)
      req.session.redirectUrl = req.query.r;
    next();
  },
  passport.authenticate("twitter")
);

export default app;
