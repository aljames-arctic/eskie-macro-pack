export interface MotionPoint {
  x: number;
  y: number;
}

export interface MotionAxisOffset {
  x?: number;
  y?: number;
}

export interface MotionKeyframe<TValue> {
  v: TValue;
  duration?: number;
  hold?: number;
  ease?: string;
  inEase?: string;
  outEase?: string;
}

export interface MotionTrackOptions<TReturnValue = any> {
  duration?: number;
  ease?: string;
  delay?: number;
  return?: boolean;
  easeOut?: string;
  returnDuration?: number;
  returnValues?: Array<TReturnValue | MotionKeyframe<TReturnValue>>;
}

export interface MotionMoveToOptions extends MotionTrackOptions<MotionPoint> {
  attachTo?: boolean;
  ignoreMotion?: boolean;
  gridUnits?: boolean;
}

export interface MotionMoveByOptions extends MotionTrackOptions<MotionPoint> {
  gridUnits?: boolean;
  towards?: any;
  awayFrom?: any;
  attachTo?: boolean;
  ignoreMotion?: boolean;
}

export type MotionRotateOptions = MotionTrackOptions<number>;
export type MotionScaleOptions = MotionTrackOptions<number | MotionPoint>;
export type MotionFadeOptions = MotionTrackOptions<number>;

export interface MotionTintOptions extends MotionTrackOptions<string | number> {
  colorSpace?: 'rgb' | 'hsv';
}

export type MotionNoiseStrength = number | MotionAxisOffset;

export interface MotionNoiseOptions {
  frequency: number;
  strength?: MotionNoiseStrength;
  strengthScaledToObject?: MotionNoiseStrength;
  rotationStrength?: number;
  directionMin?: number;
  directionMax?: number;
  duration?: number;
  delay?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
}

export type MotionOscillateWaveform = 'sine' | 'triangle' | 'square';

export type MotionOscillatePositionAxis =
  | { amplitude: number; phase?: number; strengthScaledToObject?: never }
  | { strengthScaledToObject: number; phase?: number; amplitude?: never };

export interface MotionOscillateScalarAxis {
  amplitude: number;
  phase?: number;
}

export interface MotionOscillateMultiplierAxis {
  amplitude: number;
  phase?: number;
  baseline?: number;
}

export interface MotionOscillateOptions {
  period: number;
  waveform: MotionOscillateWaveform;
  duration?: number;
  delay?: number;
  fadeInDuration?: number;
  fadeOutDuration?: number;
  x?: MotionOscillatePositionAxis;
  y?: MotionOscillatePositionAxis;
  rotation?: MotionOscillateScalarAxis;
  scale?: MotionOscillateMultiplierAxis;
  alpha?: MotionOscillateMultiplierAxis;
}

export interface MotionDisplacement {
  deltaX: number;
  deltaY: number;
  deltaAngle: number;
  deltaAlpha: number;
  scaleMultiplierX: number;
  scaleMultiplierY: number;
  alphaMultiplier: number;
  tintR: number;
  tintG: number;
  tintB: number;
}

export interface MotionEndOptions {
  object?: any;
  target?: any;
  name?: string;
  sequenceId?: string;
  settle?: number;
  sceneId?: string;
}

export interface SequencerMotionManager {
  endMotions(target: any | MotionEndOptions | null, options?: MotionEndOptions, push?: boolean): number;
  endAllMotions(options?: MotionEndOptions, push?: boolean): number;
  getDisplacement(target: any): MotionDisplacement | null;
}

export interface MotionSection {
  on(target: any): MotionSection;
  name(name: string): MotionSection;
  zIndex(zIndex: number): MotionSection;
  persist(): MotionSection;
  persistUntilUpdate(): MotionSection;
  tieToDocuments(documents: any | any[]): MotionSection;

  moveTo(
    target: MotionPoint | any | Array<MotionPoint | MotionKeyframe<MotionPoint>>,
    options?: MotionMoveToOptions
  ): MotionSection;
  moveBy(
    offset: MotionAxisOffset | number | Array<MotionPoint | MotionKeyframe<MotionPoint>>,
    options?: MotionMoveByOptions
  ): MotionSection;
  rotateTo(
    angle: number | Array<number | MotionKeyframe<number>>,
    options?: MotionRotateOptions
  ): MotionSection;
  rotateBy(
    angle: number | Array<number | MotionKeyframe<number>>,
    options?: MotionRotateOptions
  ): MotionSection;
  scaleTo(
    scale: number | MotionAxisOffset | Array<number | MotionPoint | MotionKeyframe<number | MotionPoint>>,
    options?: MotionScaleOptions
  ): MotionSection;
  scaleBy(
    scale: number | MotionAxisOffset | Array<number | MotionPoint | MotionKeyframe<number | MotionPoint>>,
    options?: MotionScaleOptions
  ): MotionSection;
  fadeTo(
    alpha: number | Array<number | MotionKeyframe<number>>,
    options?: MotionFadeOptions
  ): MotionSection;
  fadeBy(
    delta: number | Array<number | MotionKeyframe<number>>,
    options?: MotionFadeOptions
  ): MotionSection;
  tintTo(
    color: string | number | Array<string | number | MotionKeyframe<string | number>>,
    options?: MotionTintOptions
  ): MotionSection;
  noise(options: MotionNoiseOptions): MotionSection;
  oscillate(options: MotionOscillateOptions): MotionSection;

