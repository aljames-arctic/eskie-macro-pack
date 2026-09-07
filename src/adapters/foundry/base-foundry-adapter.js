import { dependency } from '../../lib/dependency.js';
import { massEditAdapter } from '../modules/mass-edit/mass-edit-module-adapter.js';
import { tokenAttacherAdapter } from '../modules/token-attacher/token-attacher-module-adapter.js';
import { log } from '../../lib/logger.js';

/**
 * User permission tiers for ownership priority evaluation.
 * Tier 1: Players (least permissions)
 * Tier 2: Trusted Players
 * Tier 3: GM / Co-GM (most permissions)
 * @type {Readonly<{ PLAYER: 1, TRUSTED: 2, GM: 3 }>}
 */
export const USER_PERMISSION_TIERS = Object.freeze({
    PLAYER: 1,
    TRUSTED: 2,
    GM: 3
});

/**
 * Base abstract class for all Foundry platform adapters in Eskie Macro Pack.
 * Defines strict contracts and encapsulates version-agnostic Application, interaction,
 * permission, placeable lookup, and utility operations.
 */
export class BaseFoundryAdapter {
    /**
     * @param {object|null} [adapter=null] Unified Adapter singleton reference
     */
    constructor(adapter = null) {
        this._adapter = adapter;
    }

    /**
     * Reference to parent unified adapter singleton.
     */
    get adapter() {
        return this._adapter ?? null;
    }

    set adapter(inst) {
        this._adapter = inst;
    }

    /**
     * Access the Mass Edit module adapter via parent adapter navigation, falling back to singleton.
     */
    get massEdit() {
        return this.adapter?.massEdit ?? massEditAdapter;
    }

    /**
     * Access the Token Attacher module adapter via parent adapter navigation, falling back to singleton.
     */
    get tokenAttacher() {
        return this.adapter?.tokenAttacher ?? tokenAttacherAdapter;
    }

    /**
     * The major generation version of Foundry VTT (e.g. 12, 13, 14).
     * @returns {number}
     */
    get generation() {
        const major = parseInt(String(game.release?.generation ?? game.version ?? "").split('.')[0], 10);
        return Number.isNaN(major) ? 12 : major;
    }

    /**
     * The active ContextMenu constructor.
     */
    get ContextMenu() {
        throw new Error('BaseFoundryAdapter.ContextMenu must be implemented by version subclass');
    }

    /**
     * The active KeyboardManager constructor.
     */
    get KeyboardManager() {
        throw new Error('BaseFoundryAdapter.KeyboardManager must be implemented by version subclass');
    }

    /**
     * The active Token placeable constructor.
     */
    get Token() {
        throw new Error('BaseFoundryAdapter.Token must be implemented by version subclass');
    }

    /**
     * The active Tile placeable constructor.
     */
    get Tile() {
        throw new Error('BaseFoundryAdapter.Tile must be implemented by version subclass');
    }

    /**
     * The active ApplicationV2 constructor (introduced in v12 under foundry.applications.api).
     */
    get ApplicationV2() {
        return foundry.applications?.api?.ApplicationV2 ?? class {};
    }

    /**
     * The active HandlebarsApplicationMixin wrapper (introduced in v12 under foundry.applications.api).
     */
    get HandlebarsApplicationMixin() {
        return foundry.applications?.api?.HandlebarsApplicationMixin ?? (Base => Base);
    }

    /**
     * The active DialogV2 constructor (introduced in v12 under foundry.applications.api).
     */
    get DialogV2() {
        return foundry.applications?.api?.DialogV2;
    }

