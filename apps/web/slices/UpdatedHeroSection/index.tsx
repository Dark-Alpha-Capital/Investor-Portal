import { FC } from "react";
import { Content } from "@prismicio/client";
import {
  PrismicImage,
  PrismicLink,
  PrismicRichText,
  SliceComponentProps,
} from "@prismicio/react";
import { ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Props for `UpdatedHeroSection`.
 */
export type UpdatedHeroSectionProps =
  SliceComponentProps<Content.UpdatedHeroSectionSlice>;

/**
 * Component for "UpdatedHeroSection" Slices.
 */
const UpdatedHeroSection: FC<UpdatedHeroSectionProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="py-16 md:py-24"
    >
      <div className="relative min-h-[56vh] overflow-hidden">
        <PrismicImage
          field={slice.primary.background_image}
          className="absolute inset-0 z-0 h-full w-full object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-950/35" />
        <div className="relative z-10 mx-auto w-[min(92%,76rem)]">
          <div className="mb-6 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
              {slice.primary.heading}
            </h2>
          </div>
          <div className="border border-white/35 bg-white/90 p-6 backdrop-blur md:p-10 lg:p-12">
            <div className="grid gap-10 md:grid-cols-2 md:gap-14">
              <div className="space-y-5">
                <h3 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
                  {slice.primary.title}
                </h3>

                <p className="text-lg leading-relaxed text-muted-foreground md:text-xl">
                  {slice.primary.tagline}
                </p>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div className="prose prose-slate max-w-none prose-sm prose-p:leading-relaxed">
                  <PrismicRichText field={slice.primary.content} />
                </div>
                <Button size="lg" className="mt-2 w-full sm:w-auto" asChild>
                  <PrismicLink field={slice.primary.button_link}>
                    {slice.primary.button_link.text}
                    <ArrowRightIcon className="ml-2 size-4" />
                  </PrismicLink>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UpdatedHeroSection;
