/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-mixed-operators, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars, default-case, jsdoc/require-param*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
var $Object = $util.global.Object, $undefined = $util.global.undefined, $Error = $util.global.Error, $TypeError = $util.global.TypeError, $Number = $util.global.Number, $Array = $util.global.Array, $Boolean = $util.global.Boolean, $isFinite = $util.global.isFinite, $String = $util.global.String, $parseInt = $util.global.parseInt, $BigInt = $util.global.BigInt;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.proto = (function() {

    /**
     * Namespace proto.
     * @exports proto
     * @namespace
     */
    var proto = {};

    /**
     * Switch_Phase_Option enum.
     * @name proto.Switch_Phase_Option
     * @enum {number}
     * @property {number} START_PHASE=0 START_PHASE value
     * @property {number} EXIT_FIGHT=1 EXIT_FIGHT value
     * @property {number} RETURN_PREV_PHASE=2 RETURN_PREV_PHASE value
     */
    proto.Switch_Phase_Option = (function() {
        var valuesById = $Object.create(null), values = $Object.create(valuesById);
        values[valuesById[0] = "START_PHASE"] = 0;
        values[valuesById[1] = "EXIT_FIGHT"] = 1;
        values[valuesById[2] = "RETURN_PREV_PHASE"] = 2;
        return values;
    })();

    /**
     * FightLogType enum.
     * @name proto.FightLogType
     * @enum {number}
     * @property {number} LOG_UNKNOWN=0 LOG_UNKNOWN value
     * @property {number} LOG_ATTACK=1 LOG_ATTACK value
     * @property {number} LOG_RECOVER=2 LOG_RECOVER value
     * @property {number} LOG_COUNTER=3 LOG_COUNTER value
     * @property {number} LOG_BUFF=4 LOG_BUFF value
     * @property {number} LOG_DEATH=5 LOG_DEATH value
     * @property {number} LOG_OTHER=6 LOG_OTHER value
     */
    proto.FightLogType = (function() {
        var valuesById = $Object.create(null), values = $Object.create(valuesById);
        values[valuesById[0] = "LOG_UNKNOWN"] = 0;
        values[valuesById[1] = "LOG_ATTACK"] = 1;
        values[valuesById[2] = "LOG_RECOVER"] = 2;
        values[valuesById[3] = "LOG_COUNTER"] = 3;
        values[valuesById[4] = "LOG_BUFF"] = 4;
        values[valuesById[5] = "LOG_DEATH"] = 5;
        values[valuesById[6] = "LOG_OTHER"] = 6;
        return values;
    })();

    proto.Buff = (function() {

        /**
         * Properties of a Buff.
         * @typedef {Object} proto.Buff.$Properties
         * @property {number|null} [buffId] Buff buffId
         * @property {number|null} [time] Buff time
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a Buff.
         * @memberof proto
         * @interface IBuff
         * @augments proto.Buff.$Properties
         * @deprecated Use proto.Buff.$Properties instead.
         */

        /**
         * Shape of a Buff.
         * @typedef {proto.Buff.$Properties} proto.Buff.$Shape
         */

        /**
         * Constructs a new Buff.
         * @memberof proto
         * @classdesc Represents a Buff.
         * @constructor
         * @param {proto.Buff.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var Buff = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * Buff buffId.
         * @member {number} buffId
         * @memberof proto.Buff
         * @instance
         */
        Buff.prototype.buffId = 0;

        /**
         * Buff time.
         * @member {number} time
         * @memberof proto.Buff
         * @instance
         */
        Buff.prototype.time = 0;

        /**
         * Creates a new Buff instance using the specified properties.
         * @function create
         * @memberof proto.Buff
         * @static
         * @param {proto.Buff.$Properties=} [properties] Properties to set
         * @returns {proto.Buff} Buff instance
         * @type {{
         *   (properties: proto.Buff.$Shape): proto.Buff & proto.Buff.$Shape;
         *   (properties?: proto.Buff.$Properties): proto.Buff;
         * }}
         */
        Buff.create = function(properties) {
            return new Buff(properties);
        };

        /**
         * Encodes the specified Buff message. Does not implicitly {@link proto.Buff.verify|verify} messages.
         * @function encode
         * @memberof proto.Buff
         * @static
         * @param {proto.Buff.$Properties} message Buff message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Buff.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.buffId != null && $Object.hasOwnProperty.call(message, "buffId") && message.buffId !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.buffId);
            if (message.time != null && $Object.hasOwnProperty.call(message, "time") && message.time !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.time);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified Buff message, length delimited. Does not implicitly {@link proto.Buff.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.Buff
         * @static
         * @param {proto.Buff.$Properties} message Buff message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Buff.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a Buff message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Buff
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.Buff & proto.Buff.$Shape} Buff
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Buff.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.Buff(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.buffId = value;
                        else
                            delete message.buffId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.time = value;
                        else
                            delete message.time;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a Buff message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.Buff
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.Buff & proto.Buff.$Shape} Buff
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Buff.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Buff message.
         * @function verify
         * @memberof proto.Buff
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Buff.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.buffId != null && $Object.hasOwnProperty.call(message, "buffId"))
                if (!$util.isInteger(message.buffId))
                    return "buffId: integer expected";
            if (message.time != null && $Object.hasOwnProperty.call(message, "time"))
                if (!$util.isInteger(message.time))
                    return "time: integer expected";
            return null;
        };

        /**
         * Creates a Buff message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.Buff
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.Buff} Buff
         */
        Buff.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.Buff)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.Buff: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.Buff();
            if (object.buffId != null)
                if ($Number(object.buffId) !== 0)
                    message.buffId = object.buffId | 0;
            if (object.time != null)
                if ($Number(object.time) !== 0)
                    message.time = object.time | 0;
            return message;
        };

        /**
         * Creates a plain object from a Buff message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.Buff
         * @static
         * @param {proto.Buff} message Buff
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Buff.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.buffId = 0;
                object.time = 0;
            }
            if (message.buffId != null && $Object.hasOwnProperty.call(message, "buffId"))
                object.buffId = message.buffId;
            if (message.time != null && $Object.hasOwnProperty.call(message, "time"))
                object.time = message.time;
            return object;
        };

        /**
         * Converts this Buff to JSON.
         * @function toJSON
         * @memberof proto.Buff
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Buff.prototype.toJSON = function() {
            return Buff.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for Buff
         * @function getTypeUrl
         * @memberof proto.Buff
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        Buff.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.Buff";
        };

        return Buff;
    })();

    proto.CharacterStatus = (function() {

        /**
         * Properties of a CharacterStatus.
         * @typedef {Object} proto.CharacterStatus.$Properties
         * @property {number|null} [health] CharacterStatus health
         * @property {number|null} [attack] CharacterStatus attack
         * @property {number|null} [defense] CharacterStatus defense
         * @property {Array.<proto.Buff.$Properties>|null} [buffs] CharacterStatus buffs
         * @property {boolean|null} [isMyCharacter] CharacterStatus isMyCharacter
         * @property {number|null} [characterId] CharacterStatus characterId
         * @property {number|null} [maxHealth] CharacterStatus maxHealth
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a CharacterStatus.
         * @memberof proto
         * @interface ICharacterStatus
         * @augments proto.CharacterStatus.$Properties
         * @deprecated Use proto.CharacterStatus.$Properties instead.
         */

        /**
         * Shape of a CharacterStatus.
         * @typedef {proto.CharacterStatus.$Properties} proto.CharacterStatus.$Shape
         */

        /**
         * Constructs a new CharacterStatus.
         * @memberof proto
         * @classdesc Represents a CharacterStatus.
         * @constructor
         * @param {proto.CharacterStatus.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var CharacterStatus = function (properties) {
            this.buffs = [];
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * CharacterStatus health.
         * @member {number} health
         * @memberof proto.CharacterStatus
         * @instance
         */
        CharacterStatus.prototype.health = 0;

        /**
         * CharacterStatus attack.
         * @member {number} attack
         * @memberof proto.CharacterStatus
         * @instance
         */
        CharacterStatus.prototype.attack = 0;

        /**
         * CharacterStatus defense.
         * @member {number} defense
         * @memberof proto.CharacterStatus
         * @instance
         */
        CharacterStatus.prototype.defense = 0;

        /**
         * CharacterStatus buffs.
         * @member {Array.<proto.Buff.$Properties>} buffs
         * @memberof proto.CharacterStatus
         * @instance
         */
        CharacterStatus.prototype.buffs = $util.emptyArray;

        /**
         * CharacterStatus isMyCharacter.
         * @member {boolean} isMyCharacter
         * @memberof proto.CharacterStatus
         * @instance
         */
        CharacterStatus.prototype.isMyCharacter = false;

        /**
         * CharacterStatus characterId.
         * @member {number} characterId
         * @memberof proto.CharacterStatus
         * @instance
         */
        CharacterStatus.prototype.characterId = 0;

        /**
         * CharacterStatus maxHealth.
         * @member {number} maxHealth
         * @memberof proto.CharacterStatus
         * @instance
         */
        CharacterStatus.prototype.maxHealth = 0;

        /**
         * Creates a new CharacterStatus instance using the specified properties.
         * @function create
         * @memberof proto.CharacterStatus
         * @static
         * @param {proto.CharacterStatus.$Properties=} [properties] Properties to set
         * @returns {proto.CharacterStatus} CharacterStatus instance
         * @type {{
         *   (properties: proto.CharacterStatus.$Shape): proto.CharacterStatus & proto.CharacterStatus.$Shape;
         *   (properties?: proto.CharacterStatus.$Properties): proto.CharacterStatus;
         * }}
         */
        CharacterStatus.create = function(properties) {
            return new CharacterStatus(properties);
        };

        /**
         * Encodes the specified CharacterStatus message. Does not implicitly {@link proto.CharacterStatus.verify|verify} messages.
         * @function encode
         * @memberof proto.CharacterStatus
         * @static
         * @param {proto.CharacterStatus.$Properties} message CharacterStatus message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CharacterStatus.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.health != null && $Object.hasOwnProperty.call(message, "health") && message.health !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.health);
            if (message.attack != null && $Object.hasOwnProperty.call(message, "attack") && !$Object.is(message.attack, 0))
                writer.uint32(/* id 2, wireType 1 =*/17).double(message.attack);
            if (message.defense != null && $Object.hasOwnProperty.call(message, "defense") && message.defense !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.defense);
            if (message.buffs != null && message.buffs.length)
                for (var i = 0; i < message.buffs.length; ++i)
                    $root.proto.Buff.encode(message.buffs[i], writer.uint32(/* id 4, wireType 2 =*/34).fork(), _depth + 1).ldelim();
            if (message.isMyCharacter != null && $Object.hasOwnProperty.call(message, "isMyCharacter") && message.isMyCharacter !== false)
                writer.uint32(/* id 5, wireType 0 =*/40).bool(message.isMyCharacter);
            if (message.characterId != null && $Object.hasOwnProperty.call(message, "characterId") && message.characterId !== 0)
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.characterId);
            if (message.maxHealth != null && $Object.hasOwnProperty.call(message, "maxHealth") && message.maxHealth !== 0)
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.maxHealth);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified CharacterStatus message, length delimited. Does not implicitly {@link proto.CharacterStatus.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.CharacterStatus
         * @static
         * @param {proto.CharacterStatus.$Properties} message CharacterStatus message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CharacterStatus.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a CharacterStatus message from the specified reader or buffer.
         * @function decode
         * @memberof proto.CharacterStatus
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.CharacterStatus & proto.CharacterStatus.$Shape} CharacterStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CharacterStatus.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.CharacterStatus(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.health = value;
                        else
                            delete message.health;
                        continue;
                    }
                case 2: {
                        if (wireType !== 1)
                            break;
                        if (!$Object.is(value = reader.double(), 0))
                            message.attack = value;
                        else
                            delete message.attack;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.defense = value;
                        else
                            delete message.defense;
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        if (!(message.buffs && message.buffs.length))
                            message.buffs = [];
                        message.buffs.push($root.proto.Buff.decode(reader, reader.uint32(), $undefined, _depth + 1));
                        continue;
                    }
                case 5: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.isMyCharacter = value;
                        else
                            delete message.isMyCharacter;
                        continue;
                    }
                case 6: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.characterId = value;
                        else
                            delete message.characterId;
                        continue;
                    }
                case 7: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.maxHealth = value;
                        else
                            delete message.maxHealth;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a CharacterStatus message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.CharacterStatus
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.CharacterStatus & proto.CharacterStatus.$Shape} CharacterStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CharacterStatus.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a CharacterStatus message.
         * @function verify
         * @memberof proto.CharacterStatus
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        CharacterStatus.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.health != null && $Object.hasOwnProperty.call(message, "health"))
                if (!$util.isInteger(message.health))
                    return "health: integer expected";
            if (message.attack != null && $Object.hasOwnProperty.call(message, "attack"))
                if (typeof message.attack !== "number")
                    return "attack: number expected";
            if (message.defense != null && $Object.hasOwnProperty.call(message, "defense"))
                if (!$util.isInteger(message.defense))
                    return "defense: integer expected";
            if (message.buffs != null && $Object.hasOwnProperty.call(message, "buffs")) {
                if (!$Array.isArray(message.buffs))
                    return "buffs: array expected";
                for (var i = 0; i < message.buffs.length; ++i) {
                    var error = $root.proto.Buff.verify(message.buffs[i], _depth + 1);
                    if (error)
                        return "buffs." + error;
                }
            }
            if (message.isMyCharacter != null && $Object.hasOwnProperty.call(message, "isMyCharacter"))
                if (typeof message.isMyCharacter !== "boolean")
                    return "isMyCharacter: boolean expected";
            if (message.characterId != null && $Object.hasOwnProperty.call(message, "characterId"))
                if (!$util.isInteger(message.characterId))
                    return "characterId: integer expected";
            if (message.maxHealth != null && $Object.hasOwnProperty.call(message, "maxHealth"))
                if (!$util.isInteger(message.maxHealth))
                    return "maxHealth: integer expected";
            return null;
        };

        /**
         * Creates a CharacterStatus message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.CharacterStatus
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.CharacterStatus} CharacterStatus
         */
        CharacterStatus.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.CharacterStatus)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.CharacterStatus: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.CharacterStatus();
            if (object.health != null)
                if ($Number(object.health) !== 0)
                    message.health = object.health | 0;
            if (object.attack != null)
                if (!$Object.is($Number(object.attack), 0))
                    message.attack = $Number(object.attack);
            if (object.defense != null)
                if ($Number(object.defense) !== 0)
                    message.defense = object.defense | 0;
            if (object.buffs) {
                if (!$Array.isArray(object.buffs))
                    throw $TypeError(".proto.CharacterStatus.buffs: array expected");
                message.buffs = $Array(object.buffs.length);
                for (var i = 0; i < object.buffs.length; ++i) {
                    if (!$util.isObject(object.buffs[i]))
                        throw $TypeError(".proto.CharacterStatus.buffs: object expected");
                    message.buffs[i] = $root.proto.Buff.fromObject(object.buffs[i], _depth + 1);
                }
            }
            if (object.isMyCharacter != null)
                if (object.isMyCharacter)
                    message.isMyCharacter = $Boolean(object.isMyCharacter);
            if (object.characterId != null)
                if ($Number(object.characterId) !== 0)
                    message.characterId = object.characterId | 0;
            if (object.maxHealth != null)
                if ($Number(object.maxHealth) !== 0)
                    message.maxHealth = object.maxHealth | 0;
            return message;
        };

        /**
         * Creates a plain object from a CharacterStatus message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.CharacterStatus
         * @static
         * @param {proto.CharacterStatus} message CharacterStatus
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        CharacterStatus.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.arrays || options.defaults)
                object.buffs = [];
            if (options.defaults) {
                object.health = 0;
                object.attack = 0;
                object.defense = 0;
                object.isMyCharacter = false;
                object.characterId = 0;
                object.maxHealth = 0;
            }
            if (message.health != null && $Object.hasOwnProperty.call(message, "health"))
                object.health = message.health;
            if (message.attack != null && $Object.hasOwnProperty.call(message, "attack"))
                object.attack = options.json && !$isFinite(message.attack) ? $String(message.attack) : message.attack;
            if (message.defense != null && $Object.hasOwnProperty.call(message, "defense"))
                object.defense = message.defense;
            if (message.buffs && message.buffs.length) {
                object.buffs = $Array(message.buffs.length);
                for (var j = 0; j < message.buffs.length; ++j)
                    object.buffs[j] = $root.proto.Buff.toObject(message.buffs[j], options, _depth + 1);
            }
            if (message.isMyCharacter != null && $Object.hasOwnProperty.call(message, "isMyCharacter"))
                object.isMyCharacter = message.isMyCharacter;
            if (message.characterId != null && $Object.hasOwnProperty.call(message, "characterId"))
                object.characterId = message.characterId;
            if (message.maxHealth != null && $Object.hasOwnProperty.call(message, "maxHealth"))
                object.maxHealth = message.maxHealth;
            return object;
        };

        /**
         * Converts this CharacterStatus to JSON.
         * @function toJSON
         * @memberof proto.CharacterStatus
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        CharacterStatus.prototype.toJSON = function() {
            return CharacterStatus.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for CharacterStatus
         * @function getTypeUrl
         * @memberof proto.CharacterStatus
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        CharacterStatus.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.CharacterStatus";
        };

        return CharacterStatus;
    })();

    proto.Tool = (function() {

        /**
         * Properties of a Tool.
         * @typedef {Object} proto.Tool.$Properties
         * @property {number|null} [toolId] Tool toolId
         * @property {number|null} [count] Tool count
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a Tool.
         * @memberof proto
         * @interface ITool
         * @augments proto.Tool.$Properties
         * @deprecated Use proto.Tool.$Properties instead.
         */

        /**
         * Shape of a Tool.
         * @typedef {proto.Tool.$Properties} proto.Tool.$Shape
         */

        /**
         * Constructs a new Tool.
         * @memberof proto
         * @classdesc Represents a Tool.
         * @constructor
         * @param {proto.Tool.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var Tool = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * Tool toolId.
         * @member {number} toolId
         * @memberof proto.Tool
         * @instance
         */
        Tool.prototype.toolId = 0;

        /**
         * Tool count.
         * @member {number} count
         * @memberof proto.Tool
         * @instance
         */
        Tool.prototype.count = 0;

        /**
         * Creates a new Tool instance using the specified properties.
         * @function create
         * @memberof proto.Tool
         * @static
         * @param {proto.Tool.$Properties=} [properties] Properties to set
         * @returns {proto.Tool} Tool instance
         * @type {{
         *   (properties: proto.Tool.$Shape): proto.Tool & proto.Tool.$Shape;
         *   (properties?: proto.Tool.$Properties): proto.Tool;
         * }}
         */
        Tool.create = function(properties) {
            return new Tool(properties);
        };

        /**
         * Encodes the specified Tool message. Does not implicitly {@link proto.Tool.verify|verify} messages.
         * @function encode
         * @memberof proto.Tool
         * @static
         * @param {proto.Tool.$Properties} message Tool message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Tool.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.toolId != null && $Object.hasOwnProperty.call(message, "toolId") && message.toolId !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.toolId);
            if (message.count != null && $Object.hasOwnProperty.call(message, "count") && message.count !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.count);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified Tool message, length delimited. Does not implicitly {@link proto.Tool.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.Tool
         * @static
         * @param {proto.Tool.$Properties} message Tool message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Tool.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a Tool message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Tool
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.Tool & proto.Tool.$Shape} Tool
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Tool.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.Tool(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.toolId = value;
                        else
                            delete message.toolId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.count = value;
                        else
                            delete message.count;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a Tool message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.Tool
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.Tool & proto.Tool.$Shape} Tool
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Tool.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Tool message.
         * @function verify
         * @memberof proto.Tool
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Tool.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.toolId != null && $Object.hasOwnProperty.call(message, "toolId"))
                if (!$util.isInteger(message.toolId))
                    return "toolId: integer expected";
            if (message.count != null && $Object.hasOwnProperty.call(message, "count"))
                if (!$util.isInteger(message.count))
                    return "count: integer expected";
            return null;
        };

        /**
         * Creates a Tool message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.Tool
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.Tool} Tool
         */
        Tool.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.Tool)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.Tool: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.Tool();
            if (object.toolId != null)
                if ($Number(object.toolId) !== 0)
                    message.toolId = object.toolId | 0;
            if (object.count != null)
                if ($Number(object.count) !== 0)
                    message.count = object.count | 0;
            return message;
        };

        /**
         * Creates a plain object from a Tool message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.Tool
         * @static
         * @param {proto.Tool} message Tool
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Tool.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.toolId = 0;
                object.count = 0;
            }
            if (message.toolId != null && $Object.hasOwnProperty.call(message, "toolId"))
                object.toolId = message.toolId;
            if (message.count != null && $Object.hasOwnProperty.call(message, "count"))
                object.count = message.count;
            return object;
        };

        /**
         * Converts this Tool to JSON.
         * @function toJSON
         * @memberof proto.Tool
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Tool.prototype.toJSON = function() {
            return Tool.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for Tool
         * @function getTypeUrl
         * @memberof proto.Tool
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        Tool.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.Tool";
        };

        return Tool;
    })();

    proto.Skill = (function() {

        /**
         * Properties of a Skill.
         * @typedef {Object} proto.Skill.$Properties
         * @property {number|null} [skillId] Skill skillId
         * @property {number|null} [targetId] Skill targetId
         * @property {number|null} [characterId] Skill characterId
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a Skill.
         * @memberof proto
         * @interface ISkill
         * @augments proto.Skill.$Properties
         * @deprecated Use proto.Skill.$Properties instead.
         */

        /**
         * Shape of a Skill.
         * @typedef {proto.Skill.$Properties} proto.Skill.$Shape
         */

        /**
         * Constructs a new Skill.
         * @memberof proto
         * @classdesc Represents a Skill.
         * @constructor
         * @param {proto.Skill.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var Skill = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * Skill skillId.
         * @member {number} skillId
         * @memberof proto.Skill
         * @instance
         */
        Skill.prototype.skillId = 0;

        /**
         * Skill targetId.
         * @member {number} targetId
         * @memberof proto.Skill
         * @instance
         */
        Skill.prototype.targetId = 0;

        /**
         * Skill characterId.
         * @member {number} characterId
         * @memberof proto.Skill
         * @instance
         */
        Skill.prototype.characterId = 0;

        /**
         * Creates a new Skill instance using the specified properties.
         * @function create
         * @memberof proto.Skill
         * @static
         * @param {proto.Skill.$Properties=} [properties] Properties to set
         * @returns {proto.Skill} Skill instance
         * @type {{
         *   (properties: proto.Skill.$Shape): proto.Skill & proto.Skill.$Shape;
         *   (properties?: proto.Skill.$Properties): proto.Skill;
         * }}
         */
        Skill.create = function(properties) {
            return new Skill(properties);
        };

        /**
         * Encodes the specified Skill message. Does not implicitly {@link proto.Skill.verify|verify} messages.
         * @function encode
         * @memberof proto.Skill
         * @static
         * @param {proto.Skill.$Properties} message Skill message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Skill.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.skillId != null && $Object.hasOwnProperty.call(message, "skillId") && message.skillId !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.skillId);
            if (message.targetId != null && $Object.hasOwnProperty.call(message, "targetId") && message.targetId !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.targetId);
            if (message.characterId != null && $Object.hasOwnProperty.call(message, "characterId") && message.characterId !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.characterId);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified Skill message, length delimited. Does not implicitly {@link proto.Skill.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.Skill
         * @static
         * @param {proto.Skill.$Properties} message Skill message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Skill.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a Skill message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Skill
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.Skill & proto.Skill.$Shape} Skill
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Skill.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.Skill(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.skillId = value;
                        else
                            delete message.skillId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.targetId = value;
                        else
                            delete message.targetId;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.characterId = value;
                        else
                            delete message.characterId;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a Skill message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.Skill
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.Skill & proto.Skill.$Shape} Skill
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Skill.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Skill message.
         * @function verify
         * @memberof proto.Skill
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Skill.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.skillId != null && $Object.hasOwnProperty.call(message, "skillId"))
                if (!$util.isInteger(message.skillId))
                    return "skillId: integer expected";
            if (message.targetId != null && $Object.hasOwnProperty.call(message, "targetId"))
                if (!$util.isInteger(message.targetId))
                    return "targetId: integer expected";
            if (message.characterId != null && $Object.hasOwnProperty.call(message, "characterId"))
                if (!$util.isInteger(message.characterId))
                    return "characterId: integer expected";
            return null;
        };

        /**
         * Creates a Skill message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.Skill
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.Skill} Skill
         */
        Skill.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.Skill)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.Skill: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.Skill();
            if (object.skillId != null)
                if ($Number(object.skillId) !== 0)
                    message.skillId = object.skillId | 0;
            if (object.targetId != null)
                if ($Number(object.targetId) !== 0)
                    message.targetId = object.targetId | 0;
            if (object.characterId != null)
                if ($Number(object.characterId) !== 0)
                    message.characterId = object.characterId | 0;
            return message;
        };

        /**
         * Creates a plain object from a Skill message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.Skill
         * @static
         * @param {proto.Skill} message Skill
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Skill.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.skillId = 0;
                object.targetId = 0;
                object.characterId = 0;
            }
            if (message.skillId != null && $Object.hasOwnProperty.call(message, "skillId"))
                object.skillId = message.skillId;
            if (message.targetId != null && $Object.hasOwnProperty.call(message, "targetId"))
                object.targetId = message.targetId;
            if (message.characterId != null && $Object.hasOwnProperty.call(message, "characterId"))
                object.characterId = message.characterId;
            return object;
        };

        /**
         * Converts this Skill to JSON.
         * @function toJSON
         * @memberof proto.Skill
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Skill.prototype.toJSON = function() {
            return Skill.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for Skill
         * @function getTypeUrl
         * @memberof proto.Skill
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        Skill.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.Skill";
        };

        return Skill;
    })();

    proto.Site = (function() {

        /**
         * Properties of a Site.
         * @typedef {Object} proto.Site.$Properties
         * @property {boolean|null} [isMainActionCharacter] Site isMainActionCharacter
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a Site.
         * @memberof proto
         * @interface ISite
         * @augments proto.Site.$Properties
         * @deprecated Use proto.Site.$Properties instead.
         */

        /**
         * Shape of a Site.
         * @typedef {proto.Site.$Properties} proto.Site.$Shape
         */

        /**
         * Constructs a new Site.
         * @memberof proto
         * @classdesc Represents a Site.
         * @constructor
         * @param {proto.Site.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var Site = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * Site isMainActionCharacter.
         * @member {boolean} isMainActionCharacter
         * @memberof proto.Site
         * @instance
         */
        Site.prototype.isMainActionCharacter = false;

        /**
         * Creates a new Site instance using the specified properties.
         * @function create
         * @memberof proto.Site
         * @static
         * @param {proto.Site.$Properties=} [properties] Properties to set
         * @returns {proto.Site} Site instance
         * @type {{
         *   (properties: proto.Site.$Shape): proto.Site & proto.Site.$Shape;
         *   (properties?: proto.Site.$Properties): proto.Site;
         * }}
         */
        Site.create = function(properties) {
            return new Site(properties);
        };

        /**
         * Encodes the specified Site message. Does not implicitly {@link proto.Site.verify|verify} messages.
         * @function encode
         * @memberof proto.Site
         * @static
         * @param {proto.Site.$Properties} message Site message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Site.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.isMainActionCharacter != null && $Object.hasOwnProperty.call(message, "isMainActionCharacter") && message.isMainActionCharacter !== false)
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.isMainActionCharacter);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified Site message, length delimited. Does not implicitly {@link proto.Site.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.Site
         * @static
         * @param {proto.Site.$Properties} message Site message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Site.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a Site message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Site
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.Site & proto.Site.$Shape} Site
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Site.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.Site(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.isMainActionCharacter = value;
                        else
                            delete message.isMainActionCharacter;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a Site message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.Site
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.Site & proto.Site.$Shape} Site
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Site.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Site message.
         * @function verify
         * @memberof proto.Site
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Site.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.isMainActionCharacter != null && $Object.hasOwnProperty.call(message, "isMainActionCharacter"))
                if (typeof message.isMainActionCharacter !== "boolean")
                    return "isMainActionCharacter: boolean expected";
            return null;
        };

        /**
         * Creates a Site message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.Site
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.Site} Site
         */
        Site.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.Site)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.Site: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.Site();
            if (object.isMainActionCharacter != null)
                if (object.isMainActionCharacter)
                    message.isMainActionCharacter = $Boolean(object.isMainActionCharacter);
            return message;
        };

        /**
         * Creates a plain object from a Site message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.Site
         * @static
         * @param {proto.Site} message Site
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Site.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults)
                object.isMainActionCharacter = false;
            if (message.isMainActionCharacter != null && $Object.hasOwnProperty.call(message, "isMainActionCharacter"))
                object.isMainActionCharacter = message.isMainActionCharacter;
            return object;
        };

        /**
         * Converts this Site to JSON.
         * @function toJSON
         * @memberof proto.Site
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Site.prototype.toJSON = function() {
            return Site.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for Site
         * @function getTypeUrl
         * @memberof proto.Site
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        Site.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.Site";
        };

        return Site;
    })();

    proto.FightStatus = (function() {

        /**
         * Properties of a FightStatus.
         * @typedef {Object} proto.FightStatus.$Properties
         * @property {boolean|null} [isSelfRound] FightStatus isSelfRound
         * @property {number|null} [round] FightStatus round
         * @property {Array.<proto.CharacterStatus.$Properties>|null} [characters] FightStatus characters
         * @property {Array.<proto.Site.$Properties>|null} [sites] FightStatus sites
         * @property {Array.<proto.Tool.$Properties>|null} [tools] FightStatus tools
         * @property {number|null} [nowFightStatus] FightStatus nowFightStatus
         * @property {Object.<string,number>|null} [counters] FightStatus counters
         * @property {number|null} [stateNumber] FightStatus stateNumber
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a FightStatus.
         * @memberof proto
         * @interface IFightStatus
         * @augments proto.FightStatus.$Properties
         * @deprecated Use proto.FightStatus.$Properties instead.
         */

        /**
         * Shape of a FightStatus.
         * @typedef {proto.FightStatus.$Properties} proto.FightStatus.$Shape
         */

        /**
         * Constructs a new FightStatus.
         * @memberof proto
         * @classdesc Represents a FightStatus.
         * @constructor
         * @param {proto.FightStatus.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var FightStatus = function (properties) {
            this.characters = [];
            this.sites = [];
            this.tools = [];
            this.counters = {};
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * FightStatus isSelfRound.
         * @member {boolean} isSelfRound
         * @memberof proto.FightStatus
         * @instance
         */
        FightStatus.prototype.isSelfRound = false;

        /**
         * FightStatus round.
         * @member {number} round
         * @memberof proto.FightStatus
         * @instance
         */
        FightStatus.prototype.round = 0;

        /**
         * FightStatus characters.
         * @member {Array.<proto.CharacterStatus.$Properties>} characters
         * @memberof proto.FightStatus
         * @instance
         */
        FightStatus.prototype.characters = $util.emptyArray;

        /**
         * FightStatus sites.
         * @member {Array.<proto.Site.$Properties>} sites
         * @memberof proto.FightStatus
         * @instance
         */
        FightStatus.prototype.sites = $util.emptyArray;

        /**
         * FightStatus tools.
         * @member {Array.<proto.Tool.$Properties>} tools
         * @memberof proto.FightStatus
         * @instance
         */
        FightStatus.prototype.tools = $util.emptyArray;

        /**
         * FightStatus nowFightStatus.
         * @member {number} nowFightStatus
         * @memberof proto.FightStatus
         * @instance
         */
        FightStatus.prototype.nowFightStatus = 0;

        /**
         * FightStatus counters.
         * @member {Object.<string,number>} counters
         * @memberof proto.FightStatus
         * @instance
         */
        FightStatus.prototype.counters = $util.emptyObject;

        /**
         * FightStatus stateNumber.
         * @member {number} stateNumber
         * @memberof proto.FightStatus
         * @instance
         */
        FightStatus.prototype.stateNumber = 0;

        /**
         * Creates a new FightStatus instance using the specified properties.
         * @function create
         * @memberof proto.FightStatus
         * @static
         * @param {proto.FightStatus.$Properties=} [properties] Properties to set
         * @returns {proto.FightStatus} FightStatus instance
         * @type {{
         *   (properties: proto.FightStatus.$Shape): proto.FightStatus & proto.FightStatus.$Shape;
         *   (properties?: proto.FightStatus.$Properties): proto.FightStatus;
         * }}
         */
        FightStatus.create = function(properties) {
            return new FightStatus(properties);
        };

        /**
         * Encodes the specified FightStatus message. Does not implicitly {@link proto.FightStatus.verify|verify} messages.
         * @function encode
         * @memberof proto.FightStatus
         * @static
         * @param {proto.FightStatus.$Properties} message FightStatus message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FightStatus.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.isSelfRound != null && $Object.hasOwnProperty.call(message, "isSelfRound") && message.isSelfRound !== false)
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.isSelfRound);
            if (message.round != null && $Object.hasOwnProperty.call(message, "round") && message.round !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.round);
            if (message.characters != null && message.characters.length)
                for (var i = 0; i < message.characters.length; ++i)
                    $root.proto.CharacterStatus.encode(message.characters[i], writer.uint32(/* id 3, wireType 2 =*/26).fork(), _depth + 1).ldelim();
            if (message.sites != null && message.sites.length)
                for (var i = 0; i < message.sites.length; ++i)
                    $root.proto.Site.encode(message.sites[i], writer.uint32(/* id 4, wireType 2 =*/34).fork(), _depth + 1).ldelim();
            if (message.tools != null && message.tools.length)
                for (var i = 0; i < message.tools.length; ++i)
                    $root.proto.Tool.encode(message.tools[i], writer.uint32(/* id 5, wireType 2 =*/42).fork(), _depth + 1).ldelim();
            if (message.nowFightStatus != null && $Object.hasOwnProperty.call(message, "nowFightStatus") && message.nowFightStatus !== 0)
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.nowFightStatus);
            if (message.counters != null && $Object.hasOwnProperty.call(message, "counters"))
                for (var keys = $Object.keys(message.counters), i = 0; i < keys.length; ++i)
                    writer.uint32(/* id 7, wireType 2 =*/58).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]).uint32(/* id 2, wireType 5 =*/21).float(message.counters[keys[i]]).ldelim();
            if (message.stateNumber != null && $Object.hasOwnProperty.call(message, "stateNumber") && message.stateNumber !== 0)
                writer.uint32(/* id 8, wireType 0 =*/64).int32(message.stateNumber);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified FightStatus message, length delimited. Does not implicitly {@link proto.FightStatus.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.FightStatus
         * @static
         * @param {proto.FightStatus.$Properties} message FightStatus message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FightStatus.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a FightStatus message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FightStatus
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.FightStatus & proto.FightStatus.$Shape} FightStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FightStatus.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.FightStatus(), key, value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.isSelfRound = value;
                        else
                            delete message.isSelfRound;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.round = value;
                        else
                            delete message.round;
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        if (!(message.characters && message.characters.length))
                            message.characters = [];
                        message.characters.push($root.proto.CharacterStatus.decode(reader, reader.uint32(), $undefined, _depth + 1));
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        if (!(message.sites && message.sites.length))
                            message.sites = [];
                        message.sites.push($root.proto.Site.decode(reader, reader.uint32(), $undefined, _depth + 1));
                        continue;
                    }
                case 5: {
                        if (wireType !== 2)
                            break;
                        if (!(message.tools && message.tools.length))
                            message.tools = [];
                        message.tools.push($root.proto.Tool.decode(reader, reader.uint32(), $undefined, _depth + 1));
                        continue;
                    }
                case 6: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.nowFightStatus = value;
                        else
                            delete message.nowFightStatus;
                        continue;
                    }
                case 7: {
                        if (wireType !== 2)
                            break;
                        if (message.counters === $util.emptyObject)
                            message.counters = {};
                        var end2 = reader.uint32() + reader.pos;
                        key = "";
                        value = 0;
                        while (reader.pos < end2) {
                            var tag2 = reader.tag();
                            wireType = tag2 & 7;
                            switch (tag2 >>>= 3) {
                            case 1:
                                if (wireType !== 2)
                                    break;
                                key = reader.stringVerify();
                                continue;
                            case 2:
                                if (wireType !== 5)
                                    break;
                                value = reader.float();
                                continue;
                            }
                            reader.skipType(wireType, _depth, tag2);
                        }
                        if (key === "__proto__")
                            $util.makeProp(message.counters, key);
                        message.counters[key] = value;
                        continue;
                    }
                case 8: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.stateNumber = value;
                        else
                            delete message.stateNumber;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a FightStatus message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.FightStatus
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.FightStatus & proto.FightStatus.$Shape} FightStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FightStatus.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a FightStatus message.
         * @function verify
         * @memberof proto.FightStatus
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        FightStatus.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.isSelfRound != null && $Object.hasOwnProperty.call(message, "isSelfRound"))
                if (typeof message.isSelfRound !== "boolean")
                    return "isSelfRound: boolean expected";
            if (message.round != null && $Object.hasOwnProperty.call(message, "round"))
                if (!$util.isInteger(message.round))
                    return "round: integer expected";
            if (message.characters != null && $Object.hasOwnProperty.call(message, "characters")) {
                if (!$Array.isArray(message.characters))
                    return "characters: array expected";
                for (var i = 0; i < message.characters.length; ++i) {
                    var error = $root.proto.CharacterStatus.verify(message.characters[i], _depth + 1);
                    if (error)
                        return "characters." + error;
                }
            }
            if (message.sites != null && $Object.hasOwnProperty.call(message, "sites")) {
                if (!$Array.isArray(message.sites))
                    return "sites: array expected";
                for (var i = 0; i < message.sites.length; ++i) {
                    var error = $root.proto.Site.verify(message.sites[i], _depth + 1);
                    if (error)
                        return "sites." + error;
                }
            }
            if (message.tools != null && $Object.hasOwnProperty.call(message, "tools")) {
                if (!$Array.isArray(message.tools))
                    return "tools: array expected";
                for (var i = 0; i < message.tools.length; ++i) {
                    var error = $root.proto.Tool.verify(message.tools[i], _depth + 1);
                    if (error)
                        return "tools." + error;
                }
            }
            if (message.nowFightStatus != null && $Object.hasOwnProperty.call(message, "nowFightStatus"))
                if (!$util.isInteger(message.nowFightStatus))
                    return "nowFightStatus: integer expected";
            if (message.counters != null && $Object.hasOwnProperty.call(message, "counters")) {
                if (!$util.isObject(message.counters))
                    return "counters: object expected";
                var key = $Object.keys(message.counters);
                for (var i = 0; i < key.length; ++i)
                    if (typeof message.counters[key[i]] !== "number")
                        return "counters: number{k:string} expected";
            }
            if (message.stateNumber != null && $Object.hasOwnProperty.call(message, "stateNumber"))
                if (!$util.isInteger(message.stateNumber))
                    return "stateNumber: integer expected";
            return null;
        };

        /**
         * Creates a FightStatus message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.FightStatus
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.FightStatus} FightStatus
         */
        FightStatus.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.FightStatus)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.FightStatus: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.FightStatus();
            if (object.isSelfRound != null)
                if (object.isSelfRound)
                    message.isSelfRound = $Boolean(object.isSelfRound);
            if (object.round != null)
                if ($Number(object.round) !== 0)
                    message.round = object.round | 0;
            if (object.characters) {
                if (!$Array.isArray(object.characters))
                    throw $TypeError(".proto.FightStatus.characters: array expected");
                message.characters = $Array(object.characters.length);
                for (var i = 0; i < object.characters.length; ++i) {
                    if (!$util.isObject(object.characters[i]))
                        throw $TypeError(".proto.FightStatus.characters: object expected");
                    message.characters[i] = $root.proto.CharacterStatus.fromObject(object.characters[i], _depth + 1);
                }
            }
            if (object.sites) {
                if (!$Array.isArray(object.sites))
                    throw $TypeError(".proto.FightStatus.sites: array expected");
                message.sites = $Array(object.sites.length);
                for (var i = 0; i < object.sites.length; ++i) {
                    if (!$util.isObject(object.sites[i]))
                        throw $TypeError(".proto.FightStatus.sites: object expected");
                    message.sites[i] = $root.proto.Site.fromObject(object.sites[i], _depth + 1);
                }
            }
            if (object.tools) {
                if (!$Array.isArray(object.tools))
                    throw $TypeError(".proto.FightStatus.tools: array expected");
                message.tools = $Array(object.tools.length);
                for (var i = 0; i < object.tools.length; ++i) {
                    if (!$util.isObject(object.tools[i]))
                        throw $TypeError(".proto.FightStatus.tools: object expected");
                    message.tools[i] = $root.proto.Tool.fromObject(object.tools[i], _depth + 1);
                }
            }
            if (object.nowFightStatus != null)
                if ($Number(object.nowFightStatus) !== 0)
                    message.nowFightStatus = object.nowFightStatus | 0;
            if (object.counters) {
                if (!$util.isObject(object.counters))
                    throw $TypeError(".proto.FightStatus.counters: object expected");
                message.counters = {};
                for (var keys = $Object.keys(object.counters), i = 0; i < keys.length; ++i) {
                    if (keys[i] === "__proto__")
                        $util.makeProp(message.counters, keys[i]);
                    message.counters[keys[i]] = $Number(object.counters[keys[i]]);
                }
            }
            if (object.stateNumber != null)
                if ($Number(object.stateNumber) !== 0)
                    message.stateNumber = object.stateNumber | 0;
            return message;
        };

        /**
         * Creates a plain object from a FightStatus message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.FightStatus
         * @static
         * @param {proto.FightStatus} message FightStatus
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        FightStatus.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.arrays || options.defaults) {
                object.characters = [];
                object.sites = [];
                object.tools = [];
            }
            if (options.objects || options.defaults)
                object.counters = {};
            if (options.defaults) {
                object.isSelfRound = false;
                object.round = 0;
                object.nowFightStatus = 0;
                object.stateNumber = 0;
            }
            if (message.isSelfRound != null && $Object.hasOwnProperty.call(message, "isSelfRound"))
                object.isSelfRound = message.isSelfRound;
            if (message.round != null && $Object.hasOwnProperty.call(message, "round"))
                object.round = message.round;
            if (message.characters && message.characters.length) {
                object.characters = $Array(message.characters.length);
                for (var j = 0; j < message.characters.length; ++j)
                    object.characters[j] = $root.proto.CharacterStatus.toObject(message.characters[j], options, _depth + 1);
            }
            if (message.sites && message.sites.length) {
                object.sites = $Array(message.sites.length);
                for (var j = 0; j < message.sites.length; ++j)
                    object.sites[j] = $root.proto.Site.toObject(message.sites[j], options, _depth + 1);
            }
            if (message.tools && message.tools.length) {
                object.tools = $Array(message.tools.length);
                for (var j = 0; j < message.tools.length; ++j)
                    object.tools[j] = $root.proto.Tool.toObject(message.tools[j], options, _depth + 1);
            }
            if (message.nowFightStatus != null && $Object.hasOwnProperty.call(message, "nowFightStatus"))
                object.nowFightStatus = message.nowFightStatus;
            var keys2;
            if (message.counters && (keys2 = $Object.keys(message.counters)).length) {
                object.counters = {};
                for (var j = 0; j < keys2.length; ++j) {
                    if (keys2[j] === "__proto__")
                        $util.makeProp(object.counters, keys2[j]);
                    object.counters[keys2[j]] = options.json && !$isFinite(message.counters[keys2[j]]) ? $String(message.counters[keys2[j]]) : message.counters[keys2[j]];
                }
            }
            if (message.stateNumber != null && $Object.hasOwnProperty.call(message, "stateNumber"))
                object.stateNumber = message.stateNumber;
            return object;
        };

        /**
         * Converts this FightStatus to JSON.
         * @function toJSON
         * @memberof proto.FightStatus
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        FightStatus.prototype.toJSON = function() {
            return FightStatus.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for FightStatus
         * @function getTypeUrl
         * @memberof proto.FightStatus
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        FightStatus.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.FightStatus";
        };

        return FightStatus;
    })();

    proto.C2S_ChoseSkills = (function() {

        /**
         * Properties of a C2S_ChoseSkills.
         * @typedef {Object} proto.C2S_ChoseSkills.$Properties
         * @property {Array.<proto.Skill.$Properties>|null} [skills] C2S_ChoseSkills skills
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a C2S_ChoseSkills.
         * @memberof proto
         * @interface IC2S_ChoseSkills
         * @augments proto.C2S_ChoseSkills.$Properties
         * @deprecated Use proto.C2S_ChoseSkills.$Properties instead.
         */

        /**
         * Shape of a C2S_ChoseSkills.
         * @typedef {proto.C2S_ChoseSkills.$Properties} proto.C2S_ChoseSkills.$Shape
         */

        /**
         * Constructs a new C2S_ChoseSkills.
         * @memberof proto
         * @classdesc Represents a C2S_ChoseSkills.
         * @constructor
         * @param {proto.C2S_ChoseSkills.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var C2S_ChoseSkills = function (properties) {
            this.skills = [];
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * C2S_ChoseSkills skills.
         * @member {Array.<proto.Skill.$Properties>} skills
         * @memberof proto.C2S_ChoseSkills
         * @instance
         */
        C2S_ChoseSkills.prototype.skills = $util.emptyArray;

        /**
         * Creates a new C2S_ChoseSkills instance using the specified properties.
         * @function create
         * @memberof proto.C2S_ChoseSkills
         * @static
         * @param {proto.C2S_ChoseSkills.$Properties=} [properties] Properties to set
         * @returns {proto.C2S_ChoseSkills} C2S_ChoseSkills instance
         * @type {{
         *   (properties: proto.C2S_ChoseSkills.$Shape): proto.C2S_ChoseSkills & proto.C2S_ChoseSkills.$Shape;
         *   (properties?: proto.C2S_ChoseSkills.$Properties): proto.C2S_ChoseSkills;
         * }}
         */
        C2S_ChoseSkills.create = function(properties) {
            return new C2S_ChoseSkills(properties);
        };

        /**
         * Encodes the specified C2S_ChoseSkills message. Does not implicitly {@link proto.C2S_ChoseSkills.verify|verify} messages.
         * @function encode
         * @memberof proto.C2S_ChoseSkills
         * @static
         * @param {proto.C2S_ChoseSkills.$Properties} message C2S_ChoseSkills message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_ChoseSkills.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.skills != null && message.skills.length)
                for (var i = 0; i < message.skills.length; ++i)
                    $root.proto.Skill.encode(message.skills[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified C2S_ChoseSkills message, length delimited. Does not implicitly {@link proto.C2S_ChoseSkills.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.C2S_ChoseSkills
         * @static
         * @param {proto.C2S_ChoseSkills.$Properties} message C2S_ChoseSkills message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_ChoseSkills.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a C2S_ChoseSkills message from the specified reader or buffer.
         * @function decode
         * @memberof proto.C2S_ChoseSkills
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.C2S_ChoseSkills & proto.C2S_ChoseSkills.$Shape} C2S_ChoseSkills
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_ChoseSkills.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.C2S_ChoseSkills();
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if (!(message.skills && message.skills.length))
                            message.skills = [];
                        message.skills.push($root.proto.Skill.decode(reader, reader.uint32(), $undefined, _depth + 1));
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a C2S_ChoseSkills message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.C2S_ChoseSkills
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.C2S_ChoseSkills & proto.C2S_ChoseSkills.$Shape} C2S_ChoseSkills
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_ChoseSkills.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a C2S_ChoseSkills message.
         * @function verify
         * @memberof proto.C2S_ChoseSkills
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        C2S_ChoseSkills.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.skills != null && $Object.hasOwnProperty.call(message, "skills")) {
                if (!$Array.isArray(message.skills))
                    return "skills: array expected";
                for (var i = 0; i < message.skills.length; ++i) {
                    var error = $root.proto.Skill.verify(message.skills[i], _depth + 1);
                    if (error)
                        return "skills." + error;
                }
            }
            return null;
        };

        /**
         * Creates a C2S_ChoseSkills message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.C2S_ChoseSkills
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.C2S_ChoseSkills} C2S_ChoseSkills
         */
        C2S_ChoseSkills.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.C2S_ChoseSkills)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.C2S_ChoseSkills: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.C2S_ChoseSkills();
            if (object.skills) {
                if (!$Array.isArray(object.skills))
                    throw $TypeError(".proto.C2S_ChoseSkills.skills: array expected");
                message.skills = $Array(object.skills.length);
                for (var i = 0; i < object.skills.length; ++i) {
                    if (!$util.isObject(object.skills[i]))
                        throw $TypeError(".proto.C2S_ChoseSkills.skills: object expected");
                    message.skills[i] = $root.proto.Skill.fromObject(object.skills[i], _depth + 1);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a C2S_ChoseSkills message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.C2S_ChoseSkills
         * @static
         * @param {proto.C2S_ChoseSkills} message C2S_ChoseSkills
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        C2S_ChoseSkills.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.arrays || options.defaults)
                object.skills = [];
            if (message.skills && message.skills.length) {
                object.skills = $Array(message.skills.length);
                for (var j = 0; j < message.skills.length; ++j)
                    object.skills[j] = $root.proto.Skill.toObject(message.skills[j], options, _depth + 1);
            }
            return object;
        };

        /**
         * Converts this C2S_ChoseSkills to JSON.
         * @function toJSON
         * @memberof proto.C2S_ChoseSkills
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        C2S_ChoseSkills.prototype.toJSON = function() {
            return C2S_ChoseSkills.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for C2S_ChoseSkills
         * @function getTypeUrl
         * @memberof proto.C2S_ChoseSkills
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        C2S_ChoseSkills.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.C2S_ChoseSkills";
        };

        return C2S_ChoseSkills;
    })();

    proto.C2S_UseTool = (function() {

        /**
         * Properties of a C2S_UseTool.
         * @typedef {Object} proto.C2S_UseTool.$Properties
         * @property {number|null} [toolId] C2S_UseTool toolId
         * @property {number|null} [targetId] C2S_UseTool targetId
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a C2S_UseTool.
         * @memberof proto
         * @interface IC2S_UseTool
         * @augments proto.C2S_UseTool.$Properties
         * @deprecated Use proto.C2S_UseTool.$Properties instead.
         */

        /**
         * Shape of a C2S_UseTool.
         * @typedef {proto.C2S_UseTool.$Properties} proto.C2S_UseTool.$Shape
         */

        /**
         * Constructs a new C2S_UseTool.
         * @memberof proto
         * @classdesc Represents a C2S_UseTool.
         * @constructor
         * @param {proto.C2S_UseTool.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var C2S_UseTool = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * C2S_UseTool toolId.
         * @member {number} toolId
         * @memberof proto.C2S_UseTool
         * @instance
         */
        C2S_UseTool.prototype.toolId = 0;

        /**
         * C2S_UseTool targetId.
         * @member {number} targetId
         * @memberof proto.C2S_UseTool
         * @instance
         */
        C2S_UseTool.prototype.targetId = 0;

        /**
         * Creates a new C2S_UseTool instance using the specified properties.
         * @function create
         * @memberof proto.C2S_UseTool
         * @static
         * @param {proto.C2S_UseTool.$Properties=} [properties] Properties to set
         * @returns {proto.C2S_UseTool} C2S_UseTool instance
         * @type {{
         *   (properties: proto.C2S_UseTool.$Shape): proto.C2S_UseTool & proto.C2S_UseTool.$Shape;
         *   (properties?: proto.C2S_UseTool.$Properties): proto.C2S_UseTool;
         * }}
         */
        C2S_UseTool.create = function(properties) {
            return new C2S_UseTool(properties);
        };

        /**
         * Encodes the specified C2S_UseTool message. Does not implicitly {@link proto.C2S_UseTool.verify|verify} messages.
         * @function encode
         * @memberof proto.C2S_UseTool
         * @static
         * @param {proto.C2S_UseTool.$Properties} message C2S_UseTool message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_UseTool.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.toolId != null && $Object.hasOwnProperty.call(message, "toolId") && message.toolId !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.toolId);
            if (message.targetId != null && $Object.hasOwnProperty.call(message, "targetId") && message.targetId !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.targetId);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified C2S_UseTool message, length delimited. Does not implicitly {@link proto.C2S_UseTool.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.C2S_UseTool
         * @static
         * @param {proto.C2S_UseTool.$Properties} message C2S_UseTool message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_UseTool.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a C2S_UseTool message from the specified reader or buffer.
         * @function decode
         * @memberof proto.C2S_UseTool
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.C2S_UseTool & proto.C2S_UseTool.$Shape} C2S_UseTool
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_UseTool.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.C2S_UseTool(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.toolId = value;
                        else
                            delete message.toolId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.targetId = value;
                        else
                            delete message.targetId;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a C2S_UseTool message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.C2S_UseTool
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.C2S_UseTool & proto.C2S_UseTool.$Shape} C2S_UseTool
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_UseTool.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a C2S_UseTool message.
         * @function verify
         * @memberof proto.C2S_UseTool
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        C2S_UseTool.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.toolId != null && $Object.hasOwnProperty.call(message, "toolId"))
                if (!$util.isInteger(message.toolId))
                    return "toolId: integer expected";
            if (message.targetId != null && $Object.hasOwnProperty.call(message, "targetId"))
                if (!$util.isInteger(message.targetId))
                    return "targetId: integer expected";
            return null;
        };

        /**
         * Creates a C2S_UseTool message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.C2S_UseTool
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.C2S_UseTool} C2S_UseTool
         */
        C2S_UseTool.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.C2S_UseTool)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.C2S_UseTool: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.C2S_UseTool();
            if (object.toolId != null)
                if ($Number(object.toolId) !== 0)
                    message.toolId = object.toolId | 0;
            if (object.targetId != null)
                if ($Number(object.targetId) !== 0)
                    message.targetId = object.targetId | 0;
            return message;
        };

        /**
         * Creates a plain object from a C2S_UseTool message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.C2S_UseTool
         * @static
         * @param {proto.C2S_UseTool} message C2S_UseTool
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        C2S_UseTool.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.toolId = 0;
                object.targetId = 0;
            }
            if (message.toolId != null && $Object.hasOwnProperty.call(message, "toolId"))
                object.toolId = message.toolId;
            if (message.targetId != null && $Object.hasOwnProperty.call(message, "targetId"))
                object.targetId = message.targetId;
            return object;
        };

        /**
         * Converts this C2S_UseTool to JSON.
         * @function toJSON
         * @memberof proto.C2S_UseTool
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        C2S_UseTool.prototype.toJSON = function() {
            return C2S_UseTool.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for C2S_UseTool
         * @function getTypeUrl
         * @memberof proto.C2S_UseTool
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        C2S_UseTool.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.C2S_UseTool";
        };

        return C2S_UseTool;
    })();

    proto.C2S_SwitchPhase = (function() {

        /**
         * Properties of a C2S_SwitchPhase.
         * @typedef {Object} proto.C2S_SwitchPhase.$Properties
         * @property {proto.Switch_Phase_Option|null} [phase] C2S_SwitchPhase phase
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a C2S_SwitchPhase.
         * @memberof proto
         * @interface IC2S_SwitchPhase
         * @augments proto.C2S_SwitchPhase.$Properties
         * @deprecated Use proto.C2S_SwitchPhase.$Properties instead.
         */

        /**
         * Shape of a C2S_SwitchPhase.
         * @typedef {proto.C2S_SwitchPhase.$Properties} proto.C2S_SwitchPhase.$Shape
         */

        /**
         * Constructs a new C2S_SwitchPhase.
         * @memberof proto
         * @classdesc Represents a C2S_SwitchPhase.
         * @constructor
         * @param {proto.C2S_SwitchPhase.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var C2S_SwitchPhase = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * C2S_SwitchPhase phase.
         * @member {proto.Switch_Phase_Option} phase
         * @memberof proto.C2S_SwitchPhase
         * @instance
         */
        C2S_SwitchPhase.prototype.phase = 0;

        /**
         * Creates a new C2S_SwitchPhase instance using the specified properties.
         * @function create
         * @memberof proto.C2S_SwitchPhase
         * @static
         * @param {proto.C2S_SwitchPhase.$Properties=} [properties] Properties to set
         * @returns {proto.C2S_SwitchPhase} C2S_SwitchPhase instance
         * @type {{
         *   (properties: proto.C2S_SwitchPhase.$Shape): proto.C2S_SwitchPhase & proto.C2S_SwitchPhase.$Shape;
         *   (properties?: proto.C2S_SwitchPhase.$Properties): proto.C2S_SwitchPhase;
         * }}
         */
        C2S_SwitchPhase.create = function(properties) {
            return new C2S_SwitchPhase(properties);
        };

        /**
         * Encodes the specified C2S_SwitchPhase message. Does not implicitly {@link proto.C2S_SwitchPhase.verify|verify} messages.
         * @function encode
         * @memberof proto.C2S_SwitchPhase
         * @static
         * @param {proto.C2S_SwitchPhase.$Properties} message C2S_SwitchPhase message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_SwitchPhase.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.phase != null && $Object.hasOwnProperty.call(message, "phase") && message.phase !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.phase);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified C2S_SwitchPhase message, length delimited. Does not implicitly {@link proto.C2S_SwitchPhase.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.C2S_SwitchPhase
         * @static
         * @param {proto.C2S_SwitchPhase.$Properties} message C2S_SwitchPhase message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_SwitchPhase.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a C2S_SwitchPhase message from the specified reader or buffer.
         * @function decode
         * @memberof proto.C2S_SwitchPhase
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.C2S_SwitchPhase & proto.C2S_SwitchPhase.$Shape} C2S_SwitchPhase
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_SwitchPhase.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.C2S_SwitchPhase(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.phase = value;
                        else
                            delete message.phase;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a C2S_SwitchPhase message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.C2S_SwitchPhase
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.C2S_SwitchPhase & proto.C2S_SwitchPhase.$Shape} C2S_SwitchPhase
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_SwitchPhase.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a C2S_SwitchPhase message.
         * @function verify
         * @memberof proto.C2S_SwitchPhase
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        C2S_SwitchPhase.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.phase != null && $Object.hasOwnProperty.call(message, "phase"))
                if (typeof message.phase !== "number" || (message.phase | 0) !== message.phase)
                    return "phase: enum value expected";
            return null;
        };

        /**
         * Creates a C2S_SwitchPhase message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.C2S_SwitchPhase
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.C2S_SwitchPhase} C2S_SwitchPhase
         */
        C2S_SwitchPhase.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.C2S_SwitchPhase)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.C2S_SwitchPhase: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.C2S_SwitchPhase();
            if (object.phase !== 0 && (typeof object.phase !== "string" || $root.proto.Switch_Phase_Option[object.phase] !== 0))
                switch (object.phase) {
                case "START_PHASE":
                case 0:
                    message.phase = 0;
                    break;
                case "EXIT_FIGHT":
                case 1:
                    message.phase = 1;
                    break;
                case "RETURN_PREV_PHASE":
                case 2:
                    message.phase = 2;
                    break;
                default:
                    if (typeof object.phase === "number" && (object.phase | 0) === object.phase)
                        message.phase = object.phase;
                }
            return message;
        };

        /**
         * Creates a plain object from a C2S_SwitchPhase message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.C2S_SwitchPhase
         * @static
         * @param {proto.C2S_SwitchPhase} message C2S_SwitchPhase
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        C2S_SwitchPhase.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults)
                object.phase = options.enums === $String ? "START_PHASE" : 0;
            if (message.phase != null && $Object.hasOwnProperty.call(message, "phase"))
                object.phase = options.enums === $String ? $root.proto.Switch_Phase_Option[message.phase] === $undefined ? message.phase : $root.proto.Switch_Phase_Option[message.phase] : message.phase;
            return object;
        };

        /**
         * Converts this C2S_SwitchPhase to JSON.
         * @function toJSON
         * @memberof proto.C2S_SwitchPhase
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        C2S_SwitchPhase.prototype.toJSON = function() {
            return C2S_SwitchPhase.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for C2S_SwitchPhase
         * @function getTypeUrl
         * @memberof proto.C2S_SwitchPhase
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        C2S_SwitchPhase.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.C2S_SwitchPhase";
        };

        return C2S_SwitchPhase;
    })();

    proto.Msg_SyncFightStatus = (function() {

        /**
         * Properties of a Msg_SyncFightStatus.
         * @typedef {Object} proto.Msg_SyncFightStatus.$Properties
         * @property {proto.FightStatus.$Properties|null} [status] Msg_SyncFightStatus status
         * @property {number|Long|null} [timestamp] Msg_SyncFightStatus timestamp
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a Msg_SyncFightStatus.
         * @memberof proto
         * @interface IMsg_SyncFightStatus
         * @augments proto.Msg_SyncFightStatus.$Properties
         * @deprecated Use proto.Msg_SyncFightStatus.$Properties instead.
         */

        /**
         * Shape of a Msg_SyncFightStatus.
         * @typedef {proto.Msg_SyncFightStatus.$Properties} proto.Msg_SyncFightStatus.$Shape
         */

        /**
         * Constructs a new Msg_SyncFightStatus.
         * @memberof proto
         * @classdesc Represents a Msg_SyncFightStatus.
         * @constructor
         * @param {proto.Msg_SyncFightStatus.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var Msg_SyncFightStatus = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * Msg_SyncFightStatus status.
         * @member {proto.FightStatus.$Properties|null|undefined} status
         * @memberof proto.Msg_SyncFightStatus
         * @instance
         */
        Msg_SyncFightStatus.prototype.status = null;

        /**
         * Msg_SyncFightStatus timestamp.
         * @member {number|Long} timestamp
         * @memberof proto.Msg_SyncFightStatus
         * @instance
         */
        Msg_SyncFightStatus.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * Creates a new Msg_SyncFightStatus instance using the specified properties.
         * @function create
         * @memberof proto.Msg_SyncFightStatus
         * @static
         * @param {proto.Msg_SyncFightStatus.$Properties=} [properties] Properties to set
         * @returns {proto.Msg_SyncFightStatus} Msg_SyncFightStatus instance
         * @type {{
         *   (properties: proto.Msg_SyncFightStatus.$Shape): proto.Msg_SyncFightStatus & proto.Msg_SyncFightStatus.$Shape;
         *   (properties?: proto.Msg_SyncFightStatus.$Properties): proto.Msg_SyncFightStatus;
         * }}
         */
        Msg_SyncFightStatus.create = function(properties) {
            return new Msg_SyncFightStatus(properties);
        };

        /**
         * Encodes the specified Msg_SyncFightStatus message. Does not implicitly {@link proto.Msg_SyncFightStatus.verify|verify} messages.
         * @function encode
         * @memberof proto.Msg_SyncFightStatus
         * @static
         * @param {proto.Msg_SyncFightStatus.$Properties} message Msg_SyncFightStatus message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Msg_SyncFightStatus.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.status != null && $Object.hasOwnProperty.call(message, "status"))
                $root.proto.FightStatus.encode(message.status, writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp") && (typeof message.timestamp === "object" ? message.timestamp.low || message.timestamp.high : message.timestamp !== 0))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.timestamp);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified Msg_SyncFightStatus message, length delimited. Does not implicitly {@link proto.Msg_SyncFightStatus.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.Msg_SyncFightStatus
         * @static
         * @param {proto.Msg_SyncFightStatus.$Properties} message Msg_SyncFightStatus message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        Msg_SyncFightStatus.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a Msg_SyncFightStatus message from the specified reader or buffer.
         * @function decode
         * @memberof proto.Msg_SyncFightStatus
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.Msg_SyncFightStatus & proto.Msg_SyncFightStatus.$Shape} Msg_SyncFightStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Msg_SyncFightStatus.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.Msg_SyncFightStatus(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        message.status = $root.proto.FightStatus.decode(reader, reader.uint32(), $undefined, _depth + 1, message.status);
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.timestamp = value;
                        else
                            delete message.timestamp;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a Msg_SyncFightStatus message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.Msg_SyncFightStatus
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.Msg_SyncFightStatus & proto.Msg_SyncFightStatus.$Shape} Msg_SyncFightStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        Msg_SyncFightStatus.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a Msg_SyncFightStatus message.
         * @function verify
         * @memberof proto.Msg_SyncFightStatus
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        Msg_SyncFightStatus.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.status != null && $Object.hasOwnProperty.call(message, "status")) {
                var error = $root.proto.FightStatus.verify(message.status, _depth + 1);
                if (error)
                    return "status." + error;
            }
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp"))
                if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                    return "timestamp: integer|Long expected";
            return null;
        };

        /**
         * Creates a Msg_SyncFightStatus message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.Msg_SyncFightStatus
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.Msg_SyncFightStatus} Msg_SyncFightStatus
         */
        Msg_SyncFightStatus.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.Msg_SyncFightStatus)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.Msg_SyncFightStatus: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.Msg_SyncFightStatus();
            if (object.status != null) {
                if (!$util.isObject(object.status))
                    throw $TypeError(".proto.Msg_SyncFightStatus.status: object expected");
                message.status = $root.proto.FightStatus.fromObject(object.status, _depth + 1);
            }
            if (object.timestamp != null)
                if (typeof object.timestamp === "object" ? object.timestamp.low || object.timestamp.high : $Number(object.timestamp) !== 0)
                    if ($util.Long)
                        message.timestamp = $util.Long.fromValue(object.timestamp, false);
                    else if (typeof object.timestamp === "string")
                        message.timestamp = $parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
            return message;
        };

        /**
         * Creates a plain object from a Msg_SyncFightStatus message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.Msg_SyncFightStatus
         * @static
         * @param {proto.Msg_SyncFightStatus} message Msg_SyncFightStatus
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        Msg_SyncFightStatus.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.status = null;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.timestamp = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.timestamp = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
            }
            if (message.status != null && $Object.hasOwnProperty.call(message, "status"))
                object.status = $root.proto.FightStatus.toObject(message.status, options, _depth + 1);
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.timestamp = typeof message.timestamp === "number" ? $BigInt(message.timestamp) : $util.Long.fromBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0, false).toBigInt();
                else if (typeof message.timestamp === "number")
                    object.timestamp = options.longs === $String ? $String(message.timestamp) : message.timestamp;
                else
                    object.timestamp = options.longs === $String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === $Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber() : message.timestamp;
            return object;
        };

        /**
         * Converts this Msg_SyncFightStatus to JSON.
         * @function toJSON
         * @memberof proto.Msg_SyncFightStatus
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        Msg_SyncFightStatus.prototype.toJSON = function() {
            return Msg_SyncFightStatus.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for Msg_SyncFightStatus
         * @function getTypeUrl
         * @memberof proto.Msg_SyncFightStatus
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        Msg_SyncFightStatus.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.Msg_SyncFightStatus";
        };

        return Msg_SyncFightStatus;
    })();

    proto.AttackLog = (function() {

        /**
         * Properties of an AttackLog.
         * @typedef {Object} proto.AttackLog.$Properties
         * @property {number|null} [source] AttackLog source
         * @property {number|null} [target] AttackLog target
         * @property {number|null} [damage] AttackLog damage
         * @property {number|null} [hpBefore] AttackLog hpBefore
         * @property {number|null} [hpAfter] AttackLog hpAfter
         * @property {number|null} [ref] AttackLog ref
         * @property {number|null} [special] AttackLog special
         * @property {string|null} [other] AttackLog other
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of an AttackLog.
         * @memberof proto
         * @interface IAttackLog
         * @augments proto.AttackLog.$Properties
         * @deprecated Use proto.AttackLog.$Properties instead.
         */

        /**
         * Shape of an AttackLog.
         * @typedef {proto.AttackLog.$Properties} proto.AttackLog.$Shape
         */

        /**
         * Constructs a new AttackLog.
         * @memberof proto
         * @classdesc Represents an AttackLog.
         * @constructor
         * @param {proto.AttackLog.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var AttackLog = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * AttackLog source.
         * @member {number} source
         * @memberof proto.AttackLog
         * @instance
         */
        AttackLog.prototype.source = 0;

        /**
         * AttackLog target.
         * @member {number} target
         * @memberof proto.AttackLog
         * @instance
         */
        AttackLog.prototype.target = 0;

        /**
         * AttackLog damage.
         * @member {number} damage
         * @memberof proto.AttackLog
         * @instance
         */
        AttackLog.prototype.damage = 0;

        /**
         * AttackLog hpBefore.
         * @member {number} hpBefore
         * @memberof proto.AttackLog
         * @instance
         */
        AttackLog.prototype.hpBefore = 0;

        /**
         * AttackLog hpAfter.
         * @member {number} hpAfter
         * @memberof proto.AttackLog
         * @instance
         */
        AttackLog.prototype.hpAfter = 0;

        /**
         * AttackLog ref.
         * @member {number} ref
         * @memberof proto.AttackLog
         * @instance
         */
        AttackLog.prototype.ref = 0;

        /**
         * AttackLog special.
         * @member {number} special
         * @memberof proto.AttackLog
         * @instance
         */
        AttackLog.prototype.special = 0;

        /**
         * AttackLog other.
         * @member {string} other
         * @memberof proto.AttackLog
         * @instance
         */
        AttackLog.prototype.other = "";

        /**
         * Creates a new AttackLog instance using the specified properties.
         * @function create
         * @memberof proto.AttackLog
         * @static
         * @param {proto.AttackLog.$Properties=} [properties] Properties to set
         * @returns {proto.AttackLog} AttackLog instance
         * @type {{
         *   (properties: proto.AttackLog.$Shape): proto.AttackLog & proto.AttackLog.$Shape;
         *   (properties?: proto.AttackLog.$Properties): proto.AttackLog;
         * }}
         */
        AttackLog.create = function(properties) {
            return new AttackLog(properties);
        };

        /**
         * Encodes the specified AttackLog message. Does not implicitly {@link proto.AttackLog.verify|verify} messages.
         * @function encode
         * @memberof proto.AttackLog
         * @static
         * @param {proto.AttackLog.$Properties} message AttackLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AttackLog.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.source != null && $Object.hasOwnProperty.call(message, "source") && message.source !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.source);
            if (message.target != null && $Object.hasOwnProperty.call(message, "target") && message.target !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.target);
            if (message.damage != null && $Object.hasOwnProperty.call(message, "damage") && message.damage !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.damage);
            if (message.hpBefore != null && $Object.hasOwnProperty.call(message, "hpBefore") && message.hpBefore !== 0)
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.hpBefore);
            if (message.hpAfter != null && $Object.hasOwnProperty.call(message, "hpAfter") && message.hpAfter !== 0)
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.hpAfter);
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref") && message.ref !== 0)
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.ref);
            if (message.special != null && $Object.hasOwnProperty.call(message, "special") && message.special !== 0)
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.special);
            if (message.other != null && $Object.hasOwnProperty.call(message, "other") && message.other !== "")
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.other);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified AttackLog message, length delimited. Does not implicitly {@link proto.AttackLog.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.AttackLog
         * @static
         * @param {proto.AttackLog.$Properties} message AttackLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        AttackLog.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes an AttackLog message from the specified reader or buffer.
         * @function decode
         * @memberof proto.AttackLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.AttackLog & proto.AttackLog.$Shape} AttackLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AttackLog.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.AttackLog(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.source = value;
                        else
                            delete message.source;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.target = value;
                        else
                            delete message.target;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.damage = value;
                        else
                            delete message.damage;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.hpBefore = value;
                        else
                            delete message.hpBefore;
                        continue;
                    }
                case 5: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.hpAfter = value;
                        else
                            delete message.hpAfter;
                        continue;
                    }
                case 6: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.ref = value;
                        else
                            delete message.ref;
                        continue;
                    }
                case 7: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.special = value;
                        else
                            delete message.special;
                        continue;
                    }
                case 8: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.other = value;
                        else
                            delete message.other;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes an AttackLog message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.AttackLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.AttackLog & proto.AttackLog.$Shape} AttackLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        AttackLog.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an AttackLog message.
         * @function verify
         * @memberof proto.AttackLog
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        AttackLog.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.source != null && $Object.hasOwnProperty.call(message, "source"))
                if (!$util.isInteger(message.source))
                    return "source: integer expected";
            if (message.target != null && $Object.hasOwnProperty.call(message, "target"))
                if (!$util.isInteger(message.target))
                    return "target: integer expected";
            if (message.damage != null && $Object.hasOwnProperty.call(message, "damage"))
                if (!$util.isInteger(message.damage))
                    return "damage: integer expected";
            if (message.hpBefore != null && $Object.hasOwnProperty.call(message, "hpBefore"))
                if (!$util.isInteger(message.hpBefore))
                    return "hpBefore: integer expected";
            if (message.hpAfter != null && $Object.hasOwnProperty.call(message, "hpAfter"))
                if (!$util.isInteger(message.hpAfter))
                    return "hpAfter: integer expected";
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref"))
                if (!$util.isInteger(message.ref))
                    return "ref: integer expected";
            if (message.special != null && $Object.hasOwnProperty.call(message, "special"))
                if (!$util.isInteger(message.special))
                    return "special: integer expected";
            if (message.other != null && $Object.hasOwnProperty.call(message, "other"))
                if (!$util.isString(message.other))
                    return "other: string expected";
            return null;
        };

        /**
         * Creates an AttackLog message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.AttackLog
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.AttackLog} AttackLog
         */
        AttackLog.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.AttackLog)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.AttackLog: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.AttackLog();
            if (object.source != null)
                if ($Number(object.source) !== 0)
                    message.source = object.source | 0;
            if (object.target != null)
                if ($Number(object.target) !== 0)
                    message.target = object.target | 0;
            if (object.damage != null)
                if ($Number(object.damage) !== 0)
                    message.damage = object.damage | 0;
            if (object.hpBefore != null)
                if ($Number(object.hpBefore) !== 0)
                    message.hpBefore = object.hpBefore | 0;
            if (object.hpAfter != null)
                if ($Number(object.hpAfter) !== 0)
                    message.hpAfter = object.hpAfter | 0;
            if (object.ref != null)
                if ($Number(object.ref) !== 0)
                    message.ref = object.ref | 0;
            if (object.special != null)
                if ($Number(object.special) !== 0)
                    message.special = object.special | 0;
            if (object.other != null)
                if (typeof object.other !== "string" || object.other.length)
                    message.other = $String(object.other);
            return message;
        };

        /**
         * Creates a plain object from an AttackLog message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.AttackLog
         * @static
         * @param {proto.AttackLog} message AttackLog
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        AttackLog.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.source = 0;
                object.target = 0;
                object.damage = 0;
                object.hpBefore = 0;
                object.hpAfter = 0;
                object.ref = 0;
                object.special = 0;
                object.other = "";
            }
            if (message.source != null && $Object.hasOwnProperty.call(message, "source"))
                object.source = message.source;
            if (message.target != null && $Object.hasOwnProperty.call(message, "target"))
                object.target = message.target;
            if (message.damage != null && $Object.hasOwnProperty.call(message, "damage"))
                object.damage = message.damage;
            if (message.hpBefore != null && $Object.hasOwnProperty.call(message, "hpBefore"))
                object.hpBefore = message.hpBefore;
            if (message.hpAfter != null && $Object.hasOwnProperty.call(message, "hpAfter"))
                object.hpAfter = message.hpAfter;
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref"))
                object.ref = message.ref;
            if (message.special != null && $Object.hasOwnProperty.call(message, "special"))
                object.special = message.special;
            if (message.other != null && $Object.hasOwnProperty.call(message, "other"))
                object.other = message.other;
            return object;
        };

        /**
         * Converts this AttackLog to JSON.
         * @function toJSON
         * @memberof proto.AttackLog
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        AttackLog.prototype.toJSON = function() {
            return AttackLog.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for AttackLog
         * @function getTypeUrl
         * @memberof proto.AttackLog
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        AttackLog.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.AttackLog";
        };

        return AttackLog;
    })();

    proto.RecoverLog = (function() {

        /**
         * Properties of a RecoverLog.
         * @typedef {Object} proto.RecoverLog.$Properties
         * @property {number|null} [source] RecoverLog source
         * @property {number|null} [target] RecoverLog target
         * @property {number|null} [recover] RecoverLog recover
         * @property {number|null} [hpBefore] RecoverLog hpBefore
         * @property {number|null} [hpAfter] RecoverLog hpAfter
         * @property {number|null} [ref] RecoverLog ref
         * @property {number|null} [special] RecoverLog special
         * @property {string|null} [other] RecoverLog other
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a RecoverLog.
         * @memberof proto
         * @interface IRecoverLog
         * @augments proto.RecoverLog.$Properties
         * @deprecated Use proto.RecoverLog.$Properties instead.
         */

        /**
         * Shape of a RecoverLog.
         * @typedef {proto.RecoverLog.$Properties} proto.RecoverLog.$Shape
         */

        /**
         * Constructs a new RecoverLog.
         * @memberof proto
         * @classdesc Represents a RecoverLog.
         * @constructor
         * @param {proto.RecoverLog.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var RecoverLog = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * RecoverLog source.
         * @member {number} source
         * @memberof proto.RecoverLog
         * @instance
         */
        RecoverLog.prototype.source = 0;

        /**
         * RecoverLog target.
         * @member {number} target
         * @memberof proto.RecoverLog
         * @instance
         */
        RecoverLog.prototype.target = 0;

        /**
         * RecoverLog recover.
         * @member {number} recover
         * @memberof proto.RecoverLog
         * @instance
         */
        RecoverLog.prototype.recover = 0;

        /**
         * RecoverLog hpBefore.
         * @member {number} hpBefore
         * @memberof proto.RecoverLog
         * @instance
         */
        RecoverLog.prototype.hpBefore = 0;

        /**
         * RecoverLog hpAfter.
         * @member {number} hpAfter
         * @memberof proto.RecoverLog
         * @instance
         */
        RecoverLog.prototype.hpAfter = 0;

        /**
         * RecoverLog ref.
         * @member {number} ref
         * @memberof proto.RecoverLog
         * @instance
         */
        RecoverLog.prototype.ref = 0;

        /**
         * RecoverLog special.
         * @member {number} special
         * @memberof proto.RecoverLog
         * @instance
         */
        RecoverLog.prototype.special = 0;

        /**
         * RecoverLog other.
         * @member {string} other
         * @memberof proto.RecoverLog
         * @instance
         */
        RecoverLog.prototype.other = "";

        /**
         * Creates a new RecoverLog instance using the specified properties.
         * @function create
         * @memberof proto.RecoverLog
         * @static
         * @param {proto.RecoverLog.$Properties=} [properties] Properties to set
         * @returns {proto.RecoverLog} RecoverLog instance
         * @type {{
         *   (properties: proto.RecoverLog.$Shape): proto.RecoverLog & proto.RecoverLog.$Shape;
         *   (properties?: proto.RecoverLog.$Properties): proto.RecoverLog;
         * }}
         */
        RecoverLog.create = function(properties) {
            return new RecoverLog(properties);
        };

        /**
         * Encodes the specified RecoverLog message. Does not implicitly {@link proto.RecoverLog.verify|verify} messages.
         * @function encode
         * @memberof proto.RecoverLog
         * @static
         * @param {proto.RecoverLog.$Properties} message RecoverLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecoverLog.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.source != null && $Object.hasOwnProperty.call(message, "source") && message.source !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.source);
            if (message.target != null && $Object.hasOwnProperty.call(message, "target") && message.target !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.target);
            if (message.recover != null && $Object.hasOwnProperty.call(message, "recover") && message.recover !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.recover);
            if (message.hpBefore != null && $Object.hasOwnProperty.call(message, "hpBefore") && message.hpBefore !== 0)
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.hpBefore);
            if (message.hpAfter != null && $Object.hasOwnProperty.call(message, "hpAfter") && message.hpAfter !== 0)
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.hpAfter);
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref") && message.ref !== 0)
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.ref);
            if (message.special != null && $Object.hasOwnProperty.call(message, "special") && message.special !== 0)
                writer.uint32(/* id 7, wireType 0 =*/56).int32(message.special);
            if (message.other != null && $Object.hasOwnProperty.call(message, "other") && message.other !== "")
                writer.uint32(/* id 8, wireType 2 =*/66).string(message.other);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified RecoverLog message, length delimited. Does not implicitly {@link proto.RecoverLog.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.RecoverLog
         * @static
         * @param {proto.RecoverLog.$Properties} message RecoverLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        RecoverLog.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a RecoverLog message from the specified reader or buffer.
         * @function decode
         * @memberof proto.RecoverLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.RecoverLog & proto.RecoverLog.$Shape} RecoverLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecoverLog.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.RecoverLog(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.source = value;
                        else
                            delete message.source;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.target = value;
                        else
                            delete message.target;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.recover = value;
                        else
                            delete message.recover;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.hpBefore = value;
                        else
                            delete message.hpBefore;
                        continue;
                    }
                case 5: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.hpAfter = value;
                        else
                            delete message.hpAfter;
                        continue;
                    }
                case 6: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.ref = value;
                        else
                            delete message.ref;
                        continue;
                    }
                case 7: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.special = value;
                        else
                            delete message.special;
                        continue;
                    }
                case 8: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.other = value;
                        else
                            delete message.other;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a RecoverLog message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.RecoverLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.RecoverLog & proto.RecoverLog.$Shape} RecoverLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        RecoverLog.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a RecoverLog message.
         * @function verify
         * @memberof proto.RecoverLog
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        RecoverLog.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.source != null && $Object.hasOwnProperty.call(message, "source"))
                if (!$util.isInteger(message.source))
                    return "source: integer expected";
            if (message.target != null && $Object.hasOwnProperty.call(message, "target"))
                if (!$util.isInteger(message.target))
                    return "target: integer expected";
            if (message.recover != null && $Object.hasOwnProperty.call(message, "recover"))
                if (!$util.isInteger(message.recover))
                    return "recover: integer expected";
            if (message.hpBefore != null && $Object.hasOwnProperty.call(message, "hpBefore"))
                if (!$util.isInteger(message.hpBefore))
                    return "hpBefore: integer expected";
            if (message.hpAfter != null && $Object.hasOwnProperty.call(message, "hpAfter"))
                if (!$util.isInteger(message.hpAfter))
                    return "hpAfter: integer expected";
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref"))
                if (!$util.isInteger(message.ref))
                    return "ref: integer expected";
            if (message.special != null && $Object.hasOwnProperty.call(message, "special"))
                if (!$util.isInteger(message.special))
                    return "special: integer expected";
            if (message.other != null && $Object.hasOwnProperty.call(message, "other"))
                if (!$util.isString(message.other))
                    return "other: string expected";
            return null;
        };

        /**
         * Creates a RecoverLog message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.RecoverLog
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.RecoverLog} RecoverLog
         */
        RecoverLog.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.RecoverLog)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.RecoverLog: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.RecoverLog();
            if (object.source != null)
                if ($Number(object.source) !== 0)
                    message.source = object.source | 0;
            if (object.target != null)
                if ($Number(object.target) !== 0)
                    message.target = object.target | 0;
            if (object.recover != null)
                if ($Number(object.recover) !== 0)
                    message.recover = object.recover | 0;
            if (object.hpBefore != null)
                if ($Number(object.hpBefore) !== 0)
                    message.hpBefore = object.hpBefore | 0;
            if (object.hpAfter != null)
                if ($Number(object.hpAfter) !== 0)
                    message.hpAfter = object.hpAfter | 0;
            if (object.ref != null)
                if ($Number(object.ref) !== 0)
                    message.ref = object.ref | 0;
            if (object.special != null)
                if ($Number(object.special) !== 0)
                    message.special = object.special | 0;
            if (object.other != null)
                if (typeof object.other !== "string" || object.other.length)
                    message.other = $String(object.other);
            return message;
        };

        /**
         * Creates a plain object from a RecoverLog message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.RecoverLog
         * @static
         * @param {proto.RecoverLog} message RecoverLog
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        RecoverLog.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.source = 0;
                object.target = 0;
                object.recover = 0;
                object.hpBefore = 0;
                object.hpAfter = 0;
                object.ref = 0;
                object.special = 0;
                object.other = "";
            }
            if (message.source != null && $Object.hasOwnProperty.call(message, "source"))
                object.source = message.source;
            if (message.target != null && $Object.hasOwnProperty.call(message, "target"))
                object.target = message.target;
            if (message.recover != null && $Object.hasOwnProperty.call(message, "recover"))
                object.recover = message.recover;
            if (message.hpBefore != null && $Object.hasOwnProperty.call(message, "hpBefore"))
                object.hpBefore = message.hpBefore;
            if (message.hpAfter != null && $Object.hasOwnProperty.call(message, "hpAfter"))
                object.hpAfter = message.hpAfter;
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref"))
                object.ref = message.ref;
            if (message.special != null && $Object.hasOwnProperty.call(message, "special"))
                object.special = message.special;
            if (message.other != null && $Object.hasOwnProperty.call(message, "other"))
                object.other = message.other;
            return object;
        };

        /**
         * Converts this RecoverLog to JSON.
         * @function toJSON
         * @memberof proto.RecoverLog
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        RecoverLog.prototype.toJSON = function() {
            return RecoverLog.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for RecoverLog
         * @function getTypeUrl
         * @memberof proto.RecoverLog
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        RecoverLog.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.RecoverLog";
        };

        return RecoverLog;
    })();

    proto.CounterLog = (function() {

        /**
         * Properties of a CounterLog.
         * @typedef {Object} proto.CounterLog.$Properties
         * @property {string|null} [key] CounterLog key
         * @property {number|null} [delta] CounterLog delta
         * @property {number|null} [value] CounterLog value
         * @property {number|null} [ref] CounterLog ref
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a CounterLog.
         * @memberof proto
         * @interface ICounterLog
         * @augments proto.CounterLog.$Properties
         * @deprecated Use proto.CounterLog.$Properties instead.
         */

        /**
         * Shape of a CounterLog.
         * @typedef {proto.CounterLog.$Properties} proto.CounterLog.$Shape
         */

        /**
         * Constructs a new CounterLog.
         * @memberof proto
         * @classdesc Represents a CounterLog.
         * @constructor
         * @param {proto.CounterLog.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var CounterLog = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * CounterLog key.
         * @member {string} key
         * @memberof proto.CounterLog
         * @instance
         */
        CounterLog.prototype.key = "";

        /**
         * CounterLog delta.
         * @member {number} delta
         * @memberof proto.CounterLog
         * @instance
         */
        CounterLog.prototype.delta = 0;

        /**
         * CounterLog value.
         * @member {number} value
         * @memberof proto.CounterLog
         * @instance
         */
        CounterLog.prototype.value = 0;

        /**
         * CounterLog ref.
         * @member {number} ref
         * @memberof proto.CounterLog
         * @instance
         */
        CounterLog.prototype.ref = 0;

        /**
         * Creates a new CounterLog instance using the specified properties.
         * @function create
         * @memberof proto.CounterLog
         * @static
         * @param {proto.CounterLog.$Properties=} [properties] Properties to set
         * @returns {proto.CounterLog} CounterLog instance
         * @type {{
         *   (properties: proto.CounterLog.$Shape): proto.CounterLog & proto.CounterLog.$Shape;
         *   (properties?: proto.CounterLog.$Properties): proto.CounterLog;
         * }}
         */
        CounterLog.create = function(properties) {
            return new CounterLog(properties);
        };

        /**
         * Encodes the specified CounterLog message. Does not implicitly {@link proto.CounterLog.verify|verify} messages.
         * @function encode
         * @memberof proto.CounterLog
         * @static
         * @param {proto.CounterLog.$Properties} message CounterLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CounterLog.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.key != null && $Object.hasOwnProperty.call(message, "key") && message.key !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.key);
            if (message.delta != null && $Object.hasOwnProperty.call(message, "delta") && message.delta !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.delta);
            if (message.value != null && $Object.hasOwnProperty.call(message, "value") && message.value !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.value);
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref") && message.ref !== 0)
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.ref);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified CounterLog message, length delimited. Does not implicitly {@link proto.CounterLog.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.CounterLog
         * @static
         * @param {proto.CounterLog.$Properties} message CounterLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        CounterLog.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a CounterLog message from the specified reader or buffer.
         * @function decode
         * @memberof proto.CounterLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.CounterLog & proto.CounterLog.$Shape} CounterLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CounterLog.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.CounterLog(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.key = value;
                        else
                            delete message.key;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.delta = value;
                        else
                            delete message.delta;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.value = value;
                        else
                            delete message.value;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.ref = value;
                        else
                            delete message.ref;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a CounterLog message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.CounterLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.CounterLog & proto.CounterLog.$Shape} CounterLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        CounterLog.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a CounterLog message.
         * @function verify
         * @memberof proto.CounterLog
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        CounterLog.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.key != null && $Object.hasOwnProperty.call(message, "key"))
                if (!$util.isString(message.key))
                    return "key: string expected";
            if (message.delta != null && $Object.hasOwnProperty.call(message, "delta"))
                if (!$util.isInteger(message.delta))
                    return "delta: integer expected";
            if (message.value != null && $Object.hasOwnProperty.call(message, "value"))
                if (!$util.isInteger(message.value))
                    return "value: integer expected";
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref"))
                if (!$util.isInteger(message.ref))
                    return "ref: integer expected";
            return null;
        };

        /**
         * Creates a CounterLog message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.CounterLog
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.CounterLog} CounterLog
         */
        CounterLog.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.CounterLog)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.CounterLog: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.CounterLog();
            if (object.key != null)
                if (typeof object.key !== "string" || object.key.length)
                    message.key = $String(object.key);
            if (object.delta != null)
                if ($Number(object.delta) !== 0)
                    message.delta = object.delta | 0;
            if (object.value != null)
                if ($Number(object.value) !== 0)
                    message.value = object.value | 0;
            if (object.ref != null)
                if ($Number(object.ref) !== 0)
                    message.ref = object.ref | 0;
            return message;
        };

        /**
         * Creates a plain object from a CounterLog message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.CounterLog
         * @static
         * @param {proto.CounterLog} message CounterLog
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        CounterLog.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.key = "";
                object.delta = 0;
                object.value = 0;
                object.ref = 0;
            }
            if (message.key != null && $Object.hasOwnProperty.call(message, "key"))
                object.key = message.key;
            if (message.delta != null && $Object.hasOwnProperty.call(message, "delta"))
                object.delta = message.delta;
            if (message.value != null && $Object.hasOwnProperty.call(message, "value"))
                object.value = message.value;
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref"))
                object.ref = message.ref;
            return object;
        };

        /**
         * Converts this CounterLog to JSON.
         * @function toJSON
         * @memberof proto.CounterLog
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        CounterLog.prototype.toJSON = function() {
            return CounterLog.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for CounterLog
         * @function getTypeUrl
         * @memberof proto.CounterLog
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        CounterLog.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.CounterLog";
        };

        return CounterLog;
    })();

    proto.BuffLog = (function() {

        /**
         * Properties of a BuffLog.
         * @typedef {Object} proto.BuffLog.$Properties
         * @property {number|null} [source] BuffLog source
         * @property {number|null} [target] BuffLog target
         * @property {number|null} [buffId] BuffLog buffId
         * @property {number|null} [time] BuffLog time
         * @property {number|null} [ref] BuffLog ref
         * @property {number|null} [special] BuffLog special
         * @property {string|null} [other] BuffLog other
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a BuffLog.
         * @memberof proto
         * @interface IBuffLog
         * @augments proto.BuffLog.$Properties
         * @deprecated Use proto.BuffLog.$Properties instead.
         */

        /**
         * Shape of a BuffLog.
         * @typedef {proto.BuffLog.$Properties} proto.BuffLog.$Shape
         */

        /**
         * Constructs a new BuffLog.
         * @memberof proto
         * @classdesc Represents a BuffLog.
         * @constructor
         * @param {proto.BuffLog.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var BuffLog = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * BuffLog source.
         * @member {number} source
         * @memberof proto.BuffLog
         * @instance
         */
        BuffLog.prototype.source = 0;

        /**
         * BuffLog target.
         * @member {number} target
         * @memberof proto.BuffLog
         * @instance
         */
        BuffLog.prototype.target = 0;

        /**
         * BuffLog buffId.
         * @member {number} buffId
         * @memberof proto.BuffLog
         * @instance
         */
        BuffLog.prototype.buffId = 0;

        /**
         * BuffLog time.
         * @member {number} time
         * @memberof proto.BuffLog
         * @instance
         */
        BuffLog.prototype.time = 0;

        /**
         * BuffLog ref.
         * @member {number} ref
         * @memberof proto.BuffLog
         * @instance
         */
        BuffLog.prototype.ref = 0;

        /**
         * BuffLog special.
         * @member {number} special
         * @memberof proto.BuffLog
         * @instance
         */
        BuffLog.prototype.special = 0;

        /**
         * BuffLog other.
         * @member {string} other
         * @memberof proto.BuffLog
         * @instance
         */
        BuffLog.prototype.other = "";

        /**
         * Creates a new BuffLog instance using the specified properties.
         * @function create
         * @memberof proto.BuffLog
         * @static
         * @param {proto.BuffLog.$Properties=} [properties] Properties to set
         * @returns {proto.BuffLog} BuffLog instance
         * @type {{
         *   (properties: proto.BuffLog.$Shape): proto.BuffLog & proto.BuffLog.$Shape;
         *   (properties?: proto.BuffLog.$Properties): proto.BuffLog;
         * }}
         */
        BuffLog.create = function(properties) {
            return new BuffLog(properties);
        };

        /**
         * Encodes the specified BuffLog message. Does not implicitly {@link proto.BuffLog.verify|verify} messages.
         * @function encode
         * @memberof proto.BuffLog
         * @static
         * @param {proto.BuffLog.$Properties} message BuffLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BuffLog.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.source != null && $Object.hasOwnProperty.call(message, "source") && message.source !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.source);
            if (message.target != null && $Object.hasOwnProperty.call(message, "target") && message.target !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.target);
            if (message.buffId != null && $Object.hasOwnProperty.call(message, "buffId") && message.buffId !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.buffId);
            if (message.time != null && $Object.hasOwnProperty.call(message, "time") && message.time !== 0)
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.time);
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref") && message.ref !== 0)
                writer.uint32(/* id 5, wireType 0 =*/40).int32(message.ref);
            if (message.special != null && $Object.hasOwnProperty.call(message, "special") && message.special !== 0)
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.special);
            if (message.other != null && $Object.hasOwnProperty.call(message, "other") && message.other !== "")
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.other);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified BuffLog message, length delimited. Does not implicitly {@link proto.BuffLog.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.BuffLog
         * @static
         * @param {proto.BuffLog.$Properties} message BuffLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        BuffLog.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a BuffLog message from the specified reader or buffer.
         * @function decode
         * @memberof proto.BuffLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.BuffLog & proto.BuffLog.$Shape} BuffLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BuffLog.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.BuffLog(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.source = value;
                        else
                            delete message.source;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.target = value;
                        else
                            delete message.target;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.buffId = value;
                        else
                            delete message.buffId;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.time = value;
                        else
                            delete message.time;
                        continue;
                    }
                case 5: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.ref = value;
                        else
                            delete message.ref;
                        continue;
                    }
                case 6: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.special = value;
                        else
                            delete message.special;
                        continue;
                    }
                case 7: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.other = value;
                        else
                            delete message.other;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a BuffLog message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.BuffLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.BuffLog & proto.BuffLog.$Shape} BuffLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        BuffLog.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a BuffLog message.
         * @function verify
         * @memberof proto.BuffLog
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        BuffLog.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.source != null && $Object.hasOwnProperty.call(message, "source"))
                if (!$util.isInteger(message.source))
                    return "source: integer expected";
            if (message.target != null && $Object.hasOwnProperty.call(message, "target"))
                if (!$util.isInteger(message.target))
                    return "target: integer expected";
            if (message.buffId != null && $Object.hasOwnProperty.call(message, "buffId"))
                if (!$util.isInteger(message.buffId))
                    return "buffId: integer expected";
            if (message.time != null && $Object.hasOwnProperty.call(message, "time"))
                if (!$util.isInteger(message.time))
                    return "time: integer expected";
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref"))
                if (!$util.isInteger(message.ref))
                    return "ref: integer expected";
            if (message.special != null && $Object.hasOwnProperty.call(message, "special"))
                if (!$util.isInteger(message.special))
                    return "special: integer expected";
            if (message.other != null && $Object.hasOwnProperty.call(message, "other"))
                if (!$util.isString(message.other))
                    return "other: string expected";
            return null;
        };

        /**
         * Creates a BuffLog message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.BuffLog
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.BuffLog} BuffLog
         */
        BuffLog.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.BuffLog)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.BuffLog: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.BuffLog();
            if (object.source != null)
                if ($Number(object.source) !== 0)
                    message.source = object.source | 0;
            if (object.target != null)
                if ($Number(object.target) !== 0)
                    message.target = object.target | 0;
            if (object.buffId != null)
                if ($Number(object.buffId) !== 0)
                    message.buffId = object.buffId | 0;
            if (object.time != null)
                if ($Number(object.time) !== 0)
                    message.time = object.time | 0;
            if (object.ref != null)
                if ($Number(object.ref) !== 0)
                    message.ref = object.ref | 0;
            if (object.special != null)
                if ($Number(object.special) !== 0)
                    message.special = object.special | 0;
            if (object.other != null)
                if (typeof object.other !== "string" || object.other.length)
                    message.other = $String(object.other);
            return message;
        };

        /**
         * Creates a plain object from a BuffLog message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.BuffLog
         * @static
         * @param {proto.BuffLog} message BuffLog
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        BuffLog.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.source = 0;
                object.target = 0;
                object.buffId = 0;
                object.time = 0;
                object.ref = 0;
                object.special = 0;
                object.other = "";
            }
            if (message.source != null && $Object.hasOwnProperty.call(message, "source"))
                object.source = message.source;
            if (message.target != null && $Object.hasOwnProperty.call(message, "target"))
                object.target = message.target;
            if (message.buffId != null && $Object.hasOwnProperty.call(message, "buffId"))
                object.buffId = message.buffId;
            if (message.time != null && $Object.hasOwnProperty.call(message, "time"))
                object.time = message.time;
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref"))
                object.ref = message.ref;
            if (message.special != null && $Object.hasOwnProperty.call(message, "special"))
                object.special = message.special;
            if (message.other != null && $Object.hasOwnProperty.call(message, "other"))
                object.other = message.other;
            return object;
        };

        /**
         * Converts this BuffLog to JSON.
         * @function toJSON
         * @memberof proto.BuffLog
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        BuffLog.prototype.toJSON = function() {
            return BuffLog.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for BuffLog
         * @function getTypeUrl
         * @memberof proto.BuffLog
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        BuffLog.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.BuffLog";
        };

        return BuffLog;
    })();

    proto.DeathLog = (function() {

        /**
         * Properties of a DeathLog.
         * @typedef {Object} proto.DeathLog.$Properties
         * @property {number|null} [source] DeathLog source
         * @property {number|null} [target] DeathLog target
         * @property {number|null} [ref] DeathLog ref
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a DeathLog.
         * @memberof proto
         * @interface IDeathLog
         * @augments proto.DeathLog.$Properties
         * @deprecated Use proto.DeathLog.$Properties instead.
         */

        /**
         * Shape of a DeathLog.
         * @typedef {proto.DeathLog.$Properties} proto.DeathLog.$Shape
         */

        /**
         * Constructs a new DeathLog.
         * @memberof proto
         * @classdesc Represents a DeathLog.
         * @constructor
         * @param {proto.DeathLog.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var DeathLog = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * DeathLog source.
         * @member {number} source
         * @memberof proto.DeathLog
         * @instance
         */
        DeathLog.prototype.source = 0;

        /**
         * DeathLog target.
         * @member {number} target
         * @memberof proto.DeathLog
         * @instance
         */
        DeathLog.prototype.target = 0;

        /**
         * DeathLog ref.
         * @member {number} ref
         * @memberof proto.DeathLog
         * @instance
         */
        DeathLog.prototype.ref = 0;

        /**
         * Creates a new DeathLog instance using the specified properties.
         * @function create
         * @memberof proto.DeathLog
         * @static
         * @param {proto.DeathLog.$Properties=} [properties] Properties to set
         * @returns {proto.DeathLog} DeathLog instance
         * @type {{
         *   (properties: proto.DeathLog.$Shape): proto.DeathLog & proto.DeathLog.$Shape;
         *   (properties?: proto.DeathLog.$Properties): proto.DeathLog;
         * }}
         */
        DeathLog.create = function(properties) {
            return new DeathLog(properties);
        };

        /**
         * Encodes the specified DeathLog message. Does not implicitly {@link proto.DeathLog.verify|verify} messages.
         * @function encode
         * @memberof proto.DeathLog
         * @static
         * @param {proto.DeathLog.$Properties} message DeathLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DeathLog.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.source != null && $Object.hasOwnProperty.call(message, "source") && message.source !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.source);
            if (message.target != null && $Object.hasOwnProperty.call(message, "target") && message.target !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.target);
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref") && message.ref !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.ref);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified DeathLog message, length delimited. Does not implicitly {@link proto.DeathLog.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.DeathLog
         * @static
         * @param {proto.DeathLog.$Properties} message DeathLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        DeathLog.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a DeathLog message from the specified reader or buffer.
         * @function decode
         * @memberof proto.DeathLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.DeathLog & proto.DeathLog.$Shape} DeathLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DeathLog.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.DeathLog(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.source = value;
                        else
                            delete message.source;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.target = value;
                        else
                            delete message.target;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.ref = value;
                        else
                            delete message.ref;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a DeathLog message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.DeathLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.DeathLog & proto.DeathLog.$Shape} DeathLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        DeathLog.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a DeathLog message.
         * @function verify
         * @memberof proto.DeathLog
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        DeathLog.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.source != null && $Object.hasOwnProperty.call(message, "source"))
                if (!$util.isInteger(message.source))
                    return "source: integer expected";
            if (message.target != null && $Object.hasOwnProperty.call(message, "target"))
                if (!$util.isInteger(message.target))
                    return "target: integer expected";
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref"))
                if (!$util.isInteger(message.ref))
                    return "ref: integer expected";
            return null;
        };

        /**
         * Creates a DeathLog message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.DeathLog
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.DeathLog} DeathLog
         */
        DeathLog.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.DeathLog)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.DeathLog: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.DeathLog();
            if (object.source != null)
                if ($Number(object.source) !== 0)
                    message.source = object.source | 0;
            if (object.target != null)
                if ($Number(object.target) !== 0)
                    message.target = object.target | 0;
            if (object.ref != null)
                if ($Number(object.ref) !== 0)
                    message.ref = object.ref | 0;
            return message;
        };

        /**
         * Creates a plain object from a DeathLog message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.DeathLog
         * @static
         * @param {proto.DeathLog} message DeathLog
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        DeathLog.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.source = 0;
                object.target = 0;
                object.ref = 0;
            }
            if (message.source != null && $Object.hasOwnProperty.call(message, "source"))
                object.source = message.source;
            if (message.target != null && $Object.hasOwnProperty.call(message, "target"))
                object.target = message.target;
            if (message.ref != null && $Object.hasOwnProperty.call(message, "ref"))
                object.ref = message.ref;
            return object;
        };

        /**
         * Converts this DeathLog to JSON.
         * @function toJSON
         * @memberof proto.DeathLog
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        DeathLog.prototype.toJSON = function() {
            return DeathLog.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for DeathLog
         * @function getTypeUrl
         * @memberof proto.DeathLog
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        DeathLog.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.DeathLog";
        };

        return DeathLog;
    })();

    proto.OtherLog = (function() {

        /**
         * Properties of an OtherLog.
         * @typedef {Object} proto.OtherLog.$Properties
         * @property {string|null} [detail] OtherLog detail
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of an OtherLog.
         * @memberof proto
         * @interface IOtherLog
         * @augments proto.OtherLog.$Properties
         * @deprecated Use proto.OtherLog.$Properties instead.
         */

        /**
         * Shape of an OtherLog.
         * @typedef {proto.OtherLog.$Properties} proto.OtherLog.$Shape
         */

        /**
         * Constructs a new OtherLog.
         * @memberof proto
         * @classdesc Represents an OtherLog.
         * @constructor
         * @param {proto.OtherLog.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var OtherLog = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * OtherLog detail.
         * @member {string} detail
         * @memberof proto.OtherLog
         * @instance
         */
        OtherLog.prototype.detail = "";

        /**
         * Creates a new OtherLog instance using the specified properties.
         * @function create
         * @memberof proto.OtherLog
         * @static
         * @param {proto.OtherLog.$Properties=} [properties] Properties to set
         * @returns {proto.OtherLog} OtherLog instance
         * @type {{
         *   (properties: proto.OtherLog.$Shape): proto.OtherLog & proto.OtherLog.$Shape;
         *   (properties?: proto.OtherLog.$Properties): proto.OtherLog;
         * }}
         */
        OtherLog.create = function(properties) {
            return new OtherLog(properties);
        };

        /**
         * Encodes the specified OtherLog message. Does not implicitly {@link proto.OtherLog.verify|verify} messages.
         * @function encode
         * @memberof proto.OtherLog
         * @static
         * @param {proto.OtherLog.$Properties} message OtherLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtherLog.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.detail != null && $Object.hasOwnProperty.call(message, "detail") && message.detail !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.detail);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified OtherLog message, length delimited. Does not implicitly {@link proto.OtherLog.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.OtherLog
         * @static
         * @param {proto.OtherLog.$Properties} message OtherLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtherLog.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes an OtherLog message from the specified reader or buffer.
         * @function decode
         * @memberof proto.OtherLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.OtherLog & proto.OtherLog.$Shape} OtherLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtherLog.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.OtherLog(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.detail = value;
                        else
                            delete message.detail;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes an OtherLog message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.OtherLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.OtherLog & proto.OtherLog.$Shape} OtherLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtherLog.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an OtherLog message.
         * @function verify
         * @memberof proto.OtherLog
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        OtherLog.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.detail != null && $Object.hasOwnProperty.call(message, "detail"))
                if (!$util.isString(message.detail))
                    return "detail: string expected";
            return null;
        };

        /**
         * Creates an OtherLog message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.OtherLog
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.OtherLog} OtherLog
         */
        OtherLog.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.OtherLog)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.OtherLog: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.OtherLog();
            if (object.detail != null)
                if (typeof object.detail !== "string" || object.detail.length)
                    message.detail = $String(object.detail);
            return message;
        };

        /**
         * Creates a plain object from an OtherLog message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.OtherLog
         * @static
         * @param {proto.OtherLog} message OtherLog
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        OtherLog.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults)
                object.detail = "";
            if (message.detail != null && $Object.hasOwnProperty.call(message, "detail"))
                object.detail = message.detail;
            return object;
        };

        /**
         * Converts this OtherLog to JSON.
         * @function toJSON
         * @memberof proto.OtherLog
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        OtherLog.prototype.toJSON = function() {
            return OtherLog.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for OtherLog
         * @function getTypeUrl
         * @memberof proto.OtherLog
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        OtherLog.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.OtherLog";
        };

        return OtherLog;
    })();

    proto.FightLog = (function() {

        /**
         * Properties of a FightLog.
         * @typedef {Object} proto.FightLog.$Properties
         * @property {number|null} [seq] FightLog seq
         * @property {proto.FightLogType|null} [type] FightLog type
         * @property {number|null} [round] FightLog round
         * @property {number|null} [stateNumber] FightLog stateNumber
         * @property {proto.AttackLog.$Properties|null} [attack] FightLog attack
         * @property {proto.RecoverLog.$Properties|null} [recover] FightLog recover
         * @property {proto.CounterLog.$Properties|null} [counter] FightLog counter
         * @property {proto.BuffLog.$Properties|null} [buff] FightLog buff
         * @property {proto.DeathLog.$Properties|null} [death] FightLog death
         * @property {proto.OtherLog.$Properties|null} [other] FightLog other
         * @property {"attack"|"recover"|"counter"|"buff"|"death"|"other"} [detail] FightLog detail
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a FightLog.
         * @memberof proto
         * @interface IFightLog
         * @augments proto.FightLog.$Properties
         * @deprecated Use proto.FightLog.$Properties instead.
         */

        /**
         * Narrowed shape of a FightLog.
         * @typedef {{
         *   seq?: number|null;
         *   type?: proto.FightLogType|null;
         *   round?: number|null;
         *   stateNumber?: number|null;
         *   attack?: proto.AttackLog.$Shape|null;
         *   recover?: proto.RecoverLog.$Shape|null;
         *   counter?: proto.CounterLog.$Shape|null;
         *   buff?: proto.BuffLog.$Shape|null;
         *   death?: proto.DeathLog.$Shape|null;
         *   other?: proto.OtherLog.$Shape|null;
         *   $unknowns?: Array.<Uint8Array>;
         * } & (
         *   ({ detail?: undefined; attack?: null; recover?: null; counter?: null; buff?: null; death?: null; other?: null }|{ detail?: "attack"; attack: proto.AttackLog.$Shape; recover?: null; counter?: null; buff?: null; death?: null; other?: null }|{ detail?: "recover"; attack?: null; recover: proto.RecoverLog.$Shape; counter?: null; buff?: null; death?: null; other?: null }|{ detail?: "counter"; attack?: null; recover?: null; counter: proto.CounterLog.$Shape; buff?: null; death?: null; other?: null }|{ detail?: "buff"; attack?: null; recover?: null; counter?: null; buff: proto.BuffLog.$Shape; death?: null; other?: null }|{ detail?: "death"; attack?: null; recover?: null; counter?: null; buff?: null; death: proto.DeathLog.$Shape; other?: null }|{ detail?: "other"; attack?: null; recover?: null; counter?: null; buff?: null; death?: null; other: proto.OtherLog.$Shape })
         * )} proto.FightLog.$Shape
         */

        /**
         * Constructs a new FightLog.
         * @memberof proto
         * @classdesc Represents a FightLog.
         * @constructor
         * @param {proto.FightLog.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var FightLog = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * FightLog seq.
         * @member {number} seq
         * @memberof proto.FightLog
         * @instance
         */
        FightLog.prototype.seq = 0;

        /**
         * FightLog type.
         * @member {proto.FightLogType} type
         * @memberof proto.FightLog
         * @instance
         */
        FightLog.prototype.type = 0;

        /**
         * FightLog round.
         * @member {number} round
         * @memberof proto.FightLog
         * @instance
         */
        FightLog.prototype.round = 0;

        /**
         * FightLog stateNumber.
         * @member {number} stateNumber
         * @memberof proto.FightLog
         * @instance
         */
        FightLog.prototype.stateNumber = 0;

        /**
         * FightLog attack.
         * @member {proto.AttackLog.$Properties|null|undefined} attack
         * @memberof proto.FightLog
         * @instance
         */
        FightLog.prototype.attack = null;

        /**
         * FightLog recover.
         * @member {proto.RecoverLog.$Properties|null|undefined} recover
         * @memberof proto.FightLog
         * @instance
         */
        FightLog.prototype.recover = null;

        /**
         * FightLog counter.
         * @member {proto.CounterLog.$Properties|null|undefined} counter
         * @memberof proto.FightLog
         * @instance
         */
        FightLog.prototype.counter = null;

        /**
         * FightLog buff.
         * @member {proto.BuffLog.$Properties|null|undefined} buff
         * @memberof proto.FightLog
         * @instance
         */
        FightLog.prototype.buff = null;

        /**
         * FightLog death.
         * @member {proto.DeathLog.$Properties|null|undefined} death
         * @memberof proto.FightLog
         * @instance
         */
        FightLog.prototype.death = null;

        /**
         * FightLog other.
         * @member {proto.OtherLog.$Properties|null|undefined} other
         * @memberof proto.FightLog
         * @instance
         */
        FightLog.prototype.other = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * FightLog detail.
         * @member {"attack"|"recover"|"counter"|"buff"|"death"|"other"|undefined} detail
         * @memberof proto.FightLog
         * @instance
         */
        $Object.defineProperty(FightLog.prototype, "detail", {
            get: $util.oneOfGetter($oneOfFields = ["attack", "recover", "counter", "buff", "death", "other"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new FightLog instance using the specified properties.
         * @function create
         * @memberof proto.FightLog
         * @static
         * @param {proto.FightLog.$Properties=} [properties] Properties to set
         * @returns {proto.FightLog} FightLog instance
         * @type {{
         *   (properties: proto.FightLog.$Shape): proto.FightLog & proto.FightLog.$Shape;
         *   (properties?: proto.FightLog.$Properties): proto.FightLog;
         * }}
         */
        FightLog.create = function(properties) {
            return new FightLog(properties);
        };

        /**
         * Encodes the specified FightLog message. Does not implicitly {@link proto.FightLog.verify|verify} messages.
         * @function encode
         * @memberof proto.FightLog
         * @static
         * @param {proto.FightLog.$Properties} message FightLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FightLog.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.seq != null && $Object.hasOwnProperty.call(message, "seq") && message.seq !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.seq);
            if (message.type != null && $Object.hasOwnProperty.call(message, "type") && message.type !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.type);
            if (message.round != null && $Object.hasOwnProperty.call(message, "round") && message.round !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.round);
            if (message.stateNumber != null && $Object.hasOwnProperty.call(message, "stateNumber") && message.stateNumber !== 0)
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.stateNumber);
            if (message.attack != null && $Object.hasOwnProperty.call(message, "attack"))
                $root.proto.AttackLog.encode(message.attack, writer.uint32(/* id 5, wireType 2 =*/42).fork(), _depth + 1).ldelim();
            if (message.recover != null && $Object.hasOwnProperty.call(message, "recover"))
                $root.proto.RecoverLog.encode(message.recover, writer.uint32(/* id 6, wireType 2 =*/50).fork(), _depth + 1).ldelim();
            if (message.counter != null && $Object.hasOwnProperty.call(message, "counter"))
                $root.proto.CounterLog.encode(message.counter, writer.uint32(/* id 7, wireType 2 =*/58).fork(), _depth + 1).ldelim();
            if (message.buff != null && $Object.hasOwnProperty.call(message, "buff"))
                $root.proto.BuffLog.encode(message.buff, writer.uint32(/* id 8, wireType 2 =*/66).fork(), _depth + 1).ldelim();
            if (message.death != null && $Object.hasOwnProperty.call(message, "death"))
                $root.proto.DeathLog.encode(message.death, writer.uint32(/* id 9, wireType 2 =*/74).fork(), _depth + 1).ldelim();
            if (message.other != null && $Object.hasOwnProperty.call(message, "other"))
                $root.proto.OtherLog.encode(message.other, writer.uint32(/* id 10, wireType 2 =*/82).fork(), _depth + 1).ldelim();
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified FightLog message, length delimited. Does not implicitly {@link proto.FightLog.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.FightLog
         * @static
         * @param {proto.FightLog.$Properties} message FightLog message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FightLog.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a FightLog message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FightLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.FightLog & proto.FightLog.$Shape} FightLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FightLog.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.FightLog(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.seq = value;
                        else
                            delete message.seq;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.type = value;
                        else
                            delete message.type;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.round = value;
                        else
                            delete message.round;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.stateNumber = value;
                        else
                            delete message.stateNumber;
                        continue;
                    }
                case 5: {
                        if (wireType !== 2)
                            break;
                        message.attack = $root.proto.AttackLog.decode(reader, reader.uint32(), $undefined, _depth + 1, message.attack);
                        message.detail = "attack";
                        continue;
                    }
                case 6: {
                        if (wireType !== 2)
                            break;
                        message.recover = $root.proto.RecoverLog.decode(reader, reader.uint32(), $undefined, _depth + 1, message.recover);
                        message.detail = "recover";
                        continue;
                    }
                case 7: {
                        if (wireType !== 2)
                            break;
                        message.counter = $root.proto.CounterLog.decode(reader, reader.uint32(), $undefined, _depth + 1, message.counter);
                        message.detail = "counter";
                        continue;
                    }
                case 8: {
                        if (wireType !== 2)
                            break;
                        message.buff = $root.proto.BuffLog.decode(reader, reader.uint32(), $undefined, _depth + 1, message.buff);
                        message.detail = "buff";
                        continue;
                    }
                case 9: {
                        if (wireType !== 2)
                            break;
                        message.death = $root.proto.DeathLog.decode(reader, reader.uint32(), $undefined, _depth + 1, message.death);
                        message.detail = "death";
                        continue;
                    }
                case 10: {
                        if (wireType !== 2)
                            break;
                        message.other = $root.proto.OtherLog.decode(reader, reader.uint32(), $undefined, _depth + 1, message.other);
                        message.detail = "other";
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a FightLog message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.FightLog
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.FightLog & proto.FightLog.$Shape} FightLog
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FightLog.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a FightLog message.
         * @function verify
         * @memberof proto.FightLog
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        FightLog.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            var properties = {};
            if (message.seq != null && $Object.hasOwnProperty.call(message, "seq"))
                if (!$util.isInteger(message.seq))
                    return "seq: integer expected";
            if (message.type != null && $Object.hasOwnProperty.call(message, "type"))
                if (typeof message.type !== "number" || (message.type | 0) !== message.type)
                    return "type: enum value expected";
            if (message.round != null && $Object.hasOwnProperty.call(message, "round"))
                if (!$util.isInteger(message.round))
                    return "round: integer expected";
            if (message.stateNumber != null && $Object.hasOwnProperty.call(message, "stateNumber"))
                if (!$util.isInteger(message.stateNumber))
                    return "stateNumber: integer expected";
            if (message.attack != null && $Object.hasOwnProperty.call(message, "attack")) {
                properties.detail = 1;
                {
                    var error = $root.proto.AttackLog.verify(message.attack, _depth + 1);
                    if (error)
                        return "attack." + error;
                }
            }
            if (message.recover != null && $Object.hasOwnProperty.call(message, "recover")) {
                if (properties.detail === 1)
                    return "detail: multiple values";
                properties.detail = 1;
                {
                    var error = $root.proto.RecoverLog.verify(message.recover, _depth + 1);
                    if (error)
                        return "recover." + error;
                }
            }
            if (message.counter != null && $Object.hasOwnProperty.call(message, "counter")) {
                if (properties.detail === 1)
                    return "detail: multiple values";
                properties.detail = 1;
                {
                    var error = $root.proto.CounterLog.verify(message.counter, _depth + 1);
                    if (error)
                        return "counter." + error;
                }
            }
            if (message.buff != null && $Object.hasOwnProperty.call(message, "buff")) {
                if (properties.detail === 1)
                    return "detail: multiple values";
                properties.detail = 1;
                {
                    var error = $root.proto.BuffLog.verify(message.buff, _depth + 1);
                    if (error)
                        return "buff." + error;
                }
            }
            if (message.death != null && $Object.hasOwnProperty.call(message, "death")) {
                if (properties.detail === 1)
                    return "detail: multiple values";
                properties.detail = 1;
                {
                    var error = $root.proto.DeathLog.verify(message.death, _depth + 1);
                    if (error)
                        return "death." + error;
                }
            }
            if (message.other != null && $Object.hasOwnProperty.call(message, "other")) {
                if (properties.detail === 1)
                    return "detail: multiple values";
                properties.detail = 1;
                {
                    var error = $root.proto.OtherLog.verify(message.other, _depth + 1);
                    if (error)
                        return "other." + error;
                }
            }
            return null;
        };

        /**
         * Creates a FightLog message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.FightLog
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.FightLog} FightLog
         */
        FightLog.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.FightLog)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.FightLog: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.FightLog();
            if (object.seq != null)
                if ($Number(object.seq) !== 0)
                    message.seq = object.seq | 0;
            if (object.type !== 0 && (typeof object.type !== "string" || $root.proto.FightLogType[object.type] !== 0))
                switch (object.type) {
                case "LOG_UNKNOWN":
                case 0:
                    message.type = 0;
                    break;
                case "LOG_ATTACK":
                case 1:
                    message.type = 1;
                    break;
                case "LOG_RECOVER":
                case 2:
                    message.type = 2;
                    break;
                case "LOG_COUNTER":
                case 3:
                    message.type = 3;
                    break;
                case "LOG_BUFF":
                case 4:
                    message.type = 4;
                    break;
                case "LOG_DEATH":
                case 5:
                    message.type = 5;
                    break;
                case "LOG_OTHER":
                case 6:
                    message.type = 6;
                    break;
                default:
                    if (typeof object.type === "number" && (object.type | 0) === object.type)
                        message.type = object.type;
                }
            if (object.round != null)
                if ($Number(object.round) !== 0)
                    message.round = object.round | 0;
            if (object.stateNumber != null)
                if ($Number(object.stateNumber) !== 0)
                    message.stateNumber = object.stateNumber | 0;
            if (object.attack != null) {
                if (!$util.isObject(object.attack))
                    throw $TypeError(".proto.FightLog.attack: object expected");
                message.attack = $root.proto.AttackLog.fromObject(object.attack, _depth + 1);
            }
            if (object.recover != null) {
                if (!$util.isObject(object.recover))
                    throw $TypeError(".proto.FightLog.recover: object expected");
                message.recover = $root.proto.RecoverLog.fromObject(object.recover, _depth + 1);
            }
            if (object.counter != null) {
                if (!$util.isObject(object.counter))
                    throw $TypeError(".proto.FightLog.counter: object expected");
                message.counter = $root.proto.CounterLog.fromObject(object.counter, _depth + 1);
            }
            if (object.buff != null) {
                if (!$util.isObject(object.buff))
                    throw $TypeError(".proto.FightLog.buff: object expected");
                message.buff = $root.proto.BuffLog.fromObject(object.buff, _depth + 1);
            }
            if (object.death != null) {
                if (!$util.isObject(object.death))
                    throw $TypeError(".proto.FightLog.death: object expected");
                message.death = $root.proto.DeathLog.fromObject(object.death, _depth + 1);
            }
            if (object.other != null) {
                if (!$util.isObject(object.other))
                    throw $TypeError(".proto.FightLog.other: object expected");
                message.other = $root.proto.OtherLog.fromObject(object.other, _depth + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a FightLog message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.FightLog
         * @static
         * @param {proto.FightLog} message FightLog
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        FightLog.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.seq = 0;
                object.type = options.enums === $String ? "LOG_UNKNOWN" : 0;
                object.round = 0;
                object.stateNumber = 0;
            }
            if (message.seq != null && $Object.hasOwnProperty.call(message, "seq"))
                object.seq = message.seq;
            if (message.type != null && $Object.hasOwnProperty.call(message, "type"))
                object.type = options.enums === $String ? $root.proto.FightLogType[message.type] === $undefined ? message.type : $root.proto.FightLogType[message.type] : message.type;
            if (message.round != null && $Object.hasOwnProperty.call(message, "round"))
                object.round = message.round;
            if (message.stateNumber != null && $Object.hasOwnProperty.call(message, "stateNumber"))
                object.stateNumber = message.stateNumber;
            if (message.attack != null && $Object.hasOwnProperty.call(message, "attack")) {
                object.attack = $root.proto.AttackLog.toObject(message.attack, options, _depth + 1);
                if (options.oneofs)
                    object.detail = "attack";
            }
            if (message.recover != null && $Object.hasOwnProperty.call(message, "recover")) {
                object.recover = $root.proto.RecoverLog.toObject(message.recover, options, _depth + 1);
                if (options.oneofs)
                    object.detail = "recover";
            }
            if (message.counter != null && $Object.hasOwnProperty.call(message, "counter")) {
                object.counter = $root.proto.CounterLog.toObject(message.counter, options, _depth + 1);
                if (options.oneofs)
                    object.detail = "counter";
            }
            if (message.buff != null && $Object.hasOwnProperty.call(message, "buff")) {
                object.buff = $root.proto.BuffLog.toObject(message.buff, options, _depth + 1);
                if (options.oneofs)
                    object.detail = "buff";
            }
            if (message.death != null && $Object.hasOwnProperty.call(message, "death")) {
                object.death = $root.proto.DeathLog.toObject(message.death, options, _depth + 1);
                if (options.oneofs)
                    object.detail = "death";
            }
            if (message.other != null && $Object.hasOwnProperty.call(message, "other")) {
                object.other = $root.proto.OtherLog.toObject(message.other, options, _depth + 1);
                if (options.oneofs)
                    object.detail = "other";
            }
            return object;
        };

        /**
         * Converts this FightLog to JSON.
         * @function toJSON
         * @memberof proto.FightLog
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        FightLog.prototype.toJSON = function() {
            return FightLog.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for FightLog
         * @function getTypeUrl
         * @memberof proto.FightLog
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        FightLog.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.FightLog";
        };

        return FightLog;
    })();

    proto.S2C_FightLogs = (function() {

        /**
         * Properties of a S2C_FightLogs.
         * @typedef {Object} proto.S2C_FightLogs.$Properties
         * @property {Array.<proto.FightLog.$Properties>|null} [logs] S2C_FightLogs logs
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a S2C_FightLogs.
         * @memberof proto
         * @interface IS2C_FightLogs
         * @augments proto.S2C_FightLogs.$Properties
         * @deprecated Use proto.S2C_FightLogs.$Properties instead.
         */

        /**
         * Shape of a S2C_FightLogs.
         * @typedef {{
         *   logs?: Array.<proto.FightLog.$Shape>|null;
         *   $unknowns?: Array.<Uint8Array>;
         * }} proto.S2C_FightLogs.$Shape
         */

        /**
         * Constructs a new S2C_FightLogs.
         * @memberof proto
         * @classdesc Represents a S2C_FightLogs.
         * @constructor
         * @param {proto.S2C_FightLogs.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var S2C_FightLogs = function (properties) {
            this.logs = [];
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * S2C_FightLogs logs.
         * @member {Array.<proto.FightLog.$Properties>} logs
         * @memberof proto.S2C_FightLogs
         * @instance
         */
        S2C_FightLogs.prototype.logs = $util.emptyArray;

        /**
         * Creates a new S2C_FightLogs instance using the specified properties.
         * @function create
         * @memberof proto.S2C_FightLogs
         * @static
         * @param {proto.S2C_FightLogs.$Properties=} [properties] Properties to set
         * @returns {proto.S2C_FightLogs} S2C_FightLogs instance
         * @type {{
         *   (properties: proto.S2C_FightLogs.$Shape): proto.S2C_FightLogs & proto.S2C_FightLogs.$Shape;
         *   (properties?: proto.S2C_FightLogs.$Properties): proto.S2C_FightLogs;
         * }}
         */
        S2C_FightLogs.create = function(properties) {
            return new S2C_FightLogs(properties);
        };

        /**
         * Encodes the specified S2C_FightLogs message. Does not implicitly {@link proto.S2C_FightLogs.verify|verify} messages.
         * @function encode
         * @memberof proto.S2C_FightLogs
         * @static
         * @param {proto.S2C_FightLogs.$Properties} message S2C_FightLogs message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        S2C_FightLogs.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.logs != null && message.logs.length)
                for (var i = 0; i < message.logs.length; ++i)
                    $root.proto.FightLog.encode(message.logs[i], writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified S2C_FightLogs message, length delimited. Does not implicitly {@link proto.S2C_FightLogs.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.S2C_FightLogs
         * @static
         * @param {proto.S2C_FightLogs.$Properties} message S2C_FightLogs message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        S2C_FightLogs.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a S2C_FightLogs message from the specified reader or buffer.
         * @function decode
         * @memberof proto.S2C_FightLogs
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.S2C_FightLogs & proto.S2C_FightLogs.$Shape} S2C_FightLogs
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        S2C_FightLogs.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.S2C_FightLogs();
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if (!(message.logs && message.logs.length))
                            message.logs = [];
                        message.logs.push($root.proto.FightLog.decode(reader, reader.uint32(), $undefined, _depth + 1));
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a S2C_FightLogs message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.S2C_FightLogs
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.S2C_FightLogs & proto.S2C_FightLogs.$Shape} S2C_FightLogs
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        S2C_FightLogs.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a S2C_FightLogs message.
         * @function verify
         * @memberof proto.S2C_FightLogs
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        S2C_FightLogs.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.logs != null && $Object.hasOwnProperty.call(message, "logs")) {
                if (!$Array.isArray(message.logs))
                    return "logs: array expected";
                for (var i = 0; i < message.logs.length; ++i) {
                    var error = $root.proto.FightLog.verify(message.logs[i], _depth + 1);
                    if (error)
                        return "logs." + error;
                }
            }
            return null;
        };

        /**
         * Creates a S2C_FightLogs message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.S2C_FightLogs
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.S2C_FightLogs} S2C_FightLogs
         */
        S2C_FightLogs.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.S2C_FightLogs)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.S2C_FightLogs: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.S2C_FightLogs();
            if (object.logs) {
                if (!$Array.isArray(object.logs))
                    throw $TypeError(".proto.S2C_FightLogs.logs: array expected");
                message.logs = $Array(object.logs.length);
                for (var i = 0; i < object.logs.length; ++i) {
                    if (!$util.isObject(object.logs[i]))
                        throw $TypeError(".proto.S2C_FightLogs.logs: object expected");
                    message.logs[i] = $root.proto.FightLog.fromObject(object.logs[i], _depth + 1);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a S2C_FightLogs message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.S2C_FightLogs
         * @static
         * @param {proto.S2C_FightLogs} message S2C_FightLogs
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        S2C_FightLogs.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.arrays || options.defaults)
                object.logs = [];
            if (message.logs && message.logs.length) {
                object.logs = $Array(message.logs.length);
                for (var j = 0; j < message.logs.length; ++j)
                    object.logs[j] = $root.proto.FightLog.toObject(message.logs[j], options, _depth + 1);
            }
            return object;
        };

        /**
         * Converts this S2C_FightLogs to JSON.
         * @function toJSON
         * @memberof proto.S2C_FightLogs
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        S2C_FightLogs.prototype.toJSON = function() {
            return S2C_FightLogs.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for S2C_FightLogs
         * @function getTypeUrl
         * @memberof proto.S2C_FightLogs
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        S2C_FightLogs.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.S2C_FightLogs";
        };

        return S2C_FightLogs;
    })();

    proto.FightMessage = (function() {

        /**
         * Properties of a FightMessage.
         * @typedef {Object} proto.FightMessage.$Properties
         * @property {number|Long|null} [sequenceId] FightMessage sequenceId
         * @property {number|Long|null} [timestamp] FightMessage timestamp
         * @property {proto.C2S_ChoseSkills.$Properties|null} [choseSkill] FightMessage choseSkill
         * @property {proto.C2S_UseTool.$Properties|null} [useTool] FightMessage useTool
         * @property {proto.C2S_SwitchPhase.$Properties|null} [switchPhase] FightMessage switchPhase
         * @property {proto.Msg_SyncFightStatus.$Properties|null} [syncFightStatus] FightMessage syncFightStatus
         * @property {proto.S2C_FightLogs.$Properties|null} [fightLogs] FightMessage fightLogs
         * @property {"choseSkill"|"useTool"|"switchPhase"|"syncFightStatus"|"fightLogs"} [payload] FightMessage payload
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a FightMessage.
         * @memberof proto
         * @interface IFightMessage
         * @augments proto.FightMessage.$Properties
         * @deprecated Use proto.FightMessage.$Properties instead.
         */

        /**
         * Narrowed shape of a FightMessage.
         * @typedef {{
         *   sequenceId?: number|Long|null;
         *   timestamp?: number|Long|null;
         *   choseSkill?: proto.C2S_ChoseSkills.$Shape|null;
         *   useTool?: proto.C2S_UseTool.$Shape|null;
         *   switchPhase?: proto.C2S_SwitchPhase.$Shape|null;
         *   syncFightStatus?: proto.Msg_SyncFightStatus.$Shape|null;
         *   fightLogs?: proto.S2C_FightLogs.$Shape|null;
         *   $unknowns?: Array.<Uint8Array>;
         * } & (
         *   ({ payload?: undefined; choseSkill?: null; useTool?: null; switchPhase?: null; syncFightStatus?: null; fightLogs?: null }|{ payload?: "choseSkill"; choseSkill: proto.C2S_ChoseSkills.$Shape; useTool?: null; switchPhase?: null; syncFightStatus?: null; fightLogs?: null }|{ payload?: "useTool"; choseSkill?: null; useTool: proto.C2S_UseTool.$Shape; switchPhase?: null; syncFightStatus?: null; fightLogs?: null }|{ payload?: "switchPhase"; choseSkill?: null; useTool?: null; switchPhase: proto.C2S_SwitchPhase.$Shape; syncFightStatus?: null; fightLogs?: null }|{ payload?: "syncFightStatus"; choseSkill?: null; useTool?: null; switchPhase?: null; syncFightStatus: proto.Msg_SyncFightStatus.$Shape; fightLogs?: null }|{ payload?: "fightLogs"; choseSkill?: null; useTool?: null; switchPhase?: null; syncFightStatus?: null; fightLogs: proto.S2C_FightLogs.$Shape })
         * )} proto.FightMessage.$Shape
         */

        /**
         * Constructs a new FightMessage.
         * @memberof proto
         * @classdesc Represents a FightMessage.
         * @constructor
         * @param {proto.FightMessage.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var FightMessage = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * FightMessage sequenceId.
         * @member {number|Long} sequenceId
         * @memberof proto.FightMessage
         * @instance
         */
        FightMessage.prototype.sequenceId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * FightMessage timestamp.
         * @member {number|Long} timestamp
         * @memberof proto.FightMessage
         * @instance
         */
        FightMessage.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * FightMessage choseSkill.
         * @member {proto.C2S_ChoseSkills.$Properties|null|undefined} choseSkill
         * @memberof proto.FightMessage
         * @instance
         */
        FightMessage.prototype.choseSkill = null;

        /**
         * FightMessage useTool.
         * @member {proto.C2S_UseTool.$Properties|null|undefined} useTool
         * @memberof proto.FightMessage
         * @instance
         */
        FightMessage.prototype.useTool = null;

        /**
         * FightMessage switchPhase.
         * @member {proto.C2S_SwitchPhase.$Properties|null|undefined} switchPhase
         * @memberof proto.FightMessage
         * @instance
         */
        FightMessage.prototype.switchPhase = null;

        /**
         * FightMessage syncFightStatus.
         * @member {proto.Msg_SyncFightStatus.$Properties|null|undefined} syncFightStatus
         * @memberof proto.FightMessage
         * @instance
         */
        FightMessage.prototype.syncFightStatus = null;

        /**
         * FightMessage fightLogs.
         * @member {proto.S2C_FightLogs.$Properties|null|undefined} fightLogs
         * @memberof proto.FightMessage
         * @instance
         */
        FightMessage.prototype.fightLogs = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * FightMessage payload.
         * @member {"choseSkill"|"useTool"|"switchPhase"|"syncFightStatus"|"fightLogs"|undefined} payload
         * @memberof proto.FightMessage
         * @instance
         */
        $Object.defineProperty(FightMessage.prototype, "payload", {
            get: $util.oneOfGetter($oneOfFields = ["choseSkill", "useTool", "switchPhase", "syncFightStatus", "fightLogs"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new FightMessage instance using the specified properties.
         * @function create
         * @memberof proto.FightMessage
         * @static
         * @param {proto.FightMessage.$Properties=} [properties] Properties to set
         * @returns {proto.FightMessage} FightMessage instance
         * @type {{
         *   (properties: proto.FightMessage.$Shape): proto.FightMessage & proto.FightMessage.$Shape;
         *   (properties?: proto.FightMessage.$Properties): proto.FightMessage;
         * }}
         */
        FightMessage.create = function(properties) {
            return new FightMessage(properties);
        };

        /**
         * Encodes the specified FightMessage message. Does not implicitly {@link proto.FightMessage.verify|verify} messages.
         * @function encode
         * @memberof proto.FightMessage
         * @static
         * @param {proto.FightMessage.$Properties} message FightMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FightMessage.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.sequenceId != null && $Object.hasOwnProperty.call(message, "sequenceId") && (typeof message.sequenceId === "object" ? message.sequenceId.low || message.sequenceId.high : message.sequenceId !== 0))
                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.sequenceId);
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp") && (typeof message.timestamp === "object" ? message.timestamp.low || message.timestamp.high : message.timestamp !== 0))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.timestamp);
            if (message.choseSkill != null && $Object.hasOwnProperty.call(message, "choseSkill"))
                $root.proto.C2S_ChoseSkills.encode(message.choseSkill, writer.uint32(/* id 3, wireType 2 =*/26).fork(), _depth + 1).ldelim();
            if (message.useTool != null && $Object.hasOwnProperty.call(message, "useTool"))
                $root.proto.C2S_UseTool.encode(message.useTool, writer.uint32(/* id 4, wireType 2 =*/34).fork(), _depth + 1).ldelim();
            if (message.switchPhase != null && $Object.hasOwnProperty.call(message, "switchPhase"))
                $root.proto.C2S_SwitchPhase.encode(message.switchPhase, writer.uint32(/* id 5, wireType 2 =*/42).fork(), _depth + 1).ldelim();
            if (message.syncFightStatus != null && $Object.hasOwnProperty.call(message, "syncFightStatus"))
                $root.proto.Msg_SyncFightStatus.encode(message.syncFightStatus, writer.uint32(/* id 6, wireType 2 =*/50).fork(), _depth + 1).ldelim();
            if (message.fightLogs != null && $Object.hasOwnProperty.call(message, "fightLogs"))
                $root.proto.S2C_FightLogs.encode(message.fightLogs, writer.uint32(/* id 7, wireType 2 =*/58).fork(), _depth + 1).ldelim();
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified FightMessage message, length delimited. Does not implicitly {@link proto.FightMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.FightMessage
         * @static
         * @param {proto.FightMessage.$Properties} message FightMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        FightMessage.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a FightMessage message from the specified reader or buffer.
         * @function decode
         * @memberof proto.FightMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.FightMessage & proto.FightMessage.$Shape} FightMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FightMessage.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.FightMessage(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.sequenceId = value;
                        else
                            delete message.sequenceId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.timestamp = value;
                        else
                            delete message.timestamp;
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        message.choseSkill = $root.proto.C2S_ChoseSkills.decode(reader, reader.uint32(), $undefined, _depth + 1, message.choseSkill);
                        message.payload = "choseSkill";
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        message.useTool = $root.proto.C2S_UseTool.decode(reader, reader.uint32(), $undefined, _depth + 1, message.useTool);
                        message.payload = "useTool";
                        continue;
                    }
                case 5: {
                        if (wireType !== 2)
                            break;
                        message.switchPhase = $root.proto.C2S_SwitchPhase.decode(reader, reader.uint32(), $undefined, _depth + 1, message.switchPhase);
                        message.payload = "switchPhase";
                        continue;
                    }
                case 6: {
                        if (wireType !== 2)
                            break;
                        message.syncFightStatus = $root.proto.Msg_SyncFightStatus.decode(reader, reader.uint32(), $undefined, _depth + 1, message.syncFightStatus);
                        message.payload = "syncFightStatus";
                        continue;
                    }
                case 7: {
                        if (wireType !== 2)
                            break;
                        message.fightLogs = $root.proto.S2C_FightLogs.decode(reader, reader.uint32(), $undefined, _depth + 1, message.fightLogs);
                        message.payload = "fightLogs";
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a FightMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.FightMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.FightMessage & proto.FightMessage.$Shape} FightMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        FightMessage.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a FightMessage message.
         * @function verify
         * @memberof proto.FightMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        FightMessage.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            var properties = {};
            if (message.sequenceId != null && $Object.hasOwnProperty.call(message, "sequenceId"))
                if (!$util.isInteger(message.sequenceId) && !(message.sequenceId && $util.isInteger(message.sequenceId.low) && $util.isInteger(message.sequenceId.high)))
                    return "sequenceId: integer|Long expected";
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp"))
                if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                    return "timestamp: integer|Long expected";
            if (message.choseSkill != null && $Object.hasOwnProperty.call(message, "choseSkill")) {
                properties.payload = 1;
                {
                    var error = $root.proto.C2S_ChoseSkills.verify(message.choseSkill, _depth + 1);
                    if (error)
                        return "choseSkill." + error;
                }
            }
            if (message.useTool != null && $Object.hasOwnProperty.call(message, "useTool")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    var error = $root.proto.C2S_UseTool.verify(message.useTool, _depth + 1);
                    if (error)
                        return "useTool." + error;
                }
            }
            if (message.switchPhase != null && $Object.hasOwnProperty.call(message, "switchPhase")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    var error = $root.proto.C2S_SwitchPhase.verify(message.switchPhase, _depth + 1);
                    if (error)
                        return "switchPhase." + error;
                }
            }
            if (message.syncFightStatus != null && $Object.hasOwnProperty.call(message, "syncFightStatus")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    var error = $root.proto.Msg_SyncFightStatus.verify(message.syncFightStatus, _depth + 1);
                    if (error)
                        return "syncFightStatus." + error;
                }
            }
            if (message.fightLogs != null && $Object.hasOwnProperty.call(message, "fightLogs")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    var error = $root.proto.S2C_FightLogs.verify(message.fightLogs, _depth + 1);
                    if (error)
                        return "fightLogs." + error;
                }
            }
            return null;
        };

        /**
         * Creates a FightMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.FightMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.FightMessage} FightMessage
         */
        FightMessage.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.FightMessage)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.FightMessage: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.FightMessage();
            if (object.sequenceId != null)
                if (typeof object.sequenceId === "object" ? object.sequenceId.low || object.sequenceId.high : $Number(object.sequenceId) !== 0)
                    if ($util.Long)
                        message.sequenceId = $util.Long.fromValue(object.sequenceId, true);
                    else if (typeof object.sequenceId === "string")
                        message.sequenceId = $parseInt(object.sequenceId, 10);
                    else if (typeof object.sequenceId === "number")
                        message.sequenceId = object.sequenceId;
                    else if (typeof object.sequenceId === "object")
                        message.sequenceId = new $util.LongBits(object.sequenceId.low >>> 0, object.sequenceId.high >>> 0).toNumber(true);
            if (object.timestamp != null)
                if (typeof object.timestamp === "object" ? object.timestamp.low || object.timestamp.high : $Number(object.timestamp) !== 0)
                    if ($util.Long)
                        message.timestamp = $util.Long.fromValue(object.timestamp, false);
                    else if (typeof object.timestamp === "string")
                        message.timestamp = $parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
            if (object.choseSkill != null) {
                if (!$util.isObject(object.choseSkill))
                    throw $TypeError(".proto.FightMessage.choseSkill: object expected");
                message.choseSkill = $root.proto.C2S_ChoseSkills.fromObject(object.choseSkill, _depth + 1);
            }
            if (object.useTool != null) {
                if (!$util.isObject(object.useTool))
                    throw $TypeError(".proto.FightMessage.useTool: object expected");
                message.useTool = $root.proto.C2S_UseTool.fromObject(object.useTool, _depth + 1);
            }
            if (object.switchPhase != null) {
                if (!$util.isObject(object.switchPhase))
                    throw $TypeError(".proto.FightMessage.switchPhase: object expected");
                message.switchPhase = $root.proto.C2S_SwitchPhase.fromObject(object.switchPhase, _depth + 1);
            }
            if (object.syncFightStatus != null) {
                if (!$util.isObject(object.syncFightStatus))
                    throw $TypeError(".proto.FightMessage.syncFightStatus: object expected");
                message.syncFightStatus = $root.proto.Msg_SyncFightStatus.fromObject(object.syncFightStatus, _depth + 1);
            }
            if (object.fightLogs != null) {
                if (!$util.isObject(object.fightLogs))
                    throw $TypeError(".proto.FightMessage.fightLogs: object expected");
                message.fightLogs = $root.proto.S2C_FightLogs.fromObject(object.fightLogs, _depth + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a FightMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.FightMessage
         * @static
         * @param {proto.FightMessage} message FightMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        FightMessage.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                if ($util.Long) {
                    var long = new $util.Long(0, 0, true);
                    object.sequenceId = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.sequenceId = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.timestamp = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.timestamp = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
            }
            if (message.sequenceId != null && $Object.hasOwnProperty.call(message, "sequenceId"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.sequenceId = typeof message.sequenceId === "number" ? $BigInt(message.sequenceId) : $util.Long.fromBits(message.sequenceId.low >>> 0, message.sequenceId.high >>> 0, true).toBigInt();
                else if (typeof message.sequenceId === "number")
                    object.sequenceId = options.longs === $String ? $String(message.sequenceId) : message.sequenceId;
                else
                    object.sequenceId = options.longs === $String ? $util.Long.prototype.toString.call(message.sequenceId) : options.longs === $Number ? new $util.LongBits(message.sequenceId.low >>> 0, message.sequenceId.high >>> 0).toNumber(true) : message.sequenceId;
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.timestamp = typeof message.timestamp === "number" ? $BigInt(message.timestamp) : $util.Long.fromBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0, false).toBigInt();
                else if (typeof message.timestamp === "number")
                    object.timestamp = options.longs === $String ? $String(message.timestamp) : message.timestamp;
                else
                    object.timestamp = options.longs === $String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === $Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber() : message.timestamp;
            if (message.choseSkill != null && $Object.hasOwnProperty.call(message, "choseSkill")) {
                object.choseSkill = $root.proto.C2S_ChoseSkills.toObject(message.choseSkill, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "choseSkill";
            }
            if (message.useTool != null && $Object.hasOwnProperty.call(message, "useTool")) {
                object.useTool = $root.proto.C2S_UseTool.toObject(message.useTool, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "useTool";
            }
            if (message.switchPhase != null && $Object.hasOwnProperty.call(message, "switchPhase")) {
                object.switchPhase = $root.proto.C2S_SwitchPhase.toObject(message.switchPhase, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "switchPhase";
            }
            if (message.syncFightStatus != null && $Object.hasOwnProperty.call(message, "syncFightStatus")) {
                object.syncFightStatus = $root.proto.Msg_SyncFightStatus.toObject(message.syncFightStatus, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "syncFightStatus";
            }
            if (message.fightLogs != null && $Object.hasOwnProperty.call(message, "fightLogs")) {
                object.fightLogs = $root.proto.S2C_FightLogs.toObject(message.fightLogs, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "fightLogs";
            }
            return object;
        };

        /**
         * Converts this FightMessage to JSON.
         * @function toJSON
         * @memberof proto.FightMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        FightMessage.prototype.toJSON = function() {
            return FightMessage.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for FightMessage
         * @function getTypeUrl
         * @memberof proto.FightMessage
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        FightMessage.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.FightMessage";
        };

        return FightMessage;
    })();

    proto.WorldPos = (function() {

        /**
         * Properties of a WorldPos.
         * @typedef {Object} proto.WorldPos.$Properties
         * @property {string|null} [mapName] WorldPos mapName
         * @property {number|null} [x] WorldPos x
         * @property {number|null} [y] WorldPos y
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a WorldPos.
         * @memberof proto
         * @interface IWorldPos
         * @augments proto.WorldPos.$Properties
         * @deprecated Use proto.WorldPos.$Properties instead.
         */

        /**
         * Shape of a WorldPos.
         * @typedef {proto.WorldPos.$Properties} proto.WorldPos.$Shape
         */

        /**
         * Constructs a new WorldPos.
         * @memberof proto
         * @classdesc Represents a WorldPos.
         * @constructor
         * @param {proto.WorldPos.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var WorldPos = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * WorldPos mapName.
         * @member {string} mapName
         * @memberof proto.WorldPos
         * @instance
         */
        WorldPos.prototype.mapName = "";

        /**
         * WorldPos x.
         * @member {number} x
         * @memberof proto.WorldPos
         * @instance
         */
        WorldPos.prototype.x = 0;

        /**
         * WorldPos y.
         * @member {number} y
         * @memberof proto.WorldPos
         * @instance
         */
        WorldPos.prototype.y = 0;

        /**
         * Creates a new WorldPos instance using the specified properties.
         * @function create
         * @memberof proto.WorldPos
         * @static
         * @param {proto.WorldPos.$Properties=} [properties] Properties to set
         * @returns {proto.WorldPos} WorldPos instance
         * @type {{
         *   (properties: proto.WorldPos.$Shape): proto.WorldPos & proto.WorldPos.$Shape;
         *   (properties?: proto.WorldPos.$Properties): proto.WorldPos;
         * }}
         */
        WorldPos.create = function(properties) {
            return new WorldPos(properties);
        };

        /**
         * Encodes the specified WorldPos message. Does not implicitly {@link proto.WorldPos.verify|verify} messages.
         * @function encode
         * @memberof proto.WorldPos
         * @static
         * @param {proto.WorldPos.$Properties} message WorldPos message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WorldPos.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.mapName != null && $Object.hasOwnProperty.call(message, "mapName") && message.mapName !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.mapName);
            if (message.x != null && $Object.hasOwnProperty.call(message, "x") && message.x !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.x);
            if (message.y != null && $Object.hasOwnProperty.call(message, "y") && message.y !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.y);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified WorldPos message, length delimited. Does not implicitly {@link proto.WorldPos.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.WorldPos
         * @static
         * @param {proto.WorldPos.$Properties} message WorldPos message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        WorldPos.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a WorldPos message from the specified reader or buffer.
         * @function decode
         * @memberof proto.WorldPos
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.WorldPos & proto.WorldPos.$Shape} WorldPos
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WorldPos.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.WorldPos(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.mapName = value;
                        else
                            delete message.mapName;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.x = value;
                        else
                            delete message.x;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.y = value;
                        else
                            delete message.y;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a WorldPos message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.WorldPos
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.WorldPos & proto.WorldPos.$Shape} WorldPos
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        WorldPos.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a WorldPos message.
         * @function verify
         * @memberof proto.WorldPos
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        WorldPos.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.mapName != null && $Object.hasOwnProperty.call(message, "mapName"))
                if (!$util.isString(message.mapName))
                    return "mapName: string expected";
            if (message.x != null && $Object.hasOwnProperty.call(message, "x"))
                if (!$util.isInteger(message.x))
                    return "x: integer expected";
            if (message.y != null && $Object.hasOwnProperty.call(message, "y"))
                if (!$util.isInteger(message.y))
                    return "y: integer expected";
            return null;
        };

        /**
         * Creates a WorldPos message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.WorldPos
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.WorldPos} WorldPos
         */
        WorldPos.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.WorldPos)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.WorldPos: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.WorldPos();
            if (object.mapName != null)
                if (typeof object.mapName !== "string" || object.mapName.length)
                    message.mapName = $String(object.mapName);
            if (object.x != null)
                if ($Number(object.x) !== 0)
                    message.x = object.x | 0;
            if (object.y != null)
                if ($Number(object.y) !== 0)
                    message.y = object.y | 0;
            return message;
        };

        /**
         * Creates a plain object from a WorldPos message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.WorldPos
         * @static
         * @param {proto.WorldPos} message WorldPos
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        WorldPos.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.mapName = "";
                object.x = 0;
                object.y = 0;
            }
            if (message.mapName != null && $Object.hasOwnProperty.call(message, "mapName"))
                object.mapName = message.mapName;
            if (message.x != null && $Object.hasOwnProperty.call(message, "x"))
                object.x = message.x;
            if (message.y != null && $Object.hasOwnProperty.call(message, "y"))
                object.y = message.y;
            return object;
        };

        /**
         * Converts this WorldPos to JSON.
         * @function toJSON
         * @memberof proto.WorldPos
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        WorldPos.prototype.toJSON = function() {
            return WorldPos.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for WorldPos
         * @function getTypeUrl
         * @memberof proto.WorldPos
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        WorldPos.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.WorldPos";
        };

        return WorldPos;
    })();

    proto.StoryProgressData = (function() {

        /**
         * Properties of a StoryProgressData.
         * @typedef {Object} proto.StoryProgressData.$Properties
         * @property {string|null} [main] StoryProgressData main
         * @property {Object.<string,string>|null} [branches] StoryProgressData branches
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a StoryProgressData.
         * @memberof proto
         * @interface IStoryProgressData
         * @augments proto.StoryProgressData.$Properties
         * @deprecated Use proto.StoryProgressData.$Properties instead.
         */

        /**
         * Shape of a StoryProgressData.
         * @typedef {proto.StoryProgressData.$Properties} proto.StoryProgressData.$Shape
         */

        /**
         * Constructs a new StoryProgressData.
         * @memberof proto
         * @classdesc Represents a StoryProgressData.
         * @constructor
         * @param {proto.StoryProgressData.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var StoryProgressData = function (properties) {
            this.branches = {};
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * StoryProgressData main.
         * @member {string} main
         * @memberof proto.StoryProgressData
         * @instance
         */
        StoryProgressData.prototype.main = "";

        /**
         * StoryProgressData branches.
         * @member {Object.<string,string>} branches
         * @memberof proto.StoryProgressData
         * @instance
         */
        StoryProgressData.prototype.branches = $util.emptyObject;

        /**
         * Creates a new StoryProgressData instance using the specified properties.
         * @function create
         * @memberof proto.StoryProgressData
         * @static
         * @param {proto.StoryProgressData.$Properties=} [properties] Properties to set
         * @returns {proto.StoryProgressData} StoryProgressData instance
         * @type {{
         *   (properties: proto.StoryProgressData.$Shape): proto.StoryProgressData & proto.StoryProgressData.$Shape;
         *   (properties?: proto.StoryProgressData.$Properties): proto.StoryProgressData;
         * }}
         */
        StoryProgressData.create = function(properties) {
            return new StoryProgressData(properties);
        };

        /**
         * Encodes the specified StoryProgressData message. Does not implicitly {@link proto.StoryProgressData.verify|verify} messages.
         * @function encode
         * @memberof proto.StoryProgressData
         * @static
         * @param {proto.StoryProgressData.$Properties} message StoryProgressData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StoryProgressData.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.main != null && $Object.hasOwnProperty.call(message, "main") && message.main !== "")
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.main);
            if (message.branches != null && $Object.hasOwnProperty.call(message, "branches"))
                for (var keys = $Object.keys(message.branches), i = 0; i < keys.length; ++i)
                    writer.uint32(/* id 2, wireType 2 =*/18).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]).uint32(/* id 2, wireType 2 =*/18).string(message.branches[keys[i]]).ldelim();
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified StoryProgressData message, length delimited. Does not implicitly {@link proto.StoryProgressData.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.StoryProgressData
         * @static
         * @param {proto.StoryProgressData.$Properties} message StoryProgressData message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StoryProgressData.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a StoryProgressData message from the specified reader or buffer.
         * @function decode
         * @memberof proto.StoryProgressData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.StoryProgressData & proto.StoryProgressData.$Shape} StoryProgressData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StoryProgressData.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.StoryProgressData(), key, value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.main = value;
                        else
                            delete message.main;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if (message.branches === $util.emptyObject)
                            message.branches = {};
                        var end2 = reader.uint32() + reader.pos;
                        key = "";
                        value = "";
                        while (reader.pos < end2) {
                            var tag2 = reader.tag();
                            wireType = tag2 & 7;
                            switch (tag2 >>>= 3) {
                            case 1:
                                if (wireType !== 2)
                                    break;
                                key = reader.stringVerify();
                                continue;
                            case 2:
                                if (wireType !== 2)
                                    break;
                                value = reader.stringVerify();
                                continue;
                            }
                            reader.skipType(wireType, _depth, tag2);
                        }
                        if (key === "__proto__")
                            $util.makeProp(message.branches, key);
                        message.branches[key] = value;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a StoryProgressData message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.StoryProgressData
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.StoryProgressData & proto.StoryProgressData.$Shape} StoryProgressData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StoryProgressData.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StoryProgressData message.
         * @function verify
         * @memberof proto.StoryProgressData
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StoryProgressData.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.main != null && $Object.hasOwnProperty.call(message, "main"))
                if (!$util.isString(message.main))
                    return "main: string expected";
            if (message.branches != null && $Object.hasOwnProperty.call(message, "branches")) {
                if (!$util.isObject(message.branches))
                    return "branches: object expected";
                var key = $Object.keys(message.branches);
                for (var i = 0; i < key.length; ++i)
                    if (!$util.isString(message.branches[key[i]]))
                        return "branches: string{k:string} expected";
            }
            return null;
        };

        /**
         * Creates a StoryProgressData message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.StoryProgressData
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.StoryProgressData} StoryProgressData
         */
        StoryProgressData.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.StoryProgressData)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.StoryProgressData: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.StoryProgressData();
            if (object.main != null)
                if (typeof object.main !== "string" || object.main.length)
                    message.main = $String(object.main);
            if (object.branches) {
                if (!$util.isObject(object.branches))
                    throw $TypeError(".proto.StoryProgressData.branches: object expected");
                message.branches = {};
                for (var keys = $Object.keys(object.branches), i = 0; i < keys.length; ++i) {
                    if (keys[i] === "__proto__")
                        $util.makeProp(message.branches, keys[i]);
                    message.branches[keys[i]] = $String(object.branches[keys[i]]);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a StoryProgressData message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.StoryProgressData
         * @static
         * @param {proto.StoryProgressData} message StoryProgressData
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StoryProgressData.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.objects || options.defaults)
                object.branches = {};
            if (options.defaults)
                object.main = "";
            if (message.main != null && $Object.hasOwnProperty.call(message, "main"))
                object.main = message.main;
            var keys2;
            if (message.branches && (keys2 = $Object.keys(message.branches)).length) {
                object.branches = {};
                for (var j = 0; j < keys2.length; ++j) {
                    if (keys2[j] === "__proto__")
                        $util.makeProp(object.branches, keys2[j]);
                    object.branches[keys2[j]] = message.branches[keys2[j]];
                }
            }
            return object;
        };

        /**
         * Converts this StoryProgressData to JSON.
         * @function toJSON
         * @memberof proto.StoryProgressData
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StoryProgressData.prototype.toJSON = function() {
            return StoryProgressData.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for StoryProgressData
         * @function getTypeUrl
         * @memberof proto.StoryProgressData
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        StoryProgressData.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.StoryProgressData";
        };

        return StoryProgressData;
    })();

    proto.C2S_Move = (function() {

        /**
         * Properties of a C2S_Move.
         * @typedef {Object} proto.C2S_Move.$Properties
         * @property {proto.WorldPos.$Properties|null} [pos] C2S_Move pos
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a C2S_Move.
         * @memberof proto
         * @interface IC2S_Move
         * @augments proto.C2S_Move.$Properties
         * @deprecated Use proto.C2S_Move.$Properties instead.
         */

        /**
         * Shape of a C2S_Move.
         * @typedef {proto.C2S_Move.$Properties} proto.C2S_Move.$Shape
         */

        /**
         * Constructs a new C2S_Move.
         * @memberof proto
         * @classdesc Represents a C2S_Move.
         * @constructor
         * @param {proto.C2S_Move.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var C2S_Move = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * C2S_Move pos.
         * @member {proto.WorldPos.$Properties|null|undefined} pos
         * @memberof proto.C2S_Move
         * @instance
         */
        C2S_Move.prototype.pos = null;

        /**
         * Creates a new C2S_Move instance using the specified properties.
         * @function create
         * @memberof proto.C2S_Move
         * @static
         * @param {proto.C2S_Move.$Properties=} [properties] Properties to set
         * @returns {proto.C2S_Move} C2S_Move instance
         * @type {{
         *   (properties: proto.C2S_Move.$Shape): proto.C2S_Move & proto.C2S_Move.$Shape;
         *   (properties?: proto.C2S_Move.$Properties): proto.C2S_Move;
         * }}
         */
        C2S_Move.create = function(properties) {
            return new C2S_Move(properties);
        };

        /**
         * Encodes the specified C2S_Move message. Does not implicitly {@link proto.C2S_Move.verify|verify} messages.
         * @function encode
         * @memberof proto.C2S_Move
         * @static
         * @param {proto.C2S_Move.$Properties} message C2S_Move message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_Move.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.pos != null && $Object.hasOwnProperty.call(message, "pos"))
                $root.proto.WorldPos.encode(message.pos, writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified C2S_Move message, length delimited. Does not implicitly {@link proto.C2S_Move.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.C2S_Move
         * @static
         * @param {proto.C2S_Move.$Properties} message C2S_Move message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_Move.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a C2S_Move message from the specified reader or buffer.
         * @function decode
         * @memberof proto.C2S_Move
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.C2S_Move & proto.C2S_Move.$Shape} C2S_Move
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_Move.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.C2S_Move(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        message.pos = $root.proto.WorldPos.decode(reader, reader.uint32(), $undefined, _depth + 1, message.pos);
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a C2S_Move message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.C2S_Move
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.C2S_Move & proto.C2S_Move.$Shape} C2S_Move
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_Move.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a C2S_Move message.
         * @function verify
         * @memberof proto.C2S_Move
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        C2S_Move.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.pos != null && $Object.hasOwnProperty.call(message, "pos")) {
                var error = $root.proto.WorldPos.verify(message.pos, _depth + 1);
                if (error)
                    return "pos." + error;
            }
            return null;
        };

        /**
         * Creates a C2S_Move message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.C2S_Move
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.C2S_Move} C2S_Move
         */
        C2S_Move.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.C2S_Move)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.C2S_Move: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.C2S_Move();
            if (object.pos != null) {
                if (!$util.isObject(object.pos))
                    throw $TypeError(".proto.C2S_Move.pos: object expected");
                message.pos = $root.proto.WorldPos.fromObject(object.pos, _depth + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a C2S_Move message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.C2S_Move
         * @static
         * @param {proto.C2S_Move} message C2S_Move
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        C2S_Move.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults)
                object.pos = null;
            if (message.pos != null && $Object.hasOwnProperty.call(message, "pos"))
                object.pos = $root.proto.WorldPos.toObject(message.pos, options, _depth + 1);
            return object;
        };

        /**
         * Converts this C2S_Move to JSON.
         * @function toJSON
         * @memberof proto.C2S_Move
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        C2S_Move.prototype.toJSON = function() {
            return C2S_Move.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for C2S_Move
         * @function getTypeUrl
         * @memberof proto.C2S_Move
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        C2S_Move.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.C2S_Move";
        };

        return C2S_Move;
    })();

    proto.C2S_StoryProgress = (function() {

        /**
         * Properties of a C2S_StoryProgress.
         * @typedef {Object} proto.C2S_StoryProgress.$Properties
         * @property {proto.StoryProgressData.$Properties|null} [progress] C2S_StoryProgress progress
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a C2S_StoryProgress.
         * @memberof proto
         * @interface IC2S_StoryProgress
         * @augments proto.C2S_StoryProgress.$Properties
         * @deprecated Use proto.C2S_StoryProgress.$Properties instead.
         */

        /**
         * Shape of a C2S_StoryProgress.
         * @typedef {proto.C2S_StoryProgress.$Properties} proto.C2S_StoryProgress.$Shape
         */

        /**
         * Constructs a new C2S_StoryProgress.
         * @memberof proto
         * @classdesc Represents a C2S_StoryProgress.
         * @constructor
         * @param {proto.C2S_StoryProgress.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var C2S_StoryProgress = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * C2S_StoryProgress progress.
         * @member {proto.StoryProgressData.$Properties|null|undefined} progress
         * @memberof proto.C2S_StoryProgress
         * @instance
         */
        C2S_StoryProgress.prototype.progress = null;

        /**
         * Creates a new C2S_StoryProgress instance using the specified properties.
         * @function create
         * @memberof proto.C2S_StoryProgress
         * @static
         * @param {proto.C2S_StoryProgress.$Properties=} [properties] Properties to set
         * @returns {proto.C2S_StoryProgress} C2S_StoryProgress instance
         * @type {{
         *   (properties: proto.C2S_StoryProgress.$Shape): proto.C2S_StoryProgress & proto.C2S_StoryProgress.$Shape;
         *   (properties?: proto.C2S_StoryProgress.$Properties): proto.C2S_StoryProgress;
         * }}
         */
        C2S_StoryProgress.create = function(properties) {
            return new C2S_StoryProgress(properties);
        };

        /**
         * Encodes the specified C2S_StoryProgress message. Does not implicitly {@link proto.C2S_StoryProgress.verify|verify} messages.
         * @function encode
         * @memberof proto.C2S_StoryProgress
         * @static
         * @param {proto.C2S_StoryProgress.$Properties} message C2S_StoryProgress message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_StoryProgress.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.progress != null && $Object.hasOwnProperty.call(message, "progress"))
                $root.proto.StoryProgressData.encode(message.progress, writer.uint32(/* id 1, wireType 2 =*/10).fork(), _depth + 1).ldelim();
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified C2S_StoryProgress message, length delimited. Does not implicitly {@link proto.C2S_StoryProgress.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.C2S_StoryProgress
         * @static
         * @param {proto.C2S_StoryProgress.$Properties} message C2S_StoryProgress message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_StoryProgress.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a C2S_StoryProgress message from the specified reader or buffer.
         * @function decode
         * @memberof proto.C2S_StoryProgress
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.C2S_StoryProgress & proto.C2S_StoryProgress.$Shape} C2S_StoryProgress
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_StoryProgress.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.C2S_StoryProgress(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 2)
                            break;
                        message.progress = $root.proto.StoryProgressData.decode(reader, reader.uint32(), $undefined, _depth + 1, message.progress);
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a C2S_StoryProgress message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.C2S_StoryProgress
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.C2S_StoryProgress & proto.C2S_StoryProgress.$Shape} C2S_StoryProgress
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_StoryProgress.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a C2S_StoryProgress message.
         * @function verify
         * @memberof proto.C2S_StoryProgress
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        C2S_StoryProgress.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.progress != null && $Object.hasOwnProperty.call(message, "progress")) {
                var error = $root.proto.StoryProgressData.verify(message.progress, _depth + 1);
                if (error)
                    return "progress." + error;
            }
            return null;
        };

        /**
         * Creates a C2S_StoryProgress message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.C2S_StoryProgress
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.C2S_StoryProgress} C2S_StoryProgress
         */
        C2S_StoryProgress.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.C2S_StoryProgress)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.C2S_StoryProgress: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.C2S_StoryProgress();
            if (object.progress != null) {
                if (!$util.isObject(object.progress))
                    throw $TypeError(".proto.C2S_StoryProgress.progress: object expected");
                message.progress = $root.proto.StoryProgressData.fromObject(object.progress, _depth + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a C2S_StoryProgress message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.C2S_StoryProgress
         * @static
         * @param {proto.C2S_StoryProgress} message C2S_StoryProgress
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        C2S_StoryProgress.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults)
                object.progress = null;
            if (message.progress != null && $Object.hasOwnProperty.call(message, "progress"))
                object.progress = $root.proto.StoryProgressData.toObject(message.progress, options, _depth + 1);
            return object;
        };

        /**
         * Converts this C2S_StoryProgress to JSON.
         * @function toJSON
         * @memberof proto.C2S_StoryProgress
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        C2S_StoryProgress.prototype.toJSON = function() {
            return C2S_StoryProgress.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for C2S_StoryProgress
         * @function getTypeUrl
         * @memberof proto.C2S_StoryProgress
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        C2S_StoryProgress.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.C2S_StoryProgress";
        };

        return C2S_StoryProgress;
    })();

    proto.C2S_SyncRequest = (function() {

        /**
         * Properties of a C2S_SyncRequest.
         * @typedef {Object} proto.C2S_SyncRequest.$Properties
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a C2S_SyncRequest.
         * @memberof proto
         * @interface IC2S_SyncRequest
         * @augments proto.C2S_SyncRequest.$Properties
         * @deprecated Use proto.C2S_SyncRequest.$Properties instead.
         */

        /**
         * Shape of a C2S_SyncRequest.
         * @typedef {proto.C2S_SyncRequest.$Properties} proto.C2S_SyncRequest.$Shape
         */

        /**
         * Constructs a new C2S_SyncRequest.
         * @memberof proto
         * @classdesc Represents a C2S_SyncRequest.
         * @constructor
         * @param {proto.C2S_SyncRequest.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var C2S_SyncRequest = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * Creates a new C2S_SyncRequest instance using the specified properties.
         * @function create
         * @memberof proto.C2S_SyncRequest
         * @static
         * @param {proto.C2S_SyncRequest.$Properties=} [properties] Properties to set
         * @returns {proto.C2S_SyncRequest} C2S_SyncRequest instance
         * @type {{
         *   (properties: proto.C2S_SyncRequest.$Shape): proto.C2S_SyncRequest & proto.C2S_SyncRequest.$Shape;
         *   (properties?: proto.C2S_SyncRequest.$Properties): proto.C2S_SyncRequest;
         * }}
         */
        C2S_SyncRequest.create = function(properties) {
            return new C2S_SyncRequest(properties);
        };

        /**
         * Encodes the specified C2S_SyncRequest message. Does not implicitly {@link proto.C2S_SyncRequest.verify|verify} messages.
         * @function encode
         * @memberof proto.C2S_SyncRequest
         * @static
         * @param {proto.C2S_SyncRequest.$Properties} message C2S_SyncRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_SyncRequest.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified C2S_SyncRequest message, length delimited. Does not implicitly {@link proto.C2S_SyncRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.C2S_SyncRequest
         * @static
         * @param {proto.C2S_SyncRequest.$Properties} message C2S_SyncRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        C2S_SyncRequest.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a C2S_SyncRequest message from the specified reader or buffer.
         * @function decode
         * @memberof proto.C2S_SyncRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.C2S_SyncRequest & proto.C2S_SyncRequest.$Shape} C2S_SyncRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_SyncRequest.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.C2S_SyncRequest();
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                reader.skipType(tag & 7, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a C2S_SyncRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.C2S_SyncRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.C2S_SyncRequest & proto.C2S_SyncRequest.$Shape} C2S_SyncRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        C2S_SyncRequest.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a C2S_SyncRequest message.
         * @function verify
         * @memberof proto.C2S_SyncRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        C2S_SyncRequest.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            return null;
        };

        /**
         * Creates a C2S_SyncRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.C2S_SyncRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.C2S_SyncRequest} C2S_SyncRequest
         */
        C2S_SyncRequest.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.C2S_SyncRequest)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.C2S_SyncRequest: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            return new $root.proto.C2S_SyncRequest();
        };

        /**
         * Creates a plain object from a C2S_SyncRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.C2S_SyncRequest
         * @static
         * @param {proto.C2S_SyncRequest} message C2S_SyncRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        C2S_SyncRequest.toObject = function () {
            return {};
        };

        /**
         * Converts this C2S_SyncRequest to JSON.
         * @function toJSON
         * @memberof proto.C2S_SyncRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        C2S_SyncRequest.prototype.toJSON = function() {
            return C2S_SyncRequest.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for C2S_SyncRequest
         * @function getTypeUrl
         * @memberof proto.C2S_SyncRequest
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        C2S_SyncRequest.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.C2S_SyncRequest";
        };

        return C2S_SyncRequest;
    })();

    proto.S2C_SyncState = (function() {

        /**
         * Properties of a S2C_SyncState.
         * @typedef {Object} proto.S2C_SyncState.$Properties
         * @property {number|null} [doing] S2C_SyncState doing
         * @property {Object.<string,string>|null} [doingMap] S2C_SyncState doingMap
         * @property {number|null} [level] S2C_SyncState level
         * @property {number|null} [exp] S2C_SyncState exp
         * @property {proto.WorldPos.$Properties|null} [location] S2C_SyncState location
         * @property {proto.StoryProgressData.$Properties|null} [story] S2C_SyncState story
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a S2C_SyncState.
         * @memberof proto
         * @interface IS2C_SyncState
         * @augments proto.S2C_SyncState.$Properties
         * @deprecated Use proto.S2C_SyncState.$Properties instead.
         */

        /**
         * Shape of a S2C_SyncState.
         * @typedef {proto.S2C_SyncState.$Properties} proto.S2C_SyncState.$Shape
         */

        /**
         * Constructs a new S2C_SyncState.
         * @memberof proto
         * @classdesc Represents a S2C_SyncState.
         * @constructor
         * @param {proto.S2C_SyncState.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var S2C_SyncState = function (properties) {
            this.doingMap = {};
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * S2C_SyncState doing.
         * @member {number} doing
         * @memberof proto.S2C_SyncState
         * @instance
         */
        S2C_SyncState.prototype.doing = 0;

        /**
         * S2C_SyncState doingMap.
         * @member {Object.<string,string>} doingMap
         * @memberof proto.S2C_SyncState
         * @instance
         */
        S2C_SyncState.prototype.doingMap = $util.emptyObject;

        /**
         * S2C_SyncState level.
         * @member {number} level
         * @memberof proto.S2C_SyncState
         * @instance
         */
        S2C_SyncState.prototype.level = 0;

        /**
         * S2C_SyncState exp.
         * @member {number} exp
         * @memberof proto.S2C_SyncState
         * @instance
         */
        S2C_SyncState.prototype.exp = 0;

        /**
         * S2C_SyncState location.
         * @member {proto.WorldPos.$Properties|null|undefined} location
         * @memberof proto.S2C_SyncState
         * @instance
         */
        S2C_SyncState.prototype.location = null;

        /**
         * S2C_SyncState story.
         * @member {proto.StoryProgressData.$Properties|null|undefined} story
         * @memberof proto.S2C_SyncState
         * @instance
         */
        S2C_SyncState.prototype.story = null;

        /**
         * Creates a new S2C_SyncState instance using the specified properties.
         * @function create
         * @memberof proto.S2C_SyncState
         * @static
         * @param {proto.S2C_SyncState.$Properties=} [properties] Properties to set
         * @returns {proto.S2C_SyncState} S2C_SyncState instance
         * @type {{
         *   (properties: proto.S2C_SyncState.$Shape): proto.S2C_SyncState & proto.S2C_SyncState.$Shape;
         *   (properties?: proto.S2C_SyncState.$Properties): proto.S2C_SyncState;
         * }}
         */
        S2C_SyncState.create = function(properties) {
            return new S2C_SyncState(properties);
        };

        /**
         * Encodes the specified S2C_SyncState message. Does not implicitly {@link proto.S2C_SyncState.verify|verify} messages.
         * @function encode
         * @memberof proto.S2C_SyncState
         * @static
         * @param {proto.S2C_SyncState.$Properties} message S2C_SyncState message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        S2C_SyncState.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.doing != null && $Object.hasOwnProperty.call(message, "doing") && message.doing !== 0)
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.doing);
            if (message.doingMap != null && $Object.hasOwnProperty.call(message, "doingMap"))
                for (var keys = $Object.keys(message.doingMap), i = 0; i < keys.length; ++i)
                    writer.uint32(/* id 2, wireType 2 =*/18).fork().uint32(/* id 1, wireType 2 =*/10).string(keys[i]).uint32(/* id 2, wireType 2 =*/18).string(message.doingMap[keys[i]]).ldelim();
            if (message.level != null && $Object.hasOwnProperty.call(message, "level") && message.level !== 0)
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.level);
            if (message.exp != null && $Object.hasOwnProperty.call(message, "exp") && message.exp !== 0)
                writer.uint32(/* id 4, wireType 0 =*/32).int32(message.exp);
            if (message.location != null && $Object.hasOwnProperty.call(message, "location"))
                $root.proto.WorldPos.encode(message.location, writer.uint32(/* id 5, wireType 2 =*/42).fork(), _depth + 1).ldelim();
            if (message.story != null && $Object.hasOwnProperty.call(message, "story"))
                $root.proto.StoryProgressData.encode(message.story, writer.uint32(/* id 6, wireType 2 =*/50).fork(), _depth + 1).ldelim();
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified S2C_SyncState message, length delimited. Does not implicitly {@link proto.S2C_SyncState.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.S2C_SyncState
         * @static
         * @param {proto.S2C_SyncState.$Properties} message S2C_SyncState message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        S2C_SyncState.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a S2C_SyncState message from the specified reader or buffer.
         * @function decode
         * @memberof proto.S2C_SyncState
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.S2C_SyncState & proto.S2C_SyncState.$Shape} S2C_SyncState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        S2C_SyncState.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.S2C_SyncState(), key, value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.doing = value;
                        else
                            delete message.doing;
                        continue;
                    }
                case 2: {
                        if (wireType !== 2)
                            break;
                        if (message.doingMap === $util.emptyObject)
                            message.doingMap = {};
                        var end2 = reader.uint32() + reader.pos;
                        key = "";
                        value = "";
                        while (reader.pos < end2) {
                            var tag2 = reader.tag();
                            wireType = tag2 & 7;
                            switch (tag2 >>>= 3) {
                            case 1:
                                if (wireType !== 2)
                                    break;
                                key = reader.stringVerify();
                                continue;
                            case 2:
                                if (wireType !== 2)
                                    break;
                                value = reader.stringVerify();
                                continue;
                            }
                            reader.skipType(wireType, _depth, tag2);
                        }
                        if (key === "__proto__")
                            $util.makeProp(message.doingMap, key);
                        message.doingMap[key] = value;
                        continue;
                    }
                case 3: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.level = value;
                        else
                            delete message.level;
                        continue;
                    }
                case 4: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.int32())
                            message.exp = value;
                        else
                            delete message.exp;
                        continue;
                    }
                case 5: {
                        if (wireType !== 2)
                            break;
                        message.location = $root.proto.WorldPos.decode(reader, reader.uint32(), $undefined, _depth + 1, message.location);
                        continue;
                    }
                case 6: {
                        if (wireType !== 2)
                            break;
                        message.story = $root.proto.StoryProgressData.decode(reader, reader.uint32(), $undefined, _depth + 1, message.story);
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a S2C_SyncState message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.S2C_SyncState
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.S2C_SyncState & proto.S2C_SyncState.$Shape} S2C_SyncState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        S2C_SyncState.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a S2C_SyncState message.
         * @function verify
         * @memberof proto.S2C_SyncState
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        S2C_SyncState.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.doing != null && $Object.hasOwnProperty.call(message, "doing"))
                if (!$util.isInteger(message.doing))
                    return "doing: integer expected";
            if (message.doingMap != null && $Object.hasOwnProperty.call(message, "doingMap")) {
                if (!$util.isObject(message.doingMap))
                    return "doingMap: object expected";
                var key = $Object.keys(message.doingMap);
                for (var i = 0; i < key.length; ++i)
                    if (!$util.isString(message.doingMap[key[i]]))
                        return "doingMap: string{k:string} expected";
            }
            if (message.level != null && $Object.hasOwnProperty.call(message, "level"))
                if (!$util.isInteger(message.level))
                    return "level: integer expected";
            if (message.exp != null && $Object.hasOwnProperty.call(message, "exp"))
                if (!$util.isInteger(message.exp))
                    return "exp: integer expected";
            if (message.location != null && $Object.hasOwnProperty.call(message, "location")) {
                var error = $root.proto.WorldPos.verify(message.location, _depth + 1);
                if (error)
                    return "location." + error;
            }
            if (message.story != null && $Object.hasOwnProperty.call(message, "story")) {
                var error = $root.proto.StoryProgressData.verify(message.story, _depth + 1);
                if (error)
                    return "story." + error;
            }
            return null;
        };

        /**
         * Creates a S2C_SyncState message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.S2C_SyncState
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.S2C_SyncState} S2C_SyncState
         */
        S2C_SyncState.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.S2C_SyncState)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.S2C_SyncState: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.S2C_SyncState();
            if (object.doing != null)
                if ($Number(object.doing) !== 0)
                    message.doing = object.doing | 0;
            if (object.doingMap) {
                if (!$util.isObject(object.doingMap))
                    throw $TypeError(".proto.S2C_SyncState.doingMap: object expected");
                message.doingMap = {};
                for (var keys = $Object.keys(object.doingMap), i = 0; i < keys.length; ++i) {
                    if (keys[i] === "__proto__")
                        $util.makeProp(message.doingMap, keys[i]);
                    message.doingMap[keys[i]] = $String(object.doingMap[keys[i]]);
                }
            }
            if (object.level != null)
                if ($Number(object.level) !== 0)
                    message.level = object.level | 0;
            if (object.exp != null)
                if ($Number(object.exp) !== 0)
                    message.exp = object.exp | 0;
            if (object.location != null) {
                if (!$util.isObject(object.location))
                    throw $TypeError(".proto.S2C_SyncState.location: object expected");
                message.location = $root.proto.WorldPos.fromObject(object.location, _depth + 1);
            }
            if (object.story != null) {
                if (!$util.isObject(object.story))
                    throw $TypeError(".proto.S2C_SyncState.story: object expected");
                message.story = $root.proto.StoryProgressData.fromObject(object.story, _depth + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a S2C_SyncState message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.S2C_SyncState
         * @static
         * @param {proto.S2C_SyncState} message S2C_SyncState
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        S2C_SyncState.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.objects || options.defaults)
                object.doingMap = {};
            if (options.defaults) {
                object.doing = 0;
                object.level = 0;
                object.exp = 0;
                object.location = null;
                object.story = null;
            }
            if (message.doing != null && $Object.hasOwnProperty.call(message, "doing"))
                object.doing = message.doing;
            var keys2;
            if (message.doingMap && (keys2 = $Object.keys(message.doingMap)).length) {
                object.doingMap = {};
                for (var j = 0; j < keys2.length; ++j) {
                    if (keys2[j] === "__proto__")
                        $util.makeProp(object.doingMap, keys2[j]);
                    object.doingMap[keys2[j]] = message.doingMap[keys2[j]];
                }
            }
            if (message.level != null && $Object.hasOwnProperty.call(message, "level"))
                object.level = message.level;
            if (message.exp != null && $Object.hasOwnProperty.call(message, "exp"))
                object.exp = message.exp;
            if (message.location != null && $Object.hasOwnProperty.call(message, "location"))
                object.location = $root.proto.WorldPos.toObject(message.location, options, _depth + 1);
            if (message.story != null && $Object.hasOwnProperty.call(message, "story"))
                object.story = $root.proto.StoryProgressData.toObject(message.story, options, _depth + 1);
            return object;
        };

        /**
         * Converts this S2C_SyncState to JSON.
         * @function toJSON
         * @memberof proto.S2C_SyncState
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        S2C_SyncState.prototype.toJSON = function() {
            return S2C_SyncState.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for S2C_SyncState
         * @function getTypeUrl
         * @memberof proto.S2C_SyncState
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        S2C_SyncState.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.S2C_SyncState";
        };

        return S2C_SyncState;
    })();

    proto.S2C_Ack = (function() {

        /**
         * Properties of a S2C_Ack.
         * @typedef {Object} proto.S2C_Ack.$Properties
         * @property {boolean|null} [ok] S2C_Ack ok
         * @property {number|null} [code] S2C_Ack code
         * @property {string|null} [reason] S2C_Ack reason
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a S2C_Ack.
         * @memberof proto
         * @interface IS2C_Ack
         * @augments proto.S2C_Ack.$Properties
         * @deprecated Use proto.S2C_Ack.$Properties instead.
         */

        /**
         * Shape of a S2C_Ack.
         * @typedef {proto.S2C_Ack.$Properties} proto.S2C_Ack.$Shape
         */

        /**
         * Constructs a new S2C_Ack.
         * @memberof proto
         * @classdesc Represents a S2C_Ack.
         * @constructor
         * @param {proto.S2C_Ack.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var S2C_Ack = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * S2C_Ack ok.
         * @member {boolean} ok
         * @memberof proto.S2C_Ack
         * @instance
         */
        S2C_Ack.prototype.ok = false;

        /**
         * S2C_Ack code.
         * @member {number} code
         * @memberof proto.S2C_Ack
         * @instance
         */
        S2C_Ack.prototype.code = 0;

        /**
         * S2C_Ack reason.
         * @member {string} reason
         * @memberof proto.S2C_Ack
         * @instance
         */
        S2C_Ack.prototype.reason = "";

        /**
         * Creates a new S2C_Ack instance using the specified properties.
         * @function create
         * @memberof proto.S2C_Ack
         * @static
         * @param {proto.S2C_Ack.$Properties=} [properties] Properties to set
         * @returns {proto.S2C_Ack} S2C_Ack instance
         * @type {{
         *   (properties: proto.S2C_Ack.$Shape): proto.S2C_Ack & proto.S2C_Ack.$Shape;
         *   (properties?: proto.S2C_Ack.$Properties): proto.S2C_Ack;
         * }}
         */
        S2C_Ack.create = function(properties) {
            return new S2C_Ack(properties);
        };

        /**
         * Encodes the specified S2C_Ack message. Does not implicitly {@link proto.S2C_Ack.verify|verify} messages.
         * @function encode
         * @memberof proto.S2C_Ack
         * @static
         * @param {proto.S2C_Ack.$Properties} message S2C_Ack message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        S2C_Ack.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.ok != null && $Object.hasOwnProperty.call(message, "ok") && message.ok !== false)
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.ok);
            if (message.code != null && $Object.hasOwnProperty.call(message, "code") && message.code !== 0)
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.code);
            if (message.reason != null && $Object.hasOwnProperty.call(message, "reason") && message.reason !== "")
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.reason);
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified S2C_Ack message, length delimited. Does not implicitly {@link proto.S2C_Ack.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.S2C_Ack
         * @static
         * @param {proto.S2C_Ack.$Properties} message S2C_Ack message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        S2C_Ack.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a S2C_Ack message from the specified reader or buffer.
         * @function decode
         * @memberof proto.S2C_Ack
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.S2C_Ack & proto.S2C_Ack.$Shape} S2C_Ack
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        S2C_Ack.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.S2C_Ack(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.bool())
                            message.ok = value;
                        else
                            delete message.ok;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (value = reader.uint32())
                            message.code = value;
                        else
                            delete message.code;
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        if ((value = reader.stringVerify()).length)
                            message.reason = value;
                        else
                            delete message.reason;
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a S2C_Ack message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.S2C_Ack
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.S2C_Ack & proto.S2C_Ack.$Shape} S2C_Ack
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        S2C_Ack.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a S2C_Ack message.
         * @function verify
         * @memberof proto.S2C_Ack
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        S2C_Ack.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            if (message.ok != null && $Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            if (message.code != null && $Object.hasOwnProperty.call(message, "code"))
                if (!$util.isInteger(message.code))
                    return "code: integer expected";
            if (message.reason != null && $Object.hasOwnProperty.call(message, "reason"))
                if (!$util.isString(message.reason))
                    return "reason: string expected";
            return null;
        };

        /**
         * Creates a S2C_Ack message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.S2C_Ack
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.S2C_Ack} S2C_Ack
         */
        S2C_Ack.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.S2C_Ack)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.S2C_Ack: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.S2C_Ack();
            if (object.ok != null)
                if (object.ok)
                    message.ok = $Boolean(object.ok);
            if (object.code != null)
                if ($Number(object.code) !== 0)
                    message.code = object.code >>> 0;
            if (object.reason != null)
                if (typeof object.reason !== "string" || object.reason.length)
                    message.reason = $String(object.reason);
            return message;
        };

        /**
         * Creates a plain object from a S2C_Ack message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.S2C_Ack
         * @static
         * @param {proto.S2C_Ack} message S2C_Ack
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        S2C_Ack.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                object.ok = false;
                object.code = 0;
                object.reason = "";
            }
            if (message.ok != null && $Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            if (message.code != null && $Object.hasOwnProperty.call(message, "code"))
                object.code = message.code;
            if (message.reason != null && $Object.hasOwnProperty.call(message, "reason"))
                object.reason = message.reason;
            return object;
        };

        /**
         * Converts this S2C_Ack to JSON.
         * @function toJSON
         * @memberof proto.S2C_Ack
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        S2C_Ack.prototype.toJSON = function() {
            return S2C_Ack.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for S2C_Ack
         * @function getTypeUrl
         * @memberof proto.S2C_Ack
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        S2C_Ack.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.S2C_Ack";
        };

        return S2C_Ack;
    })();

    proto.GlobalMessage = (function() {

        /**
         * Properties of a GlobalMessage.
         * @typedef {Object} proto.GlobalMessage.$Properties
         * @property {number|Long|null} [sequenceId] GlobalMessage sequenceId
         * @property {number|Long|null} [timestamp] GlobalMessage timestamp
         * @property {proto.C2S_Move.$Properties|null} [move] GlobalMessage move
         * @property {proto.C2S_StoryProgress.$Properties|null} [storyProgress] GlobalMessage storyProgress
         * @property {proto.C2S_SyncRequest.$Properties|null} [syncRequest] GlobalMessage syncRequest
         * @property {proto.S2C_SyncState.$Properties|null} [syncState] GlobalMessage syncState
         * @property {proto.S2C_Ack.$Properties|null} [ack] GlobalMessage ack
         * @property {"move"|"storyProgress"|"syncRequest"|"syncState"|"ack"} [payload] GlobalMessage payload
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */

        /**
         * Properties of a GlobalMessage.
         * @memberof proto
         * @interface IGlobalMessage
         * @augments proto.GlobalMessage.$Properties
         * @deprecated Use proto.GlobalMessage.$Properties instead.
         */

        /**
         * Narrowed shape of a GlobalMessage.
         * @typedef {{
         *   sequenceId?: number|Long|null;
         *   timestamp?: number|Long|null;
         *   move?: proto.C2S_Move.$Shape|null;
         *   storyProgress?: proto.C2S_StoryProgress.$Shape|null;
         *   syncRequest?: proto.C2S_SyncRequest.$Shape|null;
         *   syncState?: proto.S2C_SyncState.$Shape|null;
         *   ack?: proto.S2C_Ack.$Shape|null;
         *   $unknowns?: Array.<Uint8Array>;
         * } & (
         *   ({ payload?: undefined; move?: null; storyProgress?: null; syncRequest?: null; syncState?: null; ack?: null }|{ payload?: "move"; move: proto.C2S_Move.$Shape; storyProgress?: null; syncRequest?: null; syncState?: null; ack?: null }|{ payload?: "storyProgress"; move?: null; storyProgress: proto.C2S_StoryProgress.$Shape; syncRequest?: null; syncState?: null; ack?: null }|{ payload?: "syncRequest"; move?: null; storyProgress?: null; syncRequest: proto.C2S_SyncRequest.$Shape; syncState?: null; ack?: null }|{ payload?: "syncState"; move?: null; storyProgress?: null; syncRequest?: null; syncState: proto.S2C_SyncState.$Shape; ack?: null }|{ payload?: "ack"; move?: null; storyProgress?: null; syncRequest?: null; syncState?: null; ack: proto.S2C_Ack.$Shape })
         * )} proto.GlobalMessage.$Shape
         */

        /**
         * Constructs a new GlobalMessage.
         * @memberof proto
         * @classdesc Represents a GlobalMessage.
         * @constructor
         * @param {proto.GlobalMessage.$Properties=} [properties] Properties to set
         * @property {Array.<Uint8Array>} [$unknowns] Unknown fields preserved while decoding when enabled
         */
        var GlobalMessage = function (properties) {
            if (properties)
                for (var keys = $Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        };

        /**
         * GlobalMessage sequenceId.
         * @member {number|Long} sequenceId
         * @memberof proto.GlobalMessage
         * @instance
         */
        GlobalMessage.prototype.sequenceId = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * GlobalMessage timestamp.
         * @member {number|Long} timestamp
         * @memberof proto.GlobalMessage
         * @instance
         */
        GlobalMessage.prototype.timestamp = $util.Long ? $util.Long.fromBits(0,0,false) : 0;

        /**
         * GlobalMessage move.
         * @member {proto.C2S_Move.$Properties|null|undefined} move
         * @memberof proto.GlobalMessage
         * @instance
         */
        GlobalMessage.prototype.move = null;

        /**
         * GlobalMessage storyProgress.
         * @member {proto.C2S_StoryProgress.$Properties|null|undefined} storyProgress
         * @memberof proto.GlobalMessage
         * @instance
         */
        GlobalMessage.prototype.storyProgress = null;

        /**
         * GlobalMessage syncRequest.
         * @member {proto.C2S_SyncRequest.$Properties|null|undefined} syncRequest
         * @memberof proto.GlobalMessage
         * @instance
         */
        GlobalMessage.prototype.syncRequest = null;

        /**
         * GlobalMessage syncState.
         * @member {proto.S2C_SyncState.$Properties|null|undefined} syncState
         * @memberof proto.GlobalMessage
         * @instance
         */
        GlobalMessage.prototype.syncState = null;

        /**
         * GlobalMessage ack.
         * @member {proto.S2C_Ack.$Properties|null|undefined} ack
         * @memberof proto.GlobalMessage
         * @instance
         */
        GlobalMessage.prototype.ack = null;

        // OneOf field names bound to virtual getters and setters
        var $oneOfFields;

        /**
         * GlobalMessage payload.
         * @member {"move"|"storyProgress"|"syncRequest"|"syncState"|"ack"|undefined} payload
         * @memberof proto.GlobalMessage
         * @instance
         */
        $Object.defineProperty(GlobalMessage.prototype, "payload", {
            get: $util.oneOfGetter($oneOfFields = ["move", "storyProgress", "syncRequest", "syncState", "ack"]),
            set: $util.oneOfSetter($oneOfFields)
        });

        /**
         * Creates a new GlobalMessage instance using the specified properties.
         * @function create
         * @memberof proto.GlobalMessage
         * @static
         * @param {proto.GlobalMessage.$Properties=} [properties] Properties to set
         * @returns {proto.GlobalMessage} GlobalMessage instance
         * @type {{
         *   (properties: proto.GlobalMessage.$Shape): proto.GlobalMessage & proto.GlobalMessage.$Shape;
         *   (properties?: proto.GlobalMessage.$Properties): proto.GlobalMessage;
         * }}
         */
        GlobalMessage.create = function(properties) {
            return new GlobalMessage(properties);
        };

        /**
         * Encodes the specified GlobalMessage message. Does not implicitly {@link proto.GlobalMessage.verify|verify} messages.
         * @function encode
         * @memberof proto.GlobalMessage
         * @static
         * @param {proto.GlobalMessage.$Properties} message GlobalMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GlobalMessage.encode = function (message, writer, _depth) {
            if (!writer)
                writer = $Writer.create();
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            if (message.sequenceId != null && $Object.hasOwnProperty.call(message, "sequenceId") && (typeof message.sequenceId === "object" ? message.sequenceId.low || message.sequenceId.high : message.sequenceId !== 0))
                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.sequenceId);
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp") && (typeof message.timestamp === "object" ? message.timestamp.low || message.timestamp.high : message.timestamp !== 0))
                writer.uint32(/* id 2, wireType 0 =*/16).int64(message.timestamp);
            if (message.move != null && $Object.hasOwnProperty.call(message, "move"))
                $root.proto.C2S_Move.encode(message.move, writer.uint32(/* id 3, wireType 2 =*/26).fork(), _depth + 1).ldelim();
            if (message.storyProgress != null && $Object.hasOwnProperty.call(message, "storyProgress"))
                $root.proto.C2S_StoryProgress.encode(message.storyProgress, writer.uint32(/* id 4, wireType 2 =*/34).fork(), _depth + 1).ldelim();
            if (message.syncRequest != null && $Object.hasOwnProperty.call(message, "syncRequest"))
                $root.proto.C2S_SyncRequest.encode(message.syncRequest, writer.uint32(/* id 5, wireType 2 =*/42).fork(), _depth + 1).ldelim();
            if (message.syncState != null && $Object.hasOwnProperty.call(message, "syncState"))
                $root.proto.S2C_SyncState.encode(message.syncState, writer.uint32(/* id 6, wireType 2 =*/50).fork(), _depth + 1).ldelim();
            if (message.ack != null && $Object.hasOwnProperty.call(message, "ack"))
                $root.proto.S2C_Ack.encode(message.ack, writer.uint32(/* id 7, wireType 2 =*/58).fork(), _depth + 1).ldelim();
            if (message.$unknowns != null && $Object.hasOwnProperty.call(message, "$unknowns"))
                for (var i = 0; i < message.$unknowns.length; ++i)
                    writer.raw(message.$unknowns[i]);
            return writer;
        };

        /**
         * Encodes the specified GlobalMessage message, length delimited. Does not implicitly {@link proto.GlobalMessage.verify|verify} messages.
         * @function encodeDelimited
         * @memberof proto.GlobalMessage
         * @static
         * @param {proto.GlobalMessage.$Properties} message GlobalMessage message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GlobalMessage.encodeDelimited = function(message, writer) {
            return this.encode(message, (writer || $Writer.create()).fork()).ldelim();
        };

        /**
         * Decodes a GlobalMessage message from the specified reader or buffer.
         * @function decode
         * @memberof proto.GlobalMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {proto.GlobalMessage & proto.GlobalMessage.$Shape} GlobalMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GlobalMessage.decode = function (reader, length, _end, _depth, _target) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $Reader.recursionLimit)
                throw $Error("max depth exceeded");
            var end = length === $undefined ? reader.len : reader.pos + length, message = _target || new $root.proto.GlobalMessage(), value;
            while (reader.pos < end) {
                var start = reader.pos;
                var tag = reader.tag();
                if (tag === _end) {
                    _end = $undefined;
                    break;
                }
                var wireType = tag & 7;
                switch (tag >>>= 3) {
                case 1: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.uint64()) === "object" ? value.low || value.high : value !== 0)
                            message.sequenceId = value;
                        else
                            delete message.sequenceId;
                        continue;
                    }
                case 2: {
                        if (wireType !== 0)
                            break;
                        if (typeof (value = reader.int64()) === "object" ? value.low || value.high : value !== 0)
                            message.timestamp = value;
                        else
                            delete message.timestamp;
                        continue;
                    }
                case 3: {
                        if (wireType !== 2)
                            break;
                        message.move = $root.proto.C2S_Move.decode(reader, reader.uint32(), $undefined, _depth + 1, message.move);
                        message.payload = "move";
                        continue;
                    }
                case 4: {
                        if (wireType !== 2)
                            break;
                        message.storyProgress = $root.proto.C2S_StoryProgress.decode(reader, reader.uint32(), $undefined, _depth + 1, message.storyProgress);
                        message.payload = "storyProgress";
                        continue;
                    }
                case 5: {
                        if (wireType !== 2)
                            break;
                        message.syncRequest = $root.proto.C2S_SyncRequest.decode(reader, reader.uint32(), $undefined, _depth + 1, message.syncRequest);
                        message.payload = "syncRequest";
                        continue;
                    }
                case 6: {
                        if (wireType !== 2)
                            break;
                        message.syncState = $root.proto.S2C_SyncState.decode(reader, reader.uint32(), $undefined, _depth + 1, message.syncState);
                        message.payload = "syncState";
                        continue;
                    }
                case 7: {
                        if (wireType !== 2)
                            break;
                        message.ack = $root.proto.S2C_Ack.decode(reader, reader.uint32(), $undefined, _depth + 1, message.ack);
                        message.payload = "ack";
                        continue;
                    }
                }
                reader.skipType(wireType, _depth, tag);
                if (!reader.discardUnknown) {
                    $util.makeProp(message, "$unknowns", false);
                    (message.$unknowns || (message.$unknowns = [])).push(reader.raw(start, reader.pos));
                }
            }
            if (_end !== $undefined)
                throw $Error("missing end group");
            return message;
        };

        /**
         * Decodes a GlobalMessage message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof proto.GlobalMessage
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {proto.GlobalMessage & proto.GlobalMessage.$Shape} GlobalMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GlobalMessage.decodeDelimited = function(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GlobalMessage message.
         * @function verify
         * @memberof proto.GlobalMessage
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GlobalMessage.verify = function (message, _depth) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                return "max depth exceeded";
            var properties = {};
            if (message.sequenceId != null && $Object.hasOwnProperty.call(message, "sequenceId"))
                if (!$util.isInteger(message.sequenceId) && !(message.sequenceId && $util.isInteger(message.sequenceId.low) && $util.isInteger(message.sequenceId.high)))
                    return "sequenceId: integer|Long expected";
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp"))
                if (!$util.isInteger(message.timestamp) && !(message.timestamp && $util.isInteger(message.timestamp.low) && $util.isInteger(message.timestamp.high)))
                    return "timestamp: integer|Long expected";
            if (message.move != null && $Object.hasOwnProperty.call(message, "move")) {
                properties.payload = 1;
                {
                    var error = $root.proto.C2S_Move.verify(message.move, _depth + 1);
                    if (error)
                        return "move." + error;
                }
            }
            if (message.storyProgress != null && $Object.hasOwnProperty.call(message, "storyProgress")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    var error = $root.proto.C2S_StoryProgress.verify(message.storyProgress, _depth + 1);
                    if (error)
                        return "storyProgress." + error;
                }
            }
            if (message.syncRequest != null && $Object.hasOwnProperty.call(message, "syncRequest")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    var error = $root.proto.C2S_SyncRequest.verify(message.syncRequest, _depth + 1);
                    if (error)
                        return "syncRequest." + error;
                }
            }
            if (message.syncState != null && $Object.hasOwnProperty.call(message, "syncState")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    var error = $root.proto.S2C_SyncState.verify(message.syncState, _depth + 1);
                    if (error)
                        return "syncState." + error;
                }
            }
            if (message.ack != null && $Object.hasOwnProperty.call(message, "ack")) {
                if (properties.payload === 1)
                    return "payload: multiple values";
                properties.payload = 1;
                {
                    var error = $root.proto.S2C_Ack.verify(message.ack, _depth + 1);
                    if (error)
                        return "ack." + error;
                }
            }
            return null;
        };

        /**
         * Creates a GlobalMessage message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof proto.GlobalMessage
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {proto.GlobalMessage} GlobalMessage
         */
        GlobalMessage.fromObject = function (object, _depth) {
            if (object instanceof $root.proto.GlobalMessage)
                return object;
            if (!$util.isObject(object))
                throw $TypeError(".proto.GlobalMessage: object expected");
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var message = new $root.proto.GlobalMessage();
            if (object.sequenceId != null)
                if (typeof object.sequenceId === "object" ? object.sequenceId.low || object.sequenceId.high : $Number(object.sequenceId) !== 0)
                    if ($util.Long)
                        message.sequenceId = $util.Long.fromValue(object.sequenceId, true);
                    else if (typeof object.sequenceId === "string")
                        message.sequenceId = $parseInt(object.sequenceId, 10);
                    else if (typeof object.sequenceId === "number")
                        message.sequenceId = object.sequenceId;
                    else if (typeof object.sequenceId === "object")
                        message.sequenceId = new $util.LongBits(object.sequenceId.low >>> 0, object.sequenceId.high >>> 0).toNumber(true);
            if (object.timestamp != null)
                if (typeof object.timestamp === "object" ? object.timestamp.low || object.timestamp.high : $Number(object.timestamp) !== 0)
                    if ($util.Long)
                        message.timestamp = $util.Long.fromValue(object.timestamp, false);
                    else if (typeof object.timestamp === "string")
                        message.timestamp = $parseInt(object.timestamp, 10);
                    else if (typeof object.timestamp === "number")
                        message.timestamp = object.timestamp;
                    else if (typeof object.timestamp === "object")
                        message.timestamp = new $util.LongBits(object.timestamp.low >>> 0, object.timestamp.high >>> 0).toNumber();
            if (object.move != null) {
                if (!$util.isObject(object.move))
                    throw $TypeError(".proto.GlobalMessage.move: object expected");
                message.move = $root.proto.C2S_Move.fromObject(object.move, _depth + 1);
            }
            if (object.storyProgress != null) {
                if (!$util.isObject(object.storyProgress))
                    throw $TypeError(".proto.GlobalMessage.storyProgress: object expected");
                message.storyProgress = $root.proto.C2S_StoryProgress.fromObject(object.storyProgress, _depth + 1);
            }
            if (object.syncRequest != null) {
                if (!$util.isObject(object.syncRequest))
                    throw $TypeError(".proto.GlobalMessage.syncRequest: object expected");
                message.syncRequest = $root.proto.C2S_SyncRequest.fromObject(object.syncRequest, _depth + 1);
            }
            if (object.syncState != null) {
                if (!$util.isObject(object.syncState))
                    throw $TypeError(".proto.GlobalMessage.syncState: object expected");
                message.syncState = $root.proto.S2C_SyncState.fromObject(object.syncState, _depth + 1);
            }
            if (object.ack != null) {
                if (!$util.isObject(object.ack))
                    throw $TypeError(".proto.GlobalMessage.ack: object expected");
                message.ack = $root.proto.S2C_Ack.fromObject(object.ack, _depth + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a GlobalMessage message. Also converts values to other types if specified.
         * @function toObject
         * @memberof proto.GlobalMessage
         * @static
         * @param {proto.GlobalMessage} message GlobalMessage
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GlobalMessage.toObject = function (message, options, _depth) {
            if (!options)
                options = {};
            if (_depth === $undefined)
                _depth = 0;
            if (_depth > $util.recursionLimit)
                throw $Error("max depth exceeded");
            var object = {};
            if (options.defaults) {
                if ($util.Long) {
                    var long = new $util.Long(0, 0, true);
                    object.sequenceId = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.sequenceId = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
                if ($util.Long) {
                    var long = new $util.Long(0, 0, false);
                    object.timestamp = options.longs === $String ? long.toString() : options.longs === $Number ? long.toNumber() : typeof $BigInt !== "undefined" && options.longs === $BigInt ? long.toBigInt() : long;
                } else
                    object.timestamp = options.longs === $String ? "0" : typeof $BigInt !== "undefined" && options.longs === $BigInt ? $BigInt("0") : 0;
            }
            if (message.sequenceId != null && $Object.hasOwnProperty.call(message, "sequenceId"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.sequenceId = typeof message.sequenceId === "number" ? $BigInt(message.sequenceId) : $util.Long.fromBits(message.sequenceId.low >>> 0, message.sequenceId.high >>> 0, true).toBigInt();
                else if (typeof message.sequenceId === "number")
                    object.sequenceId = options.longs === $String ? $String(message.sequenceId) : message.sequenceId;
                else
                    object.sequenceId = options.longs === $String ? $util.Long.prototype.toString.call(message.sequenceId) : options.longs === $Number ? new $util.LongBits(message.sequenceId.low >>> 0, message.sequenceId.high >>> 0).toNumber(true) : message.sequenceId;
            if (message.timestamp != null && $Object.hasOwnProperty.call(message, "timestamp"))
                if (typeof $BigInt !== "undefined" && options.longs === $BigInt)
                    object.timestamp = typeof message.timestamp === "number" ? $BigInt(message.timestamp) : $util.Long.fromBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0, false).toBigInt();
                else if (typeof message.timestamp === "number")
                    object.timestamp = options.longs === $String ? $String(message.timestamp) : message.timestamp;
                else
                    object.timestamp = options.longs === $String ? $util.Long.prototype.toString.call(message.timestamp) : options.longs === $Number ? new $util.LongBits(message.timestamp.low >>> 0, message.timestamp.high >>> 0).toNumber() : message.timestamp;
            if (message.move != null && $Object.hasOwnProperty.call(message, "move")) {
                object.move = $root.proto.C2S_Move.toObject(message.move, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "move";
            }
            if (message.storyProgress != null && $Object.hasOwnProperty.call(message, "storyProgress")) {
                object.storyProgress = $root.proto.C2S_StoryProgress.toObject(message.storyProgress, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "storyProgress";
            }
            if (message.syncRequest != null && $Object.hasOwnProperty.call(message, "syncRequest")) {
                object.syncRequest = $root.proto.C2S_SyncRequest.toObject(message.syncRequest, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "syncRequest";
            }
            if (message.syncState != null && $Object.hasOwnProperty.call(message, "syncState")) {
                object.syncState = $root.proto.S2C_SyncState.toObject(message.syncState, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "syncState";
            }
            if (message.ack != null && $Object.hasOwnProperty.call(message, "ack")) {
                object.ack = $root.proto.S2C_Ack.toObject(message.ack, options, _depth + 1);
                if (options.oneofs)
                    object.payload = "ack";
            }
            return object;
        };

        /**
         * Converts this GlobalMessage to JSON.
         * @function toJSON
         * @memberof proto.GlobalMessage
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GlobalMessage.prototype.toJSON = function() {
            return GlobalMessage.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the type url for GlobalMessage
         * @function getTypeUrl
         * @memberof proto.GlobalMessage
         * @static
         * @param {string} [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns {string} The type url
         */
        GlobalMessage.getTypeUrl = function(prefix) {
            if (prefix === $undefined)
                prefix = "type.googleapis.com";
            return prefix + "/proto.GlobalMessage";
        };

        return GlobalMessage;
    })();

    return proto;
})();

module.exports = $root;
