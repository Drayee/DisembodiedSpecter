/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-mixed-operators, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars, default-case, jsdoc/require-param*/
"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;
var $Object = $util.global.Object, $undefined = $util.global.undefined, $Error = $util.global.Error, $TypeError = $util.global.TypeError, $String = $util.global.String, $Number = $util.global.Number, $Boolean = $util.global.Boolean, $parseInt = $util.global.parseInt, $BigInt = $util.global.BigInt;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

$root.proto = (function() {

    /**
     * Namespace proto.
     * @exports proto
     * @namespace
     */
    var proto = {};

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