    /**
     * Displays a button-choice dialog using Foundry's native DialogV2.
     * @param {{ buttons: {label: string, value: any}[], title?: string }} buttonData
     * @param {object} [options={}] Extra options forwarded to DialogV2.wait()
     * @returns {Promise<string|false>} The chosen button's value as a string, or false on cancel.
     */
    async buttonDialog(buttonData, options = {}) {
        const dialogCls = this.DialogV2;
        if (!dialogCls?.wait) {
            throw new Error("DialogV2 is not available in the current Foundry environment.");
        }
        const opt = this.mergeObject({ position: { width: 300 } }, options, { inplace: false });
        const buttons = (buttonData.buttons ?? []).map(btn => ({
            label: btn.label,
            action: String(btn.value),
            default: false
        }));

        const result = await dialogCls.wait({
            window: { title: buttonData.title ?? 'Choose an Option' },
            buttons,
            rejectClose: false,
            ...opt
        });

        if (result === null || result === undefined) return false;
        return result;
    }

    /**
     * The active FilePicker constructor / implementation.
     */
    get FilePicker() {
        throw new Error('BaseFoundryAdapter.FilePicker must be implemented by version subclass');
    }

    /**
     * The active TextEditor constructor / implementation.
     */
    get TextEditor() {
        throw new Error('BaseFoundryAdapter.TextEditor must be implemented by version subclass');
    }

    /**
     * Browse a directory using the active FilePicker implementation.
     * @param {string} source Storage source (e.g. 'data', 'public', 'client')
     * @param {string} target Directory target path
     * @param {Object} [options={}] Browse options
     * @returns {Promise<{ target: string, files: string[], dirs: string[] }>}
     */
    async browseDirectory(source, target, options = {}) {
        return this.FilePicker.browse(source, target, options);
    }

    /**
     * Safely resolve a document from UUID synchronously.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Document|null}
     */
    fromUuidSync(uuid, options = {}) {
        throw new Error('BaseFoundryAdapter.fromUuidSync must be implemented by version subclass');
    }

    /**
     * Safely resolve a document from UUID asynchronously.
     * @param {string} uuid Document UUID
     * @param {Object} [options={}] Resolution options
     * @returns {Promise<Document|null>}
     */
    async fromUuid(uuid, options = {}) {
        throw new Error('BaseFoundryAdapter.fromUuid must be implemented by version subclass');
    }

    /**
     * Merge two objects recursively.
     * @param {Object} original Target object
     * @param {Object} [other={}] Source object
     * @param {Object} [options={}] Merge options
     * @returns {Object}
     */
    mergeObject(original, other = {}, options = {}) {
        const mergedOptions = { inplace: false, ...options };
        return foundry.utils.mergeObject(original, other, mergedOptions);
    }

    /**
     * Deep duplicate an object.
     * @param {Object} obj Target object
     * @returns {Object}
     */
    duplicate(obj) {
        return foundry.utils.duplicate(obj);
    }

    /**
     * Deep clone an object.
     * @param {Object} obj Target object
     * @returns {Object}
     */
    deepClone(obj) {
        return foundry.utils.deepClone(obj);
    }

    /**
     * Retrieve a property from an object by dot-separated path.
     * @param {Object} obj Target object
     * @param {string} path Dot path
     * @returns {*}
     */
    getProperty(obj, path) {
        return foundry.utils.getProperty(obj, path);
    }

    /**
     * Set a property on an object by dot-separated path.
     * @param {Object} obj Target object
     * @param {string} path Dot path
     * @param {*} value Property value
     * @returns {boolean}
     */
    setProperty(obj, path, value) {
        return foundry.utils.setProperty(obj, path, value);
    }

    /**
     * Generate a random string identifier.
     * @param {number} [length=16] Length of the identifier
     * @returns {string}
     */
    randomID(length = 16) {
        return foundry.utils.randomID(length);
    }

    /**
     * Test whether an object is empty.
     * @param {Object} obj Target object
     * @returns {boolean}
     */
    isEmpty(obj) {
        return foundry.utils.isEmpty(obj);
    }

    /**
     * Test whether version a is strictly newer than version b.
     * @param {string} a Primary version string
     * @param {string} b Target version string to compare against
     * @returns {boolean}
     */
    isNewerVersion(a, b) {
        return foundry.utils.isNewerVersion(a, b);
    }

