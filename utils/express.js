const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("cookie-session");
const bodyParser = require("body-parser");
const passport = require("./passport");

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

if (!process.env.SESSION_SECRET)
  throw new Error("Missing env: SESSION_SECRET.");

export default () => {
  const app = express();
  app.set("trust proxy", 1);
  app.use(cors());
  app.use(cookieParser());
  app.use(
    session({
      name: "session",
      keys: [process.env.SESSION_SECRET],
      secure: process.env.NODE_ENV === "production",
      signed: true,
      sameSite: "lax",
      // This is refreshed every time the user does a request, so we can safely keep this relatively low
      maxAge: TWENTY_FOUR_HOURS // 24 hours
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());
  // Refresh authenticated users expiry time
  app.use((req: Request, res: express$Response, next: express$NextFunction) => {
    if (req.session && req.user) {
      req.session.lastRequest = Date.now();
    }
    next();
  });

  return app;
};
