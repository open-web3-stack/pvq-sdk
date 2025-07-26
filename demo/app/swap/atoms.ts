import { formatUnits, parseUnits } from "viem";
import { apiAtom } from "@/lib/atoms";
import { PvqProgram } from "@open-web3/pvq";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { guestSwapInfoProgram } from "./assets/guest-swap-info";
import metadata from "./assets/guest-swap-info-metadata.json";
import type { Bytes, Vec, Option, u128 } from "@polkadot/types";
import type { Codec, ITuple } from "@polkadot/types/types";
import { compactStripLength, u8aToString } from "@polkadot/util";
import { atomFamily } from "jotai/utils";

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
    const lpList = await program.executeQuery<Vec<ITuple<[Bytes, Bytes]>>>(
      "entrypoint_list_pools",
      undefined,
      []
    );
    return lpList.map(
      ([assetId1, assetId2]) => [assetId1.toHex(), assetId2.toHex()] as const
    );
  },
  enabled: !!get(lpProgramAtom),
}));

export const assetsInfoAtom = atomWithQuery((get) => {
  const { data: poolList, isFetched } = get(poolListAtom);
  const program = get(lpProgramAtom);
  const assetIds = [
    ...new Set(
      poolList?.flatMap(([assetId1, assetId2]) => [assetId1, assetId2])
    ),
  ];

  return {
    queryKey: ["assetsInfo", assetIds],
    queryFn: async (): Promise<
      {
        assetId: string;
        decimals: number;
        name: string;
        symbol: string;
      }[]
    > => {
      if (!program) throw new Error("Program not initialized");
      const result = await Promise.all(
        assetIds!
          .filter((assetId) => assetId !== "0x040d000000")
          .map(async (assetId) => {
            // console.log("assetId1", assetId);

            const res = await program.executeQuery<Option<Codec>>(
              "entrypoint_asset_info",
              undefined,
              [assetId]
            );

            if (res.isEmpty) return null;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const asset: any = res.unwrap();
            const [, name] = compactStripLength(asset.name);
            const [, symbol] = compactStripLength(asset.symbol);
            return {
              assetId: asset.assetId.toHex() as string,
              decimals: asset.decimals.toNumber() as number,
              name: u8aToString(name),
              symbol: u8aToString(symbol),
            };
          })
      );

      return result
        .concat({
          assetId: "0x040d000000",
          decimals: 10,
          name: "lcDOT",
          symbol: "lcDOT",
        })
        .filter(Boolean) as {
        assetId: string;
        decimals: number;
        name: string;
        symbol: string;
      }[];
    },
    enabled: isFetched && !!program,
  };
});

export const assetsInfoFamily = atomFamily((id: string) =>
  atom((get) => {
    const { data: assetsInfo } = get(assetsInfoAtom);

    return assetsInfo?.find((asset) => asset.assetId === id);
  })
);

export const poolListDetailAtom = atomWithQuery((get) => {
  const { data: poolList, isFetched: isPoolListFetched } = get(poolListAtom);
  const { data: assetsInfo, isFetched: isAssetsInfoFetched } =
    get(assetsInfoAtom);

  return {
    queryKey: ["poolListDetail"],
    queryFn: async () => {
      console.log("poolList", poolList, isPoolListFetched, isAssetsInfoFetched);
      return poolList?.map(([assetId1, assetId2]) => {
        const asset1 = assetsInfo?.find((asset) => asset.assetId === assetId1);
        const asset2 = assetsInfo?.find((asset) => asset.assetId === assetId2);
        return {
          asset1: asset1!,
          asset2: asset2!,
          key: `${assetId1}-${assetId2}`,
        };
      });
    },
    enabled: isPoolListFetched && isAssetsInfoFetched,
  };
});

export const selectedPoolAtom = atom<string | null>(null);
export const selectedPoolInfoAtom = atom((get) => {
  const selectedPool = get(selectedPoolAtom);
  const { data: poolListDetail } = get(poolListDetailAtom);
  return poolListDetail?.find((pool) => pool.key === selectedPool);
});

export const poolSizeAtom = atomWithQuery((get) => {
  const selectedPool = get(selectedPoolInfoAtom);
  const program = get(lpProgramAtom);

  return {
    queryKey: ["poolSize", selectedPool],
    queryFn: async () => {
      if (!program) throw new Error("Program not initialized");
      if (!selectedPool) throw new Error("selectedPool is not set");
      console.log("querying pool size", selectedPool);
      const poolSize = await program.executeQuery<Option<ITuple<[u128, u128]>>>(
        "entrypoint_get_liquidity_pool",
        undefined,
        [selectedPool.asset1.assetId, selectedPool.asset2.assetId]
      );
      if (poolSize.isEmpty) return;
      const [asset1Amount, asset2Amount] = poolSize.unwrap();
      const asset1AmountFormatted = formatUnits(
        asset1Amount.toBigInt(),
        selectedPool.asset1.decimals
      );
      const asset2AmountFormatted = formatUnits(
        asset2Amount.toBigInt(),
        selectedPool.asset2.decimals
      );
      return {
        size: [asset1Amount.toBigInt(), asset2Amount.toBigInt()],
        asset1: selectedPool.asset1,
        asset2: selectedPool.asset2,
        asset1Amount: asset1AmountFormatted,
        asset2Amount: asset2AmountFormatted,
        price: Number(
          (
            Number(asset2AmountFormatted) / Number(asset1AmountFormatted)
          ).toFixed(4)
        ),
      };
    },
    enabled: !!selectedPool && !!program,
  };
});

