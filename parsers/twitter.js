/**
 * Parse WordPress post links from Twitter updates published through Buffer
 */

const url 		= require( 'url' );
const redirect_follower = require( '../utils/redirect-follower' );
const find_post_slug = require( '../utils/find-post-slug' );
const request = require( 'request-promise-any' );
const conf 	= require( '../config' );

/**
 * Main Function
 * @param object update
 * @return new object w/ post_slug added
 */

module.exports = async ( update ) => {

	let tweet, post_slug, service_link;

	try {

		tweet = await get_tweet( update.service_update_id );

		post_slug = await get_post_slug_from_tweet( tweet );

		service_link = get_service_link_from_tweet( tweet );

	} catch( err ) {

		throw new Error( `Error getting Twitter update: ${update.id}` );

	}

	return Object.assign( {}, update, { post_slug, service_link } );

}

/**
 * Get Tweet
 * @param  {string} tweet_id
 * @return {Object} tweet
 */
async function get_tweet( tweet_id ) {

	let resp, tweet;

	const options = {
		method: 'GET',
		headers:{
			'Authorization' : `Bearer ${conf.twitter.auth_token}`
		},
		url: "https://api.twitter.com/1.1/statuses/show.json",
		qs: {
			id: tweet_id
		}
	};

	try{

		resp = await request( options )

		tweet = JSON.parse( resp );

	} catch( err ) {

		throw err;

	}

	return tweet;

}

/**
 * Get Post Slug From Tweet
 * @param  {Object} tweet
 * @return {string}
 */
async function get_post_slug_from_tweet( tweet ) {

	const urls = tweet.entities.urls;

	if ( 0 === urls.length ) {
		throw new Error( 'No URLs in Tweet.' );
	}

	const url_in_tweet = ( 'expanded_url' in urls[0] ) ? urls[0].expanded_url : urls[0].url;

	// If twitter says it found a URL, make sure its real
		// For example, collective.world is a URL, but request can't follow it

	try{

		new url.URL( url_in_tweet );

	} catch( err ) {
		throw err;
	}

	let link, post_slug;

	// Figure out where that URL redirects
		// if the request fails, or there's no header location, bail

	try{

		link = await redirect_follower( url_in_tweet );

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

	return post_slug;

}

/**
 * [get_service_link_from_tweet description]
 * @param  {Object}
 * @return {string}
 */
function get_service_link_from_tweet( tweet ) {

	return `https://www.twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`;

}
