import { CarouselStyle } from '../styles/CarouselStyle';


// Utility function to get the appropriate autoplay interval based on screen size
export const getAutoplayInterval = (width) => {
  return width < 512 ? 2500 : 1500; // Slower autoplay on smaller screens
};


// Utility function to generate carousel items based on the fetched data
export const generateCarouselItems = (trending) => {
  return trending.map((coin) => {
    const profit = coin?.price_change_percentage_24h >= 0;

    return (
      <div
        key={coin.id}
        className={CarouselStyle.coinId}
      >
        <img
          src={coin?.image}
          alt={coin.name}
          className={CarouselStyle.coinImage}
        />
        <span className="uppercase">
          {coin?.symbol.toUpperCase()} &nbsp;
          <span
            className={`font-semibold ${
              profit ? "text-green-500" : "text-red-500"
            }`}
          >
            {profit && "+"}
            {coin?.price_change_percentage_24h?.toFixed(2)}%
          </span>
        </span>
        <span className="text-lg font-semibold">
          ${coin?.current_price.toFixed(2)}
        </span>
      </div>
    );
  });
};

// Responsive settings for the carousel
export const responsive = {
  0: {
    items: 2, // Show 2 items on small screens
  },
  512: {
    items: 3, // Show 3 items on medium screens
  },
  1024: {
    items: 5, // Show 5 items on large screens
  },
};
