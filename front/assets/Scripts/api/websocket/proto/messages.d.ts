import * as $protobuf from "protobufjs";
import Long = require("long");

/** Namespace proto. */
export namespace proto {

    /** Switch_Phase_Option enum. */
    enum Switch_Phase_Option {

        /** START_PHASE value */
        START_PHASE = 0,

        /** EXIT_FIGHT value */
        EXIT_FIGHT = 1,

        /** RETURN_PREV_PHASE value */
        RETURN_PREV_PHASE = 2
    }

    /**
     * Properties of a Buff.
     * @deprecated Use proto.Buff.$Properties instead.
     */
    interface IBuff extends proto.Buff.$Properties {
    }

    /** Represents a Buff. */
    class Buff {

        /**
         * Constructs a new Buff.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.Buff.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** Buff buffId. */
        buffId: number;

        /** Buff time. */
        time: number;

        /**
         * Creates a new Buff instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Buff instance
         */
        static create(properties: proto.Buff.$Shape): proto.Buff & proto.Buff.$Shape;
        static create(properties?: proto.Buff.$Properties): proto.Buff;

        /**
         * Encodes the specified Buff message. Does not implicitly {@link proto.Buff.verify|verify} messages.
         * @param message Buff message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.Buff.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Buff message, length delimited. Does not implicitly {@link proto.Buff.verify|verify} messages.
         * @param message Buff message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.Buff.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Buff message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.Buff & proto.Buff.$Shape} Buff
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Buff & proto.Buff.$Shape;

        /**
         * Decodes a Buff message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.Buff & proto.Buff.$Shape} Buff
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.Buff & proto.Buff.$Shape;

        /**
         * Verifies a Buff message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Buff message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Buff
         */
        static fromObject(object: { [k: string]: any }): proto.Buff;

        /**
         * Creates a plain object from a Buff message. Also converts values to other types if specified.
         * @param message Buff
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.Buff, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Buff to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for Buff
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace Buff {

        /** Properties of a Buff. */
        interface $Properties {

            /** Buff buffId */
            buffId?: (number|null);

            /** Buff time */
            time?: (number|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a Buff. */
        type $Shape = proto.Buff.$Properties;
    }

    /**
     * Properties of a CharacterStatus.
     * @deprecated Use proto.CharacterStatus.$Properties instead.
     */
    interface ICharacterStatus extends proto.CharacterStatus.$Properties {
    }

    /** Represents a CharacterStatus. */
    class CharacterStatus {

        /**
         * Constructs a new CharacterStatus.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.CharacterStatus.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** CharacterStatus health. */
        health: number;

        /** CharacterStatus attack. */
        attack: number;

        /** CharacterStatus defense. */
        defense: number;

        /** CharacterStatus buffs. */
        buffs: proto.Buff.$Properties[];

        /** CharacterStatus isMyCharacter. */
        isMyCharacter: boolean;

        /**
         * Creates a new CharacterStatus instance using the specified properties.
         * @param [properties] Properties to set
         * @returns CharacterStatus instance
         */
        static create(properties: proto.CharacterStatus.$Shape): proto.CharacterStatus & proto.CharacterStatus.$Shape;
        static create(properties?: proto.CharacterStatus.$Properties): proto.CharacterStatus;

        /**
         * Encodes the specified CharacterStatus message. Does not implicitly {@link proto.CharacterStatus.verify|verify} messages.
         * @param message CharacterStatus message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.CharacterStatus.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified CharacterStatus message, length delimited. Does not implicitly {@link proto.CharacterStatus.verify|verify} messages.
         * @param message CharacterStatus message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.CharacterStatus.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a CharacterStatus message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.CharacterStatus & proto.CharacterStatus.$Shape} CharacterStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.CharacterStatus & proto.CharacterStatus.$Shape;

        /**
         * Decodes a CharacterStatus message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.CharacterStatus & proto.CharacterStatus.$Shape} CharacterStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.CharacterStatus & proto.CharacterStatus.$Shape;

        /**
         * Verifies a CharacterStatus message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a CharacterStatus message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns CharacterStatus
         */
        static fromObject(object: { [k: string]: any }): proto.CharacterStatus;

        /**
         * Creates a plain object from a CharacterStatus message. Also converts values to other types if specified.
         * @param message CharacterStatus
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.CharacterStatus, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this CharacterStatus to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for CharacterStatus
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace CharacterStatus {

        /** Properties of a CharacterStatus. */
        interface $Properties {

            /** CharacterStatus health */
            health?: (number|null);

            /** CharacterStatus attack */
            attack?: (number|null);

            /** CharacterStatus defense */
            defense?: (number|null);

            /** CharacterStatus buffs */
            buffs?: (proto.Buff.$Properties[]|null);

            /** CharacterStatus isMyCharacter */
            isMyCharacter?: (boolean|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a CharacterStatus. */
        type $Shape = proto.CharacterStatus.$Properties;
    }

    /**
     * Properties of a Tool.
     * @deprecated Use proto.Tool.$Properties instead.
     */
    interface ITool extends proto.Tool.$Properties {
    }

    /** Represents a Tool. */
    class Tool {

        /**
         * Constructs a new Tool.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.Tool.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** Tool toolId. */
        toolId: number;

        /** Tool count. */
        count: number;

        /**
         * Creates a new Tool instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Tool instance
         */
        static create(properties: proto.Tool.$Shape): proto.Tool & proto.Tool.$Shape;
        static create(properties?: proto.Tool.$Properties): proto.Tool;

        /**
         * Encodes the specified Tool message. Does not implicitly {@link proto.Tool.verify|verify} messages.
         * @param message Tool message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.Tool.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Tool message, length delimited. Does not implicitly {@link proto.Tool.verify|verify} messages.
         * @param message Tool message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.Tool.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Tool message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.Tool & proto.Tool.$Shape} Tool
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Tool & proto.Tool.$Shape;

        /**
         * Decodes a Tool message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.Tool & proto.Tool.$Shape} Tool
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.Tool & proto.Tool.$Shape;

        /**
         * Verifies a Tool message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Tool message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Tool
         */
        static fromObject(object: { [k: string]: any }): proto.Tool;

        /**
         * Creates a plain object from a Tool message. Also converts values to other types if specified.
         * @param message Tool
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.Tool, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Tool to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for Tool
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace Tool {

        /** Properties of a Tool. */
        interface $Properties {

