import { SimpleAdapter } from "../../adapters/types";
import fetchURL from "../../utils/fetchURL";
import { CHAIN } from "../../helpers/chains";
import { getUniqStartOfTodayTimestamp } from "../../helpers/getUniSubgraphVolume";

interface IAevoVolumeResponse {
  daily_volume: string;
  daily_volume_premium: string;
  total_volume: string;
  total_volume_premium: string;
}

export const aevoVolumeEndpoint = "https://api.aevo.xyz/statistics";

const adapter: SimpleAdapter = {
  adapter: {
    [CHAIN.ETHEREUM]: {
      fetch: fetchAevoVolumeData,
      start: async () => 0
    },
  },
};

export async function fetchAevoVolumeData(
  /** Timestamp representing the end of the 24 hour period */
  timestamp: number
) {
  const aevoVolumeData = await getAevoVolumeData(aevoVolumeEndpoint);

  const dailyNotionalVolume = Number(aevoVolumeData.daily_volume).toFixed(2);
  const dailyPremiumVolume =  Number(aevoVolumeData.daily_volume_premium).toFixed(2);
  const totalNotionalVolume = Number(aevoVolumeData.total_volume).toFixed(2);
  const totalPremiumVolume = Number(aevoVolumeData.total_volume_premium).toFixed(2);

  const dayTimestamp = getUniqStartOfTodayTimestamp(new Date(timestamp * 1000));
  return {
    timestamp: dayTimestamp,
    dailyNotionalVolume,
    dailyPremiumVolume,
    totalNotionalVolume,
    totalPremiumVolume,
  };
}

async function getAevoVolumeData(endpoint: string): Promise<IAevoVolumeResponse> {
  return (await fetchURL(endpoint))?.data;
}

export default adapter;
