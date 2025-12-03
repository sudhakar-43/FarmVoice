import { useState, useEffect } from "react";
import { FaChartLine, FaSearch, FaMapMarkerAlt, FaSpinner } from "react-icons/fa";
import { apiClient } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

interface MarketPrice {
  commodity: string;
  arrival_date: string;
  variety: string;
  state: string;
  district: string;
  market: string;
  min_price: number;
  max_price: number;
  avg_price: number;
  unit: string;
}

export default function Market() {
  const { t } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPrices = async () => {
      setIsLoading(true);
      setError("");
      
      try {
        const timestamp = new Date().getTime();
        const url = `/api/market/prices?_t=${timestamp}`;
        
        const response = await apiClient.request<MarketPrice[]>(url, {
          method: "GET"
        });
        
        if (response.error) {
          setError(typeof response.error === "string" ? response.error : String(response.error));
          setIsLoading(false);
          return;
        }

        if (response.data) {
          setPrices(response.data);
        }
      } catch (err) {
        setError(t('market_load_error'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrices();
  }, []);

  const filteredPrices = prices.filter(
    (price) => {
      const term = searchTerm.toLowerCase();
      return (
        price.commodity?.toLowerCase().includes(term) ||
        price.market?.toLowerCase().includes(term) ||
        price.district?.toLowerCase().includes(term)
      );
    }
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <FaChartLine className="text-emerald-600 dark:text-emerald-400 mr-2" />
              {t('market_prices_title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('market_prices_desc')}</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('search_market_placeholder')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <FaSpinner className="animate-spin text-4xl text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('loading_market_data')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-300 font-semibold">
                  <th className="px-6 py-4">{t('commodity_col')}</th>
                  <th className="px-6 py-4">{t('arrival_date_col')}</th>
                  <th className="px-6 py-4">{t('variety_col')}</th>
                  <th className="px-6 py-4">{t('state_col')}</th>
                  <th className="px-6 py-4">{t('district_col')}</th>
                  <th className="px-6 py-4">{t('market_col')}</th>
                  <th className="px-6 py-4 text-right">{t('min_price_col')}</th>
                  <th className="px-6 py-4 text-right">{t('max_price_col')}</th>
                  <th className="px-6 py-4 text-right">{t('avg_price_col')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredPrices.length > 0 ? (
                  filteredPrices.map((price, index) => (
                    <tr 
                      key={index} 
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm text-gray-700 dark:text-gray-300"
                    >
                      <td className="px-6 py-4 font-medium text-emerald-700 dark:text-emerald-400">{price.commodity}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{price.arrival_date}</td>
                      <td className="px-6 py-4">{price.variety}</td>
                      <td className="px-6 py-4">{price.state}</td>
                      <td className="px-6 py-4">{price.district}</td>
                      <td className="px-6 py-4 font-medium">{price.market}</td>
                      <td className="px-6 py-4 text-right font-mono">₹{price.min_price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-mono">₹{price.max_price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white font-mono">₹{price.avg_price.toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      {t('no_market_data')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
          <span>{t('data_source')}</span>
          <span>{t('last_updated')}: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
