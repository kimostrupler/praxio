function Bone({ className }: { className: string }) {
  return <div className={`bg-[#1c1c1c] rounded-lg animate-pulse ${className}`} />
}

export default function DashboardLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 w-full space-y-5">
      <div className="flex items-center justify-between">
        <Bone className="h-7 w-40" />
        <Bone className="h-9 w-64 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <Bone key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[1, 2, 3].map(i => <Bone key={i} className="h-16 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 space-y-4">
          <Bone className="h-48 rounded-xl" />
          <Bone className="h-64 rounded-xl" />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Bone className="h-24 rounded-xl" />
          <Bone className="h-24 rounded-xl" />
          <Bone className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  )
}