            /** Tool toolId */
            toolId?: (number|null);

            /** Tool count */
            count?: (number|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a Tool. */
        type $Shape = proto.Tool.$Properties;
    }

    /**
     * Properties of a Skill.
     * @deprecated Use proto.Skill.$Properties instead.
     */
    interface ISkill extends proto.Skill.$Properties {
    }

    /** Represents a Skill. */
    class Skill {

        /**
         * Constructs a new Skill.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.Skill.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** Skill skillId. */
        skillId: number;

        /** Skill targetId. */
        targetId: number;

        /** Skill characterId. */
        characterId: number;

        /**
         * Creates a new Skill instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Skill instance
         */
        static create(properties: proto.Skill.$Shape): proto.Skill & proto.Skill.$Shape;
        static create(properties?: proto.Skill.$Properties): proto.Skill;

        /**
         * Encodes the specified Skill message. Does not implicitly {@link proto.Skill.verify|verify} messages.
         * @param message Skill message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.Skill.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Skill message, length delimited. Does not implicitly {@link proto.Skill.verify|verify} messages.
         * @param message Skill message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.Skill.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Skill message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.Skill & proto.Skill.$Shape} Skill
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Skill & proto.Skill.$Shape;

        /**
         * Decodes a Skill message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.Skill & proto.Skill.$Shape} Skill
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.Skill & proto.Skill.$Shape;

        /**
         * Verifies a Skill message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Skill message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Skill
         */
        static fromObject(object: { [k: string]: any }): proto.Skill;

        /**
         * Creates a plain object from a Skill message. Also converts values to other types if specified.
         * @param message Skill
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.Skill, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Skill to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for Skill
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace Skill {

        /** Properties of a Skill. */
        interface $Properties {

            /** Skill skillId */
            skillId?: (number|null);

            /** Skill targetId */
            targetId?: (number|null);

            /** Skill characterId */
            characterId?: (number|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a Skill. */
        type $Shape = proto.Skill.$Properties;
    }

    /**
     * Properties of a Site.
     * @deprecated Use proto.Site.$Properties instead.
     */
    interface ISite extends proto.Site.$Properties {
    }

    /** Represents a Site. */
    class Site {

        /**
         * Constructs a new Site.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.Site.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** Site isMainActionCharacter. */
        isMainActionCharacter: boolean;

        /**
         * Creates a new Site instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Site instance
         */
        static create(properties: proto.Site.$Shape): proto.Site & proto.Site.$Shape;
        static create(properties?: proto.Site.$Properties): proto.Site;

        /**
         * Encodes the specified Site message. Does not implicitly {@link proto.Site.verify|verify} messages.
         * @param message Site message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.Site.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Site message, length delimited. Does not implicitly {@link proto.Site.verify|verify} messages.
         * @param message Site message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.Site.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Site message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.Site & proto.Site.$Shape} Site
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Site & proto.Site.$Shape;

        /**
         * Decodes a Site message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.Site & proto.Site.$Shape} Site
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.Site & proto.Site.$Shape;

        /**
         * Verifies a Site message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Site message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Site
         */
        static fromObject(object: { [k: string]: any }): proto.Site;

        /**
         * Creates a plain object from a Site message. Also converts values to other types if specified.
         * @param message Site
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.Site, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Site to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for Site
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace Site {

        /** Properties of a Site. */
        interface $Properties {

            /** Site isMainActionCharacter */
            isMainActionCharacter?: (boolean|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a Site. */
        type $Shape = proto.Site.$Properties;
    }

    /**
     * Properties of a FightStatus.
     * @deprecated Use proto.FightStatus.$Properties instead.
     */
    interface IFightStatus extends proto.FightStatus.$Properties {
    }

    /** Represents a FightStatus. */
    class FightStatus {

        /**
         * Constructs a new FightStatus.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.FightStatus.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** FightStatus isSelfRound. */
        isSelfRound: boolean;

        /** FightStatus round. */
        round: number;

        /** FightStatus characters. */
        characters: proto.CharacterStatus.$Properties[];

        /** FightStatus sites. */
        sites: proto.Site.$Properties[];

        /** FightStatus tools. */
        tools: proto.Tool.$Properties[];

        /** FightStatus nowFightStatus. */
        nowFightStatus: number;

        /** FightStatus counters. */
        counters: { [k: string]: number };

        /** FightStatus stateNumber. */
        stateNumber: number;

        /**
         * Creates a new FightStatus instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FightStatus instance
         */
        static create(properties: proto.FightStatus.$Shape): proto.FightStatus & proto.FightStatus.$Shape;
        static create(properties?: proto.FightStatus.$Properties): proto.FightStatus;

        /**
         * Encodes the specified FightStatus message. Does not implicitly {@link proto.FightStatus.verify|verify} messages.
         * @param message FightStatus message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.FightStatus.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FightStatus message, length delimited. Does not implicitly {@link proto.FightStatus.verify|verify} messages.
         * @param message FightStatus message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.FightStatus.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FightStatus message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.FightStatus & proto.FightStatus.$Shape} FightStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.FightStatus & proto.FightStatus.$Shape;

        /**
         * Decodes a FightStatus message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.FightStatus & proto.FightStatus.$Shape} FightStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.FightStatus & proto.FightStatus.$Shape;

        /**
         * Verifies a FightStatus message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FightStatus message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FightStatus
         */
        static fromObject(object: { [k: string]: any }): proto.FightStatus;

        /**
         * Creates a plain object from a FightStatus message. Also converts values to other types if specified.
         * @param message FightStatus
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.FightStatus, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FightStatus to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for FightStatus
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace FightStatus {

        /** Properties of a FightStatus. */
        interface $Properties {

            /** FightStatus isSelfRound */
            isSelfRound?: (boolean|null);

            /** FightStatus round */
            round?: (number|null);

            /** FightStatus characters */
            characters?: (proto.CharacterStatus.$Properties[]|null);

            /** FightStatus sites */
            sites?: (proto.Site.$Properties[]|null);

            /** FightStatus tools */
            tools?: (proto.Tool.$Properties[]|null);

            /** FightStatus nowFightStatus */
            nowFightStatus?: (number|null);

            /** FightStatus counters */
            counters?: ({ [k: string]: number }|null);

