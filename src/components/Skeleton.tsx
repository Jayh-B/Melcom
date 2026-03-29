import { cn } from '../lib/utils';

function Pulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded', className)} style={{ backgroundPosition: '200% 0', animation: 'shimmer 1.5s infinite' }} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden flex flex-col h-full">
      <Pulse className="h-72 rounded-none" />
      <div className="p-8 space-y-4 flex-1">
        <Pulse className="h-5 w-3/4 rounded-xl" />
        <Pulse className="h-4 w-full rounded-xl" />
        <Pulse className="h-4 w-2/3 rounded-xl" />
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <Pulse className="h-8 w-28 rounded-xl" />
          <Pulse className="h-14 w-14 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function OrderRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-6 border-b border-gray-50">
      <Pulse className="h-16 w-16 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Pulse className="h-4 w-40 rounded" />
        <Pulse className="h-3 w-56 rounded" />
      </div>
      <Pulse className="h-6 w-20 rounded-full" />
      <Pulse className="h-6 w-28 rounded" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 space-y-3">
      <Pulse className="h-3 w-24 rounded" />
      <Pulse className="h-9 w-36 rounded" />
      <Pulse className="h-3 w-16 rounded" />
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-16">
      <div className="space-y-4">
        <Pulse className="h-[500px] rounded-3xl" />
        <div className="flex gap-3">
          {[...Array(4)].map((_, i) => <Pulse key={i} className="h-20 w-20 rounded-xl" />)}
        </div>
      </div>
      <div className="space-y-6 pt-4">
        <Pulse className="h-4 w-24 rounded-full" />
        <Pulse className="h-10 w-3/4 rounded-xl" />
        <Pulse className="h-4 w-32 rounded" />
        <Pulse className="h-12 w-40 rounded-xl" />
        <Pulse className="h-px w-full" />
        <Pulse className="h-4 w-full rounded" />
        <Pulse className="h-4 w-5/6 rounded" />
        <Pulse className="h-4 w-4/5 rounded" />
        <div className="flex gap-3 pt-4">
          <Pulse className="h-14 flex-1 rounded-2xl" />
          <Pulse className="h-14 w-14 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
