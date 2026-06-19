
import { useEffect, useState } from "react";
import {
  Handshake,
  Search,
  FileText,
  ArrowRightLeft,
  TrendingUp,
} from "lucide-react";

import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";

/**
 * Props for `InvestmentTimeline`.
 */
export type InvestmentTimelineProps =
  SliceComponentProps<Content.InvestmentTimelineSlice>;

const steps = [
  {
    number: "01",
    icon: Handshake,
    title: "Partnership",
    shortDesc: "Initial Connection",
    description: "Initial connection + Business Statement from seller",
    details: [
      "Introduction through our network of advisors and intermediaries",
      "Preliminary discussion to understand seller objectives",
      "Business Statement collection outlining key company metrics",
      "Mutual assessment of fit and partnership potential",
    ],
  },
  {
    number: "02",
    icon: Search,
    title: "Analysis",
    shortDesc: "Deep Dive (2-5 Days)",
    description: "Deep dive (2–5 days)",
    details: [
      "Comprehensive financial review and quality of earnings analysis",
      "Operational assessment and efficiency opportunity identification",
      "Market positioning and competitive landscape evaluation",
      "Management team interviews and cultural fit assessment",
    ],
  },
  {
    number: "03",
    icon: FileText,
    title: "Thesis",
    shortDesc: "Investment Thesis",
    description: "Collaborative investment thesis with sector leaders",
    details: [
      "Development of value creation roadmap with clear milestones",
      "Collaboration with our sector-specific operating advisors",
      "Financial modeling with multiple growth scenarios",
      "Risk assessment and mitigation strategy formulation",
    ],
  },
  {
    number: "04",
    icon: ArrowRightLeft,
    title: "Transaction",
    shortDesc: "8-10 Weeks to Close",
    description: "Handshake → 8–10 weeks to close",
    details: [
      "Term sheet and Letter of Intent execution",
      "Due diligence coordination with professional advisors",
      "Financing arrangement with our capital partner network",
      "Definitive documentation and closing procedures",
    ],
  },
  {
    number: "05",
    icon: TrendingUp,
    title: "Growth",
    shortDesc: "Value Creation",
    description:
      "Value-creation playbook (RPA, AI analytics, ERP, Lean Six Sigma, margin expansion)",
    details: [
      "Robotic Process Automation (RPA) implementation",
      "AI-powered analytics for data-driven decision making",
      "ERP modernization and system integration",
      "Lean Six Sigma operational excellence programs",
      "Strategic margin expansion initiatives",
    ],
  },
];

/**
 * Component for "InvestmentTimeline" Slices.
 */
const InvestmentTimeline: FC<InvestmentTimelineProps> = ({ slice }) => {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section
      data-slice-type={slice.slice_type}
      data-slice-variation={slice.variation}
      id="process"
      className="py-20 lg:py-28"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-serif text-3xl md:text-4xl text-foreground tracking-tight">
            The 5-Step Journey
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            From initial partnership to sustained growth, our process is
            designed for speed, precision, and exceptional outcomes.
          </p>
        </div>

        {/* Horizontal Timeline - Desktop */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Background Line */}
            <div className="absolute top-16 left-[10%] right-[10%] h-0.5 bg-border" />

            {/* Progress Line */}
            <div
              className="absolute top-16 left-[10%] h-0.5 bg-accent transition-all duration-700 ease-out"
              style={{ width: `${(activeStep / (steps.length - 1)) * 80}%` }}
            />

            {/* Steps */}
            <div className="relative flex justify-between px-[5%]">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => setActiveStep(index)}
                >
                  {/* Step Number */}
                  <span
                    className={`text-xs font-medium mb-3 transition-colors ${
                      index <= activeStep
                        ? "text-accent"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.number}
                  </span>

                  {/* Icon Circle */}
                  <div
                    className={`relative z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 border-2 ${
                      index <= activeStep
                        ? "bg-primary border-primary text-primary-foreground shadow-lg"
                        : "bg-card border-border text-muted-foreground group-hover:border-accent/50 group-hover:shadow-md"
                    }`}
                  >
                    <step.icon className="w-8 h-8 mb-1" />
                    <span className="text-xs font-medium">{step.title}</span>
                  </div>

                  {/* Short Description */}
                  <p
                    className={`mt-4 text-xs font-medium text-center transition-colors ${
                      index <= activeStep
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.shortDesc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Step Details */}
          <div className="mt-16 p-8 bg-background rounded-xl border border-border">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                {(() => {
                  const Icon = steps[activeStep].icon;
                  return <Icon className="w-7 h-7 text-accent" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm font-medium text-accent">
                    {steps[activeStep].number}
                  </span>
                  <h3 className="text-xl font-semibold text-foreground">
                    {steps[activeStep].title}
                  </h3>
                </div>
                <p className="text-muted-foreground mb-6">
                  {steps[activeStep].description}
                </p>
                <ul className="grid md:grid-cols-2 gap-3">
                  {steps[activeStep].details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Step Navigation Dots */}
          <div className="flex justify-center gap-2 mt-8">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeStep
                    ? "w-8 bg-accent"
                    : "bg-border hover:bg-muted-foreground"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Mobile Timeline */}
        <div className="lg:hidden space-y-4">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`relative p-6 rounded-xl border transition-all duration-300 ${
                index === activeStep
                  ? "bg-primary/5 border-accent shadow-sm"
                  : "bg-background border-border"
              }`}
              onClick={() => setActiveStep(index)}
            >
              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-9 top-20 w-0.5 h-[calc(100%-2rem)] ${
                    index < activeStep ? "bg-accent" : "bg-border"
                  }`}
                />
              )}

              <div className="flex items-start gap-4">
                <div
                  className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    index <= activeStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <step.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-accent">
                      {step.number}
                    </span>
                    <h3 className="font-semibold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">
                    {step.shortDesc}
                  </p>

                  {index === activeStep && (
                    <div className="mt-4 space-y-2">
                      {step.details.map((detail, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="w-1 h-1 rounded-full bg-accent mt-1.5 shrink-0" />
                          <span className="text-xs text-muted-foreground">
                            {detail}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default InvestmentTimeline;
