import { FC } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { PrismicLink } from "@prismicio/react";

/**
 * Props for `SideHeadingContent`.
 */
export type SideHeadingContentProps =
  SliceComponentProps<Content.SideHeadingContentSlice>;

/**
 * Component for "SideHeadingContent" Slices.
 */
const SideHeadingContent: FC<SideHeadingContentProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 md:py-24"
    >
      <div className="mx-auto w-[min(92%,76rem)]">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 xl:gap-20 items-start">
          {/* Left Column - Heading */}
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              {slice.primary.heading}
            </h2>
          </div>

          {/* Right Column - Content */}
          <div className="space-y-6 lg:space-y-8">
            <div className="prose prose-slate max-w-none prose-sm prose-p:leading-relaxed">
              <PrismicRichText field={slice.primary.content} />
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="group"
                asChild
              >
                <PrismicLink field={slice.primary.button_link}>
                  {slice.primary.button_link.text}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </PrismicLink>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SideHeadingContent;