  // Inherited Section & trait methods
  delay(msMin: number, msMax?: number): MotionSection;
  repeats(count: number, delayMin?: number, delayMax?: number): MotionSection;
  waitUntilFinished(minDelay?: number, maxDelay?: number): MotionSection;
  playIf(condition: boolean | (() => boolean)): MotionSection;
  forUsers(users: any): MotionSection;
  async(): MotionSection;

  // Root Sequence chaining extensions
  effect(file?: string | Function): EffectSection;
  motion(target?: any): MotionSection;
  animation(target?: any): AnimationSection;
  sound(file?: string): SoundSection;
  wait(duration?: number): SequenceBuilder;
  thenDo(callback: () => void | Promise<void>): SequenceBuilder;
  canvasPan(options?: any): SequenceBuilder;
  shake(options?: any): SequenceBuilder;
  play(options?: { preload?: boolean; local?: boolean; remote?: boolean }): Promise<void>;
  addSequence(sequence: any): SequenceBuilder;
  [key: string]: any;
}

export interface EffectLocationOptions {
  offset?: { x?: number; y?: number };
  randomOffset?: number;
  gridUnits?: boolean;
  local?: boolean;
  cacheLocation?: boolean;
  ignoreMotion?: boolean;
  [key: string]: any;
}

export interface EffectAttachToOptions {
  align?: string;
  edge?: string;
  offset?: { x?: number; y?: number };
  randomOffset?: number;
  gridUnits?: boolean;
  local?: boolean;
  followRotation?: boolean;
  bindVisibility?: boolean;
  bindAlpha?: boolean;
  bindElevation?: boolean;
  bindRotation?: boolean;
  ignoreMotion?: boolean;
  [key: string]: any;
}

export interface EffectTargetOptions {
  attachTo?: boolean;
  onlyX?: boolean;
  tiling?: boolean;
  offset?: { x?: number; y?: number };
  randomOffset?: number;
  gridUnits?: boolean;
  local?: boolean;
  cacheLocation?: boolean;
  ignoreMotion?: boolean;
  [key: string]: any;
}

export interface EffectSection {
  file(file: string | Function): EffectSection;
  name(name: string): EffectSection;
  atLocation(location: any, options?: EffectLocationOptions): EffectSection;
  attachTo(target: any, options?: EffectAttachToOptions): EffectSection;
  stretchTo(target: any, options?: EffectTargetOptions): EffectSection;
  scale(scale: number | { x?: number; y?: number }): EffectSection;
  scaleToObject(scale?: number, options?: any): EffectSection;
  size(size: number | { width?: number; height?: number }, options?: any): EffectSection;
  opacity(opacity: number): EffectSection;
  fadeIn(duration: number, options?: any): EffectSection;
  fadeOut(duration: number, options?: any): EffectSection;
  scaleIn(scale: number, duration: number, options?: any): EffectSection;
  scaleOut(scale: number, duration: number, options?: any): EffectSection;
  rotate(angle: number): EffectSection;
  rotateIn(angle: number, duration: number, options?: any): EffectSection;
  rotateOut(angle: number, duration: number, options?: any): EffectSection;
  rotateTowards(target: any, options?: EffectTargetOptions): EffectSection;
  randomRotation(): EffectSection;
  randomizeMirrorX(): EffectSection;
  mirrorX(mirror?: boolean): EffectSection;
  mirrorY(mirror?: boolean): EffectSection;
  duration(duration: number): EffectSection;
  delay(delay: number | [number, number], maxDelay?: number): EffectSection;
  startTime(time: number): EffectSection;
  endTime(time: number): EffectSection;
  playbackRate(rate: number): EffectSection;
  repeats(count: number, delayMin?: number, delayMax?: number): EffectSection;
  filter(filterType: string, options?: any): EffectSection;
  mask(target?: any): EffectSection;
  tint(color: string | number): EffectSection;
  belowTokens(below?: boolean): EffectSection;
  aboveLighting(above?: boolean): EffectSection;
  elevation(elevation: number, options?: any): EffectSection;
  forUsers(users: any): EffectSection;
  locally(locally?: boolean): EffectSection;
  zIndex(index: number): EffectSection;
  persist(persist?: boolean, options?: any): EffectSection;
  tieToDocuments(documents: any | any[]): EffectSection;
  private(isPrivate?: boolean): EffectSection;
  waitUntilFinished(delay?: number): EffectSection;
  copySprite(target: any): EffectSection;
  shape(type: string, options?: any): EffectSection;
  text(text: string, options?: any): EffectSection;
  loopProperty(category: string, property: string, options?: any): EffectSection;
  animateProperty(category: string, property: string, options?: any): EffectSection;
  spriteOffset(offset: { x?: number; y?: number }, options?: any): EffectSection;
  spriteAnchor(anchor: { x?: number; y?: number }): EffectSection;
  spriteRotation(angle: number): EffectSection;
  spriteScale(scale: number | { x?: number; y?: number }, options?: any): EffectSection;
  extraEndDuration(duration: number): EffectSection;
  setMustache(mustacheObj: Record<string, any>): EffectSection;
  moveTowards(target: any, options?: any): EffectSection;
  moveSpeed(speed: number): EffectSection;
  anchor(anchor: { x?: number; y?: number }): EffectSection;
  center(): EffectSection;