    /**
     * Test whether a target object has a property at a specified path.
     * @param {Object} obj Target object
     * @param {string} path Dot-separated property path
     * @returns {boolean}
     */
    hasProperty(obj, path) {
        if (typeof foundry !== 'undefined' && foundry.utils?.hasProperty) {
            return foundry.utils.hasProperty(obj, path);
        }
        return this.getProperty(obj, path) !== undefined;
    }

    /**
     * Slugify a string according to Foundry VTT standards.
     * @param {string} text Target text to slugify
     * @param {Object} [options={}] Slugify options
     * @returns {string} Slugified string
     */
    slugify(text, options = {}) {
        if (typeof foundry !== 'undefined' && foundry.utils?.slugify) {
            return foundry.utils.slugify(text, options);
        }
        const str = String(text ?? '').toLowerCase();
        return str.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    }

    /**
     * Compute the difference between two objects.
     * @param {Object} original Original object
     * @param {Object} other Modified object
     * @param {Object} [options={}] Comparison options
     * @returns {Object} Difference object
     */
    diffObject(original, other, options = {}) {
        if (typeof foundry !== 'undefined' && foundry.utils?.diffObject) {
            return foundry.utils.diffObject(original, other, options);
        }
        return {};
    }

    /**
     * Flatten a nested object structure into dot-separated paths.
     * @param {Object} obj Object to flatten
     * @param {number} [d=0] Current recursion depth
     * @returns {Object} Flattened object
     */
    flattenObject(obj, d = 0) {
        if (typeof foundry !== 'undefined' && foundry.utils?.flattenObject) {
            return foundry.utils.flattenObject(obj, d);
        }
        return { ...obj };
    }

    /**
     * Expand a flattened object with dot-separated keys into a deeply nested structure.
     * @param {Object} obj Flattened object
     * @param {number} [d=0] Current recursion depth
     * @returns {Object} Expanded nested object
     */
    expandObject(obj, d = 0) {
        if (typeof foundry !== 'undefined' && foundry.utils?.expandObject) {
            return foundry.utils.expandObject(obj, d);
        }
        return { ...obj };
    }

    /**
     * Debounce a function call by a specified delay.
     * @param {Function} fn Function to debounce
     * @param {number} delay Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(fn, delay) {
        if (typeof foundry !== 'undefined' && foundry.utils?.debounce) {
            return foundry.utils.debounce(fn, delay);
        }
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    /**
     * Enrich an HTML string with Foundry enrichers, roll data, and document links.
     * @param {string} content HTML string to enrich
     * @param {Object} [options={}] Enrichment options (rollData, secrets, relativeTo, etc.)
     * @returns {Promise<string>}
     */
    async enrichHTML(content, options = {}) {
        if (!content) return '';
        if (this.TextEditor?.enrichHTML) {
            return this.TextEditor.enrichHTML(content, { secrets: false, async: true, ...options });
        }
        return content;
    }

    /* -------------------------------------------- */
    /*  Combat & Token Helpers                      */
    /* -------------------------------------------- */

    /**
     * Retrieve all combatants associated with a token in combat.
     * @param {Combat} combat Target combat encounter
     * @param {string|TokenDocument|Token} token Token ID or Document or Placeable
     * @returns {Combatant[]}
     */
    getCombatantsByToken(combat, token) {
        throw new Error('BaseFoundryAdapter.getCombatantsByToken must be implemented by version subclass');
    }

    /**
     * Retrieve the primary combatant associated with a token in combat.
     * @param {Combat} combat Target combat encounter
     * @param {string|TokenDocument|Token} token Token ID or Document or Placeable
     * @returns {Combatant|null}
     */
    getCombatantByToken(combat, token) {
        return this.getCombatantsByToken(combat, token)[0] ?? null;
    }

    /* -------------------------------------------- */
    /*  User Ownership & Permission Helpers         */
    /* -------------------------------------------- */

