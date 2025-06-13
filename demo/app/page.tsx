"use client";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Connect } from "./Connect";
import { SelectProgram } from "./SelectProgram";

export default function Home() {
  return (
    <div>
      <header className="border-b">
        <h1 className="text-3xl font-bold pt-6 pb-2 text-center">PVQ Demo</h1>
        <div className="mt-auto max-w-5xl mx-auto flex gap-4 font-semibold">
          <Link href="/" className="p-4 text-muted-foreground">
            Home
          </Link>
          <Link href="/swap" className="p-4">
            Swap
          </Link>
        </div>
      </header>
      <Card className="mt-4 max-w-5xl mx-auto">
        <CardContent>
          <div className="flex">
            <div className="flex-1 px-4">
              <Connect className="mt-2" />
              <SelectProgram className="mt-8" />
            </div>
            <div className="w-sm border-l px-4">Msg</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