  // Root Sequence chaining extensions
  effect(file?: string | Function): EffectSection;
  motion(target?: any): MotionSection;
  animation(target?: any): AnimationSection;
  sound(file?: string): SoundSection;
  wait(duration?: number): SequenceBuilder;
  thenDo(callback: () => void | Promise<void>): SequenceBuilder;
  canvasPan(options?: any): SequenceBuilder;
  shake(options?: any): SequenceBuilder;
  play(options?: { preload?: boolean; local?: boolean; remote?: boolean }): Promise<void>;
  addSequence(sequence: any): SequenceBuilder;
  [key: string]: any;
}

export interface AnimationSection {
  on(target: any): AnimationSection;
  teleportTo(location: any, options?: any): AnimationSection;
  moveTowards(location: any, options?: any): AnimationSection;
  snapToGrid(snap?: boolean): AnimationSection;
  offset(offset: { x?: number; y?: number }): AnimationSection;
  opacity(opacity: number): AnimationSection;
  rotate(angle: number): AnimationSection;
  tint(color: string | number): AnimationSection;
  fadeIn(duration: number, options?: any): AnimationSection;
  fadeOut(duration: number, options?: any): AnimationSection;
  duration(duration: number): AnimationSection;
  waitUntilFinished(delay?: number): AnimationSection;
  show(show?: boolean): AnimationSection;
  hide(hide?: boolean): AnimationSection;
  delay(delay: number): AnimationSection;

  // Root Sequence chaining extensions
  effect(file?: string | Function): EffectSection;
  motion(target?: any): MotionSection;
  animation(target?: any): AnimationSection;
  sound(file?: string): SoundSection;
  wait(duration?: number): SequenceBuilder;
  thenDo(callback: () => void | Promise<void>): SequenceBuilder;
  canvasPan(options?: any): SequenceBuilder;
  shake(options?: any): SequenceBuilder;
  play(options?: { preload?: boolean; local?: boolean; remote?: boolean }): Promise<void>;
  addSequence(sequence: any): SequenceBuilder;
  [key: string]: any;
}

export interface SoundSection {
  file(file: string): SoundSection;
  atLocation(location: any, options?: EffectLocationOptions): SoundSection;
  attachTo(target: any, options?: EffectAttachToOptions): SoundSection;
  toLocation(location: any, options?: EffectLocationOptions): SoundSection;
  tieToDocuments(documents: any | any[]): SoundSection;
  volume(vol: number): SoundSection;
  fadeInAudio(duration: number): SoundSection;
  fadeOutAudio(duration: number): SoundSection;
  delay(delay: number): SoundSection;
  startTime(time: number): SoundSection;
  endTime(time: number): SoundSection;
  duration(duration: number): SoundSection;
  repeats(count: number, delayMin?: number, delayMax?: number): SoundSection;
  forUsers(users: any): SoundSection;
  locally(locally?: boolean): SoundSection;

  // Root Sequence chaining extensions
  effect(file?: string | Function): EffectSection;
  motion(target?: any): MotionSection;
  animation(target?: any): AnimationSection;
  sound(file?: string): SoundSection;
  wait(duration?: number): SequenceBuilder;
  thenDo(callback: () => void | Promise<void>): SequenceBuilder;
  canvasPan(options?: any): SequenceBuilder;
  shake(options?: any): SequenceBuilder;
  play(options?: { preload?: boolean; local?: boolean; remote?: boolean }): Promise<void>;
  addSequence(sequence: any): SequenceBuilder;
  [key: string]: any;
}

export interface SequenceBuilder {
  effect(file?: string | Function): EffectSection;
  motion(target?: any): MotionSection;
  animation(target?: any): AnimationSection;
  sound(file?: string): SoundSection;
  wait(duration?: number): SequenceBuilder;
  thenDo(callback: () => void | Promise<void>): SequenceBuilder;
  canvasPan(options?: any): SequenceBuilder;
  shake(options?: any): SequenceBuilder;
  preset(name: string, ...args: any[]): SequenceBuilder;
  addSequence(sequence: any): SequenceBuilder;
  play(options?: { preload?: boolean; local?: boolean; remote?: boolean }): Promise<void>;
  [key: string]: any;
}

export interface SequenceConstructor {
  new (moduleName?: string): SequenceBuilder;
}
