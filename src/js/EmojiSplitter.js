class EmojiSplitter{
    constructor(){
        this.HIGH_SURROGATE_START = 0xD800
        this.HIGH_SURROGATE_END = 0xDBFF
        
        this.LOW_SURROGATE_START = 0xDC00
        
        this.REGIONAL_INDICATOR_START = 0x1F1E6
        this.REGIONAL_INDICATOR_END = 0x1F1FF
        
        this.FITZPATRICK_MODIFIER_START = 0x1f3fb
        this.FITZPATRICK_MODIFIER_END = 0x1f3ff
    }

    spliddit(s, delimiter) {
        if (s === void 0 || s === null) {
            throw new Error('s cannot be undefined or null')
        }
    
        if (Array.isArray(s)) {
            s = s.join('')
        }
    
        if (delimiter instanceof RegExp ||
            (typeof delimiter === 'string' && delimiter.length)
        ) {
            return s.split(delimiter)
        }
    
        return this.splitIntoChars(s)
    }
    
    splitIntoChars(s) {
        let i = 0;
        let increment;
        const result = [];

        while (i < s.length) {
            increment = this.takeHowMany(i, s)
            result.push(s.substring(i, i + increment))
            i += increment
        }
    
        return result
    }
    
    // Decide how many code units make up the current character.
    // BMP characters: 1 code unit
    // Non-BMP characters (represented by surrogate pairs): 2 code units
    // Emoji with skin-tone modifiers: 4 code units (2 code points)
    // Country flags: 4 code units (2 code points)
    takeHowMany(i, s) {
        const last_index = s.length - 1;
        const current = s[i];
        let current_pair;
        let next_pair;

        // If we don't have a value that is part of a surrogate pair, or we're at
        // the end, only take the value at i
        if (!this.isFirstOfSurrogatePair(current) || i === last_index) {
            return 1
        }
    
        // If the array isn't long enough to take another pair after this one, we
        // can only take the current pair
        if ((i + 3) > last_index) {
            return 2
        }
    
        current_pair = current + s[i + 1]
        next_pair = s.substring(i + 2, i + 5)
    
        // Country flags are comprised of two regional indicator symbols,
        // each represented by a surrogate pair.
        // See http://emojipedia.org/flags/
        // If both pairs are regional indicator symbols, take 4
        if (this.isRegionalIndicatorSymbol(current_pair) &&
            this.isRegionalIndicatorSymbol(next_pair)) {
            return 4
        }
    
        // If the next pair make a Fitzpatrick skin tone
        // modifier, take 4
        // See http://emojipedia.org/modifiers/
        // Technically, only some code points are meant to be
        // combined with the skin tone modifiers. This function
        // does not check the current pair to see if it is
        // one of them.
        if (this.isFitzPatrickModifier(next_pair)) {
            return 4
        }
    
        return 2
    }
    
    isFirstOfSurrogatePair(c) {
        if (c === void 0 || c === null || !c.hasOwnProperty(0)) {
            return false
        }
    
        return this.betweenInclusive(
            c[0].charCodeAt(0), this.HIGH_SURROGATE_START, this.HIGH_SURROGATE_END
        )
    }
    
    hasPair(s) {
        if (typeof s !== 'string') {
            return false
        }
    
        return s.split('').some(this.isFirstOfSurrogatePair)
    }
    
    isRegionalIndicatorSymbol(s) {
        const code_point = this.codePointFromSurrogatePair(s);

        return this.betweenInclusive(
            code_point, this.REGIONAL_INDICATOR_START, this.REGIONAL_INDICATOR_END
        )
    }
    
    isFitzPatrickModifier(s) {
        const code_point = this.codePointFromSurrogatePair(s);

        return this.betweenInclusive(
            code_point, this.FITZPATRICK_MODIFIER_START, this.FITZPATRICK_MODIFIER_END
        )
    }
    
    // Turn two code units (surrogate pair) into
    // the code point they represent.
    codePointFromSurrogatePair(s) {
        const high_offset = s.charCodeAt(0) - this.HIGH_SURROGATE_START;
        const low_offset = s.charCodeAt(1) - this.LOW_SURROGATE_START;

        return (high_offset << 10) + low_offset + 0x10000
    }
    
    betweenInclusive(value, lower_bound, upper_bound) {
        return value >= lower_bound && value <= upper_bound
    }
}

export default new EmojiSplitter();