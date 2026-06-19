import { Suspense, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SliceSimulator } from "@slicemachine/adapter-next/simulator";
import { SliceZone } from "@prismicio/react";
import { getDefaultSlices } from "@prismicio/simulator/kit";
import { decompressFromEncodedURIComponent } from "lz-string";
import { components } from "../../slices";

export const Route = createFileRoute("/slice-simulator/")({
  validateSearch: (search: Record<string, unknown>) => ({
    state: typeof search.state === "string" ? search.state : undefined,
  }),
  component: SliceSimulatorRoutePage,
});

function parseSimulatorSlices(state: string | undefined) {
  if (!state) return getDefaultSlices();
  try {
    return JSON.parse(decompressFromEncodedURIComponent(state));
  } catch {
    return getDefaultSlices();
  }
}

function SliceSimulatorRoutePage() {
  const { state } = Route.useSearch();
  const slices = useMemo(() => parseSimulatorSlices(state), [state]);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">
            Loading slice simulator...
          </div>
        </div>
      }
    >
      <SliceSimulator>
        <SliceZone slices={slices} components={components} />
      </SliceSimulator>
    </Suspense>
  );
}
