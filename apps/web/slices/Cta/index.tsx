import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicLink } from "@prismicio/react";
import { Button } from "@/components/ui/button";

/**
 * Props for `Cta`.
 */
export type CtaProps = SliceComponentProps<Content.CtaSlice>;

/**
 * Component for "Cta" Slices.
 */
const Cta: FC<CtaProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      id="contact"
      className="py-20 lg:py-28"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="relative rounded-2xl bg-secondary border border-border p-8 md:p-12 lg:p-16 overflow-hidden">
          <div className="relative flex flex-col items-center justify-center text-center">
            <div className="max-w-2xl">
              <h2 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight text-balance">
                {slice.primary.heading}
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {slice.primary.excerpt}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                {slice.primary.primary_button_label && (
                  <Button
                    size="lg"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-12 px-6"
                    asChild
                  >
                    <PrismicLink field={slice.primary.primary_button_link}>
                      {slice.primary.primary_button_label}
                    </PrismicLink>
                  </Button>
                )}
                {slice.primary.secondary_button_label && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 h-12 px-6 border-border hover:bg-card"
                    asChild
                  >
                    <PrismicLink
                      field={slice.primary.secondary_button_link}
                    >
                      {slice.primary.secondary_button_label}
                    </PrismicLink>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Cta;
