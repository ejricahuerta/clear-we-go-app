export default function AvailabilityPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground">Availability</h1>
      <p className="text-muted-foreground mt-1 text-sm">Set when you&apos;re available for jobs.</p>
      <div className="mt-6 rounded-lg border border-border bg-card p-4 text-card-foreground">
        <p className="text-sm text-muted-foreground">
          Weekly schedule and unavailable dates will be added in a later phase.
        </p>
      </div>
    </div>
  );
}
