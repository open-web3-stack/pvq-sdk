import { apiAtom } from "@/lib/atoms";
import { PvqProgram } from "@open-web3/pvq";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { guestSwapInfoProgram } from "./assets/guest-swap-info";
import metadata from "./assets/guest-swap-info-metadata.json";

export const lpProgramAtom = atom<PvqProgram | null>((get) => {
  const api = get(apiAtom);
  if (!api) return null;
  return new PvqProgram(api, guestSwapInfoProgram as `0x${string}`, metadata);
});

export const poolListAtom = atomWithQuery((get) => ({
  queryKey: ["poolList"],
  queryFn: async () => {
    const program = get(lpProgramAtom);
    if (!program) throw new Error("Program not initialized");
    const lpList = await program.executeQuery(
      "entrypoint_list_pools",
      undefined,
      []
    );
    return lpList;
  },
  enabled: !!get(lpProgramAtom),
}));

export const assetsInfoAtom = atomWithQuery((get) => ({
  queryKey: ["assetsInfo"],
  queryFn: async () => {
    const program = get(lpProgramAtom);
    if (!program) throw new Error("Program not initialized");
    const assetsInfo = await program.executeQuery(
      "entrypoint_asset_info",
      undefined,
      []
    );
    return assetsInfo;
  },
  enabled: !!get(lpProgramAtom),
}));
