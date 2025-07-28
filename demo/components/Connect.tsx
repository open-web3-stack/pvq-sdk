"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiAtom, apiConnectingAtom } from "@/lib/atoms";
import { cn } from "@/lib/utils";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { useAtom } from "jotai";
import { useCallback, useState } from "react";

const defaultEndpoint = "ws://127.0.0.1:8000";

export const Connect = ({
  className,
  onDisconnect,
}: {
  className?: string;
  onDisconnect?: () => void;
}) => {
  const [api, setApi] = useAtom(apiAtom);
  const [connecting, setConnecting] = useAtom(apiConnectingAtom);
  const [value, setValue] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const handleConnect = useCallback(async () => {
    if (connecting) return;
    try {
      setError(null);
      setConnecting(true);
      const wsProvider = new WsProvider(value || defaultEndpoint);

      await new Promise((resolve, reject) => {
        const unsubError = wsProvider.on("error", (err) => {
          console.error("API error:", err);
          unsubError();
          wsProvider.disconnect();
          reject(new Error("Failed to connect to the Endpoint"));
        });
        const unsubConnect = wsProvider.on("connected", () => {
          console.log("Connected to the API");
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
  }, [connecting, setApi, setConnecting, value]);

  const handleDisconnect = useCallback(() => {
    if (api) {
      api.disconnect();
      setApi(null);
      setConnecting(false);
      onDisconnect?.();
    }
  }, [api, setApi, setConnecting, onDisconnect]);

  return (
    <div className={cn(className, "select-none")}>
      <div className="font-bold">Custom Endpoint</div>
      <div className="flex space-x-2 mt-1">
        <Input
          disabled={connecting || !!api}
          placeholder={defaultEndpoint}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        {!api ? (
          <Button
            className="min-w-[120px]"
            disabled={connecting}
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
