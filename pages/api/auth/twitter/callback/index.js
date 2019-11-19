import express from "../../../../../utils/express";
import passport from "passport";

const app = express();

app.get(
  "*",
  passport.authenticate("twitter", {
    failureRedirect: "/"
  }),
  (req, res) => {
    const redirectUrl = (req.session && req.session.redirectUrl) || "/ama";
    if (req.session) delete req.session.redirectUrl;
    res.redirect(typeof redirectUrl === "string" ? redirectUrl : "/ama");
  }
);

export default app;
