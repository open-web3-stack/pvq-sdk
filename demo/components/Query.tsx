/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { apiAtom, currentProgramAtom } from "@/lib/atoms";
import { ProgramRegistry, PvqProgram } from "@open-web3/pvq";
import { useAtomValue } from "jotai";
import { SnackbarProvider, enqueueSnackbar } from "notistack";
import { useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Spinner } from "./ui/spinner";

const parseParam = (param: any) => {
  if (!param) return param;
  try {
    return JSON.parse(param.replaceAll("'", '"'));
  } catch {
    return param;
  }
};

export const Query = () => {
  const currentProgram = useAtomValue(currentProgramAtom);
  const api = useAtomValue(apiAtom);

  const [formData, setFormData] = useState<
    Record<string, Record<string, string>>
  >({});
  const [queryResults, setQueryResults] = useState<Record<string, unknown>>({});
  const [queryErrors, setQueryErrors] = useState<Record<string, string>>({});

  const [isQuerying, setIsQuerying] = useState<{
    [entrypointId: string]: boolean;
  }>({});

  const programRegistry = useMemo(() => {
    if (currentProgram?.metadata) {
      return new ProgramRegistry(currentProgram?.metadata);
    }
  }, [currentProgram?.metadata]);

  // const defaultValues = useMemo(() => {
  //   return programRegistry?.entrypoints.map((item) => item.identifier);
  // }, [programRegistry]);

  const handleInputChange = (
    entrypointId: string,
    argName: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [entrypointId]: {
        ...prev[entrypointId],
        [argName]: value,
      },
    }));
  };

  const handleQuery = async (entrypointId: string) => {
    if (!api) {
      enqueueSnackbar("Please connect to endpoint first", {
        variant: "error",
      });
      return;
    }

    if (!currentProgram?.data || !currentProgram?.metadata) {
      enqueueSnackbar("Please select a program first", {
        variant: "error",
      });
      return;
    }

    // Clear previous results and errors for this entrypoint
    setQueryResults((prev) => ({ ...prev, [entrypointId]: undefined }));
    setQueryErrors((prev) => ({ ...prev, [entrypointId]: "" }));

    try {
      setIsQuerying((prev) => ({ ...prev, [entrypointId]: true }));

      const { gasLimit, ...entrypointData } = formData[entrypointId] || {};

      const program = new PvqProgram(
        api,
        currentProgram?.data as `0x${string}`,
        currentProgram?.metadata
      );

      const entrypoint = program.registry.findEntrypoint(entrypointId);

      const result = await program.executeQuery(
        entrypointId,
        { gasLimit: gasLimit || undefined },
        entrypoint.args.map((item) => {
          return parseParam(entrypointData[item.name]) || undefined;
        })
      );

      console.log("result:", result);
      console.log(`Query for ${entrypointId}:`, entrypointData);

      setQueryResults((prev) => ({
        ...prev,
        [entrypointId]: result,
      }));
    } catch (error) {
      console.error(`Query error for ${entrypointId}:`, error);
      setQueryErrors((prev) => ({
        ...prev,
        [entrypointId]: error instanceof Error ? error.message : String(error),
      }));
    } finally {
      setIsQuerying((prev) => ({ ...prev, [entrypointId]: false }));
    }
  };

  return (
    <div>
      {programRegistry && (
        <Accordion
          type="multiple"
          // defaultValue={defaultValues}
          className="w-full"
        >
          {programRegistry.entrypoints.map((item, index) => {
            return (
              <AccordionItem value={item.identifier} key={index}>
                <AccordionTrigger className="text-md cursor-pointer font-bold flex">
                  {item.index + 1}. {item.identifier}
                </AccordionTrigger>
                <AccordionContent className="mt-2 flex flex-col gap-8 text-balance">
                  <div className="flex flex-col gap-6">
                    {item.args.map((arg) => {
                      return (
                        <div key={arg.name} className="font-bold">
                          <Label className="font-bold">
                            {arg.name} ({arg.type.type})
                          </Label>
                          <div>
                            <Input
                              className="h-[28px] mt-1 focus:outline-none focus:shadow-none text-xs cursor-pointer rounded-sm"
                              value={
                                formData[item.identifier]?.[arg.name] || ""
                              }
                              onChange={(e) =>
                                handleInputChange(
                                  item.identifier,
                                  arg.name,
                                  e.target.value
                                )
                              }
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="font-bold">
                      <Label className="font-bold">gasLimit</Label>
                      <div>
                        <Input
                          className="h-[28px] mt-1 focus:outline-none focus:shadow-none text-xs cursor-pointer rounded-sm"
                          value={formData[item.identifier]?.gasLimit || ""}
                          onChange={(e) =>
                            handleInputChange(
                              item.identifier,
                              "gasLimit",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Button
                        size="sm"
                        disabled={isQuerying[item.identifier]}
                        className="h-[24px] text-xs cursor-pointer rounded-sm w-[64px]"
                        onClick={() => handleQuery(item.identifier)}
                      >
                        {isQuerying[item.identifier] ? (
                          <Spinner
                            show={isQuerying[item.identifier]}
                            className="text-background w-4.5 h-4.5"
                          />
                        ) : (
                          "Query"
                        )}
                      </Button>
                    </div>
                    {queryErrors[item.identifier] ||
                    queryResults[item.identifier] ? (
                      <div className="flex flex-col gap-1 bg-muted p-2 rounded-lg border">
                        <div className="text-muted-foreground font-bold">
                          [{item.identifier}(
                          {item.args.map((item) => item.name).join(", ")}):{" "}
                          {item.returnType?.type}] :
                        </div>
                        <div>
                          {queryErrors[item.identifier] ? (
                            <span className="text-red-500">
                              Error: {queryErrors[item.identifier]}
                            </span>
                          ) : queryResults[item.identifier] ? (
                            <div className="flex flex-col gap-1 break-all">
                              <div className="flex items-center gap-1 font-bold border-b mb-1 pb-2">
                                {JSON.stringify(
                                  (
                                    queryResults[item.identifier] as any
                                  ).toJSON(),
                                  null,
                                  2
                                )}
                              </div>
                              <div className="flZex items-center gap-1 font-bold">
                                <span className="text-muted-foreground">
                                  [hex]:{" "}
                                </span>
                                {(queryResults[item.identifier] as any).toHex()}
                              </div>
                            </div>
                          ) : (
                            "No result yet"
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
      <SnackbarProvider
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      />
    </div>
  );
};
