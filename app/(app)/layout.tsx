import BottomNav from '@/components/nav/BottomNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A]">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
