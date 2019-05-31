class LabConvert {
    constructor() {
        this.epsilon = 0.008856;
        this.kappa = 903.3;
        this.xyzWhiteReference = {
            X: 95.047,
            Y: 100.000,
            Z: 108.883
        };
    }

    deltaE(rgb1, rgb2) {
        return this.deltaEFromLab(this.rgbToLab(...rgb1), this.rgbToLab(...rgb2))
    }

    deltaEFromLab(lab1, lab2) {
        return Math.sqrt(
            (lab1[0] - lab2[0]) ** 2 +
            (lab1[1] - lab2[1]) ** 2 +
            (lab1[2] - lab2[2]) ** 2
        );
    }

    rgbToLab(r, g, b) {
        let [x, y, z] = this.rgbToXyz(r, g, b);

        return this.xyzToLab(x, y, z);
    }

    rgbToXyz(iR, iG, iB) {
        let r = this.pivotRgb(iR / 255.0);
        let g = this.pivotRgb(iG / 255.0);
        let b = this.pivotRgb(iB / 255.0);

        // Observer. = 2°, Illuminant = D65
        let x = r * 0.4124 + g * 0.3576 + b * 0.1805;
        let y = r * 0.2126 + g * 0.7152 + b * 0.0722;
        let z = r * 0.0193 + g * 0.1192 + b * 0.9505;

        return [x, y, z];
    }

    xyzToLab(iX, iY, iZ) {
        let x = this.pivotXyz(iX / this.xyzWhiteReference.X);
        let y = this.pivotXyz(iY / this.xyzWhiteReference.Y);
        let z = this.pivotXyz(iZ / this.xyzWhiteReference.Z);

        let l = Math.max(0, 116 * y - 16);
        let a = 500 * (x - y);
        let b = 200 * (y - z);
        return [l, a, b];
    }

    pivotRgb(n) {
        return (n > 0.04045 ? Math.pow((n + 0.055) / 1.055, 2.4) : n / 12.92) * 100.0;
    }

    pivotXyz(n) {
        return n > this.epsilon ? n ** (1 / 3) : (this.kappa * n + 16) / 116;
    }
}

export default new LabConvert();