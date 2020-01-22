// @flow

export type AppearanceType =
  | "talk"
  | "lightning-talk"
  | "interview"
  | "award"
  | "podcast"
  | "workshop";

export type Appearance = {
  title: string,
  site: string,
  date: Date,
  city?: string,
  type: AppearanceType,
  link?: string
};

const appearances: Array<Appearance> = [
  {
    title: "Building third-party component libraries",
    site: "AgentConf",
    date: new Date(2017, 0),
    city: "Dornbirn, Austria",
    type: "talk",
    link: "https://www.agent.sh/"
  },
  {
    title: "Offline Web Applications",
    site: "ViennaJS",
    date: new Date(2015, 7),
    city: "Vienna, Austria",
    type: "talk",
    link: "https://www.youtube.com/watch?v=TGwjgmAqNRo"
  },
  {
    title: "Kick your CSS up a notch with PostCSS",
    site: "ViennaJS",
    date: new Date(2015, 9),
    city: "Vienna, Austria",
    type: "talk",
    link: "https://www.youtube.com/watch?v=-_gIKdHYP3E"
  },
  {
    title: "Testing React.js Applications",
    site: "ReactVienna",
    date: new Date(2016, 0),
    city: "Vienna, Austria",
    type: "talk",
    link: "https://speakerdeck.com/mxstbr/testing-react-dot-js-applications"
  },
  {
    title: "Exploring ES6",
    site: "ViennaJS",
    date: new Date(2016, 0),
    city: "Vienna, Austria",
    type: "talk",
    link: "https://www.elastic.co/videos/exploring-es6-by-max-stoiber"
  },
  {
    title: "Taking chances and career acceleration",
    site: "Tyler McGinnis Podcast",
    date: new Date(2017, 9),
    type: "podcast",
    link: "https://tylermcginnis.com/podcast/max-stoiber/"
  },
  {
    title: "React Components",
    site: "Software Engineering Daily",
    link:
      "https://softwareengineeringdaily.com/2017/12/21/react-components-with-max-stoiber/",
    type: "podcast",
    date: new Date(2017, 11)
  },
  {
    title: "My JS Story",
    site: "JavaScript Jabber",
    link: "https://devchat.tv/js-jabber/my-js-story-max-stoiber/",
    type: "podcast",
    date: new Date(2017, 3, 4)
  },
  {
    title: "styled-components and react-boilerplate",
    site: "JavaScript Jabber",
    link:
      "https://devchat.tv/js-jabber/jsj-245-styled-components-and-react-boilerplate-with-max-stoiber/",
    type: "podcast",
    date: new Date(2017, 0)
  },
  {
    title: "React Entwicklung und Frontend Einstieg",
    site: "Working Draft",
    link: "https://workingdraft.de/259/",
    type: "podcast",
    city: "German",
    date: new Date(2016, 3)
  },
  {
    title: "Max Stoiber on styled-components",
    site: "This Dot Media",
    link: "https://www.youtube.com/watch?v=1C4Kf9Pqu0k",
    type: "interview",
    date: new Date(2017, 6)
  },
  {
    title: "Done Goofed feat. Max Stoiber",
    site: "Design Details",
    link: "https://spec.fm/podcasts/design-details/63297",
    type: "podcast",
    date: new Date(2017, 2)
  },
  {
    title: "For the Beginners",
    site: "JavaScript Air",
    link: "https://javascriptair.com/episodes/2016-06-15/",
    type: "podcast",
    date: new Date(2016, 5)
  },
  {
    title: "Offline is the new Black",
    site: "JSConf Belgium",
    city: "Bruges, Belgium",
    link: "https://speakerdeck.com/mxstbr/offline-is-the-new-black",
    type: "talk",
    date: new Date(2016, 4, 1)
  },
  {
    title: "Scaling React.js Applications",
    site: "At The Frontend",
    city: "Copenhagen, Denmark",
    link: "https://vimeo.com/168648012",
    type: "talk",
    date: new Date(2016, 4, 21)
  },
  {
    title: "The Evolution of React UI Development",
    site: "React Europe with Nik Graf",
    city: "Paris, France",
    link: "https://www.youtube.com/watch?v=0IkWuXeKPV0",
    type: "talk",
    date: new Date(2016, 6)
  },
  {
    title: "Offline is the new Black",
    site: "NDC Oslo",
    city: "Oslo, Norway",
    link: "https://vimeo.com/171317290",
    type: "talk",
    date: new Date(2016, 5, 1)
  },
  {
    title: "Scaling React.js Applications",
    site: "PolyConf",
    city: "Poznan, Poland",
    link: "https://www.youtube.com/watch?v=iNNiqWZtUHg",
    type: "talk",
    date: new Date(2016, 5, 20)
  },
  {
    title: "Scaling React.js Applications",
    site: "RuhrJS",
    city: "Bochum, Germany",
    link: "https://www.youtube.com/watch?v=52Vt8Fg3ZPY",
    type: "talk",
    date: new Date(2016, 6)
  },
  {
    title: "The Future of CSS",
    site: "Frontend Conf Zurich",
    city: "Zurich, Switzerland",
    link: "https://vimeo.com/181328887",
    type: "talk",
    date: new Date(2016, 7)
  },
  {
    title: "Scaling React.js Applications",
    site: "NationJS",
    city: "Washington DC, USA",
    link:
      "https://speakerdeck.com/mxstbr/scaling-react-dot-js-applications-short-version",
    type: "talk",
    date: new Date(2016, 8)
  },
  {
    title: "Keynote: Announcing styled-components 💅",
    site: "ReactNL",
    city: "Amsterdam, Netherlands",
    link: "https://www.youtube.com/watch?v=19gqsBc_Cx0",
    type: "talk",
    date: new Date(2016, 9, 1)
  },
  {
    title: "Scaling React.js Applications",
    site: "VoxxedDays",
    city: "Thessaloniki, Greece",
    link: "https://www.youtube.com/watch?v=KjEmJqJgBCI",
    type: "talk",
    date: new Date(2016, 9, 5)
  },
  {
    title: "styled-components: enforcing best practices",
    site: "ReactiveConf",
    city: "Bratislava, Slovakia",
    link: "https://www.youtube.com/watch?v=jaqDA7Btm3c",
    type: "talk",
    date: new Date(2016, 9, 10)
  },
  {
    title: "Testing React.js Apps with Jest",
    site: "NewStore Tech Talks",
    city: "Berlin, Germany",
    link: "https://www.youtube.com/watch?v=59Ndb3YkLKA",
    type: "talk",
    date: new Date(2016, 10, 1)
  },
  {
    title: "Scaling React.js Apps",
    site: "Topconf Tallinn",
    city: "Tallinn, Estonia",
    link: "https://www.youtube.com/watch?v=6LMnV_NyxuM",
    type: "talk",
    date: new Date(2016, 10, 2)
  },
  {
    title: "Offline is the New Black",
    site: "Topconf Tallinn",
    city: "Tallinn, Estonia",
    link: "https://www.youtube.com/watch?v=iV-_aGb6Ms8",
    type: "talk",
    date: new Date(2016, 10, 3)
  },
  {
    title: "Offline is the New Black",
    site: "HolyJS",
    city: "Moskow, Russia",
    link: "https://www.youtube.com/watch?v=pjr6VJdDcHQ",
    type: "talk",
    date: new Date(2016, 11, 1)
  },
  {
    title: "Introduction to React.js",
    site: "Microsoft Technical Summit",
    city: "Darmstadt, Germany",
    link:
      "https://channel9.msdn.com/Events/microsoft-techncial-summit/Technical-Summit-2016/Introduction-to-Reactjs",
    type: "talk",
    date: new Date(2016, 11, 2)
  },
  {
    title: "Channel9 Live",
    site: "Microsoft Technical Summit",
    type: "interview",
    link:
      "https://channel9.msdn.com/Events/microsoft-techncial-summit/Technical-Summit-2016/Channel-9-live-Interview-with-Max-Stoiber",
    date: new Date(2016, 11, 3)
  },
  {
    title: "Road to styled-components",
    site: "ReactLondon",
    type: "talk",
    city: "London, UK",
    link: "https://www.youtube.com/watch?v=2j9rSur_mnk",
    date: new Date(2017, 2, 2)
  },
  {
    title: "Styling React.js Applications",
    site: "ReactAmsterdam",
    type: "talk",
    city: "Amsterdam, Netherlands",
    link: "https://www.youtube.com/watch?v=bIK2NwoK9xk",
    date: new Date(2017, 3, 1)
  },
  {
    title: "React Beginners Workshop",
    site: "ReactAmsterdam",
    type: "workshop",
    city: "Amsterdam, Netherlands",
    date: new Date(2017, 3, 2)
  },
  {
    title: "I want you to contribute to open source",
    site: "ReactRally",
    type: "talk",
    city: "Salt Lake City, Utah, USA",
    link: "https://www.youtube.com/watch?v=hwdeUG_gySI",
    date: new Date(2017, 7)
  },
  {
    title: "The road to styled-components",
    site: "ReactConf",
    type: "lightning-talk",
    city: "San Jose, California, USA",
    link: "https://www.youtube.com/watch?v=jjN2yURa_uM",
    date: new Date(2017, 2)
  },
  {
    title: "Styling React.js Applications Workshop",
    site: "JSChannel",
    type: "workshop",
    city: "Bangalore, India",
    link: "https://www.youtube.com/watch?v=ftSzsghg2io",
    date: new Date(2017, 6)
  },
  {
    title: "From CSS preprocessors to styled-components",
    site: "Reactivate London",
    city: "London, UK",
    type: "talk",
    link:
      "https://pusher.com/sessions/talk/reactivate-london/from-css-preprocessors-to-styled-components",
    date: new Date(2017, 2, 1)
  },
  {
    title: "styled-components",
    site: ".concat()",
    type: "talk",
    city: "Salzburg, Austria",
    link: "https://www.youtube.com/watch?v=1AuEnDiuRs4",
    date: new Date(2018, 2)
  },
  {
    title: "The road to styled-components",
    site: "WeAreDevelopers",
    city: "Vienna, Austria",
    type: "talk",
    link: "https://www.youtube.com/watch?v=BkgU_-KGK9w",
    date: new Date(2018, 4)
  },
  {
    title: "I want you to contribute to open source",
    site: "AgentConf",
    city: "Dornbirn, Austria",
    type: "talk",
    link: "https://www.youtube.com/watch?v=PUPEptN5MtM",
    date: new Date(2018, 0)
  },
  {
    title: "30 Under 30",
    site: "Forbes Austria",
    type: "award",
    link: "https://www.forbes.at/artikel/maximilian-stoiber.html",
    date: new Date(2018, 5)
  },
  {
    title: "Open Source Wunder",
    site: "Forbes Austria",
    type: "interview",
    city: "German",
    link: "https://www.forbes.at/artikel/open-source-wunder.html",
    date: new Date(2016, 11)
  },
  {
    title: "Site of the Month",
    site: "CSS Winner",
    type: "award",
    city: "Frankensim",
    link: "https://www.csswinner.com/details/frankensim/9805",
    date: new Date(2015, 8, 2)
  },
  {
    title: "2016 Honoree",
    site: "Webby Awards",
    type: "award",
    city: "Frankensim",
    link:
      "https://www.webbyawards.com/winners/2016/websites/general-website/weird/frankensim/",
    date: new Date(2016, 0)
  },
  {
    title: "Site of the Day",
    site: "Awwwards",
    type: "award",
    city: "Frankensim",
    link: "https://www.awwwards.com/sites/frankensim",
    date: new Date(2015, 8, 1)
  },
  {
    title: "Winner",
    site: "The Lovie Awards",
    type: "award",
    city: "Frankensim",
    link: "https://animade.tv/notes/double-win-in-the-lovie-awards",
    date: new Date(2016, 9, 1)
  },
  {
    title: "Winner",
    site: "10th Annual Pixel Awards",
    type: "award",
    city: "Frankensim",
    link: "https://pixelawards.com/winners",
    date: new Date(2016, 1, 1)
  },
  {
    title: "FWA of the Day",
    site: "FWA",
    type: "award",
    city: "Frankensim",
    link: "https://thefwa.com/cases/frankensim",
    date: new Date(2016, 7, 26)
  },
  {
    title: "Most liked Instagram of the Year",
    site: "It's Nice That",
    city: "Frankensim",
    type: "award",
    link:
      "https://www.itsnicethat.com/features/review-of-the-year-2015-top-10-instagram",
    date: new Date(2015, 12)
  },
  {
    title: "Tech Regrets at Spectrum",
    site: "React Amsterdam",
    type: "talk",
    link: "https://reactsummit.com/2019/",
    date: new Date(2019, 3, 2)
  },
  {
    title: "Modern React",
    site: "React Amsterdam",
    type: "workshop",
    link: "https://reactsummit.com/2019/workshops",
    date: new Date(2019, 3, 1)
  },
  {
    title: "Modern React",
    site: "React Day Berlin",
    type: "workshop",
    link: "https://reactday.berlin",
    date: new Date(2019, 11, 4)
  },
  {
    title: "Keynote",
    site: "React Day Berlin",
    type: "talk",
    link: "https://reactday.berlin",
    date: new Date(2019, 11, 6)
  },
  {
    title: "The past, present and future of CSS-in-JS",
    site: "Agent Conf",
    type: "talk",
    link: "https://agent.sh",
    date: new Date(2020, 0, 22)
  },
  {
    title: "Keynote",
    site: "React Conf Australia",
    type: "talk",
    link: "https://reactconfau.com",
    date: new Date(2020, 1, 27)
  }
].sort((a, b) => b.date - a.date);

export default appearances;
