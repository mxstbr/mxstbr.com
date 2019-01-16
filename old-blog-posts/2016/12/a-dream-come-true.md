export const frontmatter = {
  "published": true,
  "hidden": false,
  "title": "2016 in review: A dream come true",
  "tags": "2016 review",
  "twitter_large": true,
  "image": "open-source-sentry.jpg",
  "custom_excerpt": "What happened in 2016? This is my story, full of open source, travel and tweets. How did react-boilerplate, styled-components and Carte Blanche come to be?"
};



Originally this review was meant to solely be about 2016, but as it started coming along I noticed that the narrative didn't make any sense without any context. So, I'll start from the beginning, my time in London, to explain how react-boilerplate, styled-components and more came to be.

## Animade

My story starts at the beginning of 2015, a few months after I started to study computer science for the first time. Writing some HTML and CSS on the side while in university, I noticed that I was much more interested in the web than in my course work. Thus, I decided to become an employable front-end developer by taking a break from university and going to London for a three month internship at [Animade](http://animade.tv).

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Packing for my internship in London <a href="https://twitter.com/animadetv">@animadetv</a>, having a hard time to decide what to take and what to leave...</p>&mdash; Max Stoiber (@mxstbr) <a href="https://twitter.com/mxstbr/status/556401046550245376">January 17, 2015</a></blockquote>

After two months of working with the awesome folks there I was quite proficient in HTML, CSS and jQuery. In an effort to keep me learning for the last month of my internship, [Simon](https://twitter.com/simonneveu) and [James](https://twitter.com/jameschambers) encouraged me to learn and trial this new, hot JavaScript framework called React.

## Learning React

I dove into tutorials and the documentation, and built a tiny [marketing project](http://frankensim.animade.tv) with React, Flux and Grunt. (props to [Milo Targett](https://twitter.com/milotargett) for coming up with the idea and illustrations)

After the internship I wanted to keep getting better at React, so I built a [personal side project](http://sharingbuttons.io) with it. Noticing that I was spending the same amount of time doing the exact same things at the start, creating all the necessary folders and scaffolding to get started with actually building my app, I thought "I should save this somewhere". I copy and pasted that tiny folder structure and pushed it up to GitHub.

Little did I know that this tiny, personal "open source project" (read: repo on GitHub) would go on to have 11,000 stars, be used by a ton of companies big and small in important projects, and see hundreds of people from all around the world contribute to it.

But I'm jumping ahead of myself here.

As the second half of 2015 rolled around, I tried (again) to study Computer Science at the local technical university, but my joy of programming was (and still is) sadly not accompanied by a joy for converting numbers from the binary to the decimal system and back (much to the dismay of my parents). I kept up and got good grades (acing the one actual programming course, an introduction to Java), but in reality I spent most of my time doing what I love – writing HTML, CSS and JS.

It was Christmas (almost exactly a year ago now), and we were out for my family's annual skiing holiday. Unbeknownst to me something was about to happen that would change the course of my life forever.

I woke up the morning of the 27th of December, planning to be out on the mountain all day long, and checked my messages and notifications. As I opened GitHub, I noticed the React scaffolding project received a bunch of issues. Interesting, that hadn't happened before! I went to the repo and couldn’t believe my eyes.

**Overnight `react-boilerplate` went from 70 stars to 550 stars** and the number of stargazers was increasing every single time I refreshed the page.

I had no idea what was happening. I frantically checked Twitter in an effort to find out where all of these stars were coming from, but there was nothing there. I sent out a tweet, asking if somebody knew what was going on. Thankfully `@___swastik` replied within a few minutes:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/mxstbr">@mxstbr</a> — HackerNews happened!</p>&mdash; Swastik (@___swastik) <a href="https://twitter.com/___swastik/status/681005846042509312">December 27, 2015</a></blockquote>

`react-boilerplate` was on the frontpage of HackerNews, and it had been there for ~12 hours.

<figure>
	<img alt="HackerNews Screenshot of the 7th of December, react-boilerplate has 128 upvotes and is on the frontpage" src="/static/images/react-boilerplate-hackernews.png" />
	<figcaption>From <a href="https://web.archive.org/web/20151227081248/https://news.ycombinator.com/">web.archive.org</a></figcaption>
</figure>

Of course I had heard of HackerNews and had visited it, but I wasn't active on there by a long shot. I hadn't realised just how massive the community is. Literally overnight, `react-boilerplate` gained almost 500 stars, trended on GitHub and was shared all over the place. By the end of this wave, it had something like 2500 stars and a team of active contributors working on it.

> Side note: Seeing me repeatedly check and being excited about this thing called GitHub, my [dad](https://twitter.com/stoiber_manfred) actually got me a GitHub shirt and sticker for my birthday on the 4th of January. #bestdadever

## Thinkmill

At the start of 2016, I met [Nik](https://twitter.com/nikgraf) for the first time and somehow convinced him to invite me to a skiing trip to Jackson Hole in Feburary. Together with some other [austrian](https://twitter.com/alexandertacho) [developers](https://twitter.com/moritzplassnig) (and [Sara](https://twitter.com/GartnSara)) we had an amazing week jumping down some cliffs ("DO IT JESUS") and carving down some pistes.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">Made it to Jackson Hole and went skiing today! <a href="https://t.co/HsS0MolnHE">pic.twitter.com/HsS0MolnHE</a></p>&mdash; Max Stoiber (@mxstbr) <a href="https://twitter.com/mxstbr/status/697262986172301312">February 10, 2016</a></blockquote>

Afterwards, we went to San Francisco — my first time there. Nik had been living there for a month, working on Belle and DraftJS Plugins as part of an Open Source Retreat sponsored by Stripe. My original plan was to find a job, but most of the companies I contacted didn’t even want to interview me. So mostly Nik and I just hung out at Stripe HQ and hacked on open source. One fateful day [Jed Watson](https://twitter.com/jedwatson), an Australian Reacter who had been in town for ReactConf, joined the hacking session.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr"><a href="https://twitter.com/mxstbr">@mxstbr</a> <a href="https://twitter.com/nikgraf">@nikgraf</a> in the hotel! Where are you? Let&#39;s go :)</p>&mdash; Jed Watson (@JedWatson) <a href="https://twitter.com/JedWatson/status/701112787423010816">February 20, 2016</a></blockquote>

So we three coded and chatted, and I remarked how amazing it is what Nik is doing and that I'd love to work on open source full time. Jed looked at me in a weird way and asked me if I was serious. After some more chatting, he suggested I join his company, [Thinkmill](http://thinkmill.com.au), as their first full time open source employee.

So I flew down to Sydney to meet the whole team and get a crash course in Keystone, the project I was going to maintain as my day job, to see if I liked it there. Boy, did I love it! Thinkmill is a great team consisting of lots of awesome folks with interesting ideas that are very involved in the local community, just amazing. Everybody in Australia is super friendly but the Thinkmillers (I just coined that term) definitely set a new standard.

> I've been working there ever since, though recently I've not been spending as much time making Keystone and more time making `styled-components` and other new projects.

## Conferences

Around the same time I spoke at ReactVienna for the first time, and started helping organizing it shortly afterwards. Seeing me speak, Nik talked me into applying to some conferences around Europe to share the things I had learned while making `react-boilerplate`. I wrote three different CFPs and started sending them out, not really expecting to be accepted anywhere.

I could not have been more wrong. I was accepted and spoke at 15 different conferences, was flown all over Europe and even to the US once, met a bunch of amazing people and spent weeks preparing, practicing and performing talks to share my knowledge.

### Building CarteBlanche for ReactEurope

A highlight of this whole conference thing was being accepted to talk at ReactEurope in Paris with Nik. We had an idea for a super cool project based on Guillermo Rauch's landmark [PureUI](http://rauchg.com/2015/pure-ui/) essay.

We wanted to build a webpack plugin which shows you all of your React (and eventually Angular 2, Ember,...) components in a separate, isolated space from your app. Developers could visually fuzz test their components, adding and saving variations of them. No more "Refresh, go to that page and click that button to see what the modal looks like now..."!

We submitted a CFP explaining our idea, and agreed to start building it if the talk got accepted — which we thought was unlikely. Of course, contrary to our expectations, we got accepted. So now we had to actually build this thing.

As it turns out, building a webpack plugin is not an easy thing to do; even less so when it's more complex than almost any existing one. We started working on what was going to become CarteBlanche three months before the conference, but didn't really get anywhere because it was so hard. I asked [Jan](https://twitter.com/jantimon), the maintainer of the HTMLWebpackPlugin, for some tips and that's when things really started taking off.

We spent two months before the conference frantically working 60+ hours per week trying to get this done and ready for launch. With a lot of help by Jan we got it to a presentable state shortly before the trip. We went to Paris, and pretty much the only thing I remember from the conference is sitting in the back and hacking away to get that last minute polish in — and some karaoke.

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">One more interesting stat from the Carte Blanche launch…<br/><br/>(taken on my Github profile) <a href="https://t.co/mBannTZwyP">pic.twitter.com/mBannTZwyP</a></p>&mdash; Max Stoiber (@mxstbr) <a href="https://twitter.com/mxstbr/status/741231688076931072">June 10, 2016</a></blockquote>

<small class="caption">(that's 307 commits to one repo in less than a month)</small>

CarteBlanche was a great idea and I’m incredibly proud how far we developed the project in such a short amount of time, but it needed another month or two of development before it could be considered “production ready”. There were just so many edge cases and configuration options that it was hard to cover all of them.

Now, it’s been a lot longer than “a month or two” since ReactEurope, but from all of that stress and exhaustion back then I cannot stand looking at that codebase anymore, which is why I stopped working on it. I hope we pick it up again sometime in the future, as the idea is amazing. However currently we’re both too busy with other things.

> Nik remarked after this whole ordeal: "If I ever found a startup again, I'll do it with you." I don't think either of us have ever been as productive as in those few weeks.

## `create-react-app`

[Dan](https://twitter.com/dan_abramov) contacted me one day asking if I had time to look at a new project [Christopher](https://twitter.com/vjeux) and he had been cooking up. He invited me to a private repo which had an early prototype of `create-react-app`.

The idea was immediately appealing. As the maintainer of a boilerplate, upgrading existing apps to a new version is basically impossible, and `create-react-app` solved that elegantly by hiding everything except runtime code, i.e. the actual app. It was already clear that this project would really help beginners get their feet wet with React, and that was very exciting.

> Funny side story: what is now `npm run eject` used to be called `npm run graduate` in the first iteration. I really didn't like the name, as it sounded like something you had to do – which _this operation_ totally isn't.  We needed a word to capture this, and thankfully we checked out [Ean Platter](https://twitter.com/eanplatter)s [`enclave`](https://github.com/eanplatter/enclave). It had similar ideas and an operation like that, and he had found the perfect word for it: "eject".

I helped out on `create-react-app` shortly, had a few suggestions here and there but have since stopped due to being busy with my own projects. Dan has been doing an amazing job with it, and I can't wait to see where it will go next year!

## `styled-components` 💅

As the year progressed and I kept working on projects, this question and discussion of styling React components came up over and over again. I was (and still am) a huge fan of CSS Modules for my applications but for ElementalUI, Thinkmill’s component library, it just wasn’t the right tool for the job.

The release of `create-react-app` certainly cemented this. Due to CSS Modules being a webpack (or PostCSS) specific thing, Dan decided not to integrate them to keep the bundler choice an implementation detail of `create-react-app`. (that's also why you cannot add custom configuration without ejecting)

I had been chatting with a bunch of people about this problem and tried a lot of different libraries. I met [Glen](https://twitter.com/glenmaddern) down in Sydney, and over a beer we started chatting about this whole CSS thing. He told me he had been working on something new, and showed me an early version of what would become `styled-components`.

I thought it was the most stupid idea I had ever seen. Who would put actual CSS in their JavaScript and [what are those weird backticks](http://mxstbr.blog/2016/11/styled-components-magic-explained/)?!

Still, I listened to his explanation of what he was doing and then tried it because why not. I built a few components and went "holy cow, this is rad". The API wasn't very good and had a huge surface area, but the core ideas were there and already, it was amazing to work with. There and then we decided to make this a thing, and over a few weeks with many discussions fleshed out the API and DX.

### One more thing

I had submitted a CFP to ReactNL a few months prior to talk about my experiences with all the different styling libraries. The original plan was to showcase how some of the most popular libraries are okay with certain downsides to enable other upsides, i.e. how tradeoffs affect their design and which ones you should choose based on the problems you have to solve.

It turns out, the timing could not have been any better. As ReactNL got closer, `styled-components` got more and more finished, so we decided to release it on stage. The organizers moved me to be the opening keynote – the perfect opportunity to launch a new project!

To top it off, Glen had the idea to do a Steve Jobs-style "One more thing..." reveal of the new library – [which I did](https://youtu.be/19gqsBc_Cx0?t=25m48s)!

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">🎉 Super excited to announce styled-components with <a href="https://twitter.com/glenmaddern">@glenmaddern</a>!<br/><br/>&lt;💅&gt; Visual primitives for the component age.<br/><br/>👉 <a href="https://t.co/MKSw3QREiN">https://t.co/MKSw3QREiN</a> <a href="https://t.co/3fdtWCIpm7">pic.twitter.com/3fdtWCIpm7</a></p>&mdash; Max Stoiber (@mxstbr) <a href="https://twitter.com/mxstbr/status/786478628829814784">October 13, 2016</a></blockquote>

The library was well received and is now used by a lot of people all around the globe which is great! We aren't nearly done yet though, there's some big things on the horizon for early 2017 that I'm super excited about and can't wait to show you!

## Being featured in Forbes

In October, Forbes Austria picked up on my story. They asked some friends, and then featured me in the November issue:

<blockquote class="twitter-tweet" data-lang="en"><p lang="en" dir="ltr">I&#39;m featured in the new <a href="https://twitter.com/Forbesaustria">@ForbesAustria</a> issue! 🎉😍✨<br/><br/>Get in in your local Trafik or on <a href="https://t.co/MpNDLY5ncZ">https://t.co/MpNDLY5ncZ</a> and send me a pic! (print only) <a href="https://t.co/Dld4G2KXf6">pic.twitter.com/Dld4G2KXf6</a></p>&mdash; Max Stoiber @ 🇦🇹 (@mxstbr) <a href="https://twitter.com/mxstbr/status/795555176203620353">November 7, 2016</a></blockquote>

To this day this feels totally unreal to me. Even though it happened and is awesome it boggles my mind.

## The Future

If you would've told me this whole story two years ago, I would've laughed in your face and called it a dream. That's still what it feels like every day – I get to do the work I enjoy most with awesome people I like, and I'm being paid to do so!

Now, in case you're wondering, **[I still have no idea what the fuck I'm doing](https://medium.com/@mxstbr/nobody-knows-what-the-fuck-they-re-doing-b62945f88b0d#.lzlipi2xw)**, that hasn't changed. `#juniordevforlife` Even so, some of my work impacts the way others make things and helps them be more productive, which is an amazing feeling.

For 2017 I want to do more of the things that make me happy:

- Collaborate with rad people on interesting ideas and libraries
- Explore new areas and expand my horizon beyond React and JavaScript (P2P, ReasonML,...)
- Write more articles (goal: 50 posts in 2017)
- Consistently [send out newsletters](/newsletter/) and establish them as my place to share more personal, long-form thoughts (goal: one newsletter every week)
- Go skiing more often

I also want to travel a bit less, as this year was quite exhausting. I'll still be speaking at a few conferences, but I'm looking forward to being home for longer than a week and spending quality time with my girlfriend.

I cannot wait for 2017. Bring it on! 💪

## Stats

I love looking at random statistics, so here are some numbers from this year:

- Twitter followers: +5,250
- Tweet impressions: ~9,000,000
- GitHub followers: +1,000
- GitHub stars (created projects): +20,000
- [Conferences spoken at](http://mxstbr.com/#talks): 15
- [Countries visited](https://nomadtrips.co/mxstbr): 16 (🇦🇺 🇦🇹 🇧🇪 🇩🇰 🇪🇪 🇫🇷 🇩🇪 🇬🇷 🇮🇹 🇳🇱 🇳🇴 🇵🇱 🇷🇺 🇸🇰 🇨🇭 🇺🇸)
- [Cities visited](http://stats.mxstbr.com): 76
- [Airports visited](https://www.swarmapp.com/c/aO81Zm8qmop): 24
- Airport visits: 76
- Airplanes boarded: 62
- [Kilometers travelled](http://stats.mxstbr.com): 323,877
- [Steps walked](http://stats.mxstbr.com): 3,500,000
- [Coffeeshops visited](https://www.swarmapp.com/c/aO81Zm8qmop): <span title="CaffèCouture District 1, Kleines Café, kaffemik, Kaffeeküche, Skittle Lane Coffee, Coffee Bar, phil, Cafe-Restaurant Griensteidl, Mecca Espresso, Café Mandela, Cafe Korb, CaffèCouture, Reuben Hills Coffee Roastery & Cafe, Akrap Finest Coffee, OR Espresso Bar, Cafe Latte Art, La Colombe, Stable Cafe, Chinatown Coffee Company, Stumptown Coffee Roasters, Aroma Kaffeebar, Drop Coffee, Single Origin Roasters, Caffènation, Starbucks, Tim Wendelboe, The Coffee Shop, Screaming Beans, Weltcafé, Café Merkur, Liebling, Prufrock Coffee, Kaffeefabrik, aumann café | restaurant | bar, Café-Restaurant CORBACI, POC - People on Caffeine, La Colombe Torrefaction, Sample Coffee, Ozone Coffee Roasters, Joe Pro Shop, Télescope, Hofburgstüberl, The Coffee Collective, Everyman Espresso, Lot Sixty One Coffee Roasters, Intelligentsia Coffee, Sweet Cup, Pablo & Rusty's, Caffe Mundi, Toby's Estate Coffee, Starbucks, Gumption by Coffee Alchemy, Pavel & Co, Mahlefitz, SteamTank Coffee Hornsby, Gourmet Coffee City Kohviteek, forloren espresso, Man versus Machine Coffee Roasters, Artificer Specialty Coffee Bar & Roastery, _Rau Wolf, Café EL.AN, Felber Herrengasse, Bocca, Routine Coffee, Café Odilon">65 (hover for list)</span>
- Coffeeshop visits: 102 (1 coffeeshop every 3.5 days, even though there's an espresso machine at home!)
- [Books read](https://goodreads.com/mxstbr): 40
- GitHub contributions: 4,000
- PRs opened: 450
- Issues opened: 375

<small class="footnote">Thanks to [Sebastian McKenzie](https://medium.com/@sebmck/2015-in-review-51ac7035e272#.om2h2rnae), [Karl Horky](https://twitter.com/karlhorky), [Nik Graf](https://twitter.com/nikgraf) and [Kitze](https://twitter.com/thekitze).</small>

<script>{`
	window.addEventListener('load', function() {
		var elem = document.createElement('script'); elem.type = 'text/javascript'; elem.defer = true;
		elem.src = '//platform.twitter.com/widgets.js';
		elem.charset = 'utf-8';
		document.body.appendChild(elem);
	}, false);
	`}
</script>
