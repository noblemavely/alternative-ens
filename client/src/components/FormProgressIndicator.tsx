import React from "react";
import { CheckCircle, Circle } from "lucide-react";

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface FormProgressIndicatorProps {
  steps: Step[];
  currentStep: string;
  completionPercentage: number;
}

export default function FormProgressIndicator({
  steps,
  currentStep,
  completionPercentage,
}: FormProgressIndicatorProps) {
  return (
    <div className="mb-8 space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-foreground">Profile Completion</p>
          <p className="text-sm font-semibold text-primary">{completionPercentage}%</p>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2 min-w-max">
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-all ${
                step.completed
                  ? "bg-green-100 text-green-700"
                  : currentStep === step.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step.completed ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Circle className="w-4 h-4" />
              )}
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div className="h-1 w-2 bg-muted rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
