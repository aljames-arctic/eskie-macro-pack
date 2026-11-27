import { closest } from '../../lib/filemanager.js';
import { teleport } from '../utils/teleport.js';
import { adapter } from '../../adapters/index.js';
import { resolveMotionTarget } from '../utils/motion.js';

interface AttackAttackPoint {
    x: number;
    y: number;
}

export interface AttackAttackPositions {
    b1: AttackAttackPoint;
    b2: AttackAttackPoint;
    b3: AttackAttackPoint;
    b4: AttackAttackPoint;
    r1: AttackAttackPoint;
    r2: AttackAttackPoint;
    r3: AttackAttackPoint;
    r4: AttackAttackPoint;
}

export interface AttackAttackConfig {
    zoom?: number;
    positions?: AttackAttackPositions;
}

const DEFAULT_CONFIG: Required<Pick<AttackAttackConfig, 'zoom'>> = {
    zoom: 1.8,
};

async function validate(red: Token, blue: Token): Promise<boolean> {
    async function wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    if (!adapter.isDocumentOfType(red, 'Token') || !adapter.isDocumentOfType(blue, 'Token') || (red.id === blue.id)) {
        ui.notifications.warn('Must provide two valid tokens to fight each other!');
        throw 'Must provide two valid tokens to fight each other!';
    }

    const gridSize = adapter.getGridSize();
    const xDistanceValid = Math.abs((blue.x - red.x) / gridSize) === 9;
    const yDistanceValid = (blue.y - red.y) / gridSize === 0;
    const requireInitialTeleport = (!xDistanceValid || !yDistanceValid);

    if (requireInitialTeleport) {
        const config = {
            t: "circle",
            distance: 25,
            borderAlpha: 0,
            fillAlpha: 0.1,
            icon: { texture: "icons/skills/melee/swords-parry-block-blue.webp" },
            snap: {
                position: CONST.GRID_SNAPPING_MODES.VERTEX | CONST.GRID_SNAPPING_MODES.CENTER,
            }
        };
        const centerPoint = await Sequencer.Crosshair.show(config);
        if (!centerPoint || centerPoint.cancelled) return false;
        await teleport.play(red, { x: centerPoint.x + gridSize * 4.5, y: centerPoint.y });
        await teleport.play(blue, { x: centerPoint.x - gridSize * 4.5, y: centerPoint.y });
        // then wait 100ms so Foundry updates the token locations
        await wait(100);
    }

    return true;
}

async function play(token1: Token, token2: Token, config: AttackAttackConfig = {}): Promise<void> {
    const red = token1;
    const blue = token2;
    // move them into appropriate positions
    const isValid = await validate(red, blue);
    if (!isValid) return;

    // Blue is always on the left side in our setup
    if (blue.x > red.x) return play(blue, red, config);
    const positions = getPositions(red, blue);
    const seq = create(red, blue, { ...config, positions });
    if (seq) return seq.play({ preload: true });
}

function create(red: Token, blue: Token, config: AttackAttackConfig = {}): Sequence {
    const mConfig = adapter.mergeObject(DEFAULT_CONFIG, config) as Required<Pick<AttackAttackConfig, 'zoom'>> & AttackAttackConfig;
    const resolvedConfig = {
        ...mConfig,
        positions: mConfig.positions ?? getPositions(red, blue),
    };

    const seq = new Sequence();
    seq.addSequence(movement1create(red, blue, resolvedConfig));
    seq.addSequence(movement2create(red, blue, resolvedConfig));
    seq.addSequence(movement3create(red, blue, resolvedConfig));
    return seq;
}

async function stop(red?: Token, blue?: Token): Promise<void> {
    const motionRed = resolveMotionTarget(red);
    const motionBlue = resolveMotionTarget(blue);
    if (motionRed) {
        Sequencer.MotionManager.endMotions(motionRed, { name: "gob" });
        Sequencer.MotionManager.endMotions(motionRed, { name: "gob-lock" });
    }
    if (motionBlue) {
        Sequencer.MotionManager.endMotions(motionBlue, { name: "gob" });
        Sequencer.MotionManager.endMotions(motionBlue, { name: "gob-lock" });
    }
    await Sequencer.EffectManager.endEffects({ name: "gob" });
    await Sequencer.EffectManager.endEffects({ name: "Trail" });
}

function getPositions(red: Token, blue: Token): AttackAttackPositions {
    // Original layout per Eskie -- interpolated for ease of use
    // https://discord.com/channels/813354083061989438/1448383476457013349/1448383505406099538
    /***********************************************************
     *                        r4   r2   r3             r1
     *  | 00 | 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 |
     *    b1             b3   b2   b4
     ***********************************************************/
    function interpolatePos(r: Token, b: Token, t: number, count: number): AttackAttackPoint {
        const redCenter = adapter.getCenter(r);
        const blueCenter = adapter.getCenter(b);
        const x = blueCenter.x + (redCenter.x - blueCenter.x) * t / count;
        const y = blueCenter.y + (redCenter.y - blueCenter.y) * t / count;
        return { x, y };
    }

    return {
        b1: interpolatePos(red, blue, 0, 9),
        b2: interpolatePos(red, blue, 4, 9),
        b3: interpolatePos(red, blue, 3, 9),
        b4: interpolatePos(red, blue, 5, 9),

        r1: interpolatePos(red, blue, 9, 9),
        r2: interpolatePos(red, blue, 5, 9),
        r3: interpolatePos(red, blue, 6, 9),
        r4: interpolatePos(red, blue, 4, 9),
    };
}

