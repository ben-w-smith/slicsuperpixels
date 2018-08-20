/**
 * Calculate color difference of two pixels accord to the paper "Measuring perceived color difference
 * using YIQ NTSC transmission color space in mobile applications" by Y. Kotsarenko and F. Ramos
 * @param {Array} pixel1 - 1x4[3] array where indexes correspond to r, g, b, a properties having values 0 - 255, if 1x3, a is assumed 255
 * @param {Array} pixel2 - 1x4[3] array where indexes correspond to r, g, b, a properties having values 0 - 255, if 1x3, a is assumed 255
 * @param {number}  [tolerance] - float 0 - 1, if provided, pixelDelta returns a boolean for pixel similarity
 * @returns {(number|boolean)} Returns the distance between two pixels, or if tolerance is passed returns a boolean on pixel similarity
 */
function pixelDiff(pixel1, pixel2, tolerance) {
    tolerance = tolerance || false

    if(pixel1.length == 3) pixel1[3] = 255;
    if(pixel2.length == 3) pixel2[3] = 255;

    var p1 = {
        r: pixel1[0],
        g: pixel1[1],
        b: pixel1[2],
        a: pixel1[3],
    }
    var p2 = {
        r: pixel2[0],
        g: pixel2[1],
        b: pixel2[2],
        a: pixel2[3],
    }

    var delta = colorDelta(p1, p2)

    // if tolerance is defined we want to know if the pixels are similar
    if(tolerance) {
        // maximum acceptable square distance between two colors;
        // 35215 is the maximum possible value for the YIQ difference metric
        var maxDelta = 35215 * tolerance * tolerance
        return (delta > maxDelta)
    } 

    // otherwise we will return the distance they are from each other
    return delta 
}

/**
 * Calculate color difference accord to the paper "Measuring perceived color difference
 * using YIQ NTSC transmission color space in mobile applications" by Y. Kotsarenko and F. Ramos
 * @param {Ojbect} pixel1 - object with r, g, b, a properties having values 0 - 255
 * @param {Object} pixel2 - object with r, g, b, a properties having values 0 - 255
 */
function colorDelta(pixel1, pixel2) {
    var r1 = blend(pixel1.r, pixel1.a)
    var g1 = blend(pixel1.g, pixel1.a)
    var b1 = blend(pixel1.b, pixel1.a)

    var r2 = blend(pixel2.r, pixel2.a)
    var g2 = blend(pixel2.g, pixel2.a)
    var b2 = blend(pixel2.b, pixel2.a)

    var y = rgb2y(r1, g1, b1) - rgb2y(r2, g2, b2)
    var i = rgb2i(r1, g1, b1) - rgb2i(r2, g2, b2)
    var q = rgb2q(r1, g1, b1) - rgb2q(r2, g2, b2)

    return 0.5053 * y * y + 0.299 * i * i + 0.1957 * q * q;
}

function rgb2y(r, g, b) { return r * 0.29889531 + g * 0.58662247 + b * 0.11448223; }
function rgb2i(r, g, b) { return r * 0.59597799 - g * 0.27417610 - b * 0.32180189; }
function rgb2q(r, g, b) { return r * 0.21147017 - g * 0.52261711 + b * 0.31114694; }

/**
 * Blend semi-transparent color with white
 * @param {number} channel - 0 - 255
 * @param {number} alpha - 0 - 255
 */
function blend(channel, alpha) {
    return 255 + (channel - 255) * (alpha / 255)
}

module.exports = pixelDiff