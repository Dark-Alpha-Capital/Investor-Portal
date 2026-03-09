import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { Factory, Briefcase, Heart, Plane, LucideIcon } from "lucide-react";

/**
 * Props for `SectorExpertise`.
 */
export type SectorExpertiseProps =
  SliceComponentProps<Content.SectorExpertiseSlice>;

const iconMap: Record<
  "Manufacturing" | "Business Services" | "Healthcare" | "Aerospace & Defense",
  LucideIcon
> = {
  Manufacturing: Factory,
  "Business Services": Briefcase,
  Healthcare: Heart,
  "Aerospace & Defense": Plane,
};

const statCards: {
  label: string;
  key: "revenue" | "ebitda" | "geography" | "ownership";
}[] = [
  { label: "Revenue", key: "revenue" },
  { label: "EBITDA", key: "ebitda" },
  { label: "Geography", key: "geography" },
  { label: "Ownership", key: "ownership" },
];

/**
 * Component for "SectorExpertise" Slices.
 */
const SectorExpertise: FC<SectorExpertiseProps> = ({ slice }) => {
  const { primary } = slice;
  const sectors = primary.sector ?? [];

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      id="sectors"
      className="py-20 lg:py-28 bg-primary text-primary-foreground"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl tracking-tight">
              {primary.heading}
            </h2>
            <p className="mt-4 text-primary-foreground/70 leading-relaxed">
              {primary.excerpt}
            </p>

            {primary.target_profile_label && (
              <div className="mt-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-primary-foreground/20" />
                <span className="text-sm text-primary-foreground/50">
                  {primary.target_profile_label}
                </span>
                <div className="h-px flex-1 bg-primary-foreground/20" />
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              {statCards.map(({ label, key }) => {
                const value = primary[key];
                if (!value) return null;
                return (
                  <div
                    key={key}
                    className="p-4 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10"
                  >
                    <span className="text-primary-foreground/60">{label}</span>
                    <p className="font-semibold">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {sectors.map((sector, index) => {
              const Icon =
                sector.icon && sector.icon in iconMap
                  ? iconMap[sector.icon as keyof typeof iconMap]
                  : Factory;
              return (
                <div
                  key={index}
                  className="group p-6 rounded-lg bg-primary-foreground/5 border border-primary-foreground/10 hover:bg-primary-foreground/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center mb-4 group-hover:bg-primary-foreground/20 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold mb-2">{sector.name}</h3>
                  <p className="text-xs text-primary-foreground/60 leading-relaxed">
                    {sector.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectorExpertise;
