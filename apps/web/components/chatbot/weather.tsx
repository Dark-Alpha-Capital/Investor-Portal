type WeatherProps = {
  temperature: number;
  weather: string;
  location: string;
};

export function Weather({ temperature, weather, location }: WeatherProps) {
  return (
    <div className="w-full max-w-sm rounded-lg border bg-muted/40 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Current weather
      </p>
      <h2 className="mt-1 text-base font-semibold tracking-tight">{location}</h2>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tabular-nums tracking-tight">
          {temperature}
          <span className="text-lg font-medium text-muted-foreground">°F</span>
        </p>
        <p className="pb-1 text-sm text-muted-foreground">{weather}</p>
      </div>
    </div>
  );
}
