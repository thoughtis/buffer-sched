const conf 		= require( './config/' );
const r2 			= require( 'r2' );
const qs 			= require( 'query-string' );
const pipe 		= require( './utils/pipe' );
const parsers = require( './parsers' );
const wp 			= require( './utils/wordpress' )
const profiles = require( './private/profiles' );
const sentry 	= require( './sentry' );

let since = process.env.since || Math.ceil( ( Date.now() / 1000 ) - ( 60 * 60 ) );

/**
 * Use Sentry for Uncaught Exceptions
 */
process.on( 'uncaughtException', ( err ) => {

    sentry.captureException( err );

});

console.log( 'Looking for updates since: ', since );

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

		sentry.captureException(err);

		// return null so next function in pipe knows to bail
		return null;

	}

	return response.updates;

}

/**
 * Store Updates
 * @param array updates
 * @return do we need to return something to satisfy pipe()?
 */
async function store_updates( updates ) {

	if ( null === updates ) {
		return;
	}

	for ( let i = 0; i < updates.length; i++ ) {

		try{

			await pipe( get_post_from_update, update_wp_post_meta )( updates[i] );

		} catch( err ) {

			// Capture exception, and continue
			sentry.captureException(err);

		}

	}

}

/**
 * Update WP Post Meta
 * @param object update
 * @return object update
 */
async function update_wp_post_meta( update ) {

	if ( null === update ) {
		return;
	}

	try{

		await pipe( wp.get, wp.parse, wp.post )( update );

	} catch( err ) {

		// throw this up to the parent
		throw err;

	}

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

	try{

		update = await parsers[update.profile_service]( update );

	} catch( err ) {

		sentry.captureException(err);

		// return null so next function in pipe knows to bail
		return null;

	}

	return update;

}

/**
 * Kick it off with self invoking async function
 */
( async () => {

	for ( let i = 0; i < profiles.length; i++ ){

		try{

			await pipe( get_updates, store_updates )( profiles[i].buffer_id );

		} catch( err ) {

			sentry.captureException(err);

		}

	}

})();
