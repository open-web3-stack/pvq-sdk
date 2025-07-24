import { useQuery } from "@tanstack/react-query";

export const useQueryAssetInfo = () => {
  return useQuery({
    queryKey: ["assetInfo"],
    queryFn: async () => {
      return {
        "0x0000": {
          symbol: "ACA",
          decimals: 12,
        },
        "0x0001": {
          symbol: "AUSD",
          decimals: 12,
        },
        "0x0002": {
          symbol: "DOT",
          decimals: 10,
        },
        "0x040d000000": {
          symbol: "LDOT",
          decimals: 10,
        },
      } as Record<string, { symbol: string; decimals: number }>;
    },
  });
};
