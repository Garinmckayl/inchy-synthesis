export async function getImages(names) {
    /**
   * Fetches images for a list of tokens from the CoinGecko API.
   * @param {string[]} names - An array of token names to fetch images for.
   * @returns {Promise<Object>} - A promise that resolves to an object mapping token IDs to their image URLs.
   */
    try {
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'x-cg-demo-api-key': 'CG-mNCEY3t9ZsvHKtmrpN4hQoPb'
            }
        };
        const formattedNames = names.map(name => name.toLowerCase().replace(/\s+/g, '-')).join(',');
        const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${formattedNames}`,options);
        
        const data = await response.json();

        const imagesMap = data.reduce((acc, token) => {
            acc[token.id] = token.image;
            return acc;
        }, {});

        return imagesMap;
        } catch (error) {
        console.error('Error fetching token images:', error);
        return {};
        }
}


export const fetchTrendingCoins = async (currency, setTrending) => {
      /**
     * Fetches trending coins data from the CoinGecko API and updates state.
     * @param {string} currency - The currency code (e.g., 'usd') for the price data.
     * @param {function} setTrending - A state setter function to update the trending coins data.
     * @returns {Promise<void>} - A promise that resolves when the data has been fetched and state has been updated.
     */
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=gecko_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`
      );
  
      if (!response.ok) {
        console.log(`Error HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      setTrending(data); 
    } catch (error) {
      console.error("Error fetching trending coins: ", error);
    }
  };
  
  /**
 * Retrieves the current price of BNB from CoinGecko.
 * @returns {Promise<number>} A promise that resolves to the current price of BNB.
 */
export async function getBNB() {
  try {    
      const options = {
          method: 'GET',
          headers: {
              accept: 'application/json',
              'x-cg-demo-api-key': 'CG-mNCEY3t9ZsvHKtmrpN4hQoPb'
          }
      };

      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=binancecoin', options);
      const data = await response.json();

      const currentPrice = data[0].current_price;

      return currentPrice;
  } catch (error) {
      console.error('Error fetching BNB data:', error);
      return 0;
  }
}

/**
* Retrieves the current price of ETH from CoinGecko.
* @returns {Promise<number>} A promise that resolves to the current price of ETH.
*/
export async function getETH() {
  try {    
      const options = {
          method: 'GET',
          headers: {
              accept: 'application/json',
              'x-cg-demo-api-key': 'CG-mNCEY3t9ZsvHKtmrpN4hQoPb'
          }
      };

      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum', options);
      const data = await response.json();

      const currentPrice = data[0].current_price;

      return currentPrice;
  } catch (error) {
      console.error('Error fetching ETH data:', error);
      return 0;
  }
}
