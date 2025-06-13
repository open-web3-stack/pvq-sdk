import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import {
  addProgramAtom,
  currentProgramAtom,
  programsAtom,
  removeProgramAtom,
} from "./atoms";
import { FileSelector } from "./FileSelector";
import { u8aToHex, compactAddLength } from "@polkadot/util";

export const SelectProgram = ({ className }: { className?: string }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const programs = useAtomValue(programsAtom);
  const addProgram = useSetAtom(addProgramAtom);
  const removeProgram = useSetAtom(removeProgramAtom);
  const [selectOpen, setSelectOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMetadata, setSelectedMetadata] = useState<File | null>(null);
  const [currentProgram, setCurrentProgram] = useAtom(currentProgramAtom);

  // Add program
  const handleAddProgram = async () => {
    if (selectedFile && selectedMetadata) {
      const buffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const data = u8aToHex(compactAddLength(bytes));
      let metadata: Record<string, unknown>;
      try {
        const text = await selectedMetadata.text();
        metadata = JSON.parse(text);
      } catch (error: unknown) {
        console.error(error);
        console.error("parse failed");
        return;
      }
      addProgram({
        id: (+new Date()).toString(),
        data: data,
        name: selectedFile.name.replace(".polkavm", ""),
        metadata: metadata,
      });
      setSelectedFile(null);
      setSelectedMetadata(null);
    }
  };

  const handleDelete = (id: string) => {
    removeProgram(id);
  };

  return (
    <div className={cn(className, "")}>
      <div className="font-bold">Select program</div>
      <div className="flex space-x-2">
        <Select
          open={selectOpen}
          onOpenChange={setSelectOpen}
          value={currentProgram?.id}
          onValueChange={(value) => setCurrentProgram(value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a program" />
          </SelectTrigger>
          <SelectContent>
            {programs.length === 0 ? (
              <div className="text-center p-8 text-gray-400">
                No programs available
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto flex flex-col">
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </div>
            )}
            <div className="sticky bottom-0 border-t flex justify-center p-2 pb-1 bg-popover z-10">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  setDialogOpen(true);
                  setSelectOpen(false);
                }}
                type="button"
              >
                Manage programs
              </Button>
            </div>
          </SelectContent>
        </Select>
      </div>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Programs</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <FileSelector
              label="Drag or Select program file"
              file={selectedFile}
              allowedExtension=".polkavm"
              setFile={setSelectedFile}
            />
            <FileSelector
              label="Drag or Select metadata file"
              file={selectedMetadata}
              allowedExtension=".json"
              setFile={setSelectedMetadata}
            />
            <Button
              onClick={handleAddProgram}
              disabled={!selectedFile || !selectedMetadata}
              size="sm"
              type="button"
            >
              Add Program
            </Button>
            <div className="border-t h-[1px]" />
            <div>
              <div className="font-semibold mb-2">All Programs</div>
              {programs.length === 0 ? (
                <div className="text-gray-400 text-sm">No programs</div>
              ) : (
                <ul className="divide-y border rounded">
                  {programs.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2"
                    >
                      <span className="truncate">{p.name}</span>
                      <Button
                        variant="ghost"
                        onClick={() => handleDelete(p.id)}
                        type="button"
                      >
                        Delete
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
