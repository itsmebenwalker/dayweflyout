import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function EmailVerifiedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-[#0F172A]">
      <div className="w-full max-w-sm text-center">
        <div className="bg-green-400/10 rounded-full p-5 mb-5 inline-flex">
          <CheckCircle size={36} className="text-green-400" />
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">Email verified</h1>
        <p className="text-slate-400 text-sm mb-8">
          Your account is confirmed. Time to find some flights.
        </p>
        <Link
          href="/home"
          className="flex items-center justify-center w-full py-3 px-4 rounded-xl bg-sky-400 text-slate-900 font-semibold hover:bg-sky-300 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
