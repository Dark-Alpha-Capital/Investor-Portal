import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";

export type RoundedImageContentProps =
  SliceComponentProps<Content.RoundedImageContentSlice>;

const RoundedImageContent: FC<RoundedImageContentProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 md:py-24"
    >
      <div className="mx-auto w-[min(92%,72rem)]">
        <div className="grid grid-cols-1 overflow-hidden border border-border lg:grid-cols-2">
          {/* Left Content Section */}
          <div className="order-2 flex flex-col justify-center bg-muted/30 p-6 md:p-10 lg:order-1">
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
                {slice.primary.heading}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
                {slice.primary.description}
              </p>
            </div>
          </div>

          <div className="relative order-1 min-h-64 bg-muted lg:order-2 lg:min-h-full">
            <PrismicNextImage
              field={slice.primary.main_image}
              fill
              className="object-cover object-center"
              sizes="(max-width: 64em) 92vw, 46vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoundedImageContent;
