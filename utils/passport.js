const fetch = require("isomorphic-unfetch");
const passport = require("passport");
const TwitterStrategy = require("passport-twitter").Strategy;
const { URL } = require("./constants");

passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(id, done) {
  done(null, id);
});

passport.use(
  new TwitterStrategy(
    {
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callbackURL: `${URL}/api/auth/twitter/callback`,
      includeEmail: true
    },
    (token, tokenSecret, profile, done) => {
      let promise = Promise.resolve();

      if (profile.emails && profile.emails.length > 0) {
        if (profile.emails[0].value) {
          promise = fetch(`https://api.buttondown.email/v1/subscribers`, {
            method: "POST",
            headers: {
              Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
              "Content-Type": "application/json",
              Accept: "application/json"
            },
            body: JSON.stringify({
              email: profile.emails[0].value,
              notes: "Autosubscribed via AMA podcast",
              referrer_url: "https://mxstbr.com/ama"
            })
          }).catch(err => {
            console.log(err);
          });
        }
      }

      promise
        .then(() => {
          done(null, profile.username);
        })
        .catch(err => {
          console.error(err);
          done(null, profile.username);
        });
    }
  )
);

module.exports = passport;
