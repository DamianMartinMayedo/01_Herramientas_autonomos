export function RouteLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div
        className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
      />
    </div>
  )
}
