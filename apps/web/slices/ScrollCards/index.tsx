
import { Star } from "lucide-react";

import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `ScrollCards`.
 */
export type ScrollCardsProps = SliceComponentProps<Content.ScrollCardsSlice>;

/**
 * Component for "ScrollCards" Slices.
 */
const ScrollCards: FC<ScrollCardsProps> = ({ slice }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        aria-hidden="true"
        className={`h-4 w-4 ${i < rating ? "fill-primary text-primary" : "fill-muted text-muted-foreground"}`}
      />
    ));
  };

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 md:py-24"
    >
      <div className="mx-auto w-[min(92%,76rem)]">
        <h2 className="mb-12 text-center text-3xl font-semibold tracking-tight md:mb-14 md:text-4xl">
          Just a Few Happy Investors
        </h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {slice.primary.cards.map((card, index) => (
            <article
              key={index}
              className="flex h-full flex-col border border-border bg-background p-6"
            >
              <div className="mb-5 flex gap-1" aria-label={`${card.investor_rating} out of 5 stars`}>
                {renderStars(Number(card.investor_rating))}
              </div>

              <blockquote className="mb-7 flex-grow text-base leading-relaxed text-muted-foreground">
                &quot;{card.investor_quote}&quot;
              </blockquote>

              <div className="text-sm text-muted-foreground">
                <div className="font-medium text-foreground">
                  {card.investor_name}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScrollCards;
