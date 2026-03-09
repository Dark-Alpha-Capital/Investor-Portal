import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { Target, Building, TrendingUp, LucideIcon } from "lucide-react";

const iconMap: Record<
  "Focused Strategy" | "US-Based Focus" | "Stable EBITDA",
  LucideIcon
> = {
  "Focused Strategy": Target,
  "US-Based Focus": Building,
  "Stable EBITDA": TrendingUp,
};

/**
 * Props for `HeroWithQuote`.
 */
export type HeroWithQuoteProps =
  SliceComponentProps<Content.HeroWithQuoteSlice>;

/**
 * Component for "HeroWithQuote" Slices.
 */
const HeroWithQuote: FC<HeroWithQuoteProps> = ({ slice }) => {
  const { primary } = slice;
  const features = primary.features ?? [];

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-20 lg:py-28 bg-secondary/50"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            {primary.heading && (
              <h2 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight mb-6">
                {primary.heading}
              </h2>
            )}

            {primary.intro && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {primary.intro}
              </p>
            )}

            {primary.body && (
              <p className="text-muted-foreground leading-relaxed mb-8">
                {primary.body}
              </p>
            )}

            <div className="flex flex-col gap-4">
              {features.map((feature, index) => {
                const Icon =
                  feature.icon && feature.icon in iconMap
                    ? iconMap[feature.icon as keyof typeof iconMap]
                    : Target;
                return (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      {feature.title && (
                        <h4 className="font-semibold text-foreground mb-1">
                          {feature.title}
                        </h4>
                      )}
                      {feature.description && (
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {(primary.quote || primary.author_name || primary.author_title) && (
            <div className="relative">
              <div className="bg-card rounded-2xl border border-border p-8 lg:p-12">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/10 rounded-full blur-2xl" />

                <blockquote className="relative">
                  {primary.quote && (
                    <p className="font-serif text-2xl md:text-3xl text-foreground leading-relaxed mb-6">
                      &ldquo;{primary.quote}&rdquo;
                    </p>
                  )}
                  <footer>
                    {primary.author_name && (
                      <p className="font-semibold text-foreground">
                        {primary.author_name}
                      </p>
                    )}
                    {primary.author_title && (
                      <p className="text-sm text-muted-foreground">
                        {primary.author_title}
                      </p>
                    )}
                  </footer>
                </blockquote>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroWithQuote;
