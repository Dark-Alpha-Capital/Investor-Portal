import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";
import { PrismicRichText } from "@prismicio/react";

/**
 * Props for `ThreeContentCards`.
 */
export type ThreeContentCardsProps =
  SliceComponentProps<Content.ThreeContentCardsSlice>;

/**
 * Component for "ThreeContentCards" Slices.
 */
const ThreeContentCards: FC<ThreeContentCardsProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 md:py-24"
    >
      <div className="mx-auto w-[min(92%,72rem)]">
        {/* Header */}
        <div className="mb-12 text-center md:mb-14">
          <h2 className="mb-6 text-3xl font-semibold tracking-tight md:text-4xl">
            {slice.primary.heading}
          </h2>
          <p className="mx-auto max-w-4xl text-base leading-relaxed text-muted-foreground md:text-lg">
            {slice.primary.tagline}
          </p>
        </div>

        {/* Investment Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {slice.primary.cards.map((card, index) => {
            return (
              <article
                className="flex flex-col border border-border bg-background p-5"
                key={index}
              >
                <div className="mb-5 overflow-hidden border border-border">
                  <PrismicNextImage
                    field={card.card_image}
                    className="h-56 w-full object-cover sm:h-64"
                    sizes="(max-width: 48em) 92vw, (max-width: 64em) 46vw, 30vw"
                  />
                </div>
                <h3 className="mb-3 text-xl font-semibold tracking-tight">
                  {card.heading}
                </h3>

                <div className="prose dark:prose-invert mt-4 max-w-none text-left prose-sm prose-p:leading-relaxed">
                  <PrismicRichText field={card.content} />
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ThreeContentCards;
