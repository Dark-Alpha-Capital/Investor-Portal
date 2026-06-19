import * as React from "react";
import { Link as RouterLink } from "@tanstack/react-router";

type AppLinkProps = Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> & {
  href: string;
};

export const AppLink = React.forwardRef<HTMLAnchorElement, AppLinkProps>(
  ({ href, target, rel, ...props }, ref) => {
    const isExternal =
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:") ||
      href.startsWith("tel:") ||
      href.startsWith("#");

    if (isExternal) {
      return <a ref={ref} href={href} target={target} rel={rel} {...props} />;
    }

    return (
      <RouterLink
        ref={ref}
        to={href}
        target={target}
        rel={rel}
        {...(props as React.ComponentProps<typeof RouterLink>)}
      />
    );
  },
);

AppLink.displayName = "AppLink";

export default AppLink;
