/**
 * Its Redirects All Teh Way Down
 */

const r2 = require( 'r2' );

module.exports = async ( url ) => {

	try{

		const final = await r2( url ).response

		return final.url;

	} catch( err ) {

		throw err;

	}

};