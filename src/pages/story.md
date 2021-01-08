import { LiteYoutubeEmbed } from "react-lite-yt-embed";
import { Tweet } from "react-twitter-widgets"
import PageHeader from "../../components/PageHeader";
import Head from "../../components/Head";
import WideSection from "../../components/WideSection";

<PageHeader title="My Story" mb={0}>
  <Head
    title="About Me – Max Stoiber (@mxstbr)"
    description="Who is Max Stoiber? "
  />
</PageHeader>

For the short version, watch this beautiful mini documentary movie that folks from Honeypot made about the influence of open source on my life:

<WideSection
  css={{
    '[class*="yt-lite"]': {
      borderRadius: `5px`
    }
  }}
>
  <LiteYoutubeEmbed id="ifq3xhik8tE" noCookie mute={false} />
</WideSection>

----

For the deeper version, here is my full story:

I was born and raised in Mödling, a small town just outside of Vienna in Austria 🇦🇹, with my two siblings. I discovered my love for computers in school through gaming — specifically I played a lot of Minecraft (even hosted a server for my friends).

I learned my first bits of code in IT class when we had to build a “personal website” using basic HTML and CSS. I immensely enjoyed working on it, adding a guestbook and hit counter and trying all the CSS features I could find.

I starting making websites in my free time for fun, at first only toys and eventually for people that wanted one made. (including [my mom](http://unfallchirurgin.com)) I learned new things by trying to copy websites I liked.

After graduating from the [Sir Karl Popper high school](https://en.wikipedia.org/wiki/Sir-Karl-Popper-Schule) I thought about what I wanted to study. Computer science seemed like the obvious choice, so I enrolled in the local university.

...and hated it.

While I enjoyed student life, I did not enjoy studying CS. I dreaded every second I had to spend on Algebra, Analysis, technical computer science, and many other courses. I had already fallen in love with the visual and immediate nature of web development and felt like these courses had nothing to do with what I enjoyed.

After a couple months of slogging through coursework, I randomly stumbled upon this tweet:

<!-- <Tweet tweetId="537210432906616832" /> -->

In a moonshot attempt, I applied, thinking "What's the worst that could happen?" Miraculously, I somehow convinced them I was the best candidate and they wanted me in London for three months to learn frontend development — a dream opportunity!

I told my parents that missing three months of university was no big deal, a complete lie. I figured that after the internship I would easily be able to find a job and then my parents would not be worried about me having a degree anymore.

I had no idea how wrong I was, but more on that soon.

The three months in London were formative. I got to work on everything from real client projects to [fun](https://frankensim.animade.tv) [toys](https://sloth.animade.tv) with my fellow interns. [We](https://thefwa.com/cases/frankensim) [even](https://winners.webbyawards.com/2016/websites/general-websites/weird/160249/frankensim) [won](https://www.awwwards.com/sites/frankensim) [some](https://www.csswinner.com/details/frankensim/9805) [awards](https://www.pixelawards.com/winners.html#/category-experimental)! I learned a lot about HTML, CSS, JavaScript and React, having no clue that these experiences would define my future career.

I came back to Vienna thinking "I am now a frontend developer!". Naturally, I continued my plan and applied for dozens of jobs at cool local companies, expecting at least one of them to hire me.

I got zero good job offers.

I had some offers to join other companies as an intern, but I knew that I had more skill than an intern would have and was on at least a junior level. I didn't want to work for intern-level pay anymore, I felt like I was worth more! Thankfully due to my family situation, I also did not have to work for money, so I had the luxury of being able to choose.

So I kept on job hunting, building my [own](https://github.com/mxstbr/eternalpad) [little](https://github.com/mxstbr/sharingbuttons.io) [apps](https://github.com/mxstbr/login-flow) on the side and also gave [my first talk](https://www.youtube.com/watch?v=TGwjgmAqNRo) at the local JavaScript meetup.

After setting up webpack for the umpteenth time to build one of my apps I figured I'd make a small boilerplate for myself and push it up to GitHub so I would have a full setup ready to go for my next projects. I called it [react-boilerplate](https://github.com/mxstbr/react-boilerplate).

I kept improving the boilerplate as I learned new tools (e.g. redux-saga, ImmutableJS) and writing lots of documentation of how these tools work. It garnered a solid ~50 stars on GitHub and a few folks using it, but it was mostly just me.
