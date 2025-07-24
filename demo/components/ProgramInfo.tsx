import { currentProgramAtom } from "@/lib/atoms";
import { useAtomValue } from "jotai";
import { Textarea } from "./ui/textarea";

export const ProgramInfo = () => {
  const currentProgram = useAtomValue(currentProgramAtom);
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div>
        <div className="font-bold text-sm">Program Bytecode:</div>
        <div className="mt-2">
          <Textarea
            readOnly
            className="break-all max-h-[160px]"
            defaultValue={currentProgram?.data}
          />
        </div>
      </div>
      <div>
        <div className="font-bold text-sm">Program Metadata:</div>
        <div className="mt-2">
          <Textarea
            readOnly
            className="break-all max-h-[120px]"
            defaultValue={JSON.stringify(currentProgram?.metadata)}
          />
        </div>
      </div>
    </div>
  );
};