    /**
     * User permission tiers for ownership priority evaluation.
     * @type {Readonly<{ PLAYER: 1, TRUSTED: 2, GM: 3 }>}
     */
    get USER_PERMISSION_TIERS() {
        return USER_PERMISSION_TIERS;
    }

    /**
     * Classify a Foundry User into a standard permission tier (1: Player, 2: Trusted Player, 3: GM / Co-GM).
     * @param {User} user Concrete User document
     * @returns {number|null} 1 for Player, 2 for Trusted, 3 for GM, or null if invalid/none
     */
    getUserPermissionTier(user) {
        if (!user) return null;
        if (user.isGM) return USER_PERMISSION_TIERS.GM;

        const userRole = user.role;
        if (userRole === 0) return null;

        const assistantRole = CONST.USER_ROLES.ASSISTANT;
        const trustedRole = CONST.USER_ROLES.TRUSTED;
        const playerRole = CONST.USER_ROLES.PLAYER;

        if (userRole != null && userRole >= assistantRole) {
            return USER_PERMISSION_TIERS.GM;
        }
        if (userRole === trustedRole || Boolean(user.isTrusted)) {
            return USER_PERMISSION_TIERS.TRUSTED;
        }
        if (userRole === playerRole || !user.isTrusted) {
            return USER_PERMISSION_TIERS.PLAYER;
        }
        return null;
    }

    /**
     * Test whether a user possesses an ownership role for a given document (Actor or TokenDocument).
     * @param {User} user Concrete User document
     * @param {Document|null} doc Concrete Document (Actor or TokenDocument)
     * @returns {boolean} True if the user has an ownership role
     */
    isUserDocumentOwner(user, doc) {
        if (!user || !doc) return false;

        // GM / Co-GM always has ownership over all documents in Foundry
        if (this.getUserPermissionTier(user) === USER_PERMISSION_TIERS.GM) {
            return true;
        }

        const ownerLevel = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
        if (doc.testUserPermission) {
            return Boolean(doc.testUserPermission(user, 'OWNER'));
        }
        if (doc.getUserLevel) {
            return doc.getUserLevel(user) >= ownerLevel;
        }
        if (doc.ownership) {
            const level = doc.ownership[user.id] ?? doc.ownership.default ?? 0;
            return level >= ownerLevel;
        }
        return (user.id === game.user?.id || user === game.user) && Boolean(doc.isOwner);
    }

    /**
     * Determine if a user is "in-charge" of a token.
     * A user is in-charge of a token if:
     * 1. The user has an ownership role of the token.
     * 2. There is no other currently connected user with fewer permissions (lower tier) who also has an ownership role of that token.
     *
     * @param {Token|TokenDocument} token Token placeable or TokenDocument
     * @param {User} [user=game.user] Target user to evaluate (defaults to active client user)
     * @returns {boolean} True if the user is in-charge of the token
     */
    isUserInCharge(token, user = game.user) {
        if (!token || !user) return false;

        const tokenDoc = token.document ?? token;
        const actor = token.actor ?? tokenDoc?.actor ?? null;

        const isOwner = (u) => this.isUserDocumentOwner(u, actor) || this.isUserDocumentOwner(u, tokenDoc);

        if (!isOwner(user)) {
            return false;
        }

        const userTier = this.getUserPermissionTier(user);
        if (!userTier) return false;

        // Tier 1 (Player) is the lowest permission tier; if they own it, they are in-charge.
        if (userTier === USER_PERMISSION_TIERS.PLAYER) {
            return true;
        }

        const usersCollection = game?.users;
        const allUsers = usersCollection?.contents
            ?? (usersCollection?.values ? Array.from(usersCollection.values()) : null)
            ?? (usersCollection ? Array.from(usersCollection) : [user]);

        // Filter to only currently connected (active) other users
        const activeOtherUsers = allUsers.filter(otherUser => {
            if (otherUser.id === user.id || otherUser === user) return false;
            return Boolean(otherUser.active);
        });

        // Tier 2 (Trusted Player): in-charge only if NO connected Tier 1 (Player) owns it
        if (userTier === USER_PERMISSION_TIERS.TRUSTED) {
            const hasConnectedPlayerOwner = activeOtherUsers.some(otherUser => {
                return this.getUserPermissionTier(otherUser) === USER_PERMISSION_TIERS.PLAYER
                    && isOwner(otherUser);
            });
            return !hasConnectedPlayerOwner;
        }

        // Tier 3 (GM / Co-GM): in-charge only if NO connected Tier 1 (Player) and NO connected Tier 2 (Trusted Player) owns it
        if (userTier === USER_PERMISSION_TIERS.GM) {
            const hasConnectedLowerTierOwner = activeOtherUsers.some(otherUser => {
                const otherTier = this.getUserPermissionTier(otherUser);
                return (otherTier === USER_PERMISSION_TIERS.PLAYER || otherTier === USER_PERMISSION_TIERS.TRUSTED)
                    && isOwner(otherUser);
            });
            return !hasConnectedLowerTierOwner;
        }

        return false;
    }

