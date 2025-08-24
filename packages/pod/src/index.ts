import * as inhouse from "./providers/inhouse";

export const createPodAdapter = (provider: string) => {
  if (provider === "INHOUSE") return inhouse;
  throw new Error("Only INHOUSE provider is available in this build");
};

export * from "./types";
export * from "./dpi";
