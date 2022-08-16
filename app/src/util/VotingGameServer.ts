export type GamePhase = "idle" | "playing" | "finished";
export type VoteState = { value: string; count: number; }

export interface GameState {
    phase: GamePhase;
    isStarted: boolean;
    timeRemaining: number;
    votes: VoteState[];
}

export default class VotingGameServer {
    public gameState: GameState;

    private tickLength: number;
    private maxTicks: number;
    private interval: any;

    private _onStateChange: (state: GameState) => void;

    public get isActive() {
        return this.gameState?.phase === "playing";
    }

    public get isRunning() {
        return this.interval !== undefined;
    }

    constructor() {
        this.tickLength = 1000;
        this.maxTicks = 15;
        this.resetGame();
    }

    public setState(state: GameState) {
        this.gameState = state;
        this._onStateChange && this._onStateChange(this.gameState);
    }

    public resetGame() {
        this.gameState = {
            ...defaultState,
            isStarted: false,
            timeRemaining: this.tickLength * this.maxTicks,
            votes: []
        };
        return true;
    }

    public onStateChange(callback: (state: GameState) => void) {
        this._onStateChange = callback;
    }

    public start() {        
        this.gameState.isStarted = true;
        this.gameState.phase = "playing";

        this._onStateChange && this._onStateChange(this.gameState);
        this.startTicking();
    }

    public startTicking() {
        this.interval = setInterval(() => {

            this.gameState = {
                ...this.gameState,
                timeRemaining: this.gameState.timeRemaining -= this.tickLength,
            } as GameState;

            this._onStateChange && this._onStateChange(this.gameState);

            if (this.gameState.timeRemaining <= 0) {
                this.gameState.phase = "finished";
                clearInterval(this.interval);
                this._onStateChange && this._onStateChange(this.gameState);
            }
        }, this.tickLength);
    }

    public recordVote(value: string): GameState {
        if (this?.gameState?.phase !== "playing") {
             return;
        }

        const voteState = this.gameState.votes.find(x => x.value === value);
        if (voteState) {
            voteState.count++;
        } else {
            this.gameState.votes.push({ value, count: 1 });
        }
        
        this._onStateChange && this._onStateChange(this.gameState);
        return this.gameState;
    }
}

export const defaultState: GameState = {
    phase: "idle",
    isStarted: false,
    timeRemaining: 0,
    votes: [],
};