    /* -------------------------------------------- */
    /*  Tile Anchor & Coordinate Math               */
    /* -------------------------------------------- */

    /**
     * Calculate reveal tile placement offset.
     * @param {PlaceableObject|Document} object Token or Tile object/document
     * @param {number} [scale=1] Additional scale multiplier
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getRevealOffset(object, scale = 1) {
        throw new Error('BaseFoundryAdapter.getRevealOffset must be implemented by version subclass');
    }

    /**
     * Calculate shape tile placement offset.
     * @param {PlaceableObject|Document} object Token or Tile object/document
     * @returns {{x: number, y: number}} Offset coordinates
     */
    getShapeOffset(object) {
        throw new Error('BaseFoundryAdapter.getShapeOffset must be implemented by version subclass');
    }

    /**
     * Unified tile offset resolver.
     * @param {PlaceableObject|Document} object Token or Tile object/document
     * @param {'reveal'|'shape'} type Offset type
     * @param {number} [scale=1] Scale multiplier
     * @returns {{x: number, y: number}} Resolved coordinates
     */
    getTileOffset(object, type, scale = 1) {
        if (type === 'reveal') return this.getRevealOffset(object, scale);
        if (type === 'shape') return this.getShapeOffset(object);
        throw new Error(`Invalid offset type: ${type}`);
    }

    /* -------------------------------------------- */
    /*  Template Position Extraction                */
    /* -------------------------------------------- */

    /**
     * Gets position coordinates from a template or region document.
     * @param {Document|PlaceableObject} template The template or region document/placeable
     * @param {Object} [config={}] Configuration options
     * @returns {[ {x: number, y: number}, {x: number, y: number}, {x: number, y: number} ]} Array of [primary, secondary, center] coordinates
     */
    getTemplatePosition(template, config = {}) {
        throw new Error('BaseFoundryAdapter.getTemplatePosition must be implemented by version subclass');
    }

    /**
     * Resolves position coordinates from an interactive crosshair placement result.
     * @param {object} position The raw coordinates returned by Sequencer.Crosshair.show
     * @param {object} [config={}] Configuration options
     * @returns {[ {x: number, y: number}, {x: number, y: number}, {x: number, y: number} ]} Array of [primary, secondary, center]
     */
    getCrosshairPosition(position, config = {}) {
        if (!position) return [];

        let primary = { x: position.x ?? 0, y: position.y ?? 0 };
        const token = config.token ?? config.sourceToken;
        const tokenCenter = token?.center ?? (token?.x !== undefined ? { x: token.x, y: token.y } : null);

        const gridSize = canvas?.grid?.size ?? canvas?.dimensions?.size ?? 100;
        const gridDistance = canvas?.grid?.distance ?? canvas?.scene?.grid?.distance ?? canvas?.dimensions?.distance ?? 5;

        const dir = position.direction ?? config.direction ?? token?.document?.rotation ?? 0;
        const isRayOrCone = position.t === 'ray' || position.t === 'cone' || position.type === 'ray' || position.type === 'cone' || config.type === 'ray' || config.type === 'cone';
        const isAttached = Boolean(position.sticky || config.sticky || config.stickToToken || isRayOrCone);

        const dist = position.distance ?? config.distance ?? (isAttached ? (config.max ?? 100) : 0);
        const distancePx = (dist / gridDistance) * gridSize;
        const rad = (dir * Math.PI) / 180;

        let secondary;
        if (distancePx > 0) {
            secondary = {
                x: primary.x + Math.cos(rad) * distancePx,
                y: primary.y + Math.sin(rad) * distancePx
            };
        } else if (tokenCenter && Math.hypot(primary.x - tokenCenter.x, primary.y - tokenCenter.y) >= 1) {
            secondary = primary;
            primary = { x: tokenCenter.x, y: tokenCenter.y };
        }

        return this.resolveDistinctPositions([primary, secondary, primary], config);
    }

