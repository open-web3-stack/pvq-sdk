"use client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiAtom, apiConnectingAtom } from "@/lib/atoms";
import { cn } from "@/lib/utils";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { useAtom } from "jotai";
import { useCallback, useState } from "react";

const NETWORKS = [
  {
    name: "Acala",
    endpoint: "wss://pvq-mandala.aca-staging.network",
  },
  {
    name: "AssetHub",
    endpoint: "wss://pvq-assethub.aca-staging.network",
  },
] as const;

export const NetworkSelector = ({
  className,
  onDisconnect,
}: {
  className?: string;
  onDisconnect?: () => void;
}) => {
  const [api, setApi] = useAtom(apiAtom);
  const [connecting, setConnecting] = useAtom(apiConnectingAtom);
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [error, setError] = useState<Error | null>(null);

  const handleConnect = useCallback(async () => {
    if (connecting || !selectedNetwork) return;
    
    const network = NETWORKS.find(n => n.name === selectedNetwork);
    if (!network) return;

    try {
      setError(null);
      setConnecting(true);
      const wsProvider = new WsProvider(network.endpoint);

      await new Promise((resolve, reject) => {
        const unsubError = wsProvider.on("error", (err) => {
          console.error("API error:", err);
          unsubError();
          wsProvider.disconnect();
          reject(new Error(`Failed to connect to ${network.name}`));
        });
        const unsubConnect = wsProvider.on("connected", () => {
          console.log(`Connected to ${network.name}`);
          unsubConnect();
          resolve(null);
        });
      });

      const api = await ApiPromise.create({ provider: wsProvider });

      await api.isReady;
      setApi(api);
    } catch (error) {
      console.error("Failed to connect to the API:", error);
      setError(error as Error);
      setApi(null);
    } finally {
      setConnecting(false);
    }
  }, [connecting, selectedNetwork, setApi, setConnecting]);

  const handleDisconnect = useCallback(() => {
    if (api) {
      api.disconnect();
      setApi(null);
      setConnecting(false);
      setSelectedNetwork("");
      onDisconnect?.();
    }
  }, [api, setApi, setConnecting, onDisconnect]);

  const handleNetworkChange = useCallback((value: string) => {
    setSelectedNetwork(value);
    setError(null);
  }, []);

  return (
    <div className={cn(className, "select-none")}>
      <div className="font-bold">Select Network</div>
      <div className="flex space-x-2 mt-1">
        <Select
          value={selectedNetwork}
          onValueChange={handleNetworkChange}
          disabled={connecting || !!api}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Choose a network" />
          </SelectTrigger>
          <SelectContent>
            {NETWORKS.map((network) => (
              <SelectItem key={network.name} value={network.name}>
                {network.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!api ? (
          <Button
            className="min-w-[120px]"
            disabled={connecting || !selectedNetwork}
            onClick={handleConnect}
          >
            {connecting ? "Connecting..." : "Connect"}
          </Button>
        ) : (
          <Button
            className="min-w-[120px]"
            variant="destructive"
            disabled={connecting}
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error.message}</p>}
    </div>
  );
}; 