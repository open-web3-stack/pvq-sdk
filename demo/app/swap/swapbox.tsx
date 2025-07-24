/* eslint-disable @typescript-eslint/no-unused-vars */
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryAssetInfo } from "./useQueryAssetInfo";
import { useEffect } from "react";

type SwapBoxProps = {
  title?: string;
  value: string;
  onValueChange?: (v: string) => void;
  token: string;
  onTokenChange?: (token: string) => void;
  tokenIcon?: React.ReactNode;
  tokenButtonClass?: string;
  fiatValue?: string;
  readOnly?: boolean;
  highlight?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  tokens?: string[];
  selectableTokens?: string[];
};

export const SwapBox = ({
  value,
  onValueChange,
  token,
  onTokenChange,
  readOnly = false,
  highlight = false,
  onFocus,
  onBlur,
  tokens,
}: SwapBoxProps) => {
  const { data: assetInfo } = useQueryAssetInfo();

  useEffect(() => {
    if (!token) return;
    if (tokens?.includes(token)) return;
    onTokenChange?.(tokens?.[0] || "");
  }, [tokens, token, onTokenChange]);

  return (
    <div
      className={`select-none rounded-xl px-2.5 py-1.5 flex items-center relative h-14 ${highlight ? "bg-input/90 border border-primary/60" : "bg-input/30 border border-border"}`}
    >
      <Input
        type="number"
        min="0"
        placeholder="0"
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className="flex-1 h-full bg-transparent! text-xl! font-semibold text-foreground  border-none shadow-none focus:ring-0 focus:outline-none p-0"
        style={{ boxShadow: "none" }}
        readOnly={readOnly}
        onFocus={onFocus}
        // onBlur={onBlur}
      />
      <div
        className="flex items-center gap-2 ml-2"
        // onFocus={() => {
        //   if (!highlight) {
        //     onFocus?.();
        //   }
        // }}
      >
        <Select
          disabled={!assetInfo || !tokens?.length}
          value={token}
          onValueChange={onTokenChange}
        >
          <SelectTrigger
            disabled={!assetInfo || !tokens?.length}
            className="rounded-xl border border-border px-2 py-1.5 transition-colors shadow-sm flex items-center gap-1"
            style={{ height: "2.25rem" }}
          >
            {token ? (
              <SelectValue />
            ) : (
              <>
                <span className="w-6 h-6 rounded-full bg-blue-400 flex items-center justify-center">
                  <span className="text-white font-bold text-base">Ξ</span>
                </span>
                <span className="font-bold">Select Token</span>
              </>
            )}
          </SelectTrigger>
          {assetInfo && (
            <SelectContent>
              {tokens?.map((assetId) => (
                <SelectItem key={assetId} value={assetId}>
                  <span className="w-5 h-5 rounded-full bg-blue-400 inline-flex items-center justify-center mr-0.5 align-middle">
                    <span className="text-white font-bold text-xs">
                      {assetInfo[assetId].symbol[0]}
                    </span>
                  </span>
                  {assetInfo[assetId].symbol}
                </SelectItem>
              ))}
            </SelectContent>
          )}
        </Select>
      </div>
    </div>
  );
};