    /**
     * Validates that primary and secondary coordinates are distinct (distance >= 1px).
     * @param {Array} positions Coordinates array [primary, secondary, center]
     * @param {object} [config={}] Configuration options
     * @param {Document|object|null} [template=null] Original template or region document
     * @returns {Array} Validated positions or error array
     */
    resolveDistinctPositions(positions, config = {}, template = null) {
        if (!positions || positions.length === 0 || positions.error || positions[0]?.error) {
            return positions;
        }
        const [primary, secondary, center] = positions;
        if (!primary) return positions;

        const distancePx = secondary ? Math.hypot(secondary.x - primary.x, secondary.y - primary.y) : 0;
        if (secondary && distancePx < 1) {
            log.error('BaseFoundryAdapter | Unable to resolve distinct non-zero positions for animation.', { template, config, primary, secondary });
            ui?.notifications?.error?.('Eskie Macro Pack | Unable to resolve coordinates for animation.');
            const err = new Error('Unable to resolve distinct coordinates for template animation');
            const errResult = [{ error: err, cancelled: true }, undefined, undefined];
            errResult.error = err;
            return errResult;
        }

        return [primary, secondary, center ?? primary];
    }

    /* -------------------------------------------- */
    /*  Scene & Environment Background              */
    /* -------------------------------------------- */

    /**
     * Retrieve the background texture and offsets for a scene.
     * @param {Scene} [scene=canvas.scene] Target scene document
     * @param {Level|null} [level=null] Target level document or placeable
     * @returns {{ src: string|null, offsetX: number, offsetY: number }}
     */
    getSceneBackground(scene = canvas?.scene, level = null) {
        throw new Error('BaseFoundryAdapter.getSceneBackground must be implemented by version subclass');
    }

    /* -------------------------------------------- */
    /*  Document Inspection & Placeable Lookup      */
    /* -------------------------------------------- */

    /**
     * Gets the native Foundry VTT document name of a placeable object or document.
     * @param {PlaceableObject|Document|null} target Target document or placeable
     * @returns {string|undefined} Document name (e.g. 'Token', 'Tile')
     */
    getDocumentName(target) {
        if (!target) return undefined;
        return target.documentName ?? target.document?.documentName ?? undefined;
    }

    /**
     * Test whether a target document or placeable matches a specific document type.
     * @param {PlaceableObject|Document|null} target Target document or placeable
     * @returns {boolean}
     */
    isDocumentOfType(target, type) {
        return this.getDocumentName(target) === type;
    }

    /**
     * Resolve a PlaceableObject by its unique identifier across primary canvas layers.
     * @param {string} id Target placeable ID
     * @returns {PlaceableObject|null}
     */
    getPlaceable(id) {
        if (!id) return null;
        return canvas?.tokens?.get(id)
            ?? canvas?.tiles?.get(id)
            ?? canvas?.walls?.get(id)
            ?? null;
    }

    /* -------------------------------------------- */
    /*  Speaker Resolution                          */
    /* -------------------------------------------- */

