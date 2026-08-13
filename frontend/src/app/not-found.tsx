import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-4xl font-semibold tracking-tight">404</p>
      <h2 className="text-lg font-semibold">Page not found</h2>
      <p className="text-sm text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Link href="/" className={buttonVariants()}>
        Back to home
      </Link>
    </main>
  );
}