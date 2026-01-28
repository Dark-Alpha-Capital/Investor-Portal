import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type StepIndicatorProps = {
  currentStep: number;
  totalSteps: number;
  onStepClick?: (step: number) => void;
  isEntityInvestor?: boolean;
};

// Step labels for entity investors (7 steps)
const ENTITY_STEP_LABELS = [
  "Account",
  "Accreditation",
  "Entity Compliance",
  "KYC Docs",
  "Investment",
  "Attestations",
  "E-Sign",
];

// Step labels for individual investors (6 steps)
const INDIVIDUAL_STEP_LABELS = [
  "Account",
  "Accreditation",
  "KYC Docs",
  "Investment",
  "Attestations",
  "E-Sign",
];

export function StepIndicator({
  currentStep,
  totalSteps,
  onStepClick,
  isEntityInvestor = false,
}: StepIndicatorProps) {
  const stepLabels = isEntityInvestor ? ENTITY_STEP_LABELS : INDIVIDUAL_STEP_LABELS;

  return (
    <div className="w-full">
      {/* Progress bar for small screens */}
      <div className="sm:hidden mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-muted-foreground">
            {stepLabels[currentStep - 1]}
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Full step indicator for larger screens */}
      <div className="hidden sm:flex items-center justify-between">
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
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
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
                    <Check className="w-5 h-5" />
                  ) : (
                    step
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onStepClick?.(step)}
                  disabled={!onStepClick}
                  className={cn(
                    "mt-2 text-xs font-medium text-center transition-all duration-300 max-w-[80px]",
                    step <= currentStep
                      ? "text-foreground"
                      : "text-muted-foreground",
                    onStepClick && "cursor-pointer hover:text-foreground hover:underline",
                    !onStepClick && "cursor-default"
                  )}
                >
                  {stepLabels[index] || `Step ${step}`}
                </button>
              </div>

              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div
                  className={cn(
                    "flex-1 h-1 mx-2 rounded-full transition-all duration-300",
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
