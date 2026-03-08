import { FC } from "react";
import { Content } from "@prismicio/client";
import { PrismicRichText, SliceComponentProps } from "@prismicio/react";
import { PrismicNextImage, PrismicNextLink } from "@prismicio/next";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export type InvestmentHeroProps =
  SliceComponentProps<Content.InvestmentHeroSlice>;

const InvestmentHero: FC<InvestmentHeroProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      className="relative isolate overflow-hidden py-16 md:py-24"
    >
      <div className="absolute inset-0 -z-10">
        <PrismicNextImage
          field={slice.primary.background_image}
          className="h-full w-full object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-950/20" />
      </div>

      <div className="mx-auto grid w-[min(92%,76rem)] items-center gap-10 border-y border-white/40 bg-white/90 p-6 backdrop-blur md:grid-cols-2 md:p-10">
        <div className="order-2 md:order-1">
          <PrismicNextImage
            field={slice.primary.featured_image}
            className="h-auto w-full border border-border object-cover"
            priority
            sizes="(max-width: 64em) 92vw, 44vw"
          />
        </div>

        <div className="order-1 space-y-6 md:order-2">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-foreground md:text-4xl">
            {slice.primary.heading}
          </h2>

          <div className="prose prose-slate max-w-none prose-sm prose-p:leading-relaxed">
            <PrismicRichText field={slice.primary.content} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              asChild
              className="w-full justify-center sm:w-auto"
            >
              <PrismicNextLink field={slice.primary.pdf_guide} target="_blank">
                <Download className="size-4" />
                <span>{slice.primary.pdf_guide.text}</span>
              </PrismicNextLink>
            </Button>
            <Button
              variant="outline"
              asChild
              className="w-full justify-center sm:w-auto"
            >
              <PrismicNextLink field={slice.primary.guide_image} target="_blank">
                <Download className="size-4" />
                <span>{slice.primary.guide_image.text}</span>
              </PrismicNextLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default InvestmentHero;
