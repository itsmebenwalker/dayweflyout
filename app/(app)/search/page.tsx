import { Suspense } from 'react'
import SearchContent from './SearchContent'

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 space-y-3 max-w-lg mx-auto">
          <div className="h-8 w-40 bg-slate-800 rounded-xl animate-pulse" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  )
}
