import * as React from 'react'
import { Link as RouterLink } from '@tanstack/react-router'

type NextLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
}

const Link = React.forwardRef<HTMLAnchorElement, NextLinkProps>(
  ({ href, target, rel, ...props }, ref) => {
    const isExternal = href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:') || href.startsWith('tel:')

    if (isExternal) {
      return <a ref={ref} href={href} target={target} rel={rel} {...props} />
    }

    return <RouterLink ref={ref} to={href} target={target} rel={rel} {...props} />
  },
)

Link.displayName = 'NextLinkCompat'

export default Link
