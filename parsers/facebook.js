/**
 * Parse WordPress post links from Facebook updates published through Buffer
 */

const url = require( 'url' );
const r2 	= require( 'r2' );
const redirect_follower = require( '../utils/redirect-follower' );
const untrailingslashit = require( '../utils/untrailingslashit' );
const profiles = require( '../private/profiles' );

module.exports = async ( update ) => {

	if ( ! ( 'media' in update ) || ( ! ( 'link' in update.media ) && ! ( 'expanded_link' in update.media ) ) ) {

		throw new Error( `No URLs found in Facebook update: ${update.id}` );

	}

  let link = 'expanded_link' in update.media ? update.media.expanded_link : update.media.link;

  let test_link;

	try{

		test_link = new url.URL( link );

	} catch( err ) {

		console.error( err );
		return null;

	}

	if ( 'l.facebook.com' === test_link.hostname ) {

		link = test_link.searchParams.get( 'u' );

	}

	let post_url;

	// Figure out where that URL redirects
		// if the request fails, or there's no header location, bail

	try{

		post_url = await redirect_follower( link );

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

	// Build the correct service link
		// with a name instead of an ID in the URL

	const path = url.parse( update.service_link ).pathname.split('/');

	const profile = profiles.filter( ( p ) => {

		return p.buffer_id === update.profile_id;

	}).pop();

	if ( 'facebook_short_name' in profile ) {

		path[1] = profile.facebook_short_name;

	}

	const modifications = {

		post_slug,
		service_link : 'https://business.facebook.com' + path.join('/')

	};

//	console.log( post_slug );

	return Object.assign( {}, update, modifications );

}