            /** FightStatus stateNumber */
            stateNumber?: (number|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a FightStatus. */
        type $Shape = proto.FightStatus.$Properties;
    }

    /**
     * Properties of a C2S_ChoseSkills.
     * @deprecated Use proto.C2S_ChoseSkills.$Properties instead.
     */
    interface IC2S_ChoseSkills extends proto.C2S_ChoseSkills.$Properties {
    }

    /** Represents a C2S_ChoseSkills. */
    class C2S_ChoseSkills {

        /**
         * Constructs a new C2S_ChoseSkills.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.C2S_ChoseSkills.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** C2S_ChoseSkills skills. */
        skills: proto.Skill.$Properties[];

        /**
         * Creates a new C2S_ChoseSkills instance using the specified properties.
         * @param [properties] Properties to set
         * @returns C2S_ChoseSkills instance
         */
        static create(properties: proto.C2S_ChoseSkills.$Shape): proto.C2S_ChoseSkills & proto.C2S_ChoseSkills.$Shape;
        static create(properties?: proto.C2S_ChoseSkills.$Properties): proto.C2S_ChoseSkills;

        /**
         * Encodes the specified C2S_ChoseSkills message. Does not implicitly {@link proto.C2S_ChoseSkills.verify|verify} messages.
         * @param message C2S_ChoseSkills message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.C2S_ChoseSkills.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified C2S_ChoseSkills message, length delimited. Does not implicitly {@link proto.C2S_ChoseSkills.verify|verify} messages.
         * @param message C2S_ChoseSkills message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.C2S_ChoseSkills.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a C2S_ChoseSkills message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.C2S_ChoseSkills & proto.C2S_ChoseSkills.$Shape} C2S_ChoseSkills
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.C2S_ChoseSkills & proto.C2S_ChoseSkills.$Shape;

        /**
         * Decodes a C2S_ChoseSkills message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.C2S_ChoseSkills & proto.C2S_ChoseSkills.$Shape} C2S_ChoseSkills
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.C2S_ChoseSkills & proto.C2S_ChoseSkills.$Shape;

        /**
         * Verifies a C2S_ChoseSkills message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a C2S_ChoseSkills message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns C2S_ChoseSkills
         */
        static fromObject(object: { [k: string]: any }): proto.C2S_ChoseSkills;

        /**
         * Creates a plain object from a C2S_ChoseSkills message. Also converts values to other types if specified.
         * @param message C2S_ChoseSkills
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.C2S_ChoseSkills, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this C2S_ChoseSkills to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for C2S_ChoseSkills
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace C2S_ChoseSkills {

        /** Properties of a C2S_ChoseSkills. */
        interface $Properties {

            /** C2S_ChoseSkills skills */
            skills?: (proto.Skill.$Properties[]|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a C2S_ChoseSkills. */
        type $Shape = proto.C2S_ChoseSkills.$Properties;
    }

    /**
     * Properties of a C2S_UseTool.
     * @deprecated Use proto.C2S_UseTool.$Properties instead.
     */
    interface IC2S_UseTool extends proto.C2S_UseTool.$Properties {
    }

    /** Represents a C2S_UseTool. */
    class C2S_UseTool {

        /**
         * Constructs a new C2S_UseTool.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.C2S_UseTool.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** C2S_UseTool toolId. */
        toolId: number;

        /** C2S_UseTool targetId. */
        targetId: number;

        /**
         * Creates a new C2S_UseTool instance using the specified properties.
         * @param [properties] Properties to set
         * @returns C2S_UseTool instance
         */
        static create(properties: proto.C2S_UseTool.$Shape): proto.C2S_UseTool & proto.C2S_UseTool.$Shape;
        static create(properties?: proto.C2S_UseTool.$Properties): proto.C2S_UseTool;

        /**
         * Encodes the specified C2S_UseTool message. Does not implicitly {@link proto.C2S_UseTool.verify|verify} messages.
         * @param message C2S_UseTool message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.C2S_UseTool.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified C2S_UseTool message, length delimited. Does not implicitly {@link proto.C2S_UseTool.verify|verify} messages.
         * @param message C2S_UseTool message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.C2S_UseTool.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a C2S_UseTool message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.C2S_UseTool & proto.C2S_UseTool.$Shape} C2S_UseTool
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.C2S_UseTool & proto.C2S_UseTool.$Shape;

        /**
         * Decodes a C2S_UseTool message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.C2S_UseTool & proto.C2S_UseTool.$Shape} C2S_UseTool
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.C2S_UseTool & proto.C2S_UseTool.$Shape;

        /**
         * Verifies a C2S_UseTool message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a C2S_UseTool message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns C2S_UseTool
         */
        static fromObject(object: { [k: string]: any }): proto.C2S_UseTool;

        /**
         * Creates a plain object from a C2S_UseTool message. Also converts values to other types if specified.
         * @param message C2S_UseTool
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.C2S_UseTool, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this C2S_UseTool to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for C2S_UseTool
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace C2S_UseTool {

        /** Properties of a C2S_UseTool. */
        interface $Properties {

            /** C2S_UseTool toolId */
            toolId?: (number|null);

            /** C2S_UseTool targetId */
            targetId?: (number|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a C2S_UseTool. */
        type $Shape = proto.C2S_UseTool.$Properties;
    }

    /**
     * Properties of a C2S_SwitchPhase.
     * @deprecated Use proto.C2S_SwitchPhase.$Properties instead.
     */
    interface IC2S_SwitchPhase extends proto.C2S_SwitchPhase.$Properties {
    }

    /** Represents a C2S_SwitchPhase. */
    class C2S_SwitchPhase {

        /**
         * Constructs a new C2S_SwitchPhase.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.C2S_SwitchPhase.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** C2S_SwitchPhase phase. */
        phase: proto.Switch_Phase_Option;

        /**
         * Creates a new C2S_SwitchPhase instance using the specified properties.
         * @param [properties] Properties to set
         * @returns C2S_SwitchPhase instance
         */
        static create(properties: proto.C2S_SwitchPhase.$Shape): proto.C2S_SwitchPhase & proto.C2S_SwitchPhase.$Shape;
        static create(properties?: proto.C2S_SwitchPhase.$Properties): proto.C2S_SwitchPhase;

