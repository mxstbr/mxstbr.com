export const frontmatter = {
  "published": false,
  "title": "Sending encrypted emails with Rails",
  "tags": "cryptography rails"
};



For the new website of the [pgp.asc](http://pgpasc.org) initiative, I wanted to make Hall of Fame entry automatic with no human intervention needed. For those who haven't heard of it, pgp.asc aims to decentralise public PGP keys. In practice you put your PGP key in the root folder of your server, so it is accessible by going to `http://yourdomain.com/pgp.asc`.

Since I had just learned Ruby and Ruby on Rails, this project seemed like the perfect opportunity to dive further into it. Of course, the verification emails needed to be sent encrypted, but thankfully Jens Krämer wrote a great gem for that, [mail-gpg](https://github.com/jkraemer/mail-gpg).

## mail-gpg

After you have added `gem 'mail-gpg'` to your Gemfile and installed it, usage of this gem is rather simple. The first step is to define a keyserver which we will get the key from:

`keyserver = Hkp.new("my-key-server.com")`

From this keyserver we then get the id of the public key by searching for an email address:

`keyid = keyserver.search('recipient@hisdomain.com')`

Once we have this id, we can fetch and import this key into our local keychain:

`keyserver.fetch_and_import(keyid)`

Integration with Action Mailer thankfully exists, you just have to add the gpg option to your mail 