import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { PrismicImage } from "@prismicio/react";

export type HeroImageBackgroundProps =
  SliceComponentProps<Content.HeroImageBackgroundSlice>;

const HeroImageBackground: FC<HeroImageBackgroundProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="relative isolate flex min-h-[70vh] items-center overflow-hidden py-20"
    >
      <PrismicImage
        field={slice.primary.background_image}
        className="absolute inset-0 h-full w-full object-cover"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-slate-950/35" />

      <div className="relative z-10 mx-auto w-[min(92%,72rem)]">
        <div className="max-w-3xl space-y-5 text-white md:space-y-7">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
            {slice.primary.heading}
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-white/90 md:text-lg">
            {slice.primary.tagline}
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroImageBackground;
