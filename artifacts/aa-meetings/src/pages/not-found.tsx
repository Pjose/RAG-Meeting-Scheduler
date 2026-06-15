import { Link } from "wouter";
import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <PublicLayout>
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-6xl font-serif font-semibold text-muted-foreground/30 mb-4">404</p>
        <h1 className="text-xl font-semibold text-foreground mb-2">Page not found</h1>
        <p className="text-muted-foreground text-sm mb-6">
          The page you are looking for does not exist.
        </p>
        <Link href="/">
          <Button variant="outline">Back to Schedule</Button>
        </Link>
      </div>
    </PublicLayout>
  );
}
