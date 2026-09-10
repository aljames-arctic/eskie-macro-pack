export interface SoundConfig {
    enable: boolean;
    file?: string;
    delay?: number;
    volume?: number;
    fadeIn?: number;
    fadeOut?: number;
    startTime?: number | null;
    endTime?: number | null;
    timeRange?: [number, number];
    repeats?: number | [number, number, number];
}

export interface Dependency {
    id: string;
    min?: string;
    max?: string;
    ref?: string;
    description?: string;
    url?: string;
}

export interface TrapConfig {
    fadeTime?: number;
    sound?: SoundConfig;
    targetLocation?: { x: number; y: number } | string | null;
    pushDistance?: number;
    textureSrc?: string;
    playbackRate?: number;
    [key: string]: unknown;
}

export type ConcreteToken = Token;
export type ConcreteTile = Tile;

export interface AnimationEffectModule<TConfig = Record<string, unknown>> {
    create: (target: Token, config?: TConfig) => Promise<any>;
    play: (target: Token, config?: TConfig) => Promise<any>;
    stop?: (target: Token, config?: TConfig) => Promise<void>;
    default_config: TConfig;
}

export interface TrapModule<TConfig extends TrapConfig = TrapConfig> {
    create: (tile: Tile, targets?: Token[], config?: TConfig) => Promise<any>;
    play: (tile: Tile, targets?: Token[], config?: TConfig) => Promise<any>;
    stop?: (tile: Tile, config?: TConfig) => Promise<void>;
    setup?: (config?: Record<string, unknown>) => Promise<any>;
    default_config: TConfig;
}
