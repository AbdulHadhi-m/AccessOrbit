import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </main>
  );
}