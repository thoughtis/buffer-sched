/**
 * Parse WordPress post links from Facebook updates published through Buffer
 */

const url = require( 'url' );
const r2 	= require( 'r2' );
const redirect_follower = require( '../utils/redirect-follower' );
const find_post_slug = require( '../utils/find-post-slug' );
const profiles = require( '../private/profiles' );
const pipe = require( '../utils/pipe' );

/**
 * URL in Update.Media
 * Ensure the update has a media object and it contains either link or expanded link
 * @param update
 * @return boolean
 */
function url_in_update_media( update ) {

	return ( 'media' in update && ( 'link' in update.media || 'expanded_link' in update.media ) )

}

/**
 * Validate Link In
 * Turn link into URL object to see if validate blows up
 * Return object so we can use .searchParams later
 * @param string link
 * @return object link
 */
function validate_link_in( link ) {

	try{

		link = new url.URL( link );

	} catch( err ) {

		throw err;

	}

	return link;

}

/**
 * Get Link In Params
 * @return object
 * @return object
 */
function get_link_in_params( link ) {

	if ( 'l.facebook.com' === link.hostname ) {

		link = link.searchParams.get( 'u' );

	}

	return 'string' === typeof link ? link : link.href;

}


/**
 * Follow Redirects
 * Figure out where that URL redirects
 * If the request fails, or there's no header location, throw Error
 * @param string link
 * @return string
 */
async function follow_redirects( link ) {

	try{

		link = await redirect_follower( link );

	} catch( err ) {

		throw err;

	}

	return link;

}

/**
 * Validate Link Out
 * Only usable data type is string once we're done following redirects
 * @param string link
 * @return string link
 */
function validate_link_out( link ){

	if ( 'string' !== typeof link ) {

		throw new Error( `Unusable value for post url: ${link}` );

	}

	return link;

}

/**
 * Use Proprty Name in URL
 * The URL for the Facebook post usually contains an ID number,
 * but we want the name of the Facebook property ( Ex: heartcatalog )
 * These are matched with their corresponding Buffer property in the properties module.
 * @param object update
 * @return array path_parts
 */	
function use_property_name_in_url( update ){

	// Split path name by "/"
	const path = url.parse( update.service_link ).pathname.split('/');

	// Find this buffer profile 
	const profile = profiles.filter( ( p ) => {

		return p.buffer_id === update.profile_id;

	}).pop();

	// Substiture the short name for Facebook ID in path array
	if ( 'facebook_short_name' in profile ) {

		path[1] = profile.facebook_short_name;

	}

	return 'https://business.facebook.com' + path.join('/');

}

/**
 * Main Function
 * 
 *
 * @param object update
 * @return object w/ post_slug and modified service_link
 */

module.exports = async ( update ) => {

	// Ensure we have a link to work with
	if ( true !== url_in_update_media( update ) ) {

		throw new Error( `No URLs found in Facebook update: ${update.id}` );

	}

  let link = 'expanded_link' in update.media ? update.media.expanded_link : update.media.link;
  let post_slug;

  // Validate the link and follow and redirects we might find
  try{

  	link = await pipe( validate_link_in, get_link_in_params, follow_redirects, validate_link_out )( link );

  } catch(err) {
  	throw err;
  }

  // Find the Post Slug from the Link/URL
	try{

		post_slug = find_post_slug( link );

	} catch( err ){
		throw err;
	}

	// Modify the service link
	update.service_link = use_property_name_in_url( update )

	return Object.assign( {}, update, { post_slug } );

}
