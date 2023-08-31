import { MainBrowser } from './MainBrowser';
import { BetManager } from './BetManager';

(async () => {
    const { browser, page } = await MainBrowser();

    const balance = await page.evaluate<unknown[], () => Promise<number>>(() => {
        const balanceElement = document.querySelector('.footer-info-balance-value');
        let result = 0;
        if (balanceElement && balanceElement.textContent) {
            result = Number(balanceElement.textContent.split(',')[0].replace(/[^0-9]/g, ''));
        }

        return Promise.resolve(result);
    });

    BetManager.instance.init({
        browser, page, balance
    });

    BetManager.instance.start();

    // browser.close();
})();