import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
};

const STEP_LABELS = [
  "Account & Profile",
  "Accreditation",
  "KYC Verification",
  "Investment Profile",
  "Legal & E-Sign",
];

export function StepIndicator({ currentStep, totalSteps, onStepClick }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map(
          (step, index) => (
            <div key={step} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <button
                  type="button"
                  onClick={() => onStepClick?.(step)}
                  disabled={!onStepClick}
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold text-sm sm:text-base transition-all duration-300",
                    step < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step === currentStep
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground",
                    onStepClick && "cursor-pointer hover:opacity-80 hover:scale-105",
                    !onStepClick && "cursor-default"
                  )}
                >
                  {step < currentStep ? (
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  ) : (
                    step
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onStepClick?.(step)}
                  disabled={!onStepClick}
                  className={cn(
                    "mt-2 text-xs sm:text-sm font-medium text-center transition-all duration-300",
                    step <= currentStep
                      ? "text-foreground"
                      : "text-muted-foreground",
                    onStepClick && "cursor-pointer hover:text-foreground hover:underline",
                    !onStepClick && "cursor-default"
                  )}
                >
                  {STEP_LABELS[index]}
                </button>
              </div>

              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 sm:mx-4 rounded-full transition-all duration-300",
                    step < currentStep ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
}
