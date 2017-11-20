/**
 * Parse WordPress post links from Twitter updates published through Buffer
 */

const twitter = require( 'twitter-text' );
const url 		= require( 'url' );
const r2 			= require( 'r2' );
const redirect_follower = require( '../utils/redirect-follower' );
const untrailingslashit = require( '../utils/untrailingslashit' );

/*

{

	"due_at",
	"service_link",
	"slug"

}

*/

module.exports = async ( update ) => {

	// Get URL from tweet
		// if there's no URL, bail

	const urls = twitter.extractUrls( update.text );

	if ( 0 === urls.length ) {
		throw new Error( `No URLs found in Twitter update: ${update.id}` );
	}

	// If twitter says it found a URL, make sure its real
		// For example, collective.world is a URL, but r2 can't follow it

	try{

		new url.URL( urls[0] );

	} catch( err ) {

		console.error( err );
		return null;

	}

	let post_url;

	// Figure out where that URL redirects
		// if the request fails, or there's no header location, bail

	try{

		post_url = await redirect_follower( urls[0] );

	} catch( err ) {

		throw err;

	}

	if ( 'string' !== typeof post_url ) {

		throw new Error( `Unusable value for post url: ${post_url}` );

	}

	// Parse the URL
		// if its not on thoughtcatalog.com, bail but proceed

	let url_parts = url.parse( post_url );

	if ( 'thoughtcatalog.com' !== url_parts.hostname ) {
		return null;
	}


	// Find the slug
		// if we can't find it, bail

	const post_slug = untrailingslashit( url_parts.pathname ).split( '/' ).pop();

	if ( 'string' !== typeof post_slug ) {

		throw new Error( `Unusable value for post slug: ${post_slug}` );

	}

	return Object.assign( {}, update, { post_slug } );

}
