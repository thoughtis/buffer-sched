/**
 * Parse WordPress post links from Twitter updates published through Buffer
 */

const twitter = require( 'twitter-text' );
const url 		= require( 'url' );
const r2 			= require( 'r2' );
const redirect_follower = require( '../utils/redirect-follower' );
const find_post_slug = require( '../utils/find-post-slug' );

/**
 * Main Function
 * @param object update
 * @return new object w/ post_slug added
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

	let link, post_slug;

	// Figure out where that URL redirects
		// if the request fails, or there's no header location, bail

	try{

		link = await redirect_follower( urls[0] );

	} catch( err ) {
		throw err;
	}

	if ( 'string' !== typeof link ) {

		throw new Error( `Unusable value for post url: ${link}` );

	}

	// Find the Post Slug from the Link/URL
	try{

		post_slug = find_post_slug( link );

	} catch( err ){
		throw err;
	}

	return Object.assign( {}, update, { post_slug } );

}
