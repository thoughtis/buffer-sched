/**
 * WP
 */
const conf 	= require( '../config' );
const r2 	= require( 'r2' );

const SITEID = '7369149';
const API_BASE = `https://public-api.wordpress.com/rest/v1.1/sites/${SITEID}`;



/**
 * Get
 * @param object update ( Buffer data with post_slug appended )
 * @return object post ( WP Post with Buffer data appended )
 */
async function get( update ){

	let post;

	const options = {
		headers:{
			'Authorization' : `Bearer ${conf.wp.auth_token}`
		}
	};

	try{

		post = await r2( `${API_BASE}/posts/slug:${update.post_slug}`, options ).json;

	} catch( err ) {

		throw err;

	}

	return Object.assign( {}, post, { buffer : update } );

}

/**
 * Parse
 * @param object post ( WP Post with Buffer data appended )
 * @return object
 */

function parse( post ){

	// metadata is array of objects, one if them will have the key tc_team_social_shares

	let shares = post.metadata.filter( p => 'tc_team_social_shares' === p.key );

	if ( 0 === shares.length ) {

		// add
		shares = [ {
	        operation: 'add',
	        key : 'tc_team_social_shares',
	        value : [[ post.buffer.service_link, post.buffer.due_at ]]
	    } ];

	} else {

		// update
		shares[0].operation = 'update';
		shares[0].value.push( [ post.buffer.service_link, post.buffer.due_at ] )

	}

	return {
		post_id : post.ID,
		metadata : shares
	};

}

async function post( object ){

	if ( null === object ) {
		return;
	}

	// post_slug
	// metadata

	let post;

	const options = {
		headers:{
			'Authorization' : `Bearer ${conf.wp.auth_token}`,
			'Content-Type' : 'application/json'
		},
		body:JSON.stringify( {
			metadata : object.metadata
		} )
	};

	try{

		post = await r2.post( `${API_BASE}/posts/${object.post_id}`, options ).json;

	} catch( err ) {

		throw err;

	}

	console.log(post);

}

module.exports = { get, parse, post };