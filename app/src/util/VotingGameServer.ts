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

    private onStateChange: (state: GameState) => void;

    public get isActive() {
        return this.gameState.phase === "playing";
    }

    constructor() {
        this.tickLength = 1000;
        this.maxTicks = 15;    

        this.gameState = {
            ...defaultState,
            isStarted: false,
            timeRemaining: this.maxTicks
        };
    }

    public start(onStateChange: (state: GameState) => void) {
        this.onStateChange = onStateChange;

        this.gameState = {
            ...this.gameState,
            phase: "playing",
            votes: [],
            isStarted: true
        };

        onStateChange && onStateChange(this.gameState);

        let tick = 1;
        const interval = setInterval(() => {

            this.gameState = {
                ...this.gameState,
                timeRemaining: this.maxTicks - tick,
            } as GameState;

            onStateChange && onStateChange(this.gameState);

            tick++;

            if (tick >= this.maxTicks) {
                this.gameState.phase = "finished";
                clearInterval(interval);
                onStateChange && onStateChange(this.gameState);
            }
        }, this.tickLength);
    }

    public logVote(value: string): GameState {
        if (this?.gameState?.phase !== "playing") {
             return;
        }

        const voteState = this.gameState.votes.find(x => x.value === value);
        if (voteState) {
            voteState.count++;
        } else {
            this.gameState.votes.push({ value, count: 1 });
        }
        
        this.onStateChange && this.onStateChange(this.gameState);
        return this.gameState;
    }
}

export const defaultState: GameState = {
    phase: "idle",
    isStarted: false,
    timeRemaining: 0,
    votes: [],
};