'use client'

import { useState } from 'react'
import { Bookmark } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  destination: string
  cityName: string
  isSaved: boolean
  savedId?: string
  onToggle?: (saved: boolean, id?: string) => void
}

export default function SaveButton({
  destination, cityName,
  isSaved: initialSaved, savedId: initialId, onToggle,
}: Props) {
  const [saved, setSaved] = useState(initialSaved)
  const [savedId, setSavedId] = useState(initialId)
  const [loading, setLoading] = useState(false)

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    const supabase = createClient()

    if (saved && savedId) {
      const { error } = await supabase.from('saved_deals').delete().eq('id', savedId)
      if (!error) { setSaved(false); setSavedId(undefined); onToggle?.(false) }
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data, error } = await supabase
        .from('saved_deals')
        .insert({
          user_id: user.id,
          deal_type: 'flight',
          destination,
          start_date: new Date().toISOString().split('T')[0],
          affiliate_url: '#',
          metadata: { city_name: cityName },
        })
        .select('id')
        .single()
      if (!error && data) { setSaved(true); setSavedId(data.id); onToggle?.(true, data.id) }
    }

    setLoading(false)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={saved ? 'Remove from saved' : 'Save destination'}
      className="p-2 -mr-1 transition-opacity disabled:opacity-50"
    >
      <Bookmark
        size={17}
        className={saved ? 'text-sky-400 fill-sky-400' : 'text-slate-500 hover:text-slate-300'}
      />
    </button>
  )
}
