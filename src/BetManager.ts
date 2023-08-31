import { Page, Browser } from "puppeteer";
import { writeToLogFile as log } from "./utils/logger";

type Button = 'odd' | 'even' | 'red' | 'black' | 'big' | 'small';

type Buttonbet = {
    amount: number;
    button: Button;
    type: 'number_50';
};

type SendRequest = {
    button_bet: Buttonbet[];
    game: 'RL000001';
    total_amount: number;
};

type InitParams = {
    browser: Browser;
    page: Page | undefined;
    balance: number;
};

export class BetManager {
    private static _instance: BetManager;

    page: Page | undefined = undefined;
    browser: Browser | undefined = undefined;

    static get instance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new BetManager;
        return this._instance;
    }

    private _min = 5000;
    private _max = 5000000;
    private _balance: number = 0;

    results: number[] = [];

    periode: number = 0;

    currentAmount: number = 0;
    nextAmount: number = 0;
    maxAmount: number = 0;

    button: Button = 'odd';

    // result
    totalWin: number = 0;

    // send
    currentSend: number = 0;
    maxSend: number = 0;

    // target
    targetWin: number = 100000;
    targetLose: number = -100000;

    init(params: InitParams) {
        this.browser = params.browser;
        this.page = params.page;
        this._balance = params.balance;
    }

    start() {
        this.senBet();
    }

    addResult(result: number) {
        this.results.push(result);
    }

    async senBet() {
        if (this.currentAmount === 0 && this.nextAmount === 0) {
            this.currentAmount = this._min;
        }
        else {
            this.currentAmount = this.nextAmount;
        }

        if (this.currentAmount > this._max) {
            console.log('hit max bet');
            throw new Error('hit max bet');
        }

        if (this.currentAmount > this._balance) {
            console.log('balance insuffix');

            this.browser?.close();

            return;
        }

        this.periode++;

        const bet: SendRequest = {
            button_bet: [
                {
                    button: this.button,
                    type: 'number_50',
                    amount: this.currentAmount
                }
            ],
            game: 'RL000001',
            total_amount: this.currentAmount
        };

        try {
            if (!this.page) {
                throw new Error('page is undefined');
            }

            const { result, total_win } = await this.page.evaluate<[SendRequest], (bet: SendRequest) => Promise<{ result: number, total_win: number; }>>((bet) => {
                return new Promise((resolve, reject) => {
                    let tryResubmit = 0;

                    const send = () => {
                        fetch('/game/send_bet', {
                            method: 'POST',
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(bet)
                        })
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('Network response was not ok');  // Tolak Promise jika ada kesalahan jaringan
                                }

                                return response.json();
                            })
                            .then(result => {
                                if (result.data?.game_result?.result) {
                                    resolve({
                                        result: Number(result.data?.game_result?.result),
                                        total_win: result.data?.total_win ?? 0
                                    });
                                } else {
                                    throw new Error("Result not found in the response"); // Tolak dengan alasan yang jelas
                                }
                            })
                            .catch(error => {
                                console.error('Error', error);

                                if (tryResubmit >= 5) {
                                    console.log('max resubmit');
                                    reject(error);
                                } else {
                                    console.log('try resubmit');
                                    tryResubmit++;
                                    send();
                                }
                            });
                    };

                    send();
                });
            }, bet);

            this.addResult(result);

            this._balance -= this.currentAmount;
            this.currentSend += this.currentAmount;

            if (this.currentAmount > this.maxAmount) {
                this.maxAmount = this.currentAmount;
            }

            if (this.currentSend > this.maxSend) {
                this.maxSend = this.currentSend;
            }

            if (total_win > 0) {
                this.nextAmount = this._min;
                this._balance += total_win;

                this.totalWin += (total_win - this.currentAmount);

                this.currentSend = 0;
            }
            else {
                this.nextAmount = this.currentAmount * 2;
                this.totalWin -= this.currentAmount;

                if (result !== 0) {
                    this.button = this.button === 'odd' ? 'even' : 'odd';
                }
            }

            // const toLog = {
            //     button: bet.button_bet[0],
            //     amount: bet.total_amount,
            //     result: result,
            //     win: total_win > 0,
            //     balance: this._balance,
            //     totalWin: this.totalWin,
            //     maxSend: this.maxSend
            // };

            // console.log('send', {
            //     button: bet.button_bet[0],
            //     amount: bet.total_amount,
            //     result: result,
            //     win: total_win > 0,
            //     balance: this._balance,
            //     totalWin: this.totalWin,
            //     maxSend: this.maxSend
            // });
            console.log({
                button: bet.button_bet[0],
                result,
                totalWin: this.totalWin
            });
            // log(JSON.stringify(toLog));

            if (this.totalWin <= this.targetLose) {
                console.log('hit max lose');
                console.log(BetManager.instance);

                this.browser?.close();

                return;
            }

            if (this.totalWin >= this.targetWin) {
                console.log('hit max win');
                console.log(BetManager.instance);

                this.browser?.close();

                return;
            }

            this.senBet();

        } catch (error) {
            throw error;
        }
    }
}