import './dashboard.css'

interface DashboardLoaderProps {
  label?: string
  hint?: string
}

/** Geometric packing-box loader — items move into a carton. */
export function DashboardLoader({
  label = 'Preparing operations snapshot',
  hint = 'Aggregating orders, inventory, and warehouse workload…',
}: DashboardLoaderProps) {
  return (
    <div className="qk-pack-loader" role="status" aria-live="polite" aria-label={label}>
      <div className="qk-pack-stage" aria-hidden>
        <div className="qk-pack-item" />
        <div className="qk-pack-item" />
        <div className="qk-pack-item" />
        <div className="qk-pack-item" />
        <div className="qk-pack-box">
          <div className="qk-pack-flap" />
        </div>
      </div>
      <div className="qk-pack-caption">
        {label}
        <span>{hint}</span>
      </div>
    </div>
  )
}
