import Splitter from '@/js/EmojiSplitter.js';
import LabConvert from '@/js/LabConvert.js';

export default class EmojiMap {
    constructor(emojiPalette) {
        this.renderSize = 10;

        if (emojiPalette) {
            this.palette = emojiPalette;
            // this.palette = this.filterNonRenderableEmojis(emojiPalette);
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
            context.fillStyle = `rgb(23, 129, 238)`;
            context.fillText(emoji, 0, 0);
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
        if (false) {
            document.body.appendChild(canvas);
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
        }
        context.font = `${this.renderSize}px Arial`;
        let filterColor = [23, 129, 238];
        context.fillStyle = `rgb(${filterColor})`;
        for (let emoji of emojis) {
            // let emoji = '🇦🇫';
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillText(emoji, 0, this.renderSize);
            let data = context.getImageData(0, 0, canvas.width, canvas.height);
            let totals = [0, 0, 0];
            //If fully colored pixels are exactly of the fillStyle color, then it's not an emoji, it's text (not properly rendered)
            let filterTotals = [0, 0, 0];
            let filterN = 0;
            for (let i = 0; i < data.data.length; i += 4) {
                let [r, g, b, a] = data.data.slice(i, i + 4);
                let color = LabConvert.rgbToLab(r, g, b);

                a /= 255;
                totals[0] += color[0] * a;
                totals[1] += color[1] * a;
                totals[2] += color[2] * a;

                if (a > 0.5) {
                    filterN++;
                    filterTotals[0] += r;
                    filterTotals[1] += g;
                    filterTotals[2] += b;
                }
            }
            let n = data.data.length / 4;
            let avg = [totals[0] / n, totals[1] / n, totals[2] / n];

            let filterAvg = [filterTotals[0] / filterN, filterTotals[1] / filterN, filterTotals[2] / filterN];
            if (Math.abs(filterAvg[0] - filterColor[0]) < 1.5 && Math.abs(filterAvg[1] - filterColor[1]) < 1.5 && Math.abs(filterAvg[2] - filterColor[2]) < 1.5) {
                console.log("Filtered out", emoji);
                continue;
            }

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