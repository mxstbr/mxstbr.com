import Link from 'next/link'
import Image from 'next/image'
import { codeToHtml } from 'shiki/bundle/web'
import React from 'react'
import { MDXComponents } from 'mdx/types'
import { slugify } from './app/slugify'

function Table({ data }) {
  let headers = data.headers.map((header, index) => (
    <th key={index}>{header}</th>
  ))
  let rows = data.rows.map((row, index) => (
    <tr key={index}>
      {row.map((cell, cellIndex) => (
        <td key={cellIndex}>{cell}</td>
      ))}
    </tr>
  ))

  return (
    <table>
      <thead>
        <tr>{headers}</tr>
      </thead>
      <tbody>{rows}</tbody>
    </table>
  )
}

function CustomLink(props) {
  let href = props.href

  if (href.startsWith('/') || href.startsWith('./')) {
    return (
      <Link href={href} {...props}>
        {props.children}
      </Link>
    )
  }

  if (href.startsWith('#')) {
    return <a {...props} />
  }

  return <a target="_blank" {...props} />
}

function RoundedImage(props) {
  return <Image alt={props.alt} className="rounded-lg" {...props} />
}

async function Code({ children, ...props }) {
  const lang = props.className?.replace('language-', '')
  let codeHTML = lang
    ? await codeToHtml(children, {
        structure: 'inline',
        lang,
        themes: {
          light: 'solarized-light',
          dark: 'solarized-dark',
        },
        colorReplacements: {
          '#fdf6e3': 'var(--tw-prose-pre-bg)',
        },
      })
    : children
  return <code dangerouslySetInnerHTML={{ __html: codeHTML }} {...props} />
}

function createHeading(level) {
  const Heading = ({ children }) => {
    let slug = slugify(children)
    return React.createElement(
      `h${level}`,
      { id: slug },
      [
        React.createElement('a', {
          href: `#${slug}`,
          key: `link-${slug}`,
          className: 'anchor',
        }),
      ],
      children,
    )
  }

  Heading.displayName = `Heading${level}`

  return Heading
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: createHeading(1),
    h2: createHeading(2),
    h3: createHeading(3),
    h4: createHeading(4),
    h5: createHeading(5),
    h6: createHeading(6),
    Image: RoundedImage,
    a: CustomLink,
    code: Code,
    Table,
    ...components,
  }
}
