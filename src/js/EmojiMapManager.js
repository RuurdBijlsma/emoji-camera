import EmojiMap from '@/js/EmojiMap';

class EmojiMapManager {
    emojiMap(palette) {
        if (!this.isCached(palette))
            return this.createEmojiMap(palette);
        try {
            return EmojiMap.fromJson(localStorage[palette]);
        } catch (e) {
            return this.createEmojiMap(palette);
        }
    }

    createEmojiMap(palette) {
        let emojiMap = new EmojiMap(palette);
        localStorage[palette] = JSON.stringify(emojiMap);
        return emojiMap;
    }

    isCached(palette){
        return localStorage.getItem(palette) !== null;
    }
}

export default new EmojiMapManager();