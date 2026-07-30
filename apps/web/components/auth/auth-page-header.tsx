import type { ReactNode } from "react";

type AuthPageHeaderProps = {
  title: string;
  description?: ReactNode;
};

export function AuthPageHeader({ title, description }: AuthPageHeaderProps) {
  return (
    <div className="space-y-2 text-center lg:text-left">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      {description ? (
        <div className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </div>
      ) : null}
    </div>
  );
}