export const getQuoteAmountAtom = atom((get) => {
  const program = get(lpProgramAtom);

  return async (baseToken: string, quoteToken: string, baseAmount: string) => {
    if (!program) throw new Error("Program not initialized");

    const quoteTokenDecimals = get(assetsInfoFamily(quoteToken))?.decimals;
    const baseTokenDecimals = get(assetsInfoFamily(baseToken))?.decimals;
    if (!quoteTokenDecimals || !baseTokenDecimals)
      throw new Error("quoteTokenDecimals or baseTokenDecimals is not set");

    const quoteAmount = await program.executeQuery<Option<u128>>(
      "entrypoint_quote_price_exact_tokens_for_tokens",
      undefined,
      [baseToken, quoteToken, parseUnits(baseAmount, baseTokenDecimals)]
    );

    console.log(
      `Get ${quoteToken} amount:`,
      baseToken,
      quoteToken,
      baseAmount,
      quoteAmount.toHuman()
    );

    if (quoteAmount.isEmpty) return "0";
    return formatUnits(
      quoteAmount.unwrap().toBigInt() as bigint,
      quoteTokenDecimals
    );
  };
});

export const getBaseAmountAtom = atom((get) => {
  const program = get(lpProgramAtom);

  return async (baseToken: string, quoteToken: string, quoteAmount: string) => {
    if (!program) throw new Error("Program not initialized");

    const quoteTokenDecimals = get(assetsInfoFamily(quoteToken))?.decimals;
    const baseTokenDecimals = get(assetsInfoFamily(baseToken))?.decimals;
    if (!quoteTokenDecimals || !baseTokenDecimals)
      throw new Error("quoteTokenDecimals or baseTokenDecimals is not set");

    const baseAmount = await program.executeQuery<Option<u128>>(
      "entrypoint_quote_price_tokens_for_exact_tokens",
      undefined,
      [baseToken, quoteToken, parseUnits(quoteAmount, quoteTokenDecimals)]
    );

    console.log(
      `Get ${baseToken} amount:`,
      baseToken,
      quoteToken,
      quoteAmount,
      baseAmount.toHuman()
    );

    if (baseAmount.isEmpty) return "0";

    return formatUnits(
      baseAmount.unwrap().toBigInt() as bigint,
      baseTokenDecimals
    );
  };
});

export const getReceiveAmountAtom = atom((get) => {
  return async (
    sellToken: string,
    buyToken: string,
    amount: string,
    isSell: boolean
  ) => {
    const selectedPoolInfo = get(selectedPoolInfoAtom);
    const { refetch } = get(poolSizeAtom);
    const { data: poolSize } = await refetch();
    if (!poolSize?.size) throw new Error("poolSize is not set");
    if (!selectedPoolInfo) throw new Error("selectedPoolInfo is not set");
    const baseAssetId = selectedPoolInfo.asset1.assetId;
    const quoteAssetId = selectedPoolInfo.asset2.assetId;
    const isSwaped =
      sellToken === baseAssetId && buyToken === quoteAssetId
        ? false
        : sellToken === quoteAssetId && buyToken === baseAssetId
          ? true
          : undefined;

    const parsedAmount = parseUnits(
      amount,
      !isSwaped
        ? isSell
          ? selectedPoolInfo.asset1.decimals
          : selectedPoolInfo.asset2.decimals
        : isSell
          ? selectedPoolInfo.asset2.decimals
          : selectedPoolInfo.asset1.decimals
    );
    const receiveDecimals = !isSwaped
      ? isSell
        ? selectedPoolInfo.asset2.decimals
        : selectedPoolInfo.asset1.decimals
      : isSell
        ? selectedPoolInfo.asset1.decimals
        : selectedPoolInfo.asset2.decimals;

    if (parsedAmount <= BigInt(0)) return "0";

    const isBaseToQuote =
      sellToken === baseAssetId && buyToken === quoteAssetId;
    const isQuoteToBase =
      sellToken === quoteAssetId && buyToken === baseAssetId;

    if (!isBaseToQuote && !isQuoteToBase) {
      throw new Error("Token pair does not match the pool");
    }

    const reserveIn = isBaseToQuote ? poolSize?.size[0] : poolSize?.size[1];
    const reserveOut = isBaseToQuote ? poolSize?.size[1] : poolSize?.size[0];

    if (isSell) {
      const dx = parsedAmount;
      const dy = (dx * reserveOut) / (reserveIn + dx);
      return formatUnits(dy, receiveDecimals);
    } else {
      const dy = parsedAmount;
      if (dy >= reserveOut) return "Infinity"; // 超出池子
      const dx = (dy * reserveIn) / (reserveOut - dy);
      return formatUnits(dx, receiveDecimals);
    }
  };
});
