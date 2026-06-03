function Bone({ className }: { className: string }) {
  return <div className={`bg-[#1c1c1c] rounded-lg animate-pulse ${className}`} />
}

export default function ClientsLoading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 w-full space-y-4">
      <div className="flex items-center justify-between">
        <Bone className="h-7 w-28" />
        <Bone className="h-9 w-32 rounded-xl" />
      </div>
      <Bone className="h-10 rounded-xl" />
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1c1c1c] last:border-0">
            <Bone className="w-9 h-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-4 w-36" />
              <Bone className="h-3 w-24" />
            </div>
            <Bone className="h-5 w-14 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
