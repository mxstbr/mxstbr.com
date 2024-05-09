'use client'
import React, { ReactNode, forwardRef } from 'react'

type HandleProps = {
  expanded: boolean
  hideWhenExpanded?: boolean
  rightMarginOnHide?: string
  leftMarginOnHide?: string
  children: ReactNode
}

const shouldShow = (props: HandleProps) => {
  if (!props.expanded && props.hideWhenExpanded) return false

  return true
}

const Handle = (props: HandleProps) => (
  <span
    className={`transition-all ${
      shouldShow(props) ? `opacity-1` : `opacity-0`
    }`}
    style={{
      marginLeft: shouldShow(props) ? undefined : props.leftMarginOnHide || '',
      marginRight: shouldShow(props)
        ? undefined
        : props.rightMarginOnHide || '',
    }}
  >
    {props.children}
  </span>
)

const Logo = forwardRef<any, { expanded: boolean }>(function Logo(
  { expanded = true },
  ref
) {
  return (
    <a href="/" ref={ref}>
      <h1 className="font-serif transition-all">
        m
        <Handle expanded={expanded} hideWhenExpanded leftMarginOnHide="-0.5em">
          a
        </Handle>
        x
        <Handle expanded={expanded} hideWhenExpanded rightMarginOnHide="-.2em">
          &nbsp;
        </Handle>
        st
        <Handle
          expanded={expanded}
          hideWhenExpanded
          rightMarginOnHide="-.5em"
          leftMarginOnHide="-0.34em"
        >
          oi
        </Handle>
        b
        <Handle expanded={expanded} hideWhenExpanded rightMarginOnHide="-0.5em">
          e
        </Handle>
        r
      </h1>
    </a>
  )
})

export default Logo