        /**
         * Encodes the specified C2S_SwitchPhase message. Does not implicitly {@link proto.C2S_SwitchPhase.verify|verify} messages.
         * @param message C2S_SwitchPhase message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.C2S_SwitchPhase.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified C2S_SwitchPhase message, length delimited. Does not implicitly {@link proto.C2S_SwitchPhase.verify|verify} messages.
         * @param message C2S_SwitchPhase message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.C2S_SwitchPhase.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a C2S_SwitchPhase message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.C2S_SwitchPhase & proto.C2S_SwitchPhase.$Shape} C2S_SwitchPhase
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.C2S_SwitchPhase & proto.C2S_SwitchPhase.$Shape;

        /**
         * Decodes a C2S_SwitchPhase message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.C2S_SwitchPhase & proto.C2S_SwitchPhase.$Shape} C2S_SwitchPhase
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.C2S_SwitchPhase & proto.C2S_SwitchPhase.$Shape;

        /**
         * Verifies a C2S_SwitchPhase message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a C2S_SwitchPhase message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns C2S_SwitchPhase
         */
        static fromObject(object: { [k: string]: any }): proto.C2S_SwitchPhase;

        /**
         * Creates a plain object from a C2S_SwitchPhase message. Also converts values to other types if specified.
         * @param message C2S_SwitchPhase
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.C2S_SwitchPhase, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this C2S_SwitchPhase to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for C2S_SwitchPhase
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace C2S_SwitchPhase {

        /** Properties of a C2S_SwitchPhase. */
        interface $Properties {

            /** C2S_SwitchPhase phase */
            phase?: (proto.Switch_Phase_Option|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a C2S_SwitchPhase. */
        type $Shape = proto.C2S_SwitchPhase.$Properties;
    }

    /**
     * Properties of a Msg_SyncFightStatus.
     * @deprecated Use proto.Msg_SyncFightStatus.$Properties instead.
     */
    interface IMsg_SyncFightStatus extends proto.Msg_SyncFightStatus.$Properties {
    }

    /** Represents a Msg_SyncFightStatus. */
    class Msg_SyncFightStatus {

        /**
         * Constructs a new Msg_SyncFightStatus.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.Msg_SyncFightStatus.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** Msg_SyncFightStatus status. */
        status?: (proto.FightStatus.$Properties|null);

        /** Msg_SyncFightStatus timestamp. */
        timestamp: (number|Long);

        /**
         * Creates a new Msg_SyncFightStatus instance using the specified properties.
         * @param [properties] Properties to set
         * @returns Msg_SyncFightStatus instance
         */
        static create(properties: proto.Msg_SyncFightStatus.$Shape): proto.Msg_SyncFightStatus & proto.Msg_SyncFightStatus.$Shape;
        static create(properties?: proto.Msg_SyncFightStatus.$Properties): proto.Msg_SyncFightStatus;

        /**
         * Encodes the specified Msg_SyncFightStatus message. Does not implicitly {@link proto.Msg_SyncFightStatus.verify|verify} messages.
         * @param message Msg_SyncFightStatus message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.Msg_SyncFightStatus.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified Msg_SyncFightStatus message, length delimited. Does not implicitly {@link proto.Msg_SyncFightStatus.verify|verify} messages.
         * @param message Msg_SyncFightStatus message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.Msg_SyncFightStatus.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a Msg_SyncFightStatus message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.Msg_SyncFightStatus & proto.Msg_SyncFightStatus.$Shape} Msg_SyncFightStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.Msg_SyncFightStatus & proto.Msg_SyncFightStatus.$Shape;

        /**
         * Decodes a Msg_SyncFightStatus message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.Msg_SyncFightStatus & proto.Msg_SyncFightStatus.$Shape} Msg_SyncFightStatus
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.Msg_SyncFightStatus & proto.Msg_SyncFightStatus.$Shape;

        /**
         * Verifies a Msg_SyncFightStatus message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a Msg_SyncFightStatus message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns Msg_SyncFightStatus
         */
        static fromObject(object: { [k: string]: any }): proto.Msg_SyncFightStatus;

        /**
         * Creates a plain object from a Msg_SyncFightStatus message. Also converts values to other types if specified.
         * @param message Msg_SyncFightStatus
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.Msg_SyncFightStatus, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this Msg_SyncFightStatus to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for Msg_SyncFightStatus
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace Msg_SyncFightStatus {

        /** Properties of a Msg_SyncFightStatus. */
        interface $Properties {

            /** Msg_SyncFightStatus status */
            status?: (proto.FightStatus.$Properties|null);

            /** Msg_SyncFightStatus timestamp */
            timestamp?: (number|Long|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a Msg_SyncFightStatus. */
        type $Shape = proto.Msg_SyncFightStatus.$Properties;
    }

    /**
     * Properties of a FightMessage.
     * @deprecated Use proto.FightMessage.$Properties instead.
     */
    interface IFightMessage extends proto.FightMessage.$Properties {
    }

    /** Represents a FightMessage. */
    class FightMessage {

        /**
         * Constructs a new FightMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.FightMessage.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** FightMessage sequenceId. */
        sequenceId: (number|Long);

        /** FightMessage timestamp. */
        timestamp: (number|Long);

        /** FightMessage choseSkill. */
        choseSkill?: (proto.C2S_ChoseSkills.$Properties|null);

        /** FightMessage useTool. */
        useTool?: (proto.C2S_UseTool.$Properties|null);

        /** FightMessage switchPhase. */
        switchPhase?: (proto.C2S_SwitchPhase.$Properties|null);

        /** FightMessage syncFightStatus. */
        syncFightStatus?: (proto.Msg_SyncFightStatus.$Properties|null);

        /** FightMessage payload. */
        payload?: ("choseSkill"|"useTool"|"switchPhase"|"syncFightStatus");

        /**
         * Creates a new FightMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns FightMessage instance
         */
        static create(properties: proto.FightMessage.$Shape): proto.FightMessage & proto.FightMessage.$Shape;
        static create(properties?: proto.FightMessage.$Properties): proto.FightMessage;

