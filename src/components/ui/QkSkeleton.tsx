interface QkSkeletonProps {
  height?: number | string
  width?: number | string
  radius?: number | string
}

export function QkSkeleton({ height = 12, width = '100%', radius = 6 }: QkSkeletonProps) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius,
        background: 'linear-gradient(90deg, var(--qk-bg) 25%, var(--qk-border) 50%, var(--qk-bg) 75%)',
        backgroundSize: '200% 100%',
        animation: 'qk-skeleton 1.4s ease infinite',
      }}
    />
  )
}
