export const frontmatter = {
  "published": true,
  "title": "Sending encrypted emails with Ruby on Rails",
  "tags": "rubyonrails privacy encryption"
};



For the [new pgp.asc website](http://www.pgpasc.org), I wanted users to add themselves to the [Hall of Fame](http://www.pgpasc.org/halloffame) without any intervention by me. Previously, they would send me an email that they wanted to be added, I would send them an encrypted mail with the key they provide at theirdomain.com/pgp.asc and if they could answer the mail I would add them. A very tedious and unnecessary process. 

During my time as Front-End Development Intern at [Animade](http://animade.tv) in London, I sat down and learned basic Ruby on Rails. When I started to work on the new design for the pgp.asc project, I thought to myself “Why not build a backend while you are at it?”, so I did. 

One big challenge proved to be the encryption of the verification emails because there are gems to deal with GPG but they are very low level and tedious to use. Thankfully, Jens Krämer wrote a very handy gem called [`mail-gpg`](https://github.com/jkraemer/mail-gpg) to deal with exactly this issue. Sending an encrypted email with ActionMailer is as simple as setting `encrypt` to `true`:

```Ruby
class VerificationMailer < ActionMailer::Base
  default from: 'pgp@mxstbr.com'

  def verification_mail
    mail to: @person.mail, subject: 'Welcome to the pgp.asc Hall of Fame!', gpg: { encrypt: true }
  end
end
```

`mail-gpg` will automatically search for the public key of the recipient on a keyserver and send the encrypted mail for you. If no key is found, an error is thrown which you can then show to the user.