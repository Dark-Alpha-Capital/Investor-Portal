"use client";

import { FC, useState } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import Image from "next/image";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ArrowRight, Minus, Plus } from "lucide-react";
import { PrismicNextImage } from "@prismicio/next";

/**
 * Props for `ImageHeadingToggle`.
 */
export type ImageHeadingToggleProps =
  SliceComponentProps<Content.ImageHeadingToggleSlice>;

/**
 * Component for "ImageHeadingToggle" Slices.
 */
const ImageHeadingToggle: FC<ImageHeadingToggleProps> = ({ slice }) => {
  const [openSections, setOpenSections] = useState<string[]>([
    "individuals-joint",
  ]);

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
      className="w-full block-space"
    >
      <div className="extra-big-container grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left side - Image */}
        <div className="order-2 lg:order-1">
          <div className="relative aspect-[4/3] w-full max-w-md mx-auto lg:max-w-none">
            <PrismicNextImage
              field={slice.primary.featured_image}
              fill
              className="object-cover rounded-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 40vw"
            />
          </div>
        </div>

        {/* Right side - Content */}
        <div className="order-1 lg:order-2 space-y-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 leading-tight">
              {slice.primary.heading}
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {slice.primary.tagline}
            </p>
          </div>

          {/* Accordion Sections */}
          <div className="space-y-0 border border-border rounded-lg overflow-hidden">
            {slice.primary.faq.map((section, index) => (
              <Collapsible
                key={index}
                open={openSections.includes(index.toString())}
                onOpenChange={() => toggleSection(index.toString())}
              >
                <CollapsibleTrigger className="w-full">
                  <div
                    className={`flex items-center justify-between py-5 px-6 hover:bg-muted transition-colors ${
                      index !== slice.primary.faq.length - 1
                    } ${openSections.includes(index.toString()) ? "bg-muted" : "bg-card"}`}
                  >
                    <span className="text-left font-medium text-foreground text-base pr-4">
                      {section.question}
                    </span>
                    {openSections.includes(index.toString()) ? (
                      <Minus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Plus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                </CollapsibleTrigger>
                {section.answer && (
                  <CollapsibleContent className="overflow-hidden bg-muted p-6">
                    <div className="prose">
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
