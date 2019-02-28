/**
 * Piping async functions
 * This was an attempt to do this, and allow async functions too:
 * https://medium.com/javascript-scene/reduce-composing-software-fe22f0c39a1d#20bb
 *
 * It is difficult / impossible to use async or Promises with reduce(),
 * so this uses a for of loop instead.
 */

/**
 * Define async constructor so we can check if a function is async
 */
const ASYNC = (async () => {}).constructor;

/**
 * Pipe
 * Returns a function which iterates over an array of functions,
 * applying each of them to the parameter x.
 * @param functions
 * @return function
 */
module.exports = ( ...fns ) => {

	return async ( x ) => {

		for ( let f of fns ) {

			// Await any async functions
			x = f instanceof ASYNC ? await f( x ) : f( x );

		}

		return x;

	}

};