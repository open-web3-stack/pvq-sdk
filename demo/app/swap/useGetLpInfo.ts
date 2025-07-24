import { apiAtom } from "@/lib/atoms";
import { PvqProgram } from "@open-web3/pvq";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useMemo, useState } from "react";
import { guestSwapInfoProgram } from "./assets/guest-swap-info";
import metadata from "./assets/guest-swap-info-metadata.json";
import { useQueryAssetInfo } from "./useQueryAssetInfo";

// const currentProgram = guestSwapInfoProgram;
// const programRegistry = new ProgramRegistry(metadata);

// entrypoint_quote_price_exact_tokens_for_tokens
// entrypoint_quote_price_tokens_for_exact_tokens
// entrypoint_get_liquidity_pool
// entrypoint_list_pools

export const useGetLpInfo = () => {
  const api = useAtomValue(apiAtom);
  const { data: assetInfo } = useQueryAssetInfo();
  const [lpPoolList, setLpPoolList] = useState<
    [[string, string], [bigint, bigint]][]
  >([]);

  const program = useMemo(() => {
    if (!api || !assetInfo) return null;
    return new PvqProgram(api, guestSwapInfoProgram as `0x${string}`, metadata);
  }, [api, assetInfo]);

  const getLpList = useCallback(async () => {
    if (!program) throw new Error("Program not initialized");

    const lpList = await program.executeQuery(
      "entrypoint_list_pools",
      undefined,
      []
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return lpList as any as any[][];
  }, [program]);

  useEffect(() => {
    if (!program) return;
    getLpList().then((lpList) => {
      setLpPoolList(
        lpList.map((item) => {
          const pool1 = item[2].toBigInt();
          const pool2 = item[3].toBigInt();
          return [
            [item[0].toHex(), item[1].toHex()],
            [pool1, pool2],
          ];
        })
      );
    });
  }, [getLpList, program]);

  const lpTokens = useMemo(() => {
    return [...new Set(lpPoolList.flatMap((item) => item[0]))];
  }, [lpPoolList]);

  const getExactBuyAmount = useCallback(
    async (sellToken: string, buyToken: string, amount: bigint) => {
      if (!program) throw new Error("Program not initialized");

      console.log("query params:", sellToken, buyToken, amount);
      const buyAmount = await program.executeQuery(
        "entrypoint_quote_price_exact_tokens_for_tokens",
        undefined,
        [sellToken, buyToken, amount]
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((buyAmount as any).isEmpty) return BigInt(0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (buyAmount as any).unwrap().toBigInt() as bigint;
    },
    [program]
  );
  const getExactSellAmount = useCallback(
    async (sellToken: string, buyToken: string, amount: bigint) => {
      if (!program) throw new Error("Program not initialized");

      console.log("query params:", sellToken, buyToken, amount);

      const sellAmount = await program.executeQuery(
        "entrypoint_quote_price_tokens_for_exact_tokens",
        undefined,
        [buyToken, sellToken, amount]
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((sellAmount as any).isEmpty) return BigInt(0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (sellAmount as any).unwrap().toBigInt() as bigint;
    },
    [program]
  );

  const getPoolSize = useCallback(
    async (tokenPair: [string, string]) => {
      if (!program) throw new Error("Program not initialized");
      const poolSize = await program.executeQuery(
        "entrypoint_get_liquidity_pool",
        undefined,
        [tokenPair[0], tokenPair[1]]
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((poolSize as any).isEmpty) return undefined;
      return [
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (poolSize as any).unwrap()[0].toBigInt() as bigint,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (poolSize as any).unwrap()[1].toBigInt() as bigint,
      ];
    },
    [program]
  );

  return useMemo(
    () => ({
      getLpList,
      getExactBuyAmount,
      getExactSellAmount,
      lpPoolList,
      lpTokens,
      assetInfo,
      getPoolSize,
    }),
    [
      lpPoolList,
      lpTokens,
      getLpList,
      getExactBuyAmount,
      getExactSellAmount,
      assetInfo,
      getPoolSize,
    ]
  );
};
