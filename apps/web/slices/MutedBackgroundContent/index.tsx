import { FC } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";

/**
 * Props for `MutedBackgroundContent`.
 */
export type MutedBackgroundContentProps =
  SliceComponentProps<Content.MutedBackgroundContentSlice>;

/**
 * Component for "MutedBackgroundContent" Slices.
 */
const MutedBackgroundContent: FC<MutedBackgroundContentProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 md:py-24"
    >
      <div className="mx-auto w-[min(92%,76rem)]">
        <div className="mx-auto max-w-4xl border-y border-border bg-muted/35 p-6 md:p-8 lg:p-10">
          <div className="prose prose-slate max-w-none prose-p:leading-relaxed">
            <PrismicRichText field={slice.primary.content} />
          </div>
          <div className="mt-8 border-t border-border pt-4">
            <cite className="text-sm font-medium not-italic text-muted-foreground md:text-base">
              {slice.primary.author}
            </cite>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MutedBackgroundContent;
