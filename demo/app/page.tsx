"use client";

import { Connect } from "@/components/Connect";
import { ProgramInfo } from "@/components/ProgramInfo";
import { Query } from "@/components/Query";
import { SelectProgram } from "@/components/SelectProgram";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAtom } from "jotai";

import { atomWithStorage } from "jotai/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const tabAtom = atomWithStorage("tab", "program");

export default function Home() {
  const pathname = usePathname();
  const [tab, setTab] = useAtom(tabAtom);

  return (
    <div>
      <header className="border-b">
        <h1 className="text-3xl font-bold pt-6 pb-2 text-center">PVQ Demo</h1>
        <div className="mt-auto max-w-5xl mx-auto flex gap-4 font-semibold">
          <Link
            href="/"
            className={`p-4 transition-colors ${pathname === "/" ? "text-primary font-bold underline" : "text-muted-foreground"}`}
          >
            Home
          </Link>
          <Link
            href="/swap"
            className={`p-4 transition-colors ${pathname === "/swap" ? "text-primary font-bold underline" : "text-muted-foreground"}`}
          >
            Swap
          </Link>
        </div>
      </header>
      <Card className="mt-4 max-w-2xl mx-auto">
        <CardContent>
          <div className="flex">
            <div className="flex-1 px-4">
              <Connect className="mt-2" />
              <SelectProgram className="mt-8" />
              <Tabs value={tab} onValueChange={setTab} className="mt-8">
                <TabsList>
                  <TabsTrigger value="program">Program</TabsTrigger>
                  <TabsTrigger value="query">Query</TabsTrigger>
                </TabsList>
                <div className="h-px bg-border" />
                <TabsContent
                  forceMount
                  hidden={tab !== "program"}
                  value="program"
                  className="p-1"
                >
                  <ProgramInfo />
                </TabsContent>
                <TabsContent
                  forceMount
                  hidden={tab !== "query"}
                  value="query"
                  className="p-1"
                >
                  <Query />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