function midpoint(a: AttackAttackPoint, b: AttackAttackPoint): AttackAttackPoint {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function getVisualTokenRotation(token: Token): number {
    return token.document.lockRotation ? 0 : adapter.getTokenRotation(token);
}

function movement1create(
    red: Token,
    blue: Token,
    config: Required<Pick<AttackAttackConfig, 'zoom'>> & { positions: AttackAttackPositions }
): Sequence {
    const { b1, b2, b3, r1, r2, r3 } = config.positions;
    const gridSize = adapter.getGridSize();
    const motionBlue = resolveMotionTarget(blue);
    const motionRed = resolveMotionTarget(red);

    const blueCharge = { x: b2.x - b1.x, y: b2.y - b1.y };
    const blueRecoil = { x: b3.x - b2.x, y: b3.y - b2.y };
    const redCharge = { x: r2.x - r1.x, y: r2.y - r1.y };
    const redRecoil = { x: r3.x - r2.x, y: r3.y - r2.y };
    const hasBlueTravel = Math.hypot(b3.x - b1.x, b3.y - b1.y) >= 1;
    const hasRedTravel = Math.hypot(r3.x - r1.x, r3.y - r1.y) >= 1;

    const seq = new Sequence();

    if (motionBlue) {
        const blueChargeMotion = seq.motion(motionBlue)
            .name("gob")
            .moveBy(blueCharge, { delay: 1000, duration: 500, ease: "easeOutQuint", return: false });
        if (hasBlueTravel) blueChargeMotion.persistUntilUpdate();

        seq.motion(motionBlue)
            .name("gob-lock")
            .oscillate({
                period: 100,
                waveform: "sine",
                delay: 1500,
                x: { amplitude: 0.025 * gridSize, phase: 0 },
            })
            .persist();
    }

    if (motionRed) {
        const redChargeMotion = seq.motion(motionRed)
            .name("gob")
            .moveBy(redCharge, { delay: 1000, duration: 500, ease: "easeOutQuint", return: false });
        if (hasRedTravel) redChargeMotion.persistUntilUpdate();

        seq.motion(motionRed)
            .name("gob-lock")
            .oscillate({
                period: 100,
                waveform: "sine",
                delay: 1500,
                x: { amplitude: 0.025 * gridSize, phase: Math.PI },
            })
            .persist();
    }

    seq
        .wait(750)

        .effect()
            .name("Trail")
            .file(closest("eskie.trail.token.generic.02.blue"))
            .atLocation(blue, { ignoreMotion: true })
            .scaleToObject(1.5)
            .spriteOffset({ x: -0.75 }, { gridUnits: true })
            .moveTowards(b2, { delay: 200, ease: "easeOutQuint", rotate: false })
            .belowTokens()
            .persist()

        .effect()
            .name("Trail")
            .file(closest("eskie.trail.token.generic.02.red"))
            .atLocation(red, { ignoreMotion: true })
            .scaleToObject(1.5)
            .spriteOffset({ x: 0.75 }, { gridUnits: true })
            .moveTowards(r2, { delay: 200, ease: "easeOutQuint", rotate: false })
            .belowTokens()
            .mirrorX()
            .persist()

        .wait(400)

        .canvasPan()
            .atLocation(midpoint(r1, b1))
            .scale(config.zoom * 0.8)

        .effect()
            .file(closest("eskie.attack.melee.generic.01.slashing.medium.blue.fast.03"))
            .atLocation(b2, { offset: { x: -0.05 }, gridUnits: true })
            .size(2.25, { gridUnits: true })
            .spriteOffset({ x: -0.25 }, { gridUnits: true })
            .zIndex(2)
            .playbackRate(2)

        .effect()
            .file(closest("eskie.attack.melee.generic.01.slashing.medium.red.fast.03"))
            .atLocation(r2, { offset: { x: 0.05 }, gridUnits: true })
            .size(2.25, { gridUnits: true })
            .spriteOffset({ x: 0.25 }, { gridUnits: true })
            .mirrorX()
            .zIndex(2)
            .playbackRate(2)

        .effect()
            .file(closest("eskie.particle.05.orange"))
            .atLocation(b2, { offset: { x: 0.5 }, gridUnits: true })
            .size(4, { gridUnits: true })
            .zIndex(1)
            .randomRotation()

        .effect()
            .name("gob")
            .delay(150)
            .file(closest("eskie.particle.07.orange"))
            .attachTo(r2, { bindAlpha: false })
            .scaleToObject(1.5)
            .spriteOffset({ x: 0.2, y: -0.15 }, { gridUnits: true })
            .persist()
            .zIndex(1)
            .mirrorX()

        .effect()
            .name("gob")
            .delay(150)
            .file(closest("eskie.particle.07.orange"))
            .attachTo(b2, { bindAlpha: false })
            .scaleToObject(1.5)
            .spriteOffset({ x: -0.2, y: -0.15 }, { gridUnits: true })
            .persist()
            .zIndex(1)

        .effect()
            .delay(150)
            .file(closest("eskie.smoke.03.white"))
            .atLocation(b2, { offset: { x: 0.5 }, gridUnits: true })
            .size(4, { gridUnits: true })
            .belowTokens()
            .playbackRate(2)
            .opacity(0.1)

        .effect()
            .name("gob")
            .delay(150)
            .file(closest("eskie.particle.08.orange"))
            .atLocation(b2, { offset: { x: 0.5 }, gridUnits: true })
            .size(2, { gridUnits: true })
            .zIndex(2)
            .persist()

        .effect()
            .name("Movement 1 End")
            .delay(150)
            .file(closest("eskie.particle.08.orange"))
            .atLocation(b2, { offset: { x: 0.5 }, gridUnits: true })
            .size(2, { gridUnits: true })
            .zIndex(2)
            .opacity(0)
            .duration(5000)
            .waitUntilFinished()

        .thenDo(() => {
            Sequencer.EffectManager.endEffects({ name: "Trail" });
        })

        .wait(750)

        .canvasPan()
            .atLocation(midpoint(r3, b3))
            .scale(config.zoom)

        .effect()
            .file(closest("eskie.particle.05.orange"))
            .atLocation(b2, { offset: { x: 0.5 }, gridUnits: true })
            .size(6, { gridUnits: true })
            .zIndex(1)
            .randomRotation()

        .thenDo(() => {
            Sequencer.EffectManager.endEffects({ name: "gob" });
            if (motionBlue) Sequencer.MotionManager.endMotions(motionBlue, { name: "gob-lock", settle: 0 });
            if (motionRed) Sequencer.MotionManager.endMotions(motionRed, { name: "gob-lock", settle: 0 });
        });

    if (motionBlue) {
        const blueRecoilMotion = seq.motion(motionBlue)
            .name("gob")
            .moveBy(blueRecoil, { duration: 250, ease: "easeOutCubic", return: false });
        if (hasBlueTravel) blueRecoilMotion.persistUntilUpdate();
    }

    if (motionRed) {
        const redRecoilMotion = seq.motion(motionRed)
            .name("gob")
            .moveBy(redRecoil, { duration: 250, ease: "easeOutCubic", return: false });
        if (hasRedTravel) redRecoilMotion.persistUntilUpdate();
    }

    seq
        .effect()
            .delay(100)
            .file(closest("eskie.smoke.01.white"))
            .atLocation(b3, { offset: { x: -0.35 }, gridUnits: true })
            .size(2, { gridUnits: true })
            .zIndex(1)
            .mirrorX()
            .opacity(0.1)
            .belowTokens()

        .effect()
            .delay(100)
            .file(closest("eskie.smoke.01.white"))
            .atLocation(r3, { offset: { x: 0.35 }, gridUnits: true })
            .size(2, { gridUnits: true })
            .zIndex(1)
            .opacity(0.1)
            .belowTokens()

        .wait(250);

    if (hasBlueTravel) {
        const blueCommit = seq.animation()
            .on(blue)
            .teleportTo(b3, { relativeToCenter: true });
        if (!hasRedTravel) blueCommit.waitUntilFinished();
    }

    if (hasRedTravel) {
        seq.animation()
            .on(red)
            .teleportTo(r3, { relativeToCenter: true })
            .waitUntilFinished();
    }

    return seq;
}

function movement2create(
    red: Token,
    blue: Token,
    config: Required<Pick<AttackAttackConfig, 'zoom'>> & { positions: AttackAttackPositions }
): Sequence {
    const { b3, b4, r1, r3 } = config.positions;
    const motionBlue = resolveMotionTarget(blue);
    const motionRed = resolveMotionTarget(red);
    const hasBlueTravel = Math.hypot(b4.x - b3.x, b4.y - b3.y) >= 1;
    const hasRedTravel = Math.hypot(r1.x - r3.x, r1.y - r3.y) >= 1;

    const seq = new Sequence()
        .wait(750)

        .effect()
            .delay(1000)
            .file(closest("eskie.trail.token.generic.02.blue"))
            .atLocation(blue, { ignoreMotion: true })
            .scaleToObject(1.5)
            .spriteOffset({ x: -0.75 }, { gridUnits: true })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 2, duration: 500, gridUnits: true, ease: "easeOutQuint" })
            .playbackRate(0.5)
            .startTime(750);

    if (motionBlue) {
        const blueMotion = seq.motion(motionBlue)
            .name("gob")
            .moveBy([
                { v: { x: 0, y: 0 } },
                // charge b3 -> b4 (+2)
                { v: { x: 2, y: 0 }, duration: 500, inEase: "easeOutQuint", hold: 500 },
                // 1st attack
                { v: { x: 2.2, y: 0 }, duration: 250, inEase: "easeOutCubic" },
                { v: { x: 2, y: 0 }, duration: 250, inEase: "easeOutSine" },
                // 2nd defend
                { v: { x: 1.25, y: 0 }, duration: 250, inEase: "easeOutCubic" },
                { v: { x: 2, y: 0 }, duration: 250, inEase: "easeOutSine" },
                // 3rd defend
                { v: { x: 1.25, y: 0 }, duration: 250, inEase: "easeOutCubic", hold: 500 },
                { v: { x: 2, y: 0 }, duration: 250, inEase: "easeOutSine" },
                // 4th attack
                { v: { x: 1.9, y: 0 }, duration: 250, inEase: "easeOutCubic", hold: 500 },
                { v: { x: 2, y: 0 }, duration: 250, inEase: "easeOutSine" },
            ], { delay: 1000, gridUnits: true, return: false });
        if (hasBlueTravel) blueMotion.persistUntilUpdate();
    }

    if (motionRed) {
        const redMotion = seq.motion(motionRed)
            .name("gob")
            .moveBy([
                { v: { x: 0, y: 0 } },
                // 1st defend
                { v: { x: 0.75, y: 0 }, duration: 250, inEase: "easeOutCubic" },
                { v: { x: 0, y: 0 }, duration: 250, inEase: "easeOutSine" },
                // 2nd attack
                { v: { x: -0.2, y: 0 }, duration: 250, inEase: "easeOutCubic" },
                { v: { x: 0, y: 0 }, duration: 250, inEase: "easeOutSine" },
                // 3rd attack
                { v: { x: -0.2, y: 0 }, duration: 250, inEase: "easeOutCubic", hold: 500 },
                { v: { x: 0, y: 0 }, duration: 250, inEase: "easeOutSine" },
                // 4th defend + knockback r3 -> r1 (+3)
                { v: { x: 0.75, y: 0 }, duration: 250, inEase: "easeOutCubic", hold: 500 },
                { v: { x: 3, y: 0 }, duration: 1000, inEase: "easeOutQuint" },
            ], { delay: 2000, gridUnits: true, return: false });
        if (hasRedTravel) redMotion.persistUntilUpdate();
    }

    seq
        // FIRST ATTACK
        .effect()
            .delay(2000)
            .name("effect")
            .atLocation(b4)
            .file(closest("eskie.attack.melee.generic.01.slashing.medium.blue.normal.01"))
            .rotateTowards(r3, { randomOffset: 0 })
            .scaleToObject(2.25)
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .zIndex(2)

        .effect()
            .delay(2000)
            .name("effect")
            .atLocation(r3)
            .file(closest("eskie.attack.melee.generic.01.slashing.light.red.normal.01"))
            .rotateTowards(b4, { randomOffset: 0 })
            .scaleToObject(2)
            .spriteOffset({ x: -1.5 }, { gridUnits: true })
            .zIndex(0)

        .effect()
            .delay(2050)
            .file(closest("eskie.particle.06.orange"))
            .atLocation(b4)
            .size(2, { gridUnits: true })
            .spriteOffset({ x: 1 }, { gridUnits: true })
            .spriteRotation(90)

        // SECOND ATTACK
        .effect()
            .delay(2500)
            .name("effect")
            .atLocation(r3)
            .file(closest("eskie.attack.melee.generic.01.slashing.medium.red.normal.02"))
            .rotateTowards(b4, { randomOffset: 0 })
            .scaleToObject(2.25)
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .zIndex(2)

        .effect()
            .delay(2500)
            .name("effect")
            .atLocation(b4)
            .file(closest("eskie.attack.melee.generic.01.slashing.light.blue.normal.03"))
            .rotateTowards(r3, { randomOffset: 0 })
            .scaleToObject(2)
            .spriteOffset({ x: -1.5 }, { gridUnits: true })
            .zIndex(0)

        .effect()
            .delay(2550)
            .file(closest("eskie.particle.05.orange"))
            .atLocation(r3)
            .size(2, { gridUnits: true })
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .spriteRotation(180)

        // THIRD ATTACK
        .effect()
            .delay(3000)
            .name("effect")
            .atLocation(r3)
            .file(closest("eskie.attack.melee.generic.01.slashing.light.red.fast.03"))
            .rotateTowards(b4, { randomOffset: 0 })
            .scaleToObject(2)
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .zIndex(2)

        .effect()
            .delay(3000)
            .name("effect")
            .atLocation(r3)
            .file(closest("eskie.attack.melee.generic.01.slashing.light.red.fast.03"))
            .rotateTowards(b4, { randomOffset: 0 })
            .scaleToObject(2)
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .zIndex(2)
            .mirrorY()

        .effect()
            .delay(3000)
            .name("effect")
            .atLocation(b4)
            .file(closest("eskie.attack.melee.generic.01.slashing.light.blue.slow.01"))
            .rotateTowards(r3, { randomOffset: 0 })
            .scaleToObject(2)
            .spriteOffset({ x: -1.5 }, { gridUnits: true })
            .rotateIn(180, 150, { ease: "easeOutCubic" })
            .mirrorY()
            .zIndex(0)

        .effect()
            .delay(3050)
            .file(closest("eskie.particle.05.orange"))
            .atLocation(r3)
            .size(1, { gridUnits: true })
            .spriteOffset({ x: -0.8, y: 0.1 }, { gridUnits: true })
            .spriteRotation(90)

        // FOURTH ATTACK
        .effect()
            .delay(4000)
            .name("effect")
            .atLocation(b4)
            .file(closest("eskie.attack.melee.generic.01.slashing.heavy.blue.slow.03"))
            .rotateTowards(r3, { randomOffset: 0 })
            .scaleToObject(2.75)
            .spriteOffset({ x: -1.55 }, { gridUnits: true })
            .zIndex(2)

        .effect()
            .delay(4000)
            .name("effect")
            .atLocation(r3)
            .file(closest("eskie.attack.melee.generic.01.slashing.light.red.slow.02"))
            .rotateTowards(b4, { randomOffset: 0 })
            .scaleToObject(2)
            .spriteOffset({ x: -1.75 }, { gridUnits: true })
            .mirrorY()
            .zIndex(0)

        .effect()
            .delay(4050)
            .file(closest("eskie.particle.07.orange"))
            .atLocation(r3)
            .size(2, { gridUnits: true })
            .spriteOffset({ x: 0.75, y: 0 }, { gridUnits: true })
            .mirrorX()
            .zIndex(3)

        // Translucent hit-shudder afterimage tracks Red's live .motion() knockback
        .effect()
            .delay(4050)
            .copySprite(red)
            .attachTo(red, { bindAlpha: false, bindRotation: false })
            .rotate(0)
            .spriteRotation(getVisualTokenRotation(red))
            .scaleToObject(1, { considerTokenScale: true })
            .fadeIn(250)
            .fadeOut(250)
            .loopProperty('spriteContainer', 'position.x', { from: -0.05, to: 0.05, duration: 50, pingPong: true, gridUnits: true })
            .duration(1250)
            .opacity(0.25)

        .effect()
            .delay(5500)
            .file(closest("eskie.smoke.01.white"))
            .atLocation(r1, { offset: { x: 0.35 }, gridUnits: true })
            .size(2, { gridUnits: true })
            .zIndex(1)
            .opacity(0.1)
            .belowTokens()

        .wait(4600);

    const bg = adapter.getSceneBackground(canvas.scene);
    if (bg?.src) {
        const sceneCenter = adapter.getSceneCenter(canvas.scene);
        const sceneDims = adapter.getSceneDimensions(canvas.scene);
        seq.effect()
            .file(closest(bg.src))
            .atLocation(sceneCenter)
            .size({ width: (sceneDims.sceneRect.width / sceneDims.size) + 10, height: sceneDims.sceneRect.height / sceneDims.size }, { gridUnits: true })
            .fadeOut(1000, { ease: "easeInQuint" })
            .belowTiles()
            .spriteOffset({ x: -bg.offsetX, y: -bg.offsetY })
            .filter("Blur", { blurX: 10, blurY: 5 })
            .opacity(0.75)
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -5, duration: 1000, gridUnits: true, ease: "easeOutQuint" });
    }

    seq
        .canvasPan()
            .atLocation(midpoint(r1, b4))
            .scale(config.zoom * 1.4)

        .wait(1350);

    if (hasBlueTravel) {
        const blueCommit = seq.animation()
            .delay(100)
            .on(blue)
            .teleportTo(b4, { relativeToCenter: true });
        if (!hasRedTravel) blueCommit.waitUntilFinished();
    }

    if (hasRedTravel) {
        seq.animation()
            .delay(100)
            .on(red)
            .teleportTo(r1, { relativeToCenter: true })
            .waitUntilFinished();
    }

    seq.wait(250);

    return seq;
}

