import { FC } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import { cn } from "@/lib/utils";

/**
 * Props for `ContentHeading`.
 */
export type ContentHeadingProps =
  SliceComponentProps<Content.ContentHeadingSlice>;

/**
 * Component for "ContentHeading" Slices.
 */
const ContentHeading: FC<ContentHeadingProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 md:py-24"
    >
      <div
        className={cn(
          "mx-auto w-[min(92%,72rem)]",
          slice.variation === "contentNarrowContainer" && "w-[min(92%,46rem)]"
        )}
      >
        <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-li:leading-relaxed prose-headings:tracking-tight">
          <PrismicRichText field={slice.primary.main_content} />
        </div>
      </div>
    </section>
  );
};

export default ContentHeading;