        /**
         * Encodes the specified FightMessage message. Does not implicitly {@link proto.FightMessage.verify|verify} messages.
         * @param message FightMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.FightMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified FightMessage message, length delimited. Does not implicitly {@link proto.FightMessage.verify|verify} messages.
         * @param message FightMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.FightMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a FightMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.FightMessage & proto.FightMessage.$Shape} FightMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.FightMessage & proto.FightMessage.$Shape;

        /**
         * Decodes a FightMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.FightMessage & proto.FightMessage.$Shape} FightMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.FightMessage & proto.FightMessage.$Shape;

        /**
         * Verifies a FightMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a FightMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns FightMessage
         */
        static fromObject(object: { [k: string]: any }): proto.FightMessage;

        /**
         * Creates a plain object from a FightMessage message. Also converts values to other types if specified.
         * @param message FightMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.FightMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this FightMessage to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for FightMessage
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace FightMessage {

        /** Properties of a FightMessage. */
        interface $Properties {

            /** FightMessage sequenceId */
            sequenceId?: (number|Long|null);

            /** FightMessage timestamp */
            timestamp?: (number|Long|null);

            /** FightMessage choseSkill */
            choseSkill?: (proto.C2S_ChoseSkills.$Properties|null);

            /** FightMessage useTool */
            useTool?: (proto.C2S_UseTool.$Properties|null);

            /** FightMessage switchPhase */
            switchPhase?: (proto.C2S_SwitchPhase.$Properties|null);

            /** FightMessage syncFightStatus */
            syncFightStatus?: (proto.Msg_SyncFightStatus.$Properties|null);

            /** FightMessage payload */
            payload?: ("choseSkill"|"useTool"|"switchPhase"|"syncFightStatus");

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Narrowed shape of a FightMessage. */
        type $Shape = {
          sequenceId?: number|Long|null;
          timestamp?: number|Long|null;
          choseSkill?: proto.C2S_ChoseSkills.$Shape|null;
          useTool?: proto.C2S_UseTool.$Shape|null;
          switchPhase?: proto.C2S_SwitchPhase.$Shape|null;
          syncFightStatus?: proto.Msg_SyncFightStatus.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ payload?: undefined; choseSkill?: null; useTool?: null; switchPhase?: null; syncFightStatus?: null }|{ payload?: "choseSkill"; choseSkill: proto.C2S_ChoseSkills.$Shape; useTool?: null; switchPhase?: null; syncFightStatus?: null }|{ payload?: "useTool"; choseSkill?: null; useTool: proto.C2S_UseTool.$Shape; switchPhase?: null; syncFightStatus?: null }|{ payload?: "switchPhase"; choseSkill?: null; useTool?: null; switchPhase: proto.C2S_SwitchPhase.$Shape; syncFightStatus?: null }|{ payload?: "syncFightStatus"; choseSkill?: null; useTool?: null; switchPhase?: null; syncFightStatus: proto.Msg_SyncFightStatus.$Shape })
        );
    }

    /**
     * Properties of a WorldPos.
     * @deprecated Use proto.WorldPos.$Properties instead.
     */
    interface IWorldPos extends proto.WorldPos.$Properties {
    }

    /** Represents a WorldPos. */
    class WorldPos {

        /**
         * Constructs a new WorldPos.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.WorldPos.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** WorldPos mapName. */
        mapName: string;

        /** WorldPos x. */
        x: number;

        /** WorldPos y. */
        y: number;

        /**
         * Creates a new WorldPos instance using the specified properties.
         * @param [properties] Properties to set
         * @returns WorldPos instance
         */
        static create(properties: proto.WorldPos.$Shape): proto.WorldPos & proto.WorldPos.$Shape;
        static create(properties?: proto.WorldPos.$Properties): proto.WorldPos;

        /**
         * Encodes the specified WorldPos message. Does not implicitly {@link proto.WorldPos.verify|verify} messages.
         * @param message WorldPos message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.WorldPos.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified WorldPos message, length delimited. Does not implicitly {@link proto.WorldPos.verify|verify} messages.
         * @param message WorldPos message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.WorldPos.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a WorldPos message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.WorldPos & proto.WorldPos.$Shape} WorldPos
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.WorldPos & proto.WorldPos.$Shape;

        /**
         * Decodes a WorldPos message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.WorldPos & proto.WorldPos.$Shape} WorldPos
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.WorldPos & proto.WorldPos.$Shape;

        /**
         * Verifies a WorldPos message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a WorldPos message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns WorldPos
         */
        static fromObject(object: { [k: string]: any }): proto.WorldPos;

        /**
         * Creates a plain object from a WorldPos message. Also converts values to other types if specified.
         * @param message WorldPos
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.WorldPos, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this WorldPos to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for WorldPos
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace WorldPos {

        /** Properties of a WorldPos. */
        interface $Properties {

            /** WorldPos mapName */
            mapName?: (string|null);

            /** WorldPos x */
            x?: (number|null);

            /** WorldPos y */
            y?: (number|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a WorldPos. */
        type $Shape = proto.WorldPos.$Properties;
    }

    /**
     * Properties of a StoryProgressData.
     * @deprecated Use proto.StoryProgressData.$Properties instead.
     */
    interface IStoryProgressData extends proto.StoryProgressData.$Properties {
    }

    /** Represents a StoryProgressData. */
    class StoryProgressData {

        /**
         * Constructs a new StoryProgressData.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.StoryProgressData.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** StoryProgressData main. */
        main: string;

        /** StoryProgressData branches. */
        branches: { [k: string]: string };

        /**
         * Creates a new StoryProgressData instance using the specified properties.
         * @param [properties] Properties to set
         * @returns StoryProgressData instance
         */
        static create(properties: proto.StoryProgressData.$Shape): proto.StoryProgressData & proto.StoryProgressData.$Shape;
        static create(properties?: proto.StoryProgressData.$Properties): proto.StoryProgressData;

        /**
         * Encodes the specified StoryProgressData message. Does not implicitly {@link proto.StoryProgressData.verify|verify} messages.
         * @param message StoryProgressData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.StoryProgressData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified StoryProgressData message, length delimited. Does not implicitly {@link proto.StoryProgressData.verify|verify} messages.
         * @param message StoryProgressData message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.StoryProgressData.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a StoryProgressData message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.StoryProgressData & proto.StoryProgressData.$Shape} StoryProgressData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.StoryProgressData & proto.StoryProgressData.$Shape;

        /**
         * Decodes a StoryProgressData message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.StoryProgressData & proto.StoryProgressData.$Shape} StoryProgressData
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.StoryProgressData & proto.StoryProgressData.$Shape;

        /**
         * Verifies a StoryProgressData message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a StoryProgressData message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns StoryProgressData
         */
        static fromObject(object: { [k: string]: any }): proto.StoryProgressData;

