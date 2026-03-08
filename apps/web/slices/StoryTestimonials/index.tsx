import { FC } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";

/**
 * Props for `StoryTestimonials`.
 */
export type StoryTestimonialsProps =
  SliceComponentProps<Content.StoryTestimonialsSlice>;

/**
 * Component for "StoryTestimonials" Slices.
 */
const StoryTestimonials: FC<StoryTestimonialsProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 md:py-24"
    >
      <div className="mx-auto w-[min(92%,72rem)]">
        <div className="mx-auto max-w-4xl border-y border-border py-10 md:py-12">
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="inline-flex border border-border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {slice.primary.tagline}
            </span>
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {slice.primary.heading}
            </h2>
          </div>
          <div className="prose prose-slate mx-auto mt-8 max-w-3xl text-center prose-p:leading-relaxed">
            <PrismicRichText field={slice.primary.content} />
          </div>
          <div className="mt-10 border-t border-border pt-6 text-center">
            <p className="text-lg font-semibold tracking-tight text-foreground">
              {slice.primary.founder_name}
            </p>
            <p className="text-sm italic text-muted-foreground md:text-base">
              {slice.primary.founder_designation}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StoryTestimonials;
