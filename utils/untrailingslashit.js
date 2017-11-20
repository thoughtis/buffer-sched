/**
 * untrailingslashit
 */

module.exports = ( string ) => {

	return ( '/' === string.slice( -1 ) ? string.slice( 0, -1 ) : string );

}