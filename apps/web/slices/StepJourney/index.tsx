"use client";

import { FC } from "react";
import { Content } from "@prismicio/client";
import { SliceComponentProps } from "@prismicio/react";
import { useState, useEffect } from "react";
import {
  Search,
  Handshake,
  Settings,
  Expand,
  LogOut,
  ArrowRight,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<
  "Identify" | "Acquire" | "Optimize" | "Scale" | "Exit",
  LucideIcon
> = {
  Identify: Search,
  Acquire: Handshake,
  Optimize: Settings,
  Scale: Expand,
  Exit: LogOut,
};

/**
 * Props for `StepJourney`.
 */
export type StepJourneyProps = SliceComponentProps<Content.StepJourneySlice>;

/**
 * Component for "StepJourney" Slices.
 */
const StepJourney: FC<StepJourneyProps> = ({ slice }) => {
  const steps = slice.primary.steps ?? [];
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (steps.length === 0) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [steps.length]);

  if (steps.length === 0) return null;

  const { primary } = slice;
  const progressWidth =
    steps.length > 1 ? (activeStep / (steps.length - 1)) * 100 : 100;

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
            {primary.heading}
          </h2>
          {primary.excerpt && (
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              {primary.excerpt}
            </p>
          )}
        </div>

        {/* Desktop Process Flow */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connection Line */}
            <div className="absolute top-12 left-0 right-0 h-0.5 bg-border" />
            <div
              className="absolute top-12 left-0 h-0.5 bg-accent transition-all duration-500"
              style={{ width: `${progressWidth}%` }}
            />

            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}
            >
              {steps.map((step, index) => {
                const Icon =
                  step.icon && step.icon in iconMap
                    ? iconMap[step.icon as keyof typeof iconMap]
                    : Search;
                return (
                  <div
                    key={index}
                    className="relative cursor-pointer group"
                    onClick={() => setActiveStep(index)}
                  >
                    <div
                      className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-300 border-2 ${
                        index <= activeStep
                          ? "bg-primary border-primary text-primary-foreground"
                          : "bg-card border-border text-muted-foreground group-hover:border-accent/50"
                      }`}
                    >
                      <Icon className="w-8 h-8" />
                    </div>

                    <div className="mt-6 text-center">
                      <h3
                        className={`font-semibold transition-colors ${
                          index <= activeStep
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed px-2">
                        {step.description}
                      </p>
                    </div>

                    {index < steps.length - 1 && (
                      <ArrowRight
                        className={`absolute top-12 -right-2 w-4 h-4 -translate-y-1/2 transition-colors ${
                          index < activeStep ? "text-accent" : "text-border"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Process Flow */}
        <div className="lg:hidden space-y-4">
          {steps.map((step, index) => {
            const Icon =
              step.icon && step.icon in iconMap
                ? iconMap[step.icon as keyof typeof iconMap]
                : Search;
            return (
              <div
                key={index}
                className={`p-6 rounded-lg border transition-all duration-300 ${
                  index === activeStep
                    ? "bg-primary/5 border-accent"
                    : "bg-card border-border"
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                      index <= activeStep
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        Step {index + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {step.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mt-12">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveStep(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeStep
                  ? "w-8 bg-accent"
                  : "bg-border hover:bg-muted-foreground"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StepJourney;