    /**
     * Pinpoints the active rolling or speaker token for a chat message or active user.
     * @param {ChatMessage|object|null} message Chat message or speaker context
     * @param {string|null} [extractedTokenId=null] Optional pre-extracted token ID
     * @returns {Token|null}
     */
    getSpeakerToken(message, extractedTokenId = null) {
        const canvasObj = canvas;
        if (!canvasObj?.ready || !canvasObj.tokens) return null;

        if (extractedTokenId) {
            const htmlTarget = canvasObj.tokens.get(extractedTokenId);
            if (htmlTarget) return htmlTarget;
        }

        const speakerTokenId = message?.speaker?.token;
        if (speakerTokenId) {
            const speakerTarget = canvasObj.tokens.get(speakerTokenId);
            if (speakerTarget) return speakerTarget;
        }

        return canvasObj.tokens.controlled?.[0]
            ?? game?.user?.character?.getActiveTokens?.()?.[0]
            ?? null;
    }

    /**
     * Resolves the actor associated with a chat message speaker.
     * @param {ChatMessage|object|null} message Chat message or speaker context
     * @returns {Actor|null}
     */
    getSpeakerActor(message) {
        const speaker = message?.speaker ?? message;
        if (speaker && ChatMessage?.getSpeakerActor) {
            const actor = ChatMessage.getSpeakerActor(speaker);
            if (actor) return actor;
        }
        const speakerToken = this.getSpeakerToken(message);
        return speakerToken?.actor ?? game?.user?.character ?? null;
    }

    /* -------------------------------------------- */
    /*  Token Distance & Grid Centering Math        */
    /* -------------------------------------------- */

    /**
     * Calculates the 3D distance between two tokens in scene units (e.g. feet/meters), rounded up.
     * @param {Token} t1 The source token
     * @param {Token} t2 The target token
     * @returns {number} Distance in scene units, rounded up
     */
    getDistance(t1, t2) {
        if (!t1 || !t2) return 0;
        const p1 = t1.center ?? { x: t1.x ?? 0, y: t1.y ?? 0 };
        const p2 = t2.center ?? { x: t2.x ?? 0, y: t2.y ?? 0 };
        const dist2DPx = Math.hypot(p1.x - p2.x, p1.y - p2.y);

        const gridSize = canvas?.grid?.size ?? 100;
        const gridDistance = canvas?.scene?.grid?.distance ?? canvas?.grid?.distance ?? 5;
        const dist2DUnits = (dist2DPx / gridSize) * gridDistance;

        const el1 = t1.document?.elevation ?? 0;
        const el2 = t2.document?.elevation ?? 0;
        const elDiff = el1 - el2;

        const dist3DUnits = Math.hypot(dist2DUnits, elDiff);
        return Math.ceil(dist3DUnits);
    }

    /**
     * Finds the center coordinate of the grid square on a target token nearest to a source token.
     * @param {Token} token The source token
     * @param {Token} target The target token
     * @returns {{x: number, y: number}|null} Coordinate of nearest square center
     */
    getNearestSquareCenter(token, target) {
        if (!token || !target) return null;
        const gs = canvas?.grid?.size ?? 100;
        const srcCenter = token.center ?? { x: token.x ?? 0, y: token.y ?? 0 };

        const w = target.document?.width ?? target.width ?? 1;
        const h = target.document?.height ?? target.height ?? 1;

        let bestPoint = null;
        let bestDist2 = Infinity;

        for (let gx = 0; gx < w; gx++) {
            for (let gy = 0; gy < h; gy++) {
                const cx = (target.x ?? 0) + (gx + 0.5) * gs;
                const cy = (target.y ?? 0) + (gy + 0.5) * gs;

                const dx = cx - srcCenter.x;
                const dy = cy - srcCenter.y;
                const d2 = dx * dx + dy * dy;

                if (d2 < bestDist2) {
                    bestDist2 = d2;
                    bestPoint = { x: cx, y: cy };
                }
            }
        }

        return bestPoint;
    }

