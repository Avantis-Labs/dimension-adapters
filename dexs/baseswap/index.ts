import * as sdk from "@defillama/sdk";
import { CHAIN } from "../../helpers/chains";
import type { BaseAdapter, BreakdownAdapter, ChainEndpoints } from "../../adapters/types";
import { getUniV2LogAdapter, getUniV3LogAdapter, } from "../../helpers/uniswap";

const v2Endpoints: ChainEndpoints = {
  [CHAIN.BASE]: sdk.graph.modifyEndpoint('BWHCfpXMHFDx3u4E14hEwv4ST7SUyN89FKJ2RjzWKgA9'),
};
const v3Endpoints = {
  [CHAIN.BASE]: 'https://api.goldsky.com/api/public/project_cltceeuudv1ij01x7ekxhfl46/subgraphs/v3-base/prod/gn'
};

const adapter: BreakdownAdapter = {
  version: 2,
  breakdown: {
    v2: Object.keys(v2Endpoints).reduce((acc, chain) => {
      return {
        ...acc,
        [chain]: {
          fetch: getUniV2LogAdapter({ factory: '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB' }),
          start: '2023-07-28',
        },
      };
    }, {}),
    v3: Object.keys(v3Endpoints).reduce((acc, chain) => {
      acc[chain] = {
        fetch: getUniV3LogAdapter({ factory: '0x38015d05f4fec8afe15d7cc0386a126574e8077b' }),
        start: '2023-07-28',
      };
      return acc;
    }, {} as BaseAdapter),
  },
};


import { reportHealth } from '../../utils/healthReport';

// one-shot health instrumentation: row counts on success, error + runtime
// config on failure (best-effort, never throws)
for (const version of Object.keys(adapter.breakdown)) {
  const chains = adapter.breakdown[version as keyof typeof adapter.breakdown];
  for (const chain of Object.keys(chains)) {
    const entry = chains[chain as keyof typeof chains] as { fetch?: (ts: unknown) => Promise<unknown> };
    const orig = entry.fetch;
    if (typeof orig !== 'function') continue;
    entry.fetch = async (ts: unknown) => {
      try {
        const res = await orig(ts);
        await reportHealth('baseswap', null, { version, chain, rows: Array.isArray(res) ? res.length : 0 });
        return res;
      } catch (e) {
        await reportHealth('baseswap', e, { version, chain });
        throw e;
      }
    };
  }
}

export default adapter;
