"use client";

import { Connect } from "@/components/Connect";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowDownUp } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useMemo, useRef } from "react";
import { formatUnits, parseUnits } from "viem";
import { SwapBox } from "./swapbox";
import { useGetLpInfo } from "./useGetLpInfo";
import { poolListAtom } from "./atoms";
import { useAtomValue } from "jotai";

export default function SwapPage() {
  const pathname = usePathname();
  const poolList = useAtomValue(poolListAtom);

  console.log(poolList);
  const [poolSize, setPoolSize] = React.useState<
    | [
        {
          symbol: string;
          value: string;
        },
        { symbol: string; value: string },
      ]
    | undefined
  >(undefined);
  const [sellValue, setSellValue] = React.useState("");
  const [buyValue, setBuyValue] = React.useState("");
  const [sellToken, setSellToken] = React.useState("");
  const [buyToken, setBuyToken] = React.useState("");
  const [selectedTokenPair, setSelectedTokenPair] = React.useState<string>("");
  const [activeBox, setActiveBox] = React.useState<"sell" | "buy" | undefined>(
    "sell"
  );
  const {
    lpTokens,
    lpPoolList,
    getExactBuyAmount,
    getExactSellAmount,
    assetInfo,
    getPoolSize,
  } = useGetLpInfo();

  const tokenPairOptions = useMemo(() => {
    if (!assetInfo || !lpPoolList.length) return [];

    return lpPoolList.map(([tokens]) => {
      const token1 = tokens[0];
      const token2 = tokens[1];
      const symbol1 = assetInfo[token1]?.symbol || token1;
      const symbol2 = assetInfo[token2]?.symbol || token2;
      const pairKey = `${token1}-${token2}`;

      return {
        key: pairKey,
        tokens: [token1, token2],
        display: `${symbol1}-${symbol2}`,
        symbols: [symbol1, symbol2],
      };
    });
  }, [lpPoolList, assetInfo]);

  useEffect(() => {
    if (selectedTokenPair && assetInfo) {
      const pair = tokenPairOptions.find(
        (option) => option.key === selectedTokenPair
      );
      if (pair) {
        setSellToken(pair.tokens[0]);
        setBuyToken(pair.tokens[1]);
        setSellValue("");
        setBuyValue("");
      }
    }
  }, [selectedTokenPair, tokenPairOptions, assetInfo]);

  const [sellTokens, buyTokens] = useMemo(() => {
    if (!sellToken && !buyToken) return [lpTokens, lpTokens];
    if (activeBox === "sell") {
      return [
        lpTokens,
        [
          ...new Set(
            lpPoolList
              .filter(
                ([tokens]) => tokens[0] === sellToken || tokens[1] === sellToken
              )
              .flatMap(([tokens]) => tokens)
              .filter((token) => token !== sellToken)
          ),
        ],
      ];
    }
    if (activeBox === "buy")
      return [
        [
          ...new Set(
            lpPoolList
              .filter(
                ([tokens]) => tokens[0] === buyToken || tokens[1] === buyToken
              )
              .flatMap(([tokens]) => tokens)
              .filter((token) => token !== buyToken)
          ),
        ],
        lpTokens,
      ];
    return [lpTokens, lpTokens];
  }, [sellToken, lpTokens, buyToken, activeBox, lpPoolList]);

  const tokenPair = useMemo(() => {
    if (!sellToken || !buyToken || !lpPoolList.length) return undefined;
    const pair1 = lpPoolList.find(
      ([tokens]) => tokens[0] === sellToken && tokens[1] === buyToken
    );
    const pair2 = lpPoolList.find(
      ([tokens]) => tokens[0] === buyToken && tokens[1] === sellToken
    );
    const pair = pair1 || pair2;
    return pair?.[0];
  }, [sellToken, buyToken, lpPoolList]);

  const handleSwitch = () => {
    if (!tokenPair) return;
    setSellValue(buyValue);
    setBuyValue(sellValue);
    setSellToken(buyToken);
    setBuyToken(sellToken);
    const nextBox = activeBox === "sell" ? "buy" : "sell";
    setActiveBox(nextBox);
    const amount = nextBox === "sell" ? buyValue : sellValue;

    if (nextBox === "sell") {
      getExactBuyAmount(
        tokenPair[0],
        tokenPair[1],
        parseUnits(amount, assetInfo![buyToken].decimals)
      ).then((v) => {
        setBuyValue(formatUnits(v, assetInfo![sellToken].decimals));
      });
    } else {
      getExactSellAmount(
        tokenPair[0],
        tokenPair[1],
        parseUnits(amount, assetInfo![sellToken].decimals)
      ).then((v) => {
        setSellValue(formatUnits(v, assetInfo![buyToken].decimals));
      });
    }
  };

  const handleSellChange = (v: string) => {
    setSellValue(v);
    if (
      !tokenPair ||
      !sellToken ||
      !buyToken ||
      !assetInfo?.[sellToken]?.decimals ||
      !assetInfo?.[buyToken]?.decimals
    )
      return;

    getExactBuyAmount(
      tokenPair[0],
      tokenPair[1],
      parseUnits(v, assetInfo[sellToken].decimals)
    ).then((v) => {
      setBuyValue(formatUnits(v, assetInfo[buyToken].decimals));
    });
  };

  const handleBuyChange = (v: string) => {
    setBuyValue(v);
    if (
      !tokenPair ||
      !sellToken ||
      !buyToken ||
      !assetInfo?.[buyToken]?.decimals ||
      !assetInfo?.[sellToken]?.decimals
    )
      return;

    getExactSellAmount(
      tokenPair[0],
      tokenPair[1],
      parseUnits(v, assetInfo[buyToken].decimals)
    ).then((v) => {
      setSellValue(formatUnits(v, assetInfo[sellToken].decimals));
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
        setSelectedTokenPair(existingPair.key);
      } else {
        setSelectedTokenPair("");
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
        setSelectedTokenPair(existingPair.key);
      } else {
        setSelectedTokenPair("");
      }
    }
  };

  const sellValueRef = useRef(sellValue);
  sellValueRef.current = sellValue;
  const buyValueRef = useRef(buyValue);
  buyValueRef.current = buyValue;
  const activeBoxRef = useRef(activeBox);
  activeBoxRef.current = activeBox;
  const assetInfoRef = useRef(assetInfo);
  assetInfoRef.current = assetInfo;
  const sellTokenRef = useRef(sellToken);
  sellTokenRef.current = sellToken;
  const buyTokenRef = useRef(buyToken);
  buyTokenRef.current = buyToken;

  useEffect(() => {
    if (tokenPair) {
      const func =
        activeBoxRef.current === "sell"
          ? getExactBuyAmount
          : getExactSellAmount;
      const amount =
        activeBoxRef.current === "sell"
          ? sellValueRef.current
          : buyValueRef.current;
      const token =
        activeBoxRef.current === "sell"
          ? sellTokenRef.current
          : buyTokenRef.current;

      if (!amount || !token) return;
      func(
        tokenPair[0],
        tokenPair[1],
        parseUnits(amount, assetInfoRef.current![token].decimals)
      ).then((v) => {
        const setFunc =
          activeBoxRef.current === "sell" ? setBuyValue : setSellValue;
        setFunc(
          formatUnits(
            v,
            assetInfoRef.current![
              activeBoxRef.current === "sell"
                ? buyTokenRef.current
                : sellTokenRef.current
            ].decimals
          )
        );
      });
    }
  }, [tokenPair, getExactBuyAmount, getExactSellAmount]);

  useEffect(() => {
    if (tokenPair) {
      getPoolSize(tokenPair).then((result) => {
        if (!result) return;
        setPoolSize([
          {
            symbol: assetInfo![tokenPair[0]].symbol,
            value: formatUnits(result[0], assetInfo![tokenPair[0]].decimals),
          },
          {
            symbol: assetInfo![tokenPair[1]].symbol,
            value: formatUnits(result[1], assetInfo![tokenPair[1]].decimals),
          },
        ]);
      });
    }
  }, [tokenPair, getPoolSize, assetInfo]);

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
              <Connect className="mt-2" />
              <div className="mt-8 flex flex-col gap-4">
                {/* Token Pair Selector */}
                <div>
                  <div className="font-bold mb-2">Select Liquidity Pool</div>
                  <Select
                    value={selectedTokenPair}
                    onValueChange={setSelectedTokenPair}
                    disabled={!assetInfo || !tokenPairOptions.length}
                  >
                    <SelectTrigger className="w-full h-12! text-md">
                      <SelectValue placeholder="Select a token pair" />
                    </SelectTrigger>
                    <SelectContent>
                      {tokenPairOptions.map((option) => (
                        <SelectItem key={option.key} value={option.key}>
                          <div className="flex items-center gap-2 select-none">
                            <div className="flex items-center gap-0">
                              <Image
                                className="w-5 h-5 inline-flex items-center justify-center align-middle"
                                src={`https://resources.acala.network/tokens/${option.symbols[0]}.png`}
                                alt={option.symbols[0]}
                                width={20}
                                height={20}
                              />
                              <Image
                                className="ml-[-8px] w-5 h-5 inline-flex items-center justify-center align-middle"
                                src={`https://resources.acala.network/tokens/${option.symbols[1]}.png`}
                                alt={option.symbols[1]}
                                width={20}
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
                        {poolSize[0].value} {poolSize[0].symbol}
                        <span className="text-muted-foreground">+</span>
                        {poolSize[1].value} {poolSize[1].symbol}
                      </div>
                    ) : (
                      <div className="text-muted-foreground">--</div>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <div className="font-bold text-muted-foreground">Price</div>
                    {poolSize ? (
                      <div className="flex gap-1">
                        {1} {poolSize[0].symbol}
                        <span className="text-muted-foreground">=</span>
                        {Number(
                          (
                            Number(poolSize[1].value) /
                            Number(poolSize[0].value)
                          ).toFixed(4)
                        )}{" "}
                        {poolSize[1].symbol}
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
                    disabled={!sellValue || !buyValue || !tokenPair}
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
