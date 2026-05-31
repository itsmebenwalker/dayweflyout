export default function ScheduleLoading() {
  return (
    <div className="p-4 max-w-lg mx-auto">
      <div className="h-8 w-40 bg-slate-800 rounded-xl animate-pulse mb-2" />
      <div className="h-4 w-56 bg-slate-800 rounded animate-pulse mb-6" />

      {[1, 2].map((group) => (
        <div key={group} className="mb-7">
          <div className="h-3 w-24 bg-slate-800 rounded animate-pulse mb-3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
