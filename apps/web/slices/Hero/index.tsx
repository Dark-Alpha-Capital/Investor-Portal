import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrismicNextLink } from "@prismicio/next";

/**
 * Props for `Hero`.
 */
export type HeroProps = SliceComponentProps<Content.HeroSlice>;

/**
 * Component for "Hero" Slices.
 */
const Hero: FC<HeroProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="relative pt-32 pb-20 lg:pt-40 lg:pb-28"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border mb-6">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-muted-foreground">
              {slice.primary.tag}
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground" />
          </div>

          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight tracking-tight text-balance">
            {slice.primary.heading}
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            {slice.primary.excerpt}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            {slice.primary.primary_button_label && (
              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-12 px-6"
                asChild
              >
                <PrismicNextLink field={slice.primary.primary_button_link}>
                  {slice.primary.primary_button_label}
                </PrismicNextLink>
              </Button>
            )}
            {slice.primary.secondary_button_label && (
              <Button
                size="lg"
                variant="outline"
                className="gap-2 h-12 px-6 border-border hover:bg-card"
                asChild
              >
                <PrismicNextLink field={slice.primary.secondary_button_link}>
                  {slice.primary.secondary_button_label}
                </PrismicNextLink>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute top-20 right-0 w-1/3 h-96 bg-gradient-to-l from-secondary/50 to-transparent pointer-events-none hidden lg:block" />
    </section>
  );
};

export default Hero;
