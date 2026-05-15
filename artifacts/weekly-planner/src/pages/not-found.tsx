import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPinOff } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center bg-background px-4 py-10 font-sans">
      <Card className="w-full max-w-md border-border/80 ring-1 ring-border/40">
        <CardHeader className="space-y-1 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <MapPinOff className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                404
              </p>
              <CardTitle className="font-serif text-2xl font-semibold tracking-tight text-balance text-foreground">
                This page is not in your planner
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-pretty pt-2 text-sm leading-relaxed text-muted-foreground">
            The address does not match any route in this app. If you opened a bookmark or typed a URL,
            head back to the planner home.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 pt-2">
          <Button asChild className="font-medium">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" strokeWidth={2} aria-hidden />
              Back to planner
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
