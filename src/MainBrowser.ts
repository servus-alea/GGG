import puppeteer, { Page, Browser } from "puppeteer";
import { sleep } from "./utils/sleep";

const URL = "https://dmbmania.net";
const LOBBY = "/lobby/ide";
const GAME = "http://idnelectroniclobby.com/play/rl000001";

const User = {
    username: "JOSUA4000",
    password: "qwe123"
};

export const MainBrowser = async () => {
    const browser = await initializeBrowser();
    const mainPage = await browser.newPage();

    await navigateToUrl(mainPage, URL);
    await loginUser(mainPage);
    // await navigateToUrl(mainPage, URL);
    const lobbyPage = await openLobbyPage(browser, mainPage);
    await closeOtherPages(browser, lobbyPage);
    await navigateToGame(lobbyPage, GAME);

    return { browser, page: lobbyPage };
};

const initializeBrowser = async (): Promise<Browser> => {
    return puppeteer.launch({
        headless: false,
        args: ['--disable-notifications']
    });
};

const navigateToUrl = async (page: Page, url: string) => {
    await page.goto(url, {
        waitUntil: 'networkidle0'
    });
};

const loginUser = async (page: Page) => {
    await page.type('#username', User.username, { delay: 100 });
    await page.type('#password', User.password, { delay: 100 });
    await page.click('button.btn-login.btn-blue[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
};

const openLobbyPage = async (browser: Browser, page: Page): Promise<Page> => {
    const pagesBeforeClick = await browser.pages();

    await page.evaluate((url: string) => {
        const buttonEl = document.createElement('a');
        buttonEl.href = url;
        buttonEl.target = '_blank';
        buttonEl.click();
    }, `${URL}${LOBBY}`);

    let lobbyPage: Page | undefined;
    while (!lobbyPage) {
        const pagesAfterClick = await browser.pages();
        for (const p of pagesAfterClick) {
            if (!pagesBeforeClick.includes(p)) {
                lobbyPage = p;
                break;
            }
        }

        await sleep(100); // poll every 100ms until the new page is found
    }

    return lobbyPage;
};

const closeOtherPages = async (browser: Browser, excludePage: Page) => {
    const pages = await browser.pages();

    for (const page of pages) {
        if (page !== excludePage) {
            await page.close();
        }
    }
};

const navigateToGame = async (page: Page, gameUrl: string) => {
    await page.goto(gameUrl, { waitUntil: "networkidle0" });
};
