const NODE_ENV 	= process.env.NODE_ENV || 'development';
const env 			= require( './' + NODE_ENV );
const common 		= require( './common' );

module.exports = Object.assign( {}, common, env );