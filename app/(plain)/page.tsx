import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Max Stoiber',
  description: 'A few things about Max Stoiber, and a few things he believes.',
}

export default function Home() {
  return (
    <article className="plain-page">
      <h1>Max Stoiber</h1>

      <section aria-labelledby="about-me">
        <h2 id="about-me">Some things about me:</h2>
        <ul>
          <li>
            Member of Technical Staff at <a href="https://openai.com">OpenAI</a>
          </li>
          <li>
            Previously Director of Engineering at{' '}
            <a href="https://shopify.com">Shopify</a>
          </li>
          <li>
            Founded two companies
            <ul>
              <li>
                <a href="https://spectrum.chat">Spectrum</a>, acquired by GitHub
              </li>
              <li>
                <a href="https://stellate.co">Stellate</a>, acquired by Shopify
              </li>
            </ul>
          </li>
          <li>
            Created <Link href="/oss">open source projects</Link> with 100k+
            total stars
          </li>
          <li>
            <Link href="/investing">Invest in early-stage startups</Link>
          </li>
          <li>
            Into coffee,{' '}
            <a href="https://www.youtube.com/watch?v=19kDOIwzTfE">skiing</a>,
            and music
          </li>
          <li>Grew up in Vienna, Austria</li>
          <li>Live in San Francisco</li>
        </ul>
      </section>

      <section aria-labelledby="beliefs">
        <h2 id="beliefs">Some things I believe:</h2>
        <ul>
          <li>
            What you tolerate becomes the standard
            <ul>
              <li>Focus on your high performers</li>
              <li>When there is doubt, there is no doubt</li>
              <li>Set expectations early and often</li>
              <li>Default to open</li>
              <li>95th percentile isn&apos;t that good</li>
            </ul>
          </li>
          <li>
            Speed wins
            <ul>
              <li>There is no speed limit</li>
              <li>Pressure is a privilege</li>
              <li>Slow is smooth and smooth is fast</li>
              <li>Scope down and ship</li>
              <li>Save polish for where it matters</li>
            </ul>
          </li>
          <li>
            Start with why
            <ul>
              <li>The right question is half the answer</li>
              <li>Be aggressively intolerant of vague thinking</li>
              <li>Fall in love with the problem, not the solution</li>
            </ul>
          </li>
          <li>
            Feelings are data
            <ul>
              <li>People do things for good reasons</li>
              <li>Every judgement is a self portrait</li>
              <li>Feelings come from expectations</li>
              <li>Freedom with, not freedom from</li>
              <li>Nervousness is excitement without breath</li>
            </ul>
          </li>
        </ul>
      </section>

      <section aria-labelledby="elsewhere">
        <h2 id="elsewhere">Elsewhere:</h2>
        <ul>
          <li>
            <Link href="/thoughts">Essays</Link>
          </li>
          <li>
            <Link href="/notes">Notes</Link>
          </li>
          <li>
            <a href="https://x.com/mxstbr">X</a>
          </li>
          <li>
            <a href="https://github.com/mxstbr">GitHub</a>
          </li>
          <li>
            <a href="mailto:contact@mxstbr.com">Email</a>
          </li>
        </ul>
      </section>
    </article>
  )
}