        /**
         * Creates a plain object from a StoryProgressData message. Also converts values to other types if specified.
         * @param message StoryProgressData
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.StoryProgressData, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this StoryProgressData to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for StoryProgressData
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace StoryProgressData {

        /** Properties of a StoryProgressData. */
        interface $Properties {

            /** StoryProgressData main */
            main?: (string|null);

            /** StoryProgressData branches */
            branches?: ({ [k: string]: string }|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a StoryProgressData. */
        type $Shape = proto.StoryProgressData.$Properties;
    }

    /**
     * Properties of a C2S_Move.
     * @deprecated Use proto.C2S_Move.$Properties instead.
     */
    interface IC2S_Move extends proto.C2S_Move.$Properties {
    }

    /** Represents a C2S_Move. */
    class C2S_Move {

        /**
         * Constructs a new C2S_Move.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.C2S_Move.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** C2S_Move pos. */
        pos?: (proto.WorldPos.$Properties|null);

        /**
         * Creates a new C2S_Move instance using the specified properties.
         * @param [properties] Properties to set
         * @returns C2S_Move instance
         */
        static create(properties: proto.C2S_Move.$Shape): proto.C2S_Move & proto.C2S_Move.$Shape;
        static create(properties?: proto.C2S_Move.$Properties): proto.C2S_Move;

        /**
         * Encodes the specified C2S_Move message. Does not implicitly {@link proto.C2S_Move.verify|verify} messages.
         * @param message C2S_Move message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.C2S_Move.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified C2S_Move message, length delimited. Does not implicitly {@link proto.C2S_Move.verify|verify} messages.
         * @param message C2S_Move message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.C2S_Move.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a C2S_Move message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.C2S_Move & proto.C2S_Move.$Shape} C2S_Move
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.C2S_Move & proto.C2S_Move.$Shape;

        /**
         * Decodes a C2S_Move message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.C2S_Move & proto.C2S_Move.$Shape} C2S_Move
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.C2S_Move & proto.C2S_Move.$Shape;

        /**
         * Verifies a C2S_Move message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a C2S_Move message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns C2S_Move
         */
        static fromObject(object: { [k: string]: any }): proto.C2S_Move;

        /**
         * Creates a plain object from a C2S_Move message. Also converts values to other types if specified.
         * @param message C2S_Move
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.C2S_Move, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this C2S_Move to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for C2S_Move
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace C2S_Move {

        /** Properties of a C2S_Move. */
        interface $Properties {

            /** C2S_Move pos */
            pos?: (proto.WorldPos.$Properties|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a C2S_Move. */
        type $Shape = proto.C2S_Move.$Properties;
    }

    /**
     * Properties of a C2S_StoryProgress.
     * @deprecated Use proto.C2S_StoryProgress.$Properties instead.
     */
    interface IC2S_StoryProgress extends proto.C2S_StoryProgress.$Properties {
    }

    /** Represents a C2S_StoryProgress. */
    class C2S_StoryProgress {

        /**
         * Constructs a new C2S_StoryProgress.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.C2S_StoryProgress.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** C2S_StoryProgress progress. */
        progress?: (proto.StoryProgressData.$Properties|null);

        /**
         * Creates a new C2S_StoryProgress instance using the specified properties.
         * @param [properties] Properties to set
         * @returns C2S_StoryProgress instance
         */
        static create(properties: proto.C2S_StoryProgress.$Shape): proto.C2S_StoryProgress & proto.C2S_StoryProgress.$Shape;
        static create(properties?: proto.C2S_StoryProgress.$Properties): proto.C2S_StoryProgress;

        /**
         * Encodes the specified C2S_StoryProgress message. Does not implicitly {@link proto.C2S_StoryProgress.verify|verify} messages.
         * @param message C2S_StoryProgress message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.C2S_StoryProgress.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified C2S_StoryProgress message, length delimited. Does not implicitly {@link proto.C2S_StoryProgress.verify|verify} messages.
         * @param message C2S_StoryProgress message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.C2S_StoryProgress.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a C2S_StoryProgress message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.C2S_StoryProgress & proto.C2S_StoryProgress.$Shape} C2S_StoryProgress
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.C2S_StoryProgress & proto.C2S_StoryProgress.$Shape;

        /**
         * Decodes a C2S_StoryProgress message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.C2S_StoryProgress & proto.C2S_StoryProgress.$Shape} C2S_StoryProgress
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.C2S_StoryProgress & proto.C2S_StoryProgress.$Shape;

        /**
         * Verifies a C2S_StoryProgress message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a C2S_StoryProgress message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns C2S_StoryProgress
         */
        static fromObject(object: { [k: string]: any }): proto.C2S_StoryProgress;

        /**
         * Creates a plain object from a C2S_StoryProgress message. Also converts values to other types if specified.
         * @param message C2S_StoryProgress
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.C2S_StoryProgress, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this C2S_StoryProgress to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for C2S_StoryProgress
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace C2S_StoryProgress {

        /** Properties of a C2S_StoryProgress. */
        interface $Properties {

            /** C2S_StoryProgress progress */
            progress?: (proto.StoryProgressData.$Properties|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a C2S_StoryProgress. */
        type $Shape = proto.C2S_StoryProgress.$Properties;
    }

    /**
     * Properties of a C2S_SyncRequest.
     * @deprecated Use proto.C2S_SyncRequest.$Properties instead.
     */
    interface IC2S_SyncRequest extends proto.C2S_SyncRequest.$Properties {
    }

    /** Represents a C2S_SyncRequest. */
    class C2S_SyncRequest {

        /**
         * Constructs a new C2S_SyncRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.C2S_SyncRequest.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /**
         * Creates a new C2S_SyncRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns C2S_SyncRequest instance
         */
        static create(properties: proto.C2S_SyncRequest.$Shape): proto.C2S_SyncRequest & proto.C2S_SyncRequest.$Shape;
        static create(properties?: proto.C2S_SyncRequest.$Properties): proto.C2S_SyncRequest;

