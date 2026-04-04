
import { FC, useState } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Minus, Plus } from "lucide-react";
import { PrismicImage } from "@prismicio/react";

/**
 * Props for `ImageHeadingToggle`.
 */
export type ImageHeadingToggleProps =
  SliceComponentProps<Content.ImageHeadingToggleSlice>;

/**
 * Component for "ImageHeadingToggle" Slices.
 */
const ImageHeadingToggle: FC<ImageHeadingToggleProps> = ({ slice }) => {
  const [openSections, setOpenSections] = useState<string[]>(["0"]);

  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 md:py-24"
    >
      <div className="mx-auto grid w-[min(92%,76rem)] items-start gap-10 lg:grid-cols-2 lg:gap-14">
        {/* Left side - Image */}
        <div className="order-2 lg:order-1">
          <div className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-muted">
            <PrismicImage
              field={slice.primary.featured_image}
              className="object-cover"
              sizes="(max-width: 64em) 92vw, 46vw"
            />
          </div>
        </div>

        {/* Right side - Content */}
        <div className="order-1 lg:order-2 space-y-6">
          <div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              {slice.primary.heading}
            </h2>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
              {slice.primary.tagline}
            </p>
          </div>

          {/* Accordion Sections */}
          <div className="divide-y divide-border border-y border-border">
            {slice.primary.faq.map((section, index) => (
              <Collapsible
                key={index}
                open={openSections.includes(index.toString())}
                onOpenChange={() => toggleSection(index.toString())}
              >
                <CollapsibleTrigger className="w-full cursor-pointer">
                  <div
                    className={`flex items-center justify-between gap-6 py-5 transition-colors hover:bg-muted/40 ${
                      openSections.includes(index.toString()) ? "bg-muted/30" : ""
                    }`}
                  >
                    <span className="pr-2 text-left text-base font-medium text-foreground">
                      {section.question}
                    </span>
                    {openSections.includes(index.toString()) ? (
                      <Minus className="h-5 w-5 shrink-0 text-muted-foreground" />
                    ) : (
                      <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />
                    )}
                  </div>
                </CollapsibleTrigger>
                {section.answer && (
                  <CollapsibleContent className="overflow-hidden bg-muted/30 pb-5 pr-2">
                    <div className="prose prose-slate max-w-none prose-sm prose-p:leading-relaxed">
                      <PrismicRichText field={section.answer} />
                    </div>
                  </CollapsibleContent>
                )}
              </Collapsible>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ImageHeadingToggle;