function movement3create(
    red: Token,
    blue: Token,
    config: Required<Pick<AttackAttackConfig, 'zoom'>> & { positions: AttackAttackPositions }
): Sequence {
    const { b1, b3, b4, r1, r3, r4 } = config.positions;
    const motionBlue = resolveMotionTarget(blue);
    const motionRed = resolveMotionTarget(red);
    const hasBlueTravel = Math.hypot(b1.x - b4.x, b1.y - b4.y) >= 1;

    const seq = new Sequence()
        .effect()
            .delay(1000)
            .file(closest("eskie.trail.token.generic.02.red"))
            .atLocation(red, { ignoreMotion: true })
            .scaleToObject(1.5)
            .spriteOffset({ x: 0.75 }, { gridUnits: true })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -3, duration: 500, gridUnits: true, ease: "easeOutQuint" })
            .playbackRate(0.5)
            .mirrorX()
            .startTime(750)

        // SHADOWS (PIXI ColorMatrix + Blur remain grounded on the floor plane)
        .effect()
            .name("gob")
            .copySprite(red)
            .atLocation(red, { ignoreMotion: true })
            .rotate(0)
            .spriteRotation(getVisualTokenRotation(red))
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -3, duration: 500, delay: 1000, gridUnits: true, ease: "easeOutQuint" })
            // 1st attack
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.2, duration: 250, delay: 2000, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 0.2, duration: 250, delay: 2250, gridUnits: true, ease: "easeOutSine" })
            // 2nd attack
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.2, duration: 250, delay: 2500, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 0.2, duration: 250, delay: 2750, gridUnits: true, ease: "easeOutSine" })
            // 3rd attack
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -1.5, duration: 500, delay: 3500, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.5, duration: 250, delay: 4000, gridUnits: true, ease: "easeOutSine" })
            // 4th defend
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 0.5, duration: 250, delay: 4500, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.5, duration: 250, delay: 5500, gridUnits: true, ease: "easeOutCubic" })
            // 5th defend
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 5, duration: 500, delay: 6250, gridUnits: true, ease: "easeInQuint" })
            .persist()
            .filter("ColorMatrix", { brightness: 0 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .opacity(0.5)
            .scaleToObject(0.8, { considerTokenScale: true })
            .belowTokens()

        .effect()
            .name("gob")
            .copySprite(blue)
            .atLocation(blue, { ignoreMotion: true })
            .rotate(0)
            .spriteRotation(getVisualTokenRotation(blue))
            // 1st defend
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: 0.75, duration: 250, delay: 2000, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty('spriteContainer', 'position.y', { from: 0, to: -0.75, duration: 250, delay: 2250, gridUnits: true, ease: "easeOutSine" })
            // 2nd defend
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.75, duration: 250, delay: 2500, gridUnits: true, ease: "easeOutCubic" })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -1.25, duration: 250, delay: 3250, gridUnits: true, ease: "easeOutQuint" })
            // 3rd defend
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.5, duration: 250, delay: 4000, gridUnits: true, ease: "easeOutCubic" })
            // 4th attack
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -1.5, duration: 500, delay: 5250, gridUnits: true, ease: "easeOutSine" })
            // 5th attack
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -0.25, duration: 250, delay: 5750, gridUnits: true, ease: "easeOutSine" })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: 0.5, duration: 250, delay: 6000, gridUnits: true, ease: "easeOutQuint" })
            .animateProperty('spriteContainer', 'position.x', { from: 0, to: -1.25, duration: 500, delay: 6250, gridUnits: true, ease: "easeOutCubic" })
            .persist()
            .filter("ColorMatrix", { brightness: 0 })
            .filter("Blur", { blurX: 5, blurY: 10 })
            .opacity(0.5)
            .scaleToObject(0.8, { considerTokenScale: true })
            .belowTokens();

    // Red returns to r1 (net displacement 0, -360 deg === 0 deg) — intentionally non-persistent
    if (motionRed) {
        seq.motion(motionRed)
            .name("gob")
            .moveBy([
                { v: { x: 0, y: 0 } },
                // charge r1 -> r3 (-3)
                { v: { x: -3, y: 0 }, duration: 500, inEase: "easeOutQuint", hold: 500 },
                // 1st attack
                { v: { x: -3.2, y: 0 }, duration: 250, inEase: "easeOutCubic" },
                { v: { x: -3, y: 0 }, duration: 250, inEase: "easeOutSine" },
                // 2nd attack
                { v: { x: -3.2, y: 0 }, duration: 250, inEase: "easeOutCubic" },
                { v: { x: -3, y: 0 }, duration: 250, inEase: "easeOutSine", hold: 500 },
                // 3rd attack leap r3 -> r4 (-5)
                { v: { x: -4.5, y: 0 }, duration: 500, inEase: "easeOutCubic" },
                { v: { x: -5, y: 0 }, duration: 250, inEase: "easeOutSine", hold: 250 },
                // 4th defend
                { v: { x: -4.5, y: 0 }, duration: 250, inEase: "easeOutCubic", hold: 750 },
                { v: { x: -5, y: 0 }, duration: 250, inEase: "easeOutCubic", hold: 500 },
                // 5th defend blasted back r4 -> r1 (0)
                { v: { x: 0, y: 0 }, duration: 500, inEase: "easeInQuint" },
            ], { delay: 1000, gridUnits: true, return: false })
            .moveBy([
                { v: { x: 0, y: 0 } },
                { v: { x: 0, y: -0.5 }, duration: 500, inEase: "easeOutCubic" },
                { v: { x: 0, y: 0 }, duration: 250, inEase: "easeOutSine" },
            ], { delay: 3500, gridUnits: true, return: false })
            .rotateBy(-360, { delay: 3650, duration: 500, ease: "easeOutCubic", return: false });
    }

    // Blue travels b4 -> b1 (-5) and commits DB position at t = 7000
    if (motionBlue) {
        const blueMotion = seq.motion(motionBlue)
            .name("gob")
            .moveBy([
                { v: { x: 0, y: 0 } },
                // 2nd defend
                { v: { x: -0.75, y: 0 }, duration: 250, inEase: "easeOutCubic", hold: 500 },
                { v: { x: -2, y: 0 }, duration: 250, inEase: "easeOutQuint", hold: 500 },
                // 3rd defend
                { v: { x: -2.5, y: 0 }, duration: 250, inEase: "easeOutCubic", hold: 1000 },
                // 4th attack
                { v: { x: -4, y: 0 }, duration: 500, inEase: "easeOutSine" },
                // 5th attack
                { v: { x: -4.25, y: 0 }, duration: 250, inEase: "easeOutSine" },
                { v: { x: -3.75, y: 0 }, duration: 250, inEase: "easeOutQuint" },
                { v: { x: -5, y: 0 }, duration: 500, inEase: "easeOutCubic" },
            ], { delay: 2500, gridUnits: true, return: false })
            .moveBy([
                { v: { x: 0, y: 0 } },
                // 1st defend duck
                { v: { x: 0, y: 0.75 }, duration: 250, inEase: "easeOutCubic" },
                { v: { x: 0, y: 0 }, duration: 250, inEase: "easeOutSine", hold: 1500 },
                // 3rd defend aerial flip + 4th attack landing
                { v: { x: 0, y: -0.5 }, duration: 500, inEase: "easeOutCubic", hold: 750 },
                { v: { x: 0, y: 0 }, duration: 250, inEase: "easeInOutSine" },
            ], { delay: 2000, gridUnits: true, return: false })
            .rotateBy(-360, { delay: 4100, duration: 500, ease: "easeOutCubic", return: false });
        if (hasBlueTravel) blueMotion.persistUntilUpdate();
    }

    seq
        // FIRST ATTACK
        .canvasPan()
            .delay(1000)
            .atLocation(r3)
            .scale(config.zoom)

        .effect()
            .delay(2000)
            .name("effect")
            .atLocation(r3)
            .file(closest("eskie.attack.melee.generic.01.bludgeoning.medium.red.normal.03"))
            .rotateTowards(b4, { randomOffset: 0 })
            .scaleToObject(2.25)
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .mirrorY()
            .zIndex(2)

        .effect()
            .delay(2000)
            .name("effect")
            .atLocation(b4)
            .file(closest("eskie.attack.melee.generic.01.slashing.light.blue.normal.01"))
            .rotateTowards(r3, { randomOffset: 0 })
            .scaleToObject(2)
            .spriteOffset({ x: -1.75 }, { gridUnits: true })
            .rotate(90)
            .zIndex(0)

        .effect()
            .delay(2050)
            .file(closest("eskie.particle.06.orange"))
            .atLocation(b4)
            .size(2, { gridUnits: true })
            .spriteOffset({ y: -0.5 }, { gridUnits: true })
            .spriteRotation(90)
            .mirrorY()

        // SECOND ATTACK
        .effect()
            .delay(2500)
            .name("effect")
            .atLocation(r3)
            .file(closest("eskie.attack.melee.generic.01.bludgeoning.heavy.red.slow.01"))
            .rotateTowards(b4, { randomOffset: 0 })
            .scaleToObject(2.25)
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .zIndex(2)

        .effect()
            .delay(2500)
            .name("effect")
            .atLocation(b4)
            .file(closest("eskie.attack.melee.generic.01.slashing.light.blue.slow.02"))
            .rotateTowards(r3, { randomOffset: 0 })
            .scaleToObject(2)
            .spriteOffset({ x: -1.75 }, { gridUnits: true })
            .zIndex(0)

        .effect()
            .delay(2550)
            .file(closest("eskie.particle.07.orange"))
            .atLocation(b4)
            .size(2, { gridUnits: true })
            .spriteOffset({ x: -0.75, y: -0.1 }, { gridUnits: true })
            .zIndex(3)

        .effect()
            .delay(3250)
            .file(closest("eskie.smoke.01.white"))
            .atLocation(b3, { offset: { x: -0.35 }, gridUnits: true })
            .size(2, { gridUnits: true })
            .zIndex(1)
            .mirrorX()
            .opacity(0.1)
            .belowTokens()

        // THIRD ATTACK
        .canvasPan()
            .delay(3250)
            .atLocation(r4)
            .scale(config.zoom)

        .effect()
            .delay(4000)
            .name("effect")
            .atLocation(r4)
            .file(closest("eskie.attack.melee.generic.01.bludgeoning.heavy.red.slow.02"))
            .rotateTowards(b3, { randomOffset: 0 })
            .scaleToObject(2.75)
            .spriteOffset({ x: -1.25 }, { gridUnits: true })
            .mirrorY()
            .zIndex(2)

        .effect()
            .delay(4050)
            .file(closest("eskie.smoke.03.white"))
            .atLocation(b3)
            .size(4, { gridUnits: true })
            .belowTokens()
            .playbackRate(2)
            .spriteRotation(90)
            .opacity(0.1)

        // FOURTH ATTACK
        .canvasPan()
            .delay(4000)
            .atLocation(b3)
            .scale(config.zoom)

        .effect()
            .delay(4500)
            .name("effect")
            .atLocation(b3, { offset: { x: -0.5, y: -0.5 }, gridUnits: true })
            .file(closest("eskie.attack.melee.generic.01.piercing.medium.blue.normal.01"))
            .rotateTowards(r4, { randomOffset: 0 })
            .scaleToObject(2.75)
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .zIndex(3)
            .playbackRate(2)

        .effect()
            .delay(4700)
            .name("effect")
            .atLocation(b3, { offset: { x: -0.5, y: -0.6 }, gridUnits: true })
            .file(closest("eskie.attack.melee.generic.01.piercing.medium.blue.normal.02"))
            .rotateTowards(r4, { randomOffset: 0 })
            .scaleToObject(2.75)
            .spriteOffset({ x: -1, y: -0.15 }, { gridUnits: true })
            .zIndex(3)
            .playbackRate(2)

        .effect()
            .delay(4900)
            .name("effect")
            .atLocation(b3, { offset: { x: -0.5, y: -0.4 }, gridUnits: true })
            .file(closest("eskie.attack.melee.generic.01.piercing.medium.blue.normal.02"))
            .rotateTowards(r4, { randomOffset: 0 })
            .scaleToObject(2.75)
            .spriteOffset({ x: -1, y: 0 }, { gridUnits: true })
            .mirrorY()
            .zIndex(3)
            .playbackRate(2)

        .effect()
            .delay(4500)
            .name("effect")
            .atLocation(r4)
            .file(closest("eskie.attack.melee.generic.01.slashing.light.red.slow.01"))
            .rotateTowards(b3, { offset: { x: -1, y: -0.5 }, randomOffset: 0 })
            .scaleToObject(2)
            .spriteOffset({ x: -1.75 }, { gridUnits: true })
            .zIndex(0)
            .playbackRate(2)

        .effect()
            .delay(4500)
            .file(closest("eskie.particle.05.orange"))
            .atLocation(r4, { randomOffset: 0.15, gridUnits: true })
            .size(1, { gridUnits: true })
            .spriteOffset({ x: -0.1, y: 0 }, { gridUnits: true })
            .randomRotation()
            .repeats(6, 100, 100)

        .effect()
            .delay(5250)
            .file(closest("eskie.smoke.01.white"))
            .atLocation(b1, { offset: { x: 1 }, gridUnits: true })
            .size(2, { gridUnits: true })
            .zIndex(1)
            .mirrorX()
            .opacity(0.1)
            .belowTokens()

        // FIFTH ATTACK
        .canvasPan()
            .delay(5500)
            .atLocation(midpoint(r3, b3))
            .scale(config.zoom)

        .effect()
            .delay(6000)
            .name("effect")
            .atLocation(b1, { offset: { x: 1 }, gridUnits: true })
            .file(closest("eskie.attack.melee.generic.01.piercing.heavy.blue.slow.01"))
            .rotateTowards(r4, { randomOffset: 0 })
            .scaleToObject(3.25)
            .spriteOffset({ x: -1 }, { gridUnits: true })
            .animateProperty('spriteContainer', 'position.x', { from: -0.8, to: 0.8, duration: 500, gridUnits: true, ease: "easeOutCubic" })
            .zIndex(2)

        .effect()
            .delay(6000)
            .name("effect")
            .atLocation(r4)
            .file(closest("eskie.attack.melee.generic.01.bludgeoning.medium.red.fast.01"))
            .rotateTowards(b1, { randomOffset: 0 })
            .scaleToObject(2)
            .spriteOffset({ x: -1.75 }, { gridUnits: true })
            .zIndex(0)
            .playbackRate(1.5)

        .effect()
            .delay(6000)
            .file(closest("eskie.particle.05.orange"))
            .atLocation(r4)
            .size(5, { gridUnits: true })
            .spriteOffset({ x: 0 }, { gridUnits: true })
            .playbackRate(0.75)

        .effect()
            .delay(6500)
            .file(closest("eskie.smoke.01.white"))
            .atLocation(r1, { offset: { x: 0 }, gridUnits: true })
            .size(2, { gridUnits: true })
            .zIndex(1)
            .opacity(0.1)
            .belowTokens()

        .canvasPan()
            .atLocation(midpoint(r1, b1))
            .scale(config.zoom * 1.6);

    if (hasBlueTravel) {
        seq.animation()
            .delay(7000)
            .on(blue)
            .teleportTo(b1, { relativeToCenter: true });
    }

    seq
        .wait(7000)

        .thenDo(() => { Sequencer.EffectManager.endEffects({ name: "gob" }); });

    return seq;
}

export const attackAttack = {
    create,
    play,
    stop,
    default_config: DEFAULT_CONFIG,
};