        /**
         * Encodes the specified C2S_SyncRequest message. Does not implicitly {@link proto.C2S_SyncRequest.verify|verify} messages.
         * @param message C2S_SyncRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.C2S_SyncRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified C2S_SyncRequest message, length delimited. Does not implicitly {@link proto.C2S_SyncRequest.verify|verify} messages.
         * @param message C2S_SyncRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.C2S_SyncRequest.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a C2S_SyncRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.C2S_SyncRequest & proto.C2S_SyncRequest.$Shape} C2S_SyncRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.C2S_SyncRequest & proto.C2S_SyncRequest.$Shape;

        /**
         * Decodes a C2S_SyncRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.C2S_SyncRequest & proto.C2S_SyncRequest.$Shape} C2S_SyncRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.C2S_SyncRequest & proto.C2S_SyncRequest.$Shape;

        /**
         * Verifies a C2S_SyncRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a C2S_SyncRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns C2S_SyncRequest
         */
        static fromObject(object: { [k: string]: any }): proto.C2S_SyncRequest;

        /**
         * Creates a plain object from a C2S_SyncRequest message. Also converts values to other types if specified.
         * @param message C2S_SyncRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.C2S_SyncRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this C2S_SyncRequest to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for C2S_SyncRequest
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace C2S_SyncRequest {

        /** Properties of a C2S_SyncRequest. */
        interface $Properties {

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a C2S_SyncRequest. */
        type $Shape = proto.C2S_SyncRequest.$Properties;
    }

    /**
     * Properties of a S2C_SyncState.
     * @deprecated Use proto.S2C_SyncState.$Properties instead.
     */
    interface IS2C_SyncState extends proto.S2C_SyncState.$Properties {
    }

    /** Represents a S2C_SyncState. */
    class S2C_SyncState {

        /**
         * Constructs a new S2C_SyncState.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.S2C_SyncState.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** S2C_SyncState doing. */
        doing: number;

        /** S2C_SyncState doingMap. */
        doingMap: { [k: string]: string };

        /** S2C_SyncState level. */
        level: number;

        /** S2C_SyncState exp. */
        exp: number;

        /** S2C_SyncState location. */
        location?: (proto.WorldPos.$Properties|null);

        /** S2C_SyncState story. */
        story?: (proto.StoryProgressData.$Properties|null);

        /**
         * Creates a new S2C_SyncState instance using the specified properties.
         * @param [properties] Properties to set
         * @returns S2C_SyncState instance
         */
        static create(properties: proto.S2C_SyncState.$Shape): proto.S2C_SyncState & proto.S2C_SyncState.$Shape;
        static create(properties?: proto.S2C_SyncState.$Properties): proto.S2C_SyncState;

        /**
         * Encodes the specified S2C_SyncState message. Does not implicitly {@link proto.S2C_SyncState.verify|verify} messages.
         * @param message S2C_SyncState message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.S2C_SyncState.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified S2C_SyncState message, length delimited. Does not implicitly {@link proto.S2C_SyncState.verify|verify} messages.
         * @param message S2C_SyncState message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.S2C_SyncState.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a S2C_SyncState message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.S2C_SyncState & proto.S2C_SyncState.$Shape} S2C_SyncState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.S2C_SyncState & proto.S2C_SyncState.$Shape;

        /**
         * Decodes a S2C_SyncState message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.S2C_SyncState & proto.S2C_SyncState.$Shape} S2C_SyncState
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.S2C_SyncState & proto.S2C_SyncState.$Shape;

        /**
         * Verifies a S2C_SyncState message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a S2C_SyncState message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns S2C_SyncState
         */
        static fromObject(object: { [k: string]: any }): proto.S2C_SyncState;

        /**
         * Creates a plain object from a S2C_SyncState message. Also converts values to other types if specified.
         * @param message S2C_SyncState
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.S2C_SyncState, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this S2C_SyncState to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for S2C_SyncState
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace S2C_SyncState {

        /** Properties of a S2C_SyncState. */
        interface $Properties {

            /** S2C_SyncState doing */
            doing?: (number|null);

            /** S2C_SyncState doingMap */
            doingMap?: ({ [k: string]: string }|null);

            /** S2C_SyncState level */
            level?: (number|null);

            /** S2C_SyncState exp */
            exp?: (number|null);

            /** S2C_SyncState location */
            location?: (proto.WorldPos.$Properties|null);

            /** S2C_SyncState story */
            story?: (proto.StoryProgressData.$Properties|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a S2C_SyncState. */
        type $Shape = proto.S2C_SyncState.$Properties;
    }

    /**
     * Properties of a S2C_Ack.
     * @deprecated Use proto.S2C_Ack.$Properties instead.
     */
    interface IS2C_Ack extends proto.S2C_Ack.$Properties {
    }

    /** Represents a S2C_Ack. */
    class S2C_Ack {

        /**
         * Constructs a new S2C_Ack.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.S2C_Ack.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** S2C_Ack ok. */
        ok: boolean;

        /** S2C_Ack code. */
        code: number;

        /** S2C_Ack reason. */
        reason: string;

        /**
         * Creates a new S2C_Ack instance using the specified properties.
         * @param [properties] Properties to set
         * @returns S2C_Ack instance
         */
        static create(properties: proto.S2C_Ack.$Shape): proto.S2C_Ack & proto.S2C_Ack.$Shape;
        static create(properties?: proto.S2C_Ack.$Properties): proto.S2C_Ack;

        /**
         * Encodes the specified S2C_Ack message. Does not implicitly {@link proto.S2C_Ack.verify|verify} messages.
         * @param message S2C_Ack message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.S2C_Ack.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified S2C_Ack message, length delimited. Does not implicitly {@link proto.S2C_Ack.verify|verify} messages.
         * @param message S2C_Ack message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.S2C_Ack.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a S2C_Ack message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.S2C_Ack & proto.S2C_Ack.$Shape} S2C_Ack
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.S2C_Ack & proto.S2C_Ack.$Shape;

        /**
         * Decodes a S2C_Ack message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.S2C_Ack & proto.S2C_Ack.$Shape} S2C_Ack
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.S2C_Ack & proto.S2C_Ack.$Shape;

        /**
         * Verifies a S2C_Ack message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a S2C_Ack message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns S2C_Ack
         */
        static fromObject(object: { [k: string]: any }): proto.S2C_Ack;

