import { Check } from 'lucide-react'

const rules = [
  { label: '12 or more characters', test: (p: string) => p.length >= 12 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'At least one number', test: (p: string) => /[0-9]/.test(p) },
]

export default function PasswordRules({ password }: { password: string }) {
  if (!password) return null

  return (
    <ul className="space-y-1.5 mt-2">
      {rules.map(({ label, test }) => {
        const met = test(password)
        return (
          <li key={label} className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-emerald-400' : 'text-slate-500'}`}>
            <span className={`flex items-center justify-center w-4 h-4 rounded-full border transition-colors ${met ? 'border-emerald-400 bg-emerald-400/20' : 'border-slate-600'}`}>
              {met && <Check size={10} strokeWidth={3} />}
            </span>
            {label}
          </li>
        )
      })}
    </ul>
  )
}
