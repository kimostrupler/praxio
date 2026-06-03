import SidebarLayout from '@/components/SidebarLayout'
import MobileNav from '@/components/MobileNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <SidebarLayout>{children}</SidebarLayout>
      <MobileNav />
    </div>
  )
}
