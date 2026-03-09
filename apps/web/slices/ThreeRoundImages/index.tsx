import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";

/**
 * Props for `ThreeRoundImages`.
 */
export type ThreeRoundImagesProps =
  SliceComponentProps<Content.ThreeRoundImagesSlice>;

/**
 * Component for "ThreeRoundImages" Slices.
 */
const ThreeRoundImages: FC<ThreeRoundImagesProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 md:py-24"
    >
      <div className="mx-auto w-[min(92%,72rem)]">
        <div className="flex flex-col items-center text-center">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            {slice.primary.heading}
          </h2>

          <div className="mt-12 grid w-full max-w-5xl grid-cols-1 gap-8 md:grid-cols-3 md:gap-10">
            {slice.primary.cards.map((card, index) => {
              return (
                <div
                  className="flex flex-col items-center gap-4 border border-border bg-background p-5"
                  key={index}
                >
                  <div className="relative aspect-square w-36 overflow-hidden rounded-full sm:w-40 md:w-44">
                    <PrismicNextImage
                      field={card.card_image}
                      fill
                      className="object-cover"
                      sizes="(max-width: 48em) 40vw, 18vw"
                    />
                  </div>
                  <h3 className="text-lg font-medium tracking-wide text-foreground md:text-xl">
                    {card.card_title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ThreeRoundImages;
