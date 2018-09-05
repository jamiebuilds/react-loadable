const crypto = require('crypto');

/**
 * See {@link https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity|Subresource Integrity} at MDN
 *
 * @param  {array} algorithms - The algorithms you want to use when hashing `content`
 * @param  {string} source - File contents you want to hash
 * @return {string} SRI hash
 */
const computeIntegrity = (algorithms, source) =>
  Array.isArray(algorithms) ? algorithms
    .map(algorithm => {
      const hash = crypto
        .createHash(algorithm)
        .update(source, "utf8")
        .digest("base64");
      return `${algorithm}-${hash}`;
    })
    .join(' ') : '';

/**
 * toArray
 *
 * @desc Check and convert given data to Array, if needed.
 * @param  {string|array} data
 * @return {array}
 */
const toArray = data =>  Array.isArray(data) ? data : [data];


module.exports = {
  computeIntegrity,
  toArray,
};
