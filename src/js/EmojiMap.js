import Splitter from '@/js/EmojiSplitter.js';
import LabConvert from '@/js/LabConvert.js';

export default class EmojiMap {
    constructor(emojiPalette) {
        this.renderSize = 10;

        if (emojiPalette) {
            this.palette = this.filterNonRenderableEmojis(emojiPalette);
            this.emojiToColor = this.createEmojiToColorMap(this.palette);
            this.colorToEmoji = this.createColorToEmojiMap(this.emojiToColor);
        }
    }

    static fromJson(json) {
        let object = JSON.parse(json);
        let emojiMap = new EmojiMap();
        emojiMap.palette = object.palette;
        emojiMap.emojiToColor = object.emojiToColor;
        emojiMap.colorToEmoji = object.colorToEmoji;
        return emojiMap;
    }

    filterNonRenderableEmojis(emojiPalette) {
        let result = '';
        let emojis = Splitter.spliddit(emojiPalette);

        for (let emoji of emojis) {
            let canvas = document.createElement('canvas');
            let context = canvas.getContext('2d');
            canvas.style.width = '200px';
            canvas.style.height = '200px';
            canvas.width = 20;
            canvas.height = 20;
            context.font = `${this.renderSize}px Arial`;
            let width = context.measureText(emoji).width;
            //Todo filter based on color too, if width is low but it is colored then it's ok
            if (width > this.renderSize * 0.9)
                result += emoji;
            else {
                console.log("Filtering out:", emoji, width);
            }
        }

        return result;
    }

    createEmojiToColorMap(emojiPalette) {
        let map = {};
        let emojis = Splitter.spliddit(emojiPalette);
        let canvas = document.createElement('canvas');
        let context = canvas.getContext('2d');
        canvas.width = Math.round(this.renderSize * 1.4) - 2;
        canvas.height = Math.round(this.renderSize * 1.4) - 3;
        canvas.style.width = '200px';
        canvas.style.height = '200px';
        // document.body.appendChild(canvas);
        context.font = `${this.renderSize}px Arial`;
        context.fillStyle = 'white';
        for (let emoji of emojis) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillText(emoji, -1, this.renderSize - 1);
            let data = context.getImageData(0, 0, canvas.width, canvas.height);
            let totals = [0, 0, 0];
            for (let i = 0; i < data.data.length; i += 4) {
                let [r, g, b] = data.data.slice(i, i + 3);
                let color = LabConvert.rgbToLab(r, g, b);
                totals[0] += color[0];
                totals[1] += color[1];
                totals[2] += color[2];
            }
            let n = data.data.length / 4;
            let avg = [totals[0] / n, totals[1] / n, totals[2] / n];
            map[emoji] = avg;
        }
        return map;
    }

    //Todo nearest neighbour search
    createColorToEmojiMap(emojiToColorMap) {
        const colorRange = 100;
        const step = 4;

        let map = [];
        for (let l = -colorRange; l <= colorRange; l += step) {
            map[(l + colorRange) / step] = [];
            for (let a = -colorRange; a <= colorRange; a += step) {
                map[(l + colorRange) / step][(a + colorRange) / step] = [];
                for (let b = -colorRange; b <= colorRange; b += step) {
                    let color = [l, a, b];
                    let bestDelta = Infinity;
                    let bestEmoji;
                    for (let emoji in emojiToColorMap) {
                        let deltaE = LabConvert.deltaEFromLab(color, emojiToColorMap[emoji]);
                        if (deltaE < bestDelta) {
                            bestDelta = deltaE;
                            bestEmoji = emoji;
                        }
                    }
                    map[(l + colorRange) / step][(a + colorRange) / step][(b + colorRange) / step] = bestEmoji;
                }
            }
        }
        return {map, step, colorRange};
    }
}