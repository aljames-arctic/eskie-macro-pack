export interface SoundConfig {
    enable: boolean;
    file?: string;
    delay?: number;
    volume?: number;
    fadeIn?: number;
    fadeOut?: number;
    startTime?: number;
    endTime?: number;
    timeRange?: [number, number];
    repeats?: number | [number, number, number];
}

export interface TrapConfig {
    fadeTime?: number;
    sound?: SoundConfig;
    targetLocation?: { x: number; y: number } | null;
    [key: string]: unknown;
}

export type ConcreteToken = Token;
export type ConcreteTile = Tile;
