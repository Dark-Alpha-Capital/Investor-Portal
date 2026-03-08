import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { Check } from "lucide-react";

/**
 * Props for `ReuseableCards`.
 */
export type ReuseableCardsProps =
  SliceComponentProps<Content.ReuseableCardsSlice>;

/**
 * Component for "ReuseableCards" Slices.
 */
const ReuseableCards: FC<ReuseableCardsProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 md:py-24"
    >
      <div className="mx-auto w-[min(92%,76rem)]">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
          {slice.primary.heading}
        </h2>

        <div className="mt-8 grid grid-cols-1 gap-5 md:mt-10 md:grid-cols-3">
          {slice.primary.cards.map((card, index) => {
            return (
              <article className="border border-border bg-background p-6" key={index}>
                <div className="mb-4 flex size-8 items-center justify-center rounded-full bg-muted">
                  <Check className="h-4 w-4 text-primary" />
                </div>
                <h3 className="mb-3 text-xl font-semibold tracking-tight">
                  {card.card_heading}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  {card.card_description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ReuseableCards;
