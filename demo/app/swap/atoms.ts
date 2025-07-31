import { apiAtom } from "@/lib/atoms";
import { PvqProgram } from "@open-web3/pvq";
import type { Option, u128, Vec } from "@polkadot/types";
import type { ITuple } from "@polkadot/types/types";
import { u8aToString } from "@polkadot/util";
import { atom } from "jotai";
import { atomWithQuery } from "jotai-tanstack-query";
import { atomFamily } from "jotai/utils";
import { formatUnits, parseUnits } from "viem";
import { guestSwapInfoProgram } from "./assets/guest-swap-info";
import metadata from "./assets/guest-swap-info-metadata.json";

type AssetInfo = {
  assetId: string;
  decimals: number;
  name: string;
  symbol: string;
};

export const lpProgramAtom = atom<PvqProgram | null>((get) => {
  const api = get(apiAtom);
  if (!api) return null;
  return new PvqProgram(api, guestSwapInfoProgram as `0x${string}`, metadata);
});

export const poolListAtom = atomWithQuery((get) => {
  const api = get(apiAtom);
  return {
    queryKey: ["poolList", api?.genesisHash.toHex()],
    onError: (error: Error) => {
      console.error("Error fetching pool list", error.message);
    },
    throwOnError: true,
    retry: false,
    queryFn: async () => {
      console.log("fetching pool list");
      const program = get(lpProgramAtom);
      if (!program) throw new Error("Program not initialized");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lpList = await program.executeQuery<Vec<ITuple<[any, any]>>>(
        "entrypoint_list_pools",
        undefined,
        []
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getAssetInfo = (asset: any): AssetInfo => {
        return {
          assetId: asset.assetId.toHex() as string,
          decimals: asset.decimals.toNumber() as number,
          name: u8aToString(asset.name),
          symbol: u8aToString(asset.symbol).replace(/[^a-zA-Z0-9]/g, ""),
        };
      };

      const result = lpList.map(([assetId1, assetId2]) => {
        const asset1 = getAssetInfo(assetId1);
        const asset2 = getAssetInfo(assetId2);
        return {
          asset1,
          asset2,
          key: `${assetId1.assetId}-${assetId2.assetId}`,
        };
      });

      console.log("pools", result);
      return result;
    },
    enabled: !!get(lpProgramAtom),
  };
});

export const assetsInfoAtom = atomWithQuery((get) => {
  const { data: poolList } = get(poolListAtom);
  const api = get(apiAtom);

  return {
    queryKey: ["assetsInfo", api?.genesisHash.toHex()],
    queryFn: async () => {
      const assetsInfo =
        poolList?.flatMap((pool) => [pool.asset1, pool.asset2]) ?? [];
      const uniqueAssetsInfo: AssetInfo[] = [];

      for (const asset of assetsInfo) {
        if (!uniqueAssetsInfo.some((a) => a.assetId === asset.assetId)) {
          uniqueAssetsInfo.push(asset);
        }
      }

      return uniqueAssetsInfo;
    },
    enabled: !!poolList,
  };
});

export const assetsInfoFamily = atomFamily((id: string) =>
  atom((get) => {
    const { data: assetsInfo } = get(assetsInfoAtom);
    return assetsInfo?.find((asset) => asset.assetId === id);
  })
);

export const selectedPoolAtom = atom<string | null>(null);
export const selectedPoolInfoAtom = atom((get) => {
  const selectedPool = get(selectedPoolAtom);
  const { data: poolList } = get(poolListAtom);
  return poolList?.find((pool) => pool.key === selectedPool);
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
      if (poolSize.isEmpty)
        return {
          size: [BigInt(0), BigInt(0)],
          asset1: selectedPool.asset1,
          asset2: selectedPool.asset2,
          asset1Amount: "0",
          asset2Amount: "0",
          price: 0,
        };

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

export const getExactAmountOutAtom = atom((get) => {
  const program = get(lpProgramAtom);

  return async (sellToken: string, buyToken: string, sellAmount: string) => {
    if (!program) throw new Error("Program not initialized");

    const sellTokenDecimals = get(assetsInfoFamily(sellToken))?.decimals;
    const buyTokenDecimals = get(assetsInfoFamily(buyToken))?.decimals;
    if (sellTokenDecimals === undefined || buyTokenDecimals === undefined)
      throw new Error("sellTokenDecimals or buyTokenDecimals is not set");

    const buyAmount = await program.executeQuery<Option<u128>>(
      "entrypoint_quote_price_exact_tokens_for_tokens",
      undefined,
      [sellToken, buyToken, parseUnits(sellAmount, sellTokenDecimals)]
    );

    if (buyAmount.isEmpty) return "0";
    return formatUnits(
      buyAmount.unwrap().toBigInt() as bigint,
      buyTokenDecimals
    );
  };
});

export const getExactAmountInAtom = atom((get) => {
  const program = get(lpProgramAtom);

  return async (sellToken: string, buyToken: string, buyAmount: string) => {
    if (!program) throw new Error("Program not initialized");

    const buyTokenDecimals = get(assetsInfoFamily(buyToken))?.decimals;
    const sellTokenDecimals = get(assetsInfoFamily(sellToken))?.decimals;
    if (buyTokenDecimals === undefined || sellTokenDecimals === undefined)
      throw new Error("buyTokenDecimals or sellTokenDecimals is not set");

    const sellAmount = await program.executeQuery<Option<u128>>(
      "entrypoint_quote_price_tokens_for_exact_tokens",
      undefined,
      [sellToken, buyToken, parseUnits(buyAmount, buyTokenDecimals)]
    );

    if (sellAmount.isEmpty) return "0";

    return formatUnits(
      sellAmount.unwrap().toBigInt() as bigint,
      sellTokenDecimals
    );
  };
});

export const calcReceiveAmountAtom = atom((get) => {
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

export const getReceiveAmountAtom = atom((get) => {
  return async (
    sellToken: string,
    buyToken: string,
    amount: string,
    isSell: boolean
  ) => {
    const getExactAmountOut = get(getExactAmountOutAtom);
    const getExactAmountIn = get(getExactAmountInAtom);
    if (isSell) {
      return getExactAmountOut(sellToken, buyToken, amount);
    } else {
      return getExactAmountIn(sellToken, buyToken, amount);
    }
  };
});