    /**
     * Returns an array of users who are owners of a given token.
     * Evaluates document ownership permissions via user permission tiers and ownership levels.
     * @param {Token|TokenDocument} token Token placeable or document
     * @param {object} [config={}] Configuration options
     * @param {boolean} [config.applyPC=true] Whether to include player characters
     * @param {boolean} [config.applyGM=true] Whether to include Game Masters
     * @returns {User[]} Array of User objects
     */
    getTokenOwners(token, config = {}) {
        if (!token) return [];
        const applyPC = config.applyPC !== false;
        const applyGM = config.applyGM !== false;
        const doc = token.document ?? token;
        const actor = token.actor ?? doc?.actor ?? null;

        const isOwner = (u) => this.isUserDocumentOwner(u, actor) || this.isUserDocumentOwner(u, doc);

        const usersCollection = game?.users;
        const allUsers = usersCollection?.contents
            ?? (usersCollection?.values ? Array.from(usersCollection.values()) : null)
            ?? (usersCollection ? Array.from(usersCollection) : []);

        let matched = allUsers.filter(user => isOwner(user));
        if (!applyPC) matched = matched.filter(user => Boolean(user.isGM));
        if (!applyGM) matched = matched.filter(user => !user.isGM);
        return matched;
    }

    /* -------------------------------------------- */
    /*  Placeable Element Attachment Operations     */
    /* -------------------------------------------- */

    /**
     * Attaches elements to a target PlaceableObject (Token or Tile).
     * If the target is a Tile, uses Baileywiki Mass Edit if active.
     * If the target is a Token, falls back to Token Attacher or Mass Edit.
     * @param {Array} elements Elements to attach
     * @param {PlaceableObject|Document} target Target Token or Tile
     * @returns {Promise<unknown>}
     */
    async attachPlaceableElements(elements, target) {
        const isTile = this.isDocumentOfType(target, 'Tile');

        if (isTile) {
            dependency.required([
                { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
            ]);
            return this.massEdit?.link(elements, target);
        }

        // Default Token behavior
        if (dependency.isActivated({ id: 'token-attacher', ref: "Token Attacher" })) {
            return this.tokenAttacher?.attachElementsToToken(elements, target, true);
        } else if (dependency.isActivated({ id: 'multi-token-edit', ref: "Baileywiki Mass Edit" })) {
            return this.massEdit?.link(elements, target);
        }

        dependency.someRequired([
            { id: 'token-attacher', ref: "Token Attacher" },
            { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
        ]);
    }

    /**
     * Detaches elements from a target PlaceableObject (Token or Tile).
     * @param {Array} elements Elements to detach
     * @param {PlaceableObject|Document} target Target Token or Tile
     * @returns {Promise<unknown>}
     */
    async detachPlaceableElements(elements, target) {
        const isTile = this.isDocumentOfType(target, 'Tile');

        if (isTile) {
            dependency.required([
                { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
            ]);
            return this.massEdit?.removeLinks(elements, target);
        }

        // Default Token behavior
        if (dependency.isActivated({ id: 'token-attacher', ref: "Token Attacher" })) {
            return this.tokenAttacher?.detachElementsFromToken(elements, target, true);
        } else if (dependency.isActivated({ id: 'multi-token-edit', ref: "Baileywiki Mass Edit" })) {
            return this.massEdit?.removeLinks(elements, target);
        }

        dependency.someRequired([
            { id: 'token-attacher', ref: "Token Attacher" },
            { id: 'multi-token-edit', ref: "Baileywiki Mass Edit" }
        ]);
    }

    /**
     * Format a document update payload to delete/remove a specific property key.
     * @param {string} path Dot-delimited parent property path (e.g. "flags.eskie-macros.token-masks")
     * @param {string} keyId The property key to delete
     * @returns {Record<string, *>} Update dictionary
     */
    formatDeletionUpdate(path, keyId) {
        throw new Error('BaseFoundryAdapter.formatDeletionUpdate must be implemented by version subclass');
    }
}
