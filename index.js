const conf 		= require( './config/' );
const r2 			= require( 'r2' );
const qs 			= require( 'query-string' );
const pipe 		= require( './utils/pipe' );
const parsers = require( './parsers' );
const wp 			= require( './utils/wordpress' )
const profiles = require( './private/profiles' );

const sentry = require( 'raven' ); 

sentry.config( conf.sentry.dsn ).install();

let since = process.env.since || Math.ceil( ( Date.now() / 1000 ) - ( 60 * 60 ) );

console.log( 'Looking for updates since: ', since );

// ( async () => {

// 	let response;
// 	let options = {

// 		headers: {
// 			Authorization: 'Bearer ' + conf.buffer.auth_token
// 		}

// 	};

// 	try{

// 		response = await r2( 'https://api.bufferapp.com/1/profiles.json', options ).json;

// 	} catch( err ) {

// 		console.error( err );

// 	}

// 	const ids = response.map( p => p.id );

// 	console.log( ids );

// })();

/**
 * Get Updates
 * @param string profile_id
 * @return array updates
 */
async function get_updates( profile_id ) {

	let response;

	const options = {

		headers: {
			Authorization: 'Bearer ' + conf.buffer.auth_token
		}

	};

	try{

		response = await r2( `https://api.bufferapp.com/1/profiles/${profile_id}/updates/sent.json?since=${since}`, options ).json;

	} catch( err ) {

		console.error( err );

	}

	return response.updates;

}

/**
 * Store Updates
 * @param array updates
 * @return do we need to return something to satisfy pipe()?
 */
async function store_updates( updates ) {

	for ( let i = 0; i < updates.length; i++ ) {

		try{

			await pipe( get_post_from_update, update_wp_post_meta )( updates[i] );

		} catch( err ) {

			console.error( err );

		}

	}

	return null;

}

/**
 * Update WP Post Meta
 * @param object update
 * @return object update
 */
async function update_wp_post_meta( update ) {

	console.log( update );

	// testing
	return;

	if ( null === update ) {
		return;
	}

	try{

		await pipe( wp.get, wp.parse, wp.post )( update );

	} catch( err ) {

		console.error( err );

	}

	// maybe don't need to return? we're done now
	// return update;

}

/**
 * Get Post From Update
 * use update.profile_service to determine which parser we need
 * @param object update
 * @param object update
 */
async function get_post_from_update( update ) {

	if ( ! ( update.profile_service in parsers ) ) {

		throw new Error( `The platform ${update.profile_service} is not supported.` );

	}

	return await parsers[update.profile_service]( update );

}

/**
 * Kick it off with self invoking async function
 */
( async () => {

	for ( let i = 0; i < profiles.length; i++ ){

		try{

			await pipe( get_updates, store_updates )( profiles[i].buffer_id );

		} catch( err ) {

			console.error( err );

		}

	}

})();
