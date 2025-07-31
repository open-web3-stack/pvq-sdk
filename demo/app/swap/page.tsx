"use client";

import { NetworkSelector } from "@/components/NetworkSelector";
import { ImageWithFallback } from "@/components/ImageWithFallback";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryClient } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";
import { ArrowDownUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useCallback, useMemo, useTransition } from "react";
import {
  assetsInfoAtom,
  getReceiveAmountAtom,
  poolListAtom,
  poolSizeAtom,
  selectedPoolAtom,
  selectedPoolInfoAtom,
} from "./atoms";
import { SwapBox } from "./swapbox";

export default function SwapPage() {
  const pathname = usePathname();
  const selectedPoolInfo = useAtomValue(selectedPoolInfoAtom);
  const setSelectedPool = useSetAtom(selectedPoolAtom);
  const { data: assetInfo } = useAtomValue(assetsInfoAtom);
  const { data: poolList } = useAtomValue(poolListAtom);
  const { data: poolSize } = useAtomValue(poolSizeAtom);
  const queryClient = useQueryClient();

  const [sellValue, setSellValue] = React.useState("");
  const [buyValue, setBuyValue] = React.useState("");
  const [sellToken, setSellToken] = React.useState("");
  const [buyToken, setBuyToken] = React.useState("");
  const [isSwapLoading, setIsSwapLoading] = React.useState(false);
  const [activeBox, setActiveBox] = React.useState<"sell" | "buy" | undefined>(
    "sell"
  );

  const getReceiveAmount = useAtomValue(getReceiveAmountAtom);
  const [, startTransition] = useTransition();

  const tokenPairOptions = useMemo(() => {
    if (!poolList) return [];

    return poolList.map(({ asset1, asset2, key }) => {
      const token1 = asset1.assetId;
      const token2 = asset2.assetId;
      const symbol1 = asset1.symbol;
      const symbol2 = asset2.symbol;

      return {
        key,
        tokens: [token1, token2],
        display: `${symbol1}-${symbol2}`,
        symbols: [symbol1, symbol2],
      };
    });
  }, [poolList]);

  const [sellTokens, buyTokens] = useMemo(() => {
    const allTokens = assetInfo?.map((asset) => asset.assetId) ?? [];
    if (!sellToken && !buyToken) return [allTokens, allTokens];
    if (activeBox === "sell") {
      return [
        allTokens,
        [
          ...new Set(
            poolList
              ?.filter(
                ({ asset1, asset2 }) =>
                  asset1.assetId === sellToken || asset2.assetId === sellToken
              )
              .flatMap(({ asset1, asset2 }) => [asset1.assetId, asset2.assetId])
              .filter((token) => token !== sellToken)
          ),
        ],
      ];
    }
    if (activeBox === "buy")
      return [
        [
          ...new Set(
            poolList
              ?.filter(
                ({ asset1, asset2 }) =>
                  asset1.assetId === buyToken || asset2.assetId === buyToken
              )
              .flatMap(({ asset1, asset2 }) => [asset1.assetId, asset2.assetId])
              .filter((token) => token !== buyToken)
          ),
        ],
        allTokens,
      ];

    return [allTokens, allTokens];
  }, [sellToken, buyToken, activeBox, poolList, assetInfo]);

  const handleChangeSelectedPool = useCallback(
    (key: string) => {
      setSelectedPool(key);
      setSellToken(
        poolList?.find((pool) => pool.key === key)?.asset1.assetId || ""
      );
      setBuyToken(
        poolList?.find((pool) => pool.key === key)?.asset2.assetId || ""
      );
      setSellValue("");
      setBuyValue("");
    },
    [
      poolList,
      setSelectedPool,
      setSellToken,
      setBuyToken,
      setSellValue,
      setBuyValue,
    ]
  );

  const handleSwitch = () => {
    if (!selectedPoolInfo) return;
    setSellValue(buyValue);
    setBuyValue(sellValue);
    setSellToken(buyToken);
    setBuyToken(sellToken);
    const nextBox = activeBox === "sell" ? "buy" : "sell";
    setActiveBox(nextBox);

    console.log(buyToken, sellToken, nextBox === "sell" ? buyValue : sellValue);
    setIsSwapLoading(true);
    getReceiveAmount(
      buyToken,
      sellToken,
      nextBox === "sell" ? buyValue : sellValue,
      nextBox === "sell"
    )
      .then((v) => {
        if (nextBox === "sell") {
          setBuyValue(v);
        } else {
          setSellValue(v);
        }
      })
      .finally(() => {
        setIsSwapLoading(false);
      });
  };

  const handleSellChange = (amount: string) => {
    setSellValue(amount);
    if (!selectedPoolInfo || !sellToken || !buyToken) return;
    getReceiveAmount(sellToken, buyToken, amount, true).then((result) => {
      setBuyValue(result);
    });
  };

  const handleBuyChange = (amount: string) => {
    setBuyValue(amount);
    if (!selectedPoolInfo || !sellToken || !buyToken) return;

    getReceiveAmount(sellToken, buyToken, amount, false).then((result) => {
      setSellValue(result);
    });
  };

  const handleSellTokenChange = (token: string) => {
    setSellToken(token);
    if (buyToken) {
      const pairKey = `${token}-${buyToken}`;
      const reversePairKey = `${buyToken}-${token}`;
      const existingPair = tokenPairOptions.find(
        (option) => option.key === pairKey || option.key === reversePairKey
      );
      if (existingPair) {
        setSelectedPool(existingPair.key);
        startTransition(() => {
          const amount = activeBox === "sell" ? sellValue : buyValue;
          if (amount && sellToken) {
            getReceiveAmount(
              buyToken,
              token,
              amount,
              activeBox === "sell"
            ).then((result) => {
              if (activeBox === "sell") {
                setBuyValue(result);
              } else {
                setSellValue(result);
              }
            });
          }
        });
      } else {
        setSelectedPool("");
      }
    }
  };

  const handleBuyTokenChange = (token: string) => {
    setBuyToken(token);
    if (sellToken) {
      const pairKey = `${sellToken}-${token}`;
      const reversePairKey = `${token}-${sellToken}`;
      const existingPair = tokenPairOptions.find(
        (option) => option.key === pairKey || option.key === reversePairKey
      );
      if (existingPair) {
        setSelectedPool(existingPair.key);
        startTransition(() => {
          const amount = activeBox === "sell" ? sellValue : buyValue;
          if (amount && sellToken) {
            getReceiveAmount(
              sellToken,
              token,
              amount,
              activeBox === "sell"
            ).then((result) => {
              if (activeBox === "sell") {
                setBuyValue(result);
              } else {
                setSellValue(result);
              }
            });
          }
        });
      } else {
        setSelectedPool("");
      }
    }
  };

  const handleDisconnect = useCallback(() => {
    handleChangeSelectedPool("");
    queryClient.clear();
  }, [queryClient, handleChangeSelectedPool]);

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
            className={`p-4 transition-colors ${pathname.includes("/swap") ? "text-primary font-bold underline" : "text-muted-foreground"}`}
          >
            Swap
          </Link>
        </div>
      </header>
      <Card className="mt-4 max-w-2xl mx-auto">
        <CardContent>
          <div className="flex">
            <div className="flex-1 px-4">
              <NetworkSelector className="mt-2" onDisconnect={handleDisconnect} />
              <div className="mt-8 flex flex-col gap-4">
                {/* Token Pair Selector */}
                <div>
                  <div className="font-bold mb-2">Select Liquidity Pool</div>
                  <Select
                    value={selectedPoolInfo?.key || ""}
                    onValueChange={handleChangeSelectedPool}
                    disabled={!assetInfo || !tokenPairOptions.length}
                  >
                    <SelectTrigger className="w-full h-12! text-md">
                      <SelectValue placeholder="Select a token pair" />
                    </SelectTrigger>
                    <SelectContent scrollAble>
                      {tokenPairOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                          <div className="flex items-center gap-2 select-none">
                            <div className="flex items-center gap-0">
                              <ImageWithFallback
                                className="w-5 h-5 inline-flex items-center justify-center align-middle"
                                src={`https://resources.acala.network/tokens/${option.symbols[0].toUpperCase()}.png`}
                                alt={option.symbols[0]}
                                fallback={option.symbols[0]?.slice(0, 1)}
                                width={20}
                                fallbackClassName="rounded-full bg-blue-400 font-bold"
                                height={20}
                              />
                              <ImageWithFallback
                                className="ml-[-8px] w-5 h-5 inline-flex items-center justify-center align-middle"
                                src={`https://resources.acala.network/tokens/${option.symbols[1].toUpperCase()}.png`}
                                alt={option.symbols[1]}
                                width={20}
                                fallback={option.symbols[1]?.slice(0, 1)}
                                fallbackClassName="rounded-full bg-blue-400 font-bold"
                                height={20}
                              />
                            </div>
                            <span className="font-bold">{option.display}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="font-bold">Sell</div>
                  <SwapBox
                    value={sellValue}
                    onValueChange={handleSellChange}
                    token={sellToken}
                    onTokenChange={handleSellTokenChange}
                    onFocus={() => setActiveBox("sell")}
                    highlight={activeBox !== "sell"}
                    tokens={sellTokens}
                  />
                </div>
                <div className="flex justify-center -my-2 mt-2 cursor-pointer">
                  <button
                    onClick={handleSwitch}
                    className="cursor-pointer rounded-xl border border-border bg-card w-10 h-10 flex items-center justify-center shadow-md active:scale-95 transition-transform"
                    disabled={isSwapLoading}
                  >
                    <ArrowDownUp className="w-6 h-6 text-foreground" />
                  </button>
                </div>
                <div>
                  <div className="font-bold">Buy</div>
                  <SwapBox
                    value={buyValue}
                    onValueChange={handleBuyChange}
                    token={buyToken}
                    onTokenChange={handleBuyTokenChange}
                    onFocus={() => setActiveBox("buy")}
                    highlight={activeBox !== "buy"}
                    tokens={buyTokens}
                  />
                </div>
                <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-4 gap-2 select-none">
                  <div className="flex justify-between">
                    <div className="font-bold text-muted-foreground">
                      Pool Size
                    </div>
                    {poolSize ? (
                      <div className="flex gap-1">
                        {poolSize.asset1Amount} {poolSize.asset1.symbol}
                        <span className="text-muted-foreground">+</span>
                        {poolSize.asset2Amount} {poolSize.asset2.symbol}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">--</div>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <div className="font-bold text-muted-foreground">Price</div>
                    {poolSize ? (
                      <div className="flex gap-1">
                        {1} {poolSize.asset1.symbol}
                        <span className="text-muted-foreground">=</span>
                        {poolSize.price}
                        {poolSize.asset2.symbol}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">--</div>
                    )}
                  </div>
                </div>
                <div>
                  <Button
                    size="lg"
                    className="w-full cursor-pointer"
                    disabled={!sellValue || !buyValue || !selectedPoolInfo}
                  >
                    Swap
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