        /**
         * Creates a plain object from a S2C_Ack message. Also converts values to other types if specified.
         * @param message S2C_Ack
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.S2C_Ack, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this S2C_Ack to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for S2C_Ack
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace S2C_Ack {

        /** Properties of a S2C_Ack. */
        interface $Properties {

            /** S2C_Ack ok */
            ok?: (boolean|null);

            /** S2C_Ack code */
            code?: (number|null);

            /** S2C_Ack reason */
            reason?: (string|null);

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Shape of a S2C_Ack. */
        type $Shape = proto.S2C_Ack.$Properties;
    }

    /**
     * Properties of a GlobalMessage.
     * @deprecated Use proto.GlobalMessage.$Properties instead.
     */
    interface IGlobalMessage extends proto.GlobalMessage.$Properties {
    }

    /** Represents a GlobalMessage. */
    class GlobalMessage {

        /**
         * Constructs a new GlobalMessage.
         * @param [properties] Properties to set
         */
        constructor(properties?: proto.GlobalMessage.$Properties);

        /** Unknown fields preserved while decoding when enabled */
        $unknowns?: Uint8Array[];

        /** GlobalMessage sequenceId. */
        sequenceId: (number|Long);

        /** GlobalMessage timestamp. */
        timestamp: (number|Long);

        /** GlobalMessage move. */
        move?: (proto.C2S_Move.$Properties|null);

        /** GlobalMessage storyProgress. */
        storyProgress?: (proto.C2S_StoryProgress.$Properties|null);

        /** GlobalMessage syncRequest. */
        syncRequest?: (proto.C2S_SyncRequest.$Properties|null);

        /** GlobalMessage syncState. */
        syncState?: (proto.S2C_SyncState.$Properties|null);

        /** GlobalMessage ack. */
        ack?: (proto.S2C_Ack.$Properties|null);

        /** GlobalMessage payload. */
        payload?: ("move"|"storyProgress"|"syncRequest"|"syncState"|"ack");

        /**
         * Creates a new GlobalMessage instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GlobalMessage instance
         */
        static create(properties: proto.GlobalMessage.$Shape): proto.GlobalMessage & proto.GlobalMessage.$Shape;
        static create(properties?: proto.GlobalMessage.$Properties): proto.GlobalMessage;

        /**
         * Encodes the specified GlobalMessage message. Does not implicitly {@link proto.GlobalMessage.verify|verify} messages.
         * @param message GlobalMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encode(message: proto.GlobalMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GlobalMessage message, length delimited. Does not implicitly {@link proto.GlobalMessage.verify|verify} messages.
         * @param message GlobalMessage message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        static encodeDelimited(message: proto.GlobalMessage.$Properties, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GlobalMessage message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns {proto.GlobalMessage & proto.GlobalMessage.$Shape} GlobalMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): proto.GlobalMessage & proto.GlobalMessage.$Shape;

        /**
         * Decodes a GlobalMessage message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns {proto.GlobalMessage & proto.GlobalMessage.$Shape} GlobalMessage
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): proto.GlobalMessage & proto.GlobalMessage.$Shape;

        /**
         * Verifies a GlobalMessage message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GlobalMessage message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GlobalMessage
         */
        static fromObject(object: { [k: string]: any }): proto.GlobalMessage;

        /**
         * Creates a plain object from a GlobalMessage message. Also converts values to other types if specified.
         * @param message GlobalMessage
         * @param [options] Conversion options
         * @returns Plain object
         */
        static toObject(message: proto.GlobalMessage, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GlobalMessage to JSON.
         * @returns JSON object
         */
        toJSON(): { [k: string]: any };

        /**
         * Gets the type url for GlobalMessage
         * @param [prefix] Custom type url prefix, defaults to `"type.googleapis.com"`
         * @returns The type url
         */
        static getTypeUrl(prefix?: string): string;
    }

    namespace GlobalMessage {

        /** Properties of a GlobalMessage. */
        interface $Properties {

            /** GlobalMessage sequenceId */
            sequenceId?: (number|Long|null);

            /** GlobalMessage timestamp */
            timestamp?: (number|Long|null);

            /** GlobalMessage move */
            move?: (proto.C2S_Move.$Properties|null);

            /** GlobalMessage storyProgress */
            storyProgress?: (proto.C2S_StoryProgress.$Properties|null);

            /** GlobalMessage syncRequest */
            syncRequest?: (proto.C2S_SyncRequest.$Properties|null);

            /** GlobalMessage syncState */
            syncState?: (proto.S2C_SyncState.$Properties|null);

            /** GlobalMessage ack */
            ack?: (proto.S2C_Ack.$Properties|null);

            /** GlobalMessage payload */
            payload?: ("move"|"storyProgress"|"syncRequest"|"syncState"|"ack");

            /** Unknown fields preserved while decoding when enabled */
            $unknowns?: Uint8Array[];
        }

        /** Narrowed shape of a GlobalMessage. */
        type $Shape = {
          sequenceId?: number|Long|null;
          timestamp?: number|Long|null;
          move?: proto.C2S_Move.$Shape|null;
          storyProgress?: proto.C2S_StoryProgress.$Shape|null;
          syncRequest?: proto.C2S_SyncRequest.$Shape|null;
          syncState?: proto.S2C_SyncState.$Shape|null;
          ack?: proto.S2C_Ack.$Shape|null;
          $unknowns?: Uint8Array[];
        } & (
          ({ payload?: undefined; move?: null; storyProgress?: null; syncRequest?: null; syncState?: null; ack?: null }|{ payload?: "move"; move: proto.C2S_Move.$Shape; storyProgress?: null; syncRequest?: null; syncState?: null; ack?: null }|{ payload?: "storyProgress"; move?: null; storyProgress: proto.C2S_StoryProgress.$Shape; syncRequest?: null; syncState?: null; ack?: null }|{ payload?: "syncRequest"; move?: null; storyProgress?: null; syncRequest: proto.C2S_SyncRequest.$Shape; syncState?: null; ack?: null }|{ payload?: "syncState"; move?: null; storyProgress?: null; syncRequest?: null; syncState: proto.S2C_SyncState.$Shape; ack?: null }|{ payload?: "ack"; move?: null; storyProgress?: null; syncRequest?: null; syncState?: null; ack: proto.S2C_Ack.$Shape })
        );
    }
}
