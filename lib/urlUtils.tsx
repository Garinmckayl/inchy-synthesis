export const getUrlString = (key: string, operation: string, walletAddress: string) => {
    const ethplorerAPIKey = 'EK-nY7ou-saWnY7s-ooUEm';
    const urlMappings = {
        'Ethereum': 'https://api.ethplorer.io/',
        'BNB Smart Chain': 'https://api.binplorer.com/'
    };

    const baseUrl = urlMappings[key as keyof typeof urlMappings];
    if (!baseUrl) {
        throw new Error(`Invalid network key: ${key}`);
    }

    return `${baseUrl}${operation}/${walletAddress}?apiKey=${ethplorerAPIKey}`;
};