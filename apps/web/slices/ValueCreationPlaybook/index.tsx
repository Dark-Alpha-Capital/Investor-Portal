import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { Clock, Target, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * Props for `ValueCreationPlaybook`.
 */
export type ValueCreationPlaybookProps =
  SliceComponentProps<Content.ValueCreationPlaybookSlice>;

const differentiators = [
  {
    icon: Clock,
    title: "Speed to Close",
    value: "8-10 Weeks",
    description:
      "From handshake to closing, we move 4-5x faster than traditional private equity firms.",
  },
  {
    icon: Target,
    title: "Focused Analysis",
    value: "2-5 Days",
    description:
      "Our deep sector expertise enables rapid yet thorough due diligence assessments.",
  },
  {
    icon: Shield,
    title: "Certainty of Close",
    value: "95%+",
    description:
      "Once we commit, we close. Our capital partner relationships ensure execution.",
  },
  {
    icon: Users,
    title: "Partnership First",
    value: "Day 1",
    description:
      "We work as an extension of management from the very first conversation.",
  },
];

/**
 * Component for "ValueCreationPlaybook" Slices.
 */
const ValueCreationPlaybook: FC<ValueCreationPlaybookProps> = ({ slice }) => {
  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      id="differentiators"
      className="py-20 lg:py-28"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="mb-20">
          <h2 className="font-serif text-2xl md:text-3xl text-foreground tracking-tight text-center mb-12">
            Why Our Process Works
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {differentiators.map((item, index) => (
              <div
                key={index}
                className="p-6 bg-card rounded-xl border border-border hover:border-accent/30 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <div className="text-2xl font-bold text-foreground mb-1">
                  {item.value}
                </div>
                <div className="text-sm font-medium text-foreground mb-2">
                  {item.title}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Value Creation Playbook */}
        <div className="bg-primary rounded-2xl p-8 lg:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-2xl md:text-3xl text-primary-foreground tracking-tight mb-4">
              The Value-Creation Playbook
            </h2>
            <p className="text-primary-foreground/80 mb-8 leading-relaxed">
              Post-acquisition, we deploy our proven operational toolkit to
              drive immediate and sustainable value creation across every
              portfolio company.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
              {[
                { label: "RPA", desc: "Process Automation" },
                { label: "AI", desc: "Analytics & Insights" },
                { label: "ERP", desc: "System Integration" },
                { label: "LSS", desc: "Lean Six Sigma" },
                { label: "Margin", desc: "Expansion" },
              ].map((tool, index) => (
                <div
                  key={index}
                  className="bg-primary-foreground/10 rounded-lg p-4 backdrop-blur-sm"
                >
                  <div className="text-lg font-bold text-primary-foreground">
                    {tool.label}
                  </div>
                  <div className="text-xs text-primary-foreground/70">
                    {tool.desc}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-primary-foreground/70 mb-8">
              Our playbook has delivered an average of{" "}
              <span className="text-primary-foreground font-semibold">
                40% efficiency gains
              </span>{" "}
              across portfolio companies.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link href="/contact">Start a Conversation</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/about">Learn About Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ValueCreationPlaybook;
