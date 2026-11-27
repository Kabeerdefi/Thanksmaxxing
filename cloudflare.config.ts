import { bindings, defineConfig, defineWorker } from "cf/config";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const localEnv = loadEnv(mode, process.cwd(), "");
  const value = (name: string) => process.env[name] ?? localEnv[name] ?? "";

  return {
    worker: defineWorker({
      name: "thanksmaxxing",
      entrypoint: "vinext/server/fetch-handler",
      compatibilityDate: "2026-11-26",
      workersDev: true,
      previewUrls: false,
      assets: {
        htmlHandling: "none",
        notFoundHandling: "none",
        runWorkerFirst: ["/*", "!/_next/static/*", "!/*/_next/static/*"],
      },
      env: {
        ASSETS: bindings.assets(),
        NEXT_PUBLIC_CHAIN_ID: bindings.text(value("NEXT_PUBLIC_CHAIN_ID")),
        NEXT_PUBLIC_BASE_RPC_URL: bindings.text(value("NEXT_PUBLIC_BASE_RPC_URL")),
        NEXT_PUBLIC_CONTRACT_ADDRESS: bindings.text(value("NEXT_PUBLIC_CONTRACT_ADDRESS")),
        NEXT_PUBLIC_DEPLOYMENT_BLOCK: bindings.text(value("NEXT_PUBLIC_DEPLOYMENT_BLOCK")),
        X_CLIENT_ID: bindings.secret(),
        NEXT_PUBLIC_SITE_URL: bindings.text(value("NEXT_PUBLIC_SITE_URL")),
        X_ATTESTOR_ADDRESS: bindings.text(value("X_ATTESTOR_ADDRESS")),
        X_CLIENT_SECRET: bindings.secret(),
        AUTH_COOKIE_SECRET: bindings.secret(),
        X_ATTESTOR_PRIVATE_KEY: bindings.secret(),
      },
    }),
  };
